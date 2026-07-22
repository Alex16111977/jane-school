#!/usr/bin/env node
// Generate background-playable audio "lesson tracks" for vokabeln.html decks.
// One .m4a per deck (word -> UA translation -> German example, with pauses),
// plus a .json cue file (card start times) and an updated manifest.json.
//
// Usage:
//   node tools/gen-audio.mjs                 # default set (12 verb synonym decks)
//   node tools/gen-audio.mjs syn:syn_denken b1:gefuehle ...   # specific decks
//   node tools/gen-audio.mjs --level syn     # every deck of a level
//   node tools/gen-audio.mjs --all           # ALL decks (big!)
//
// Requires `edge-tts` (pip install edge-tts — free Microsoft neural voices)
// and `ffmpeg`. If edge-tts is not on PATH, pass its path via EDGE_TTS_BIN.
// Voices: German = de-DE-KatjaNeural, Ukrainian = uk-UA-PolinaNeural
// (override with EDGE_VOICE_DE / EDGE_VOICE_UK).

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'vokabeln.html');
const OUTDIR = path.join(ROOT, 'audio');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'neoaudio-'));

const EDGE = process.env.EDGE_TTS_BIN || 'edge-tts';
const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_UK = process.env.EDGE_VOICE_UK || 'uk-UA-PolinaNeural';
const SR = 24000;           // sample rate (mono) — matches edge-tts output
const BITRATE = '48k';
const GAP_INNER = 0.45;      // pause between word/translation/example
const GAP_CARD = 1.15;       // pause between cards
const LEAD_IN = 0.30;        // silence at start

// ---------- entity decode ----------
const ENT = {
  '&uuml;': 'ü', '&auml;': 'ä', '&ouml;': 'ö', '&szlig;': 'ß',
  '&Uuml;': 'Ü', '&Auml;': 'Ä', '&Ouml;': 'Ö',
  '&mdash;': ' — ', '&ndash;': ' – ', '&laquo;': '', '&raquo;': '',
  '&rsquo;': '’', '&lsquo;': '‘', '&nbsp;': ' ', '&amp;': '&',
  '&hellip;': '…', '&shy;': '', '&quot;': '"'
};
function decodeEnt(s) {
  return String(s == null ? '' : s).replace(/&[a-zA-Z]+;/g, m => (ENT[m] !== undefined ? ENT[m] : ' '));
}
function cleanSpeech(s) {
  return decodeEnt(s).replace(/<[^>]*>/g, '').replace(/\|/g, '').replace(/\s+/g, ' ').trim();
}
function germanWord(s) {
  return cleanSpeech(s).replace(/\s*\([^)]*\)/g, '').trim();  // drop "(sich)" etc. for cleaner audio
}
function transText(s) {
  return cleanSpeech(String(s || '').split(' / ')[0]);
}

// ---------- extract VOCAB object from the HTML ----------
function extractVocab(html) {
  const marker = 'const VOCAB = {';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('VOCAB not found');
  const objStart = start + marker.length - 1;
  let i = objStart, depth = 0, inStr = false, esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === "'") inStr = false;
      continue;
    }
    if (c === "'") inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const lit = html.slice(objStart, i);
  return (0, eval)('(' + lit + ')');
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
      execFileSync(EDGE, ['--voice', voice, '--text', t, '--write-media', mp3],
        { stdio: 'ignore', timeout: 60000 });
      ok = fs.existsSync(mp3) && fs.statSync(mp3).size > 0;
    } catch (e) { ok = false; }
  }
  if (!ok) throw new Error('edge-tts failed for: ' + t.slice(0, 50));
  execFileSync('ffmpeg', ['-i', mp3, '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s16le', wav, '-y', '-loglevel', 'error']);
  return wav;
}

// ---------- build one deck ----------
function buildDeck(key, vocab) {
  const cards = vocab[key];
  if (!cards || !cards.length) { console.log(`skip ${key} (no data)`); return null; }
  const base = key.replace(':', '__');
  const list = [];               // concat entries {file}
  const cues = [];               // {i,t,w,tr,ex}
  let t = 0;
  const push = (file) => { list.push(file); t += wavDuration(file); };

  push(silence(LEAD_IN));
  cards.forEach((c, i) => {
    const cueT = t;
    const wSpeak = germanWord(c[0]);
    const trSpeak = transText(c[1]);
    const exSpeak = cleanSpeech(c[3] || '');
    const wWav = edgeClip(VOICE_DE, wSpeak); if (wWav) push(wWav);
    push(silence(GAP_INNER));
    const trWav = edgeClip(VOICE_UK, trSpeak); if (trWav) push(trWav);
    if (exSpeak) { push(silence(GAP_INNER)); const exWav = edgeClip(VOICE_DE, exSpeak); if (exWav) push(exWav); }
    push(silence(GAP_CARD));
    cues.push({ i, t: Math.round(cueT * 1000) / 1000, w: c[0], tr: transText(c[1]), ex: c[3] || '' });
  });

  const listFile = path.join(TMP, `list_${base}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  fs.mkdirSync(OUTDIR, { recursive: true });
  const m4a = path.join(OUTDIR, base + '.m4a');
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), m4a, '-y', '-loglevel', 'error']);
  fs.writeFileSync(path.join(OUTDIR, base + '.json'),
    JSON.stringify({ deck: key, total: Math.round(t * 1000) / 1000, voiceDe: VOICE_DE, voiceUk: VOICE_UK, cards: cues }));
  const kb = Math.round(fs.statSync(m4a).size / 1024);
  console.log(`✓ ${key}  ${cards.length} cards  ${Math.round(t)}s  ${kb}KB`);
  return key;
}

// ---------- main ----------
const DEFAULT_DECKS = [
  'syn:syn_denken', 'syn:syn_glauben', 'syn:syn_finden', 'syn:syn_bekommen',
  'syn:syn_brauchen', 'syn:syn_helfen', 'syn:syn_verstehen', 'syn:syn_erklaeren',
  'syn:syn_vergleichen', 'syn:syn_beeinflussen', 'syn:syn_verbessern', 'syn:syn_erreichen'
];

const html = fs.readFileSync(HTML, 'utf8');
const vocab = extractVocab(html);
const allKeys = Object.keys(vocab);

let targets;
const args = process.argv.slice(2);
if (args[0] === '--all') targets = allKeys;
else if (args[0] === '--level') targets = allKeys.filter(k => k.startsWith(args[1] + ':'));
else if (args.length) targets = args;
else targets = DEFAULT_DECKS;

console.log(`Generating ${targets.length} deck(s) -> ${OUTDIR}`);
const done = [];
for (const k of targets) { const r = buildDeck(k, vocab); if (r) done.push(r); }

// update manifest
const manFile = path.join(OUTDIR, 'manifest.json');
let existing = [];
try { existing = JSON.parse(fs.readFileSync(manFile, 'utf8')); } catch (e) {}
const merged = Array.from(new Set([...existing, ...done])).sort();
fs.writeFileSync(manFile, JSON.stringify(merged));
console.log(`\nmanifest.json: ${merged.length} deck(s) with audio`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
