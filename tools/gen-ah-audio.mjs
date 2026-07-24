#!/usr/bin/env node
// Generate offline per-chapter audio tracks for englisch-atomic-habits.html.
// Each card is read as: English word -> Ukrainian translation -> Ukrainian
// explanation, with pauses. One .m4a per chapter + a .json cue file (per-card
// start/segment-end offsets, so the page can play just one word), then a
// single audio/ah-audio-cues.js assigning window.AH_AUDIO (no fetch needed,
// works from file:// too).
//
// Pipeline (fast): all TTS clips for the requested chapters are fetched in
// ONE concurrent batch via tools/edge_batch.py (Python edge-tts, asyncio),
// then stitched per chapter with ffmpeg. Both the mp3 cache and the wav
// cache are resumable across runs (kept outside the repo, in os.tmpdir()).
//
// Usage:
//   node tools/gen-ah-audio.mjs                 # all chapters c0..c10
//   node tools/gen-ah-audio.mjs c7 c8            # specific chapters
//   node tools/gen-ah-audio.mjs --dry            # just print counts/estimate
//   node tools/gen-ah-audio.mjs --cues-only      # rebuild ah-audio-cues.js only
//   add --concurrency N to change TTS parallelism (default 16)
//
// Requires `edge-tts`'s Python package (edge_tts, used via `python3 -m` /
// tools/edge_batch.py) and `ffmpeg`.
// Voices: English = en-US-AvaMultilingualNeural, Ukrainian = uk-UA-PolinaNeural
// (override with EDGE_VOICE_EN / EDGE_VOICE_UK).

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'englisch-atomic-habits.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-ah-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_EN = process.env.EDGE_VOICE_EN || 'en-US-AvaMultilingualNeural';
const VOICE_UK = process.env.EDGE_VOICE_UK || 'uk-UA-PolinaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_INNER = 0.45;
const GAP_CARD = 1.15;
const LEAD_IN = 0.30;

// ---------- text cleanup (defensive; source data has no tags/entities today) ----------
const ENT = {
  '&uuml;': 'ü', '&auml;': 'ä', '&ouml;': 'ö', '&szlig;': 'ß',
  '&mdash;': ' — ', '&ndash;': ' – ', '&rsquo;': '’', '&lsquo;': '‘',
  '&nbsp;': ' ', '&amp;': '&', '&hellip;': '…', '&quot;': '"',
};
function cleanSpeech(s) {
  return String(s == null ? '' : s)
    .replace(/&[a-zA-Z]+;/g, m => (ENT[m] !== undefined ? ENT[m] : ' '))
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- extract DATA object from the HTML ----------
function extractData(html) {
  const marker = 'const DATA={';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('DATA not found');
  const objStart = start + marker.length - 1;
  const end = html.indexOf('\n};', objStart) + 2;
  const lit = html.slice(objStart, end);
  return JSON.parse(lit);
}

// ---------- WAV helpers ----------
function wavDuration(file) {
  const b = fs.readFileSync(file);
  let off = 12;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === 'data') return size / (SR * 2);
    off += 8 + size + (size % 2);
  }
  return 0;
}
const silenceCache = {};
function silence(sec) {
  const key = Math.round(sec * 1000);
  if (silenceCache[key]) return silenceCache[key];
  fs.mkdirSync(WAVDIR, { recursive: true });
  const f = path.join(WAVDIR, `_sil_${key}.wav`);
  if (!fs.existsSync(f)) {
    execFileSync('ffmpeg', ['-f', 'lavfi', '-i', `anullsrc=r=${SR}:cl=mono`, '-t', String(sec),
      '-c:a', 'pcm_s16le', f, '-y', '-loglevel', 'error']);
  }
  silenceCache[key] = f;
  return f;
}

// ---------- small async concurrency pool ----------
async function pool(items, limit, worker) {
  let i = 0, active = 0;
  return new Promise((resolve, reject) => {
    let doneCount = 0;
    if (!items.length) return resolve();
    function launch() {
      while (active < limit && i < items.length) {
        const idx = i++; active++;
        worker(items[idx]).then(() => {
          active--; doneCount++;
          if (doneCount === items.length) resolve();
          else launch();
        }).catch(reject);
      }
    }
    launch();
  });
}
function execFileP(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 30000 }, (err) => (err ? reject(err) : resolve()));
  });
}

// ---------- main ----------
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const cuesOnly = args.includes('--cues-only');
const concIdx = args.indexOf('--concurrency');
const CONCURRENCY = concIdx >= 0 ? parseInt(args[concIdx + 1], 10) : 16;
const chapterArgs = args.filter(a => /^c\d+$/.test(a));

const html = fs.readFileSync(HTML, 'utf8');
const DATA = extractData(html);
const allChapters = Object.keys(DATA).sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
const targets = chapterArgs.length ? chapterArgs : allChapters;

function rebuildCuesJs() {
  const obj = {};
  for (const ch of allChapters) {
    const jf = path.join(OUTDIR, `ah__${ch}.json`);
    if (!fs.existsSync(jf)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(jf, 'utf8'));
      obj[ch] = { d: j.total, c: j.cards.map(c => [c.i, c.t, c.w, c.u, c.e]) };
    } catch (e) { /* skip corrupt */ }
  }
  const js = 'window.AH_AUDIO = ' + JSON.stringify(obj) + ';\n';
  fs.writeFileSync(path.join(OUTDIR, 'ah-audio-cues.js'), js);
  return Object.keys(obj);
}

if (cuesOnly) {
  const chs = rebuildCuesJs();
  console.log(`ah-audio-cues.js rebuilt: ${chs.length} chapter(s) -> [${chs.join(', ')}]`);
  process.exit(0);
}

if (dry) {
  let totalCards = 0, totalJobs = 0;
  for (const ch of targets) {
    const n = DATA[ch].length;
    totalCards += n; totalJobs += n * 3;
    console.log(`${ch}  ${n} cards  (${n * 3} tts clips)`);
  }
  console.log(`\nTotal: ${totalCards} cards, ${totalJobs} tts clips across ${targets.length} chapter(s)`);
  console.log(`At concurrency ${CONCURRENCY} and ~1s/clip that's roughly ${Math.round(totalJobs / CONCURRENCY)}s`);
  process.exit(0);
}

console.log(`Chapters: ${targets.join(', ')}  |  EN voice: ${VOICE_EN}  |  UK voice: ${VOICE_UK}`);
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

// ---- 1) build + run the TTS job batch (resumable: existing mp3s are skipped) ----
const jobs = [];
for (const ch of targets) {
  DATA[ch].forEach((c, i) => {
    jobs.push({ id: `${ch}_${i}_w`, voice: VOICE_EN, text: cleanSpeech(c.en) });
    jobs.push({ id: `${ch}_${i}_u`, voice: VOICE_UK, text: cleanSpeech(c.ua) });
    jobs.push({ id: `${ch}_${i}_x`, voice: VOICE_UK, text: cleanSpeech(c.ex) });
  });
}
const jobsFile = path.join(CACHE, 'jobs.json');
fs.writeFileSync(jobsFile, JSON.stringify(jobs));
console.log(`Fetching ${jobs.length} tts clips (concurrency ${CONCURRENCY})...`);
execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, String(CONCURRENCY)],
  { stdio: 'inherit' });

// ---- 2) convert every mp3 in this run to wav (resumable, concurrency pool) ----
const mp3Ids = jobs.map(j => j.id).filter(id => fs.existsSync(path.join(MP3DIR, id + '.mp3')));
const toConvert = mp3Ids.filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
console.log(`Converting ${toConvert.length}/${mp3Ids.length} clips to wav...`);
await pool(toConvert, 8, async (id) => {
  const mp3 = path.join(MP3DIR, id + '.mp3');
  const wav = path.join(WAVDIR, id + '.wav');
  await execFileP('ffmpeg', ['-i', mp3, '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s16le', wav, '-y', '-loglevel', 'error']);
});

// ---- 3) stitch each chapter ----
function wavFor(id) {
  const f = path.join(WAVDIR, id + '.wav');
  return fs.existsSync(f) ? f : null;
}
function buildChapter(ch) {
  const cards = DATA[ch];
  const list = [];
  const cues = [];
  let t = 0;
  const push = (file) => { if (!file) return; list.push(file); t += wavDuration(file); };

  push(silence(LEAD_IN));
  cards.forEach((c, i) => {
    const cueT = t;
    push(wavFor(`${ch}_${i}_w`));
    const wEnd = t;
    push(silence(GAP_INNER));
    push(wavFor(`${ch}_${i}_u`));
    const uEnd = t;
    push(silence(GAP_INNER));
    push(wavFor(`${ch}_${i}_x`));
    const eEnd = t;
    push(silence(GAP_CARD));
    cues.push({ i, t: Math.round(cueT * 1000) / 1000, w: Math.round(wEnd * 1000) / 1000, u: Math.round(uEnd * 1000) / 1000, e: Math.round(eEnd * 1000) / 1000 });
  });

  const listFile = path.join(WAVDIR, `_list_${ch}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  const m4a = path.join(OUTDIR, `ah__${ch}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  const total = Math.round(t * 1000) / 1000;
  fs.writeFileSync(path.join(OUTDIR, `ah__${ch}.json`),
    JSON.stringify({ chapter: ch, total, voiceEn: VOICE_EN, voiceUk: VOICE_UK, cards: cues }));
  const kb = Math.round(fs.statSync(m4a).size / 1024);
  console.log(`✓ ${ch}  ${cards.length} cards  ${Math.round(total)}s  ${kb}KB`);
}

for (const ch of targets) {
  try { buildChapter(ch); } catch (e) { console.log(`✗ ${ch}  FAILED: ${e && e.message ? e.message : e}`); }
}

const chs = rebuildCuesJs();
console.log(`\nah-audio-cues.js: ${chs.length} chapter(s) -> [${chs.join(', ')}]`);
