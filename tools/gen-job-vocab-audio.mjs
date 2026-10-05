#!/usr/bin/env node
// Offline neural drill-audio for the vocabulary table of englisch-egb.html (#u1d, JOB_VOCAB).
//
// Reads JOB_VOCAB straight out of the page, so the audio cannot drift from the word list.
// ONE continuous track for the whole list (hands-free listening), with per-word cues so a
// row's own speaker button can seek into it. Each word inside the track says:
//   [English word] x3 · pause · [Deutsch] x1 · pause · [Russisch] x1 · pause ·
//   [English definition = "What it means"] x1 · pause · [English word] x1 (recap)
// Only 4 unique TTS clips are fetched per word; the repeats reuse the same file.
//
// Output:
//   audio/jv__all.m4a
//   audio/job-vocab-audio-cues.js  ->  window.JOB_VOCAB_AUDIO = {src, d, w:[{en, raw, t, e}, ...]}
//   (w[i] belongs to JOB_VOCAB[i]; `raw` is the untouched JOB_VOCAB[i].en so the page can verify
//    the row still matches; `en` is the decoded text for the dock title.)
//
// Usage:
//   node tools/gen-job-vocab-audio.mjs          # rebuild for all words
//   node tools/gen-job-vocab-audio.mjs --plan    # print what the voices will say, no TTS
//
// Requires edge-tts (tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'englisch-egb.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-job-vocab-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_EN = process.env.EDGE_VOICE_EN || 'en-US-AvaMultilingualNeural';
const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const LEAD_IN = 0.3;
const GAP_REPEAT = 0.6;   // between the 3 repeats of the English word
const GAP_LANG = 0.9;     // between English / German / Russian / definition / recap
const GAP_WORD = 1.3;     // between one word and the next
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const PLAN_ONLY = process.argv.includes('--plan');

// ---------- read JOB_VOCAB out of the page ----------
function extractArray(html, name) {
  const start = html.indexOf('var ' + name + ' = [');
  if (start < 0) throw new Error('cannot find ' + name + ' in ' + PAGE);
  const from = html.indexOf('[', start);
  let depth = 0, end = -1, inStr = null, inBlockComment = false;
  for (let i = from; i < html.length; i++) {
    const ch = html[i], nx = html[i + 1];
    if (inBlockComment) { if (ch === '*' && nx === '/') { inBlockComment = false; i++; } continue; }
    if (inStr) { if (ch === '\\') { i++; } else if (ch === inStr) { inStr = null; } continue; }
    if (ch === '/' && nx === '*') { inBlockComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { inStr = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  return (0, eval)('(' + html.slice(from, end + 1) + ')');
}
const html = fs.readFileSync(PAGE, 'utf8');
const DATA = extractArray(html, 'JOB_VOCAB');
if (!DATA.length) { console.error('JOB_VOCAB is empty'); process.exit(1); }

// ---------- text cleaning: what the voices actually say ----------
const ENT = {
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', eacute: 'é',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•', rarr: '→', larr: '←', harr: '↔',
  amp: '&', nbsp: ' ', quot: '"', laquo: '«', raquo: '»', lt: '<', gt: '>',
  bdquo: '„', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', sbquo: '‚', euro: '€', asymp: '≈', ne: '≠', aelig: 'æ',
};
function decode(s) {
  return String(s == null ? '' : s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in ENT ? ENT[n] : m));
}
const tidy = s => s.replace(/\s*=\s*/g, ', ').replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/,\s*,+/g, ',').replace(/^[,\s]+|[,\s]+$/g, '').trim();

// A trailing "(…)" is a clarification -> ", …" (or a continuation of the phrase -> " …"); a middle one is part of the phrase.
function parens(s) {
  let out = s.replace(/\s*\((?:AE|BE|noun|verb|adjective)\b[^)]*\)/g, '');           // language-variant / word-class tags
  const base = out;
  out = out.replace(/\s*\(([^)]*)\)\s*$/, (m, inner0) => {
    const inner = inner0.replace(/^=\s*/, '').trim();
    const continues = !/[,;\s]/.test(inner) || /^(somebody|sb|sth|something)\b/i.test(inner);
    return (continues && !/^[A-Z]/.test(base) ? ' ' : ', ') + inner;
  });
  return out.replace(/[()]/g, '');
}
function speakEn(raw) {
  let s = decode(raw);
  s = parens(s);
  s = s.replace(/\bsth\b/g, 'something').replace(/\bsb\b/g, 'somebody').replace(/\s*\/\s*/g, ', ');
  return tidy(s);
}
function speakDe(raw) {
  let s = decode(raw);
  s = s.replace(/\(([a-zA-Zäöüß]{1,3})\)/g, '');            // "Betreuer(in)" -> "Betreuer"
  s = parens(s);
  s = s.replace(/(\S)\/(\S)/g, '$1 oder $2').replace(/\s+\/\s+/g, ', ');
  return tidy(s);
}
function speakRu(raw) {
  let s = decode(raw).replace(/напр\.\s*/gi, 'например ');
  s = parens(s);
  s = s.replace(/\s*\/\s*/g, ' или ');
  return tidy(s);
}
function speakDef(raw) {
  let s = decode(raw);
  s = s.replace(/\s*\([^)]*\)/g, '');                        // drop usage notes in brackets
  s = s.replace(/\s+\/\s+/g, ', ');                           // "A / B" pairs -> a pause
  return tidy(s);
}

if (PLAN_ONLY) {
  DATA.forEach((v, i) => {
    console.log(`\n### ${i + 1}. ${v.en}`);
    console.log('  EN  x3  ' + speakEn(v.en) + '   (+ x1 again at the end)');
    console.log('  DE  x1  ' + speakDe(v.de));
    console.log('  RU  x1  ' + speakRu(v.ru));
    console.log('  DEF x1  ' + speakDef(v.def));
  });
  console.log('\n' + DATA.length + ' word(s), one continuous track');
  process.exit(0);
}

// ---------- helpers ----------
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
const execFileP = (cmd, a) => new Promise((res, rej) => execFile(cmd, a, { timeout: 60000 }, e => e ? rej(e) : res()));
const idFor = (voice, text) => 'jv_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

// ---------- 1) collect clips (4 unique per word: EN, DE, RU, DEF) ----------
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const clips = new Map();
const plan = DATA.map(v => {
  const en = speakEn(v.en), de = speakDe(v.de), ru = speakRu(v.ru), def = speakDef(v.def);
  const idEn = idFor(VOICE_EN, en), idDe = idFor(VOICE_DE, de), idRu = idFor(VOICE_RU, ru), idDef = idFor(VOICE_EN, def);
  clips.set(idEn, { id: idEn, voice: VOICE_EN, text: en });
  clips.set(idDe, { id: idDe, voice: VOICE_DE, text: de });
  clips.set(idRu, { id: idRu, voice: VOICE_RU, text: ru });
  clips.set(idDef, { id: idDef, voice: VOICE_EN, text: def });
  return { raw: v.en, shown: decode(v.en).replace(/\s+/g, ' ').trim(), idEn, idDe, idRu, idDef };
});

const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`${clips.size} unique clips, ${missing.length} to fetch`);
if (missing.length) {
  const jobsFile = path.join(CACHE, 'jobs.json');
  fs.writeFileSync(jobsFile, JSON.stringify(missing.map(c => ({ id: c.id, voice: c.voice, text: c.text }))));
  execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, '16'], { stdio: ['ignore', 'inherit', 'inherit'] });
}
const toConv = [...clips.keys()].filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
if (toConv.length) {
  console.log(`Converting ${toConv.length} clips to wav...`);
  await pool(toConv, 8, async id => {
    const mp3 = path.join(MP3DIR, id + '.mp3');
    if (!fs.existsSync(mp3)) { console.log('  ! missing mp3 ' + id); return; }
    await execFileP('ffmpeg', ['-i', mp3, '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
  });
}
const stillMissing = [...clips.keys()].filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
if (stillMissing.length) { console.error(`ABORT: ${stillMissing.length} clip(s) failed; re-run to retry`); process.exit(1); }

// ---------- 2) stitch ONE continuous track, remembering per-word cues ----------
const list = [], cues = [];
let t = 0;
const push = f => { if (!f || !fs.existsSync(f)) return; list.push(f); t += wavDuration(f); };
const r3 = x => Math.round(x * 1000) / 1000;

push(silence(LEAD_IN));
plan.forEach(e => {
  const start = t;
  const enWav = path.join(WAVDIR, e.idEn + '.wav');
  const deWav = path.join(WAVDIR, e.idDe + '.wav');
  const ruWav = path.join(WAVDIR, e.idRu + '.wav');
  const defWav = path.join(WAVDIR, e.idDef + '.wav');

  push(enWav); push(silence(GAP_REPEAT)); push(enWav); push(silence(GAP_REPEAT)); push(enWav);
  push(silence(GAP_LANG));
  push(deWav);
  push(silence(GAP_LANG));
  push(ruWav);
  push(silence(GAP_LANG));
  push(defWav);
  push(silence(GAP_LANG));
  push(enWav);
  const end = t;
  push(silence(GAP_WORD));
  cues.push({ en: e.shown, raw: e.raw, t: r3(start), e: r3(end) });
});

const listFile = path.join(CACHE, '_list_all.txt');
fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
const m4a = path.join(OUTDIR, 'jv__all.m4a');
execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
console.log(`✓ jv__all.m4a  ${cues.length} words  ${Math.round(t)}s (${Math.round(t / 60)} min)  ${(fs.statSync(m4a).size / 1048576).toFixed(1)} MB`);

// ---------- 3) cue file ----------
const cuesFile = path.join(OUTDIR, 'job-vocab-audio-cues.js');
fs.writeFileSync(cuesFile, 'window.JOB_VOCAB_AUDIO = ' + JSON.stringify({ src: 'audio/jv__all.m4a', d: r3(t), w: cues }) + ';\n');
console.log(`job-vocab-audio-cues.js written (${cues.length} words)`);
