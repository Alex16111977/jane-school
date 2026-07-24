#!/usr/bin/env node
// Generate background-playable per-DAY audio tracks for deutsch-c1-gesellschaft.html.
// Each card is read as:
//   German word -> Ukrainian translation -> German example ->
//   Synonyme:  <de synonym> -> <uk> , <de synonym> -> <uk> , ...      (PAIRED: translation right after each word)
//   Gegenteil: <de antonym> -> <uk> , ...
//   Typische Wendungen: <de collocation> -> <uk> , ...
//   persönlicher Satz (German).
// The Ukrainian meanings of syn/ant/collocations are AUDIO-ONLY (the card display stays German).
//
// One .m4a per day + a .json cue file (per-card start times), then a single
// audio/c1-audio-cues.js that assigns window.C1_AUDIO (no fetch needed -> works from file:// too).
//
// Fast pipeline: every TTS clip for the requested days is fetched in ONE concurrent
// batch via tools/edge_batch.py (Python edge-tts, asyncio), then stitched per day.
// mp3 + wav caches are resumable across runs (kept in os.tmpdir()), and clip ids are
// content-hashed so an edited translation auto-busts its cache (and identical phrases dedupe).
//
// Usage:
//   node tools/gen-c1-audio.mjs             # days 1..20
//   node tools/gen-c1-audio.mjs 1 20        # explicit range
//   node tools/gen-c1-audio.mjs 5 5 --force # one day, overwrite
//   node tools/gen-c1-audio.mjs --dry       # counts/estimate only
//   node tools/gen-c1-audio.mjs --cues-only # rebuild c1-audio-cues.js only
//   add --concurrency N to change TTS parallelism (default 16)
//
// Requires edge-tts's Python package (edge_tts, via tools/edge_batch.py) and ffmpeg.
// Voices: German = de-DE-KatjaNeural, Ukrainian = uk-UA-PolinaNeural (EDGE_VOICE_DE / EDGE_VOICE_UK).

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'deutsch-c1-gesellschaft.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-c1-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_UK = process.env.EDGE_VOICE_UK || 'uk-UA-PolinaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_INNER = 0.38;   // before head UA / example / a field's first item
const GAP_MID = 0.30;     // between pairs inside a field
const GAP_PAIR = 0.10;    // between a German word and its Ukrainian translation (snappy)
const GAP_CARD = 0.90;    // between cards
const LEAD_IN = 0.25;
// edge-tts bakes ~0.2s lead + up to ~0.9s trailing silence into every clip; strip it
// (keep ~30ms) so the gaps above are the ONLY pauses the listener hears.
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

// ---------- entity decode / cleanup ----------
const ENT = {
  '&uuml;': 'ü', '&auml;': 'ä', '&ouml;': 'ö', '&szlig;': 'ß',
  '&Uuml;': 'Ü', '&Auml;': 'Ä', '&Ouml;': 'Ö',
  '&mdash;': ' — ', '&ndash;': ' – ', '&laquo;': '', '&raquo;': '',
  '&bull;': ' ', '&middot;': ' ', '&amp;': '&', '&nbsp;': ' ',
  '&rsquo;': '’', '&lsquo;': '‘', '&hellip;': '…', '&shy;': '', '&quot;': '"'
};
function decodeEnt(s) {
  return String(s == null ? '' : s)
    .replace(/&#x[0-9a-fA-F]+;/g, '').replace(/&#\d+;/g, '')
    .replace(/&[a-zA-Z]+;/g, m => (ENT[m] !== undefined ? ENT[m] : ' '));
}
function cleanSpeech(s) {
  return decodeEnt(s).replace(/<[^>]*>/g, '').replace(/[|„“”«»‚‘’"]/g, ' ').replace(/\s+/g, ' ').trim();
}
function gWord(s) { return cleanSpeech(s).replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); }
function uaText(s) { return cleanSpeech(s).replace(/\s*\/\s*/g, ', '); }

// ---------- extract window.C1_EXTRAS + Ukrainian extras ----------
function extractExtras(html) {
  const marker = 'window.C1_EXTRAS=';
  const i = html.indexOf(marker);
  if (i < 0) throw new Error('C1_EXTRAS not found');
  const start = i + marker.length;
  const end = html.indexOf('</script>', start);
  let lit = html.slice(start, end).trim();
  if (lit.endsWith(';')) lit = lit.slice(0, -1);
  return JSON.parse(lit);
}
let uaExtras = {};
try { uaExtras = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'c1-ua-extras.json'), 'utf8')); }
catch (e) { console.log('note: tools/c1-ua-extras.json missing — Ukrainian extras will be skipped'); }

// ---------- parse one day's cards (document order) ----------
function parseDayCards(html, day) {
  const open = html.indexOf('data-day="' + day + '">');
  if (open < 0) return [];
  const next = html.indexOf('data-day="' + (day + 1) + '">', open + 1);
  const block = html.slice(open, next < 0 ? html.length : next);
  const re = /<div class="fcard-num">#(\d+)<\/div><div class="fcard-word">([\s\S]*?)<\/div><div class="fcard-hint">[\s\S]*?<div class="fcard-ua">([\s\S]*?)<\/div>[\s\S]*?<div class="fcard-example">([\s\S]*?)<\/div>/g;
  const cards = []; let m;
  while ((m = re.exec(block)) !== null) cards.push({ num: parseInt(m[1], 10), word: m[2], ua: m[3], example: m[4] });
  return cards;
}

// ---------- per-card speech plan (ordered segments) ----------
const idFor = (voice, text) => 'c1_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);
function planCard(c) {
  const ex = (typeof extras !== 'undefined' ? extras : {})[String(c.num)] || {};
  const uex = uaExtras[String(c.num)] || {};
  const segs = [];
  const add = (voice, text, gap) => { text = (text || '').trim(); if (!text) return; segs.push({ id: idFor(voice, text), voice, text, gap }); };
  add(VOICE_DE, gWord(c.word), 0);                       // head word (card boundary handles the lead gap)
  add(VOICE_UK, uaText(c.ua), GAP_INNER);                // its Ukrainian translation
  const exs = cleanSpeech(c.example); if (exs) add(VOICE_DE, exs, GAP_INNER);
  const field = (label, deArr, uaArr, clean) => {
    (deArr || []).forEach((de, i) => {
      add(VOICE_DE, (i === 0 ? label : '') + clean(de), i === 0 ? GAP_INNER : GAP_MID);
      const ua = (uaArr || [])[i]; if (ua) add(VOICE_UK, cleanSpeech(ua), GAP_PAIR);   // translation right after the word
    });
  };
  field('Synonyme: ', ex.s, uex.s, gWord);
  field('Gegenteil: ', ex.a, uex.a, gWord);
  field('Typische Wendungen: ', ex.r, uex.r, cleanSpeech);
  if (ex.p) add(VOICE_DE, cleanSpeech(ex.p), GAP_INNER);
  return segs;
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
  if (!fs.existsSync(f)) execFileSync('ffmpeg', ['-f', 'lavfi', '-i', `anullsrc=r=${SR}:cl=mono`, '-t', String(sec), '-c:a', 'pcm_s16le', f, '-y', '-loglevel', 'error']);
  silenceCache[key] = f;
  return f;
}
async function pool(items, limit, worker) {
  let i = 0, active = 0, done = 0;
  return new Promise((resolve, reject) => {
    if (!items.length) return resolve();
    (function launch() {
      while (active < limit && i < items.length) {
        const it = items[i++]; active++;
        worker(it).then(() => { active--; done++; (done === items.length) ? resolve() : launch(); }).catch(reject);
      }
    })();
  });
}
const execFileP = (cmd, a) => new Promise((res, rej) => execFile(cmd, a, { timeout: 30000 }, e => e ? rej(e) : res()));
const wavFor = id => { const f = path.join(WAVDIR, id + '.wav'); return fs.existsSync(f) ? f : null; };

// ---------- stitch one day ----------
function buildDay(day, cards) {
  const base = 'c1__day' + String(day).padStart(2, '0');
  const list = [], cues = [];
  let t = 0;
  const push = (file) => { if (!file) return; list.push(file); t += wavDuration(file); };
  push(silence(LEAD_IN));
  cards.forEach((c) => {
    const cueT = t;
    for (const s of planCard(c)) { if (s.gap) push(silence(s.gap)); push(wavFor(s.id)); }
    push(silence(GAP_CARD));
    cues.push([c.num, Math.round(cueT * 1000) / 1000]);
  });
  const listFile = path.join(WAVDIR, `_list_${base}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  fs.mkdirSync(OUTDIR, { recursive: true });
  const m4a = path.join(OUTDIR, base + '.m4a');
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  const total = Math.round(t * 1000) / 1000;
  fs.writeFileSync(path.join(OUTDIR, base + '.json'), JSON.stringify({ day, d: total, voiceDe: VOICE_DE, voiceUk: VOICE_UK, c: cues }));
  console.log(`✓ day ${day}  ${cards.length} cards  ${Math.round(total)}s  ${Math.round(fs.statSync(m4a).size / 1024)}KB`);
}

// ---------- assemble window.C1_AUDIO from every c1__day*.json present ----------
function writeCuesJs() {
  const obj = {};
  for (const f of fs.readdirSync(OUTDIR)) {
    const mm = /^c1__day(\d+)\.json$/.exec(f);
    if (!mm) continue;
    try { const j = JSON.parse(fs.readFileSync(path.join(OUTDIR, f), 'utf8')); obj[String(parseInt(mm[1], 10))] = { d: j.d, c: j.c }; } catch (e) {}
  }
  const days = Object.keys(obj).map(Number).sort((a, b) => a - b);
  const ordered = {}; days.forEach(d => { ordered[d] = obj[d]; });
  fs.writeFileSync(path.join(OUTDIR, 'c1-audio-cues.js'),
    'window.C1_AUDIO = window.C1_AUDIO || {};\nObject.assign(window.C1_AUDIO, ' + JSON.stringify(ordered) + ');\n');
  return days;
}

// ---------- main ----------
const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const cuesOnly = args.includes('--cues-only');
const cIdx = args.indexOf('--concurrency');
const CONCURRENCY = cIdx >= 0 ? parseInt(args[cIdx + 1], 10) : 16;
const nums = args.filter(a => /^\d+$/.test(a)).map(Number);
const first = nums[0] || 1;
const last = nums[1] || nums[0] || 20;

const html = fs.readFileSync(HTML, 'utf8');
const extras = extractExtras(html);

if (cuesOnly) { const d = writeCuesJs(); console.log(`c1-audio-cues.js rebuilt: ${d.length} day(s) -> [${d.join(', ')}]`); process.exit(0); }

const planIdx = args.indexOf('--plan');
if (planIdx >= 0) {
  const target = parseInt(args[planIdx + 1], 10);
  for (let d = 1; d <= 66; d++) for (const c of parseDayCards(html, d)) if (c.num === target) {
    console.log(`#${c.num} (day ${d})  ${gWord(c.word)} / ${uaText(c.ua)}`);
    planCard(c).forEach((s, i) => console.log(`  ${String(i).padStart(2)} [${s.voice === VOICE_DE ? 'DE' : 'UK'}] +${s.gap}  ${s.text}`));
    process.exit(0);
  }
  console.log('card not found'); process.exit(1);
}

// gather target days -> cards
const dayCards = {};
for (let d = first; d <= last; d++) { const cs = parseDayCards(html, d); if (cs.length) dayCards[d] = cs; }
const daysToBuild = Object.keys(dayCards).map(Number).filter(d => force || !fs.existsSync(path.join(OUTDIR, 'c1__day' + String(d).padStart(2, '0') + '.m4a')));

if (dry) {
  let cards = 0, segs = 0;
  const uniq = new Set();
  for (const d of Object.keys(dayCards).map(Number)) for (const c of dayCards[d]) { cards++; for (const s of planCard(c)) { segs++; uniq.add(s.id); } }
  console.log(`days ${first}-${last}: ${cards} cards, ${segs} clip-slots, ${uniq.size} unique tts clips`);
  console.log(`at concurrency ${CONCURRENCY} ~ ${Math.round(uniq.size / CONCURRENCY)}s of fetching`);
  process.exit(0);
}
if (!daysToBuild.length) { console.log('nothing to build (all present; use --force)'); writeCuesJs(); process.exit(0); }

console.log(`Building days [${daysToBuild.join(', ')}]  |  DE ${VOICE_DE}  UK ${VOICE_UK}`);
fs.mkdirSync(MP3DIR, { recursive: true }); fs.mkdirSync(WAVDIR, { recursive: true }); fs.mkdirSync(OUTDIR, { recursive: true });

// 1) build the TTS job batch (unique clips only) and fetch concurrently
const jobMap = new Map();
for (const d of daysToBuild) for (const c of dayCards[d]) for (const s of planCard(c)) if (!jobMap.has(s.id)) jobMap.set(s.id, { id: s.id, voice: s.voice, text: s.text });
const jobs = [...jobMap.values()];
const jobsFile = path.join(CACHE, 'jobs.json');
fs.writeFileSync(jobsFile, JSON.stringify(jobs));
console.log(`Fetching ${jobs.length} unique tts clips (concurrency ${CONCURRENCY})...`);
execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, String(CONCURRENCY)], { stdio: 'inherit' });

// 2) convert new mp3s to wav (resumable pool)
const have = jobs.map(j => j.id).filter(id => fs.existsSync(path.join(MP3DIR, id + '.mp3')));
const toConv = have.filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
console.log(`Converting ${toConv.length}/${have.length} clips to wav...`);
await pool(toConv, 8, async (id) => {
  await execFileP('ffmpeg', ['-i', path.join(MP3DIR, id + '.mp3'), '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});

// 3) stitch each day
for (const d of daysToBuild) { try { buildDay(d, dayCards[d]); writeCuesJs(); } catch (e) { console.log('✗ day ' + d + '  FAILED: ' + (e && e.message ? e.message : e)); } }
const days = writeCuesJs();
console.log(`\naudio/c1-audio-cues.js: ${days.length} day(s) with audio -> [${days.join(', ')}]`);
