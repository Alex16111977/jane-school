#!/usr/bin/env node
// Generate offline per-block audio tracks for englisch-wortschatz-themen.html.
// Each card is read as: English word -> Ukrainian translation -> English example
// sentence, with pauses. One .m4a per block (t1..t26) + a .json cue file
// (per-card start / word-end / ua-end / example-end offsets, so the page can
// play a single word), then one audio/wt-audio-cues.js assigning
// window.WT_AUDIO (no fetch needed, works from file:// too).
//
// Pipeline mirrors tools/gen-ah-audio.mjs: all TTS clips are fetched in ONE
// concurrent batch via tools/edge_batch.py (Python edge-tts, asyncio), then
// stitched per block with ffmpeg. mp3 + wav caches live in os.tmpdir() and are
// resumable across runs.
//
// Usage:
//   node tools/gen-wt-audio.mjs                # all blocks
//   node tools/gen-wt-audio.mjs t1 t26         # specific blocks
//   node tools/gen-wt-audio.mjs --dry          # counts + rough estimate only
//   node tools/gen-wt-audio.mjs --cues-only    # rebuild wt-audio-cues.js only
//   add --concurrency N to change TTS parallelism (default 16)
//
// Requires the `edge_tts` Python package and `ffmpeg`.
// Voices: English = en-US-AvaMultilingualNeural, Ukrainian = uk-UA-PolinaNeural
// (override with EDGE_VOICE_EN / EDGE_VOICE_UK).

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Zwei Seiten teilen sich diesen Generator:
//   default  -> englisch-wortschatz-themen.html, audio/wt__*.m4a, window.WT_AUDIO
//   --page X --prefix sy --global SY_AUDIO -> englisch-wortschatz-system.html
const argv = process.argv.slice(2);
function argVal(name, dflt) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
}
const PAGE = argVal('--page', 'englisch-wortschatz-themen.html');
const PREFIX = argVal('--prefix', 'wt');
const GLOBAL = argVal('--global', 'WT_AUDIO');

const HTML = path.join(ROOT, PAGE);
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), `jane-school-${PREFIX}-audio-cache`);
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_EN = process.env.EDGE_VOICE_EN || 'en-US-AvaMultilingualNeural';
const VOICE_UK = process.env.EDGE_VOICE_UK || 'uk-UA-PolinaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_INNER = 0.25;
const GAP_CARD = 0.55;
const LEAD_IN = 0.15;

const ENT = {
  '&uuml;': 'ü', '&auml;': 'ä', '&ouml;': 'ö', '&szlig;': 'ß',
  '&mdash;': ' — ', '&ndash;': ' – ', '&rsquo;': '’', '&lsquo;': '‘',
  '&nbsp;': ' ', '&amp;': '&', '&hellip;': '…', '&quot;': '"', '&middot;': ' ',
  '&harr;': ' ', '&ne;': ' ', '&rarr;': ' ', '&laquo;': '«', '&raquo;': '»',
};
function cleanSpeech(s) {
  return String(s == null ? '' : s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, m => (ENT[m] !== undefined ? ENT[m] : ' '))
    .replace(/&#x[0-9A-Fa-f]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
// only the translation itself, without the "— hint" tail
function uaShort(s) { return cleanSpeech(String(s).split(/\s+[—–-]\s+/)[0]); }
// "heir / air" -> "heir or air", "hood <-> bonnet" -> "hood or bonnet" (sonst liest TTS "slash")
function headSpeech(s) { return cleanSpeech(String(s).replace(/\s*(?:\/|&harr;|↔)\s*/g, ' or ')); }

// ---------- read the DECKS data out of the page ----------
function extractDecks(html) {
  const start = html.indexOf('var DECKS = [];');
  const end = html.indexOf('// ===== Grunddaten =====');
  if (start < 0 || end < 0) throw new Error('DECKS block not found in ' + HTML);
  const body = html.slice(start, end).replace('var DECKS = [];', '');
  const collect = new Function('DECKS', body + '\nreturn DECKS;');
  return collect([]);
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
    execFile(cmd, args, { timeout: 60000 }, (err) => (err ? reject(err) : resolve()));
  });
}

// ---------- main ----------
const args = argv;
const dry = args.includes('--dry');
const cuesOnly = args.includes('--cues-only');
const concIdx = args.indexOf('--concurrency');
const CONCURRENCY = concIdx >= 0 ? parseInt(args[concIdx + 1], 10) : 16;
const blockArgs = args.filter(a => /^[a-z]\d+$/.test(a) && a !== PAGE);

const html = fs.readFileSync(HTML, 'utf8');
const DECKS = extractDecks(html);
const byId = {};
DECKS.forEach(d => { byId[d.id] = d; });
const allBlocks = DECKS.map(d => d.id);
const targets = blockArgs.length ? blockArgs : allBlocks;

function rebuildCuesJs() {
  const obj = {};
  for (const id of allBlocks) {
    const jf = path.join(OUTDIR, `${PREFIX}__${id}.json`);
    if (!fs.existsSync(jf)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(jf, 'utf8'));
      obj[id] = { d: j.total, c: j.cards.map(c => [c.i, c.t, c.w, c.u, c.e]) };
    } catch (e) { /* skip corrupt */ }
  }
  fs.writeFileSync(path.join(OUTDIR, `${PREFIX}-audio-cues.js`), `window.${GLOBAL} = ` + JSON.stringify(obj) + ';\n');
  return Object.keys(obj);
}

if (cuesOnly) {
  const ids = rebuildCuesJs();
  console.log(`${PREFIX}-audio-cues.js rebuilt: ${ids.length} block(s)`);
  process.exit(0);
}

if (dry) {
  let cards = 0;
  for (const id of targets) {
    const n = byId[id].rows.length;
    cards += n;
    console.log(`${id}  ${n} cards  (${n * 3} tts clips)  ${byId[id].t.replace(/&#x[0-9A-Fa-f]+;/g, '').trim()}`);
  }
  console.log(`\nTotal: ${cards} cards, ${cards * 3} clips across ${targets.length} block(s)`);
  console.log(`At concurrency ${CONCURRENCY} and ~1s/clip that is roughly ${Math.round(cards * 3 / CONCURRENCY)}s of TTS`);
  process.exit(0);
}

console.log(`Page: ${PAGE}  |  prefix: ${PREFIX}  |  Blocks: ${targets.join(', ')}  |  EN: ${VOICE_EN}  |  UK: ${VOICE_UK}`);
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

// ---- 1) TTS batch (resumable: existing mp3s are skipped by edge_batch.py) ----
const jobs = [];
for (const id of targets) {
  byId[id].rows.forEach((r, i) => {
    jobs.push({ id: `${id}_${i}_w`, voice: VOICE_EN, text: headSpeech(r[0]) });
    jobs.push({ id: `${id}_${i}_u`, voice: VOICE_UK, text: uaShort(r[4]) });
    jobs.push({ id: `${id}_${i}_x`, voice: VOICE_EN, text: cleanSpeech(r[5]) });
  });
}
const jobsFile = path.join(CACHE, 'jobs.json');
fs.writeFileSync(jobsFile, JSON.stringify(jobs));
console.log(`Fetching ${jobs.length} tts clips (concurrency ${CONCURRENCY})...`);
execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, String(CONCURRENCY)],
  { stdio: 'inherit' });

// ---- 2) mp3 -> wav ----
const mp3Ids = jobs.map(j => j.id).filter(id => fs.existsSync(path.join(MP3DIR, id + '.mp3')));
const toConvert = mp3Ids.filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
console.log(`Converting ${toConvert.length}/${mp3Ids.length} clips to wav...`);
await pool(toConvert, 8, async (id) => {
  await execFileP('ffmpeg', ['-i', path.join(MP3DIR, id + '.mp3'), '-ar', String(SR), '-ac', '1',
    '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});

// ---- 3) stitch each block ----
function wavFor(id) {
  const f = path.join(WAVDIR, id + '.wav');
  return fs.existsSync(f) ? f : null;
}
function buildBlock(id) {
  const rows = byId[id].rows;
  const list = [];
  const cues = [];
  let t = 0;
  const push = (file) => { if (!file) return; list.push(file); t += wavDuration(file); };

  push(silence(LEAD_IN));
  rows.forEach((r, i) => {
    const cueT = t;
    push(wavFor(`${id}_${i}_w`));
    const wEnd = t;
    push(silence(GAP_INNER));
    push(wavFor(`${id}_${i}_u`));
    const uEnd = t;
    push(silence(GAP_INNER));
    push(wavFor(`${id}_${i}_x`));
    const eEnd = t;
    push(silence(GAP_CARD));
    const r3 = (x) => Math.round(x * 1000) / 1000;
    cues.push({ i, t: r3(cueT), w: r3(wEnd), u: r3(uEnd), e: r3(eEnd) });
  });

  const listFile = path.join(WAVDIR, `_list_${id}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  const m4a = path.join(OUTDIR, `${PREFIX}__${id}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  const total = Math.round(t * 1000) / 1000;
  fs.writeFileSync(path.join(OUTDIR, `${PREFIX}__${id}.json`),
    JSON.stringify({ block: id, total, voiceEn: VOICE_EN, voiceUk: VOICE_UK, cards: cues }));
  console.log(`✓ ${id}  ${rows.length} cards  ${Math.round(total)}s  ${Math.round(fs.statSync(m4a).size / 1024)}KB`);
}

for (const id of targets) {
  try { buildBlock(id); } catch (e) { console.log(`✗ ${id}  FAILED: ${e && e.message ? e.message : e}`); }
}

const ids = rebuildCuesJs();
console.log(`\n${PREFIX}-audio-cues.js: ${ids.length} block(s)`);
