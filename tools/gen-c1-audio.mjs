#!/usr/bin/env node
// Generate background-playable per-DAY audio tracks for deutsch-c1-gesellschaft.html.
// Each card is read as: German word -> Ukrainian translation -> German example ->
// (Synonyme / Gegenteil / Typische Wendungen / persönlicher Satz), with pauses.
// One .m4a per day + a .json cue file (per-card start times), then a single
// audio/c1-audio-cues.js that assigns window.C1_AUDIO for the page (no fetch needed,
// so it works from file:// too).
//
// Usage:
//   node tools/gen-c1-audio.mjs             # days 1..20 (default)
//   node tools/gen-c1-audio.mjs 1 20        # explicit range
//   node tools/gen-c1-audio.mjs 5 5         # a single day
//   add --force to regenerate days whose .m4a already exists
//
// Requires the same toolchain as tools/gen-audio.mjs:
//   edge-tts  (pip install edge-tts — free Microsoft neural voices; here via `python3 -m edge_tts`)
//   ffmpeg
// Voices: German = de-DE-KatjaNeural, Ukrainian = uk-UA-PolinaNeural
// (override with EDGE_VOICE_DE / EDGE_VOICE_UK). Override the edge binary with EDGE_TTS_BIN.

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'deutsch-c1-gesellschaft.html');
const OUTDIR = path.join(ROOT, 'audio');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'c1audio-'));

// edge-tts invocation: prefer explicit EDGE_TTS_BIN, else `python3 -m edge_tts`.
const EDGE_BIN = process.env.EDGE_TTS_BIN || 'python3';
const EDGE_PREARGS = process.env.EDGE_TTS_BIN ? [] : ['-m', 'edge_tts'];
const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_UK = process.env.EDGE_VOICE_UK || 'uk-UA-PolinaNeural';
const SR = 24000;            // sample rate (mono) — matches edge-tts output
const BITRATE = '48k';
const GAP_INNER = 0.45;      // pause between the parts of one card
const GAP_CARD = 1.15;       // pause between cards
const LEAD_IN = 0.30;        // silence at the very start

// Ukrainian translations of the synonyms/antonyms/collocations (spoken after the German set).
const UA_EXTRAS_FILE = path.join(ROOT, 'tools', 'c1-ua-extras.json');
let uaExtras = {};
try { uaExtras = JSON.parse(fs.readFileSync(UA_EXTRAS_FILE, 'utf8')); }
catch (e) { console.log('note: tools/c1-ua-extras.json missing — Ukrainian extras will be skipped'); }

// ---------- entity decode ----------
const ENT = {
  '&uuml;': 'ü', '&auml;': 'ä', '&ouml;': 'ö', '&szlig;': 'ß',
  '&Uuml;': 'Ü', '&Auml;': 'Ä', '&Ouml;': 'Ö',
  '&mdash;': ' — ', '&ndash;': ' – ', '&laquo;': '', '&raquo;': '',
  '&bull;': ' ', '&middot;': ' ', '&amp;': '&', '&nbsp;': ' ',
  '&rsquo;': '’', '&lsquo;': '‘', '&hellip;': '…', '&shy;': '', '&quot;': '"',
  '&sbquo;': '', '&bdquo;': '', '&ldquo;': '', '&rdquo;': '', '&#x1F4AC;': ''
};
function decodeEnt(s) {
  return String(s == null ? '' : s)
    .replace(/&#x[0-9a-fA-F]+;/g, '')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-zA-Z]+;/g, m => (ENT[m] !== undefined ? ENT[m] : ' '));
}
function cleanSpeech(s) {
  return decodeEnt(s).replace(/<[^>]*>/g, '').replace(/[|„“”«»‚‘’]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function germanWord(s) {
  // strip "(sich)" / "(etw.)" etc. for cleaner audio, keep the article
  return cleanSpeech(s).replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}
function uaText(s) {
  return cleanSpeech(s).replace(/\s*\/\s*/g, ', ');
}

// ---------- extract window.C1_EXTRAS ----------
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

// ---------- parse one day's cards (document order) ----------
function parseDayCards(html, day) {
  const open = html.indexOf('data-day="' + day + '">');
  if (open < 0) return [];
  const next = html.indexOf('data-day="' + (day + 1) + '">', open + 1);
  const block = html.slice(open, next < 0 ? html.length : next);
  const re = /<div class="fcard-num">#(\d+)<\/div><div class="fcard-word">([\s\S]*?)<\/div><div class="fcard-hint">[\s\S]*?<div class="fcard-ua">([\s\S]*?)<\/div>[\s\S]*?<div class="fcard-example">([\s\S]*?)<\/div>/g;
  const cards = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    cards.push({ num: parseInt(m[1], 10), word: m[2], ua: m[3], example: m[4] });
  }
  return cards;
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
  const f = path.join(TMP, `sil_${key}.wav`);
  execFileSync('ffmpeg', ['-f', 'lavfi', '-i', `anullsrc=r=${SR}:cl=mono`, '-t', String(sec),
    '-c:a', 'pcm_s16le', f, '-y', '-loglevel', 'error']);
  silenceCache[key] = f;
  return f;
}
let clipN = 0;
function edgeClip(voice, text) {
  const t = (text || '').trim();
  if (!t) return null;
  const mp3 = path.join(TMP, `e${clipN}.mp3`);
  const wav = path.join(TMP, `c${clipN}.wav`);
  clipN++;
  let ok = false;
  for (let attempt = 0; attempt < 4 && !ok; attempt++) {
    try {
      execFileSync(EDGE_BIN, [...EDGE_PREARGS, '--voice', voice, '--text', t, '--write-media', mp3],
        { stdio: 'ignore', timeout: 60000 });
      ok = fs.existsSync(mp3) && fs.statSync(mp3).size > 0;
    } catch (e) { ok = false; }
  }
  if (!ok) throw new Error('edge-tts failed for: ' + t.slice(0, 60));
  execFileSync('ffmpeg', ['-i', mp3, '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s16le', wav, '-y', '-loglevel', 'error']);
  return wav;
}

// ---------- extras -> one German speech block ----------
function extrasSpeech(ex) {
  if (!ex) return '';
  const parts = [];
  if (ex.s && ex.s.length) parts.push('Synonyme: ' + ex.s.map(cleanSpeech).join(', '));
  if (ex.a && ex.a.length) parts.push('Gegenteil: ' + ex.a.map(cleanSpeech).join(', '));
  if (ex.r && ex.r.length) parts.push('Typische Wendungen: ' + ex.r.map(cleanSpeech).join('. '));
  if (ex.p) parts.push(cleanSpeech(ex.p));
  return parts.join('. ');
}

// ---------- build one day ----------
function buildDay(day, extras) {
  const cards = parseDayCards(fs.readFileSync(HTML, 'utf8'), day);
  if (!cards.length) { console.log(`skip day ${day} (no cards)`); return null; }
  const base = 'c1__day' + String(day).padStart(2, '0');
  const list = [];
  const cues = [];
  let t = 0;
  const push = (file) => { list.push(file); t += wavDuration(file); };
  // Speak a German field (with label), then its Ukrainian translation.
  const pushField = (label, deArr, uaArr, sep) => {
    if (!deArr || !deArr.length) return;
    push(silence(GAP_INNER));
    const dw = edgeClip(VOICE_DE, label + deArr.map(cleanSpeech).join(sep)); if (dw) push(dw);
    if (uaArr && uaArr.length) {
      push(silence(GAP_INNER));
      const uw = edgeClip(VOICE_UK, uaArr.map(cleanSpeech).join(sep)); if (uw) push(uw);
    }
  };

  push(silence(LEAD_IN));
  cards.forEach((c) => {
    const cueT = t;
    const wWav = edgeClip(VOICE_DE, germanWord(c.word)); if (wWav) push(wWav);
    push(silence(GAP_INNER));
    const trWav = edgeClip(VOICE_UK, uaText(c.ua)); if (trWav) push(trWav);
    const exSpeak = cleanSpeech(c.example);
    if (exSpeak) { push(silence(GAP_INNER)); const exWav = edgeClip(VOICE_DE, exSpeak); if (exWav) push(exWav); }
    const ex = extras[String(c.num)] || {};
    const uex = uaExtras[String(c.num)] || {};
    pushField('Synonyme: ', ex.s, uex.s, ', ');            // German synonyms, then Ukrainian
    pushField('Gegenteil: ', ex.a, uex.a, ', ');           // German antonyms, then Ukrainian
    pushField('Typische Wendungen: ', ex.r, uex.r, '. ');  // German collocations, then Ukrainian
    if (ex.p) { const pSpeak = cleanSpeech(ex.p); if (pSpeak) { push(silence(GAP_INNER)); const pWav = edgeClip(VOICE_DE, pSpeak); if (pWav) push(pWav); } }
    push(silence(GAP_CARD));
    cues.push([c.num, Math.round(cueT * 1000) / 1000]);
  });

  const listFile = path.join(TMP, `list_${base}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  fs.mkdirSync(OUTDIR, { recursive: true });
  const m4a = path.join(OUTDIR, base + '.m4a');
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), m4a, '-y', '-loglevel', 'error']);
  const total = Math.round(t * 1000) / 1000;
  fs.writeFileSync(path.join(OUTDIR, base + '.json'),
    JSON.stringify({ day, d: total, voiceDe: VOICE_DE, voiceUk: VOICE_UK, c: cues }));
  const kb = Math.round(fs.statSync(m4a).size / 1024);
  console.log(`✓ day ${day}  ${cards.length} cards  ${Math.round(total)}s  ${kb}KB`);
  return { day, d: total, c: cues };
}

// ---------- assemble window.C1_AUDIO from every c1__day*.json present ----------
function writeCuesJs() {
  const obj = {};
  for (const f of fs.readdirSync(OUTDIR)) {
    const mm = /^c1__day(\d+)\.json$/.exec(f);
    if (!mm) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(OUTDIR, f), 'utf8'));
      obj[String(parseInt(mm[1], 10))] = { d: j.d, c: j.c };
    } catch (e) {}
  }
  const days = Object.keys(obj).map(Number).sort((a, b) => a - b);
  const ordered = {};
  days.forEach(d => { ordered[d] = obj[d]; });
  const js = 'window.C1_AUDIO = window.C1_AUDIO || {};\n' +
    'Object.assign(window.C1_AUDIO, ' + JSON.stringify(ordered) + ');\n';
  fs.writeFileSync(path.join(OUTDIR, 'c1-audio-cues.js'), js);
  return days;
}

// ---------- main ----------
const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const nums = args.filter(a => /^\d+$/.test(a)).map(Number);
const first = nums[0] || 1;
const last = nums[1] || nums[0] || 20;

const html = fs.readFileSync(HTML, 'utf8');
const extras = extractExtras(html);

if (args.includes('--cues-only')) {
  const days = writeCuesJs();
  console.log(`audio/c1-audio-cues.js rebuilt: ${days.length} day(s) -> [${days.join(', ')}]`);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  process.exit(0);
}

if (dry) {
  let grand = 0;
  for (let d = first; d <= last; d++) {
    const cards = parseDayCards(html, d);
    grand += cards.length;
    const withEx = cards.filter(c => extras[String(c.num)]).length;
    console.log(`day ${String(d).padStart(2)}  ${String(cards.length).padStart(3)} cards  (${withEx} with extras)` +
      (cards.length ? `   e.g. #${cards[0].num} ${germanWord(cards[0].word)} → ${uaText(cards[0].ua)}` : ''));
  }
  console.log(`\nTotal days ${first}-${last}: ${grand} cards`);
  console.log('sample extras speech:', extrasSpeech(extras[String(parseDayCards(html, first)[0].num)]).slice(0, 160));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  process.exit(0);
}

console.log(`Generating C1 audio, days ${first}..${last} -> ${OUTDIR}`);
for (let d = first; d <= last; d++) {
  const m4a = path.join(OUTDIR, 'c1__day' + String(d).padStart(2, '0') + '.m4a');
  if (!force && fs.existsSync(m4a)) { console.log(`• day ${d} already done (skip; --force to redo)`); continue; }
  try { buildDay(d, extras); writeCuesJs(); }   // refresh cues after every day (crash-safe)
  catch (e) { console.log('✗ day ' + d + '  FAILED: ' + (e && e.message ? e.message : e)); }
}
const days = writeCuesJs();
console.log(`\naudio/c1-audio-cues.js: ${days.length} day(s) with audio -> [${days.join(', ')}]`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
