#!/usr/bin/env node
// Offline neural audio for bwr-egb.html, card #bwr9 ("Wortschatz & Selbsttest").
//
// Reads the word table (<table class="vt" id="bwrVocab">) straight out of the page,
// so the audio can never drift from the list. ONE continuous track with per-word cues
// (dock at the bottom + a 🔊 per row seeks into it). Each word says:
//   [Deutsch] · pause · [Russisch: Erklärung] · pause · [Deutsch] again · longer pause
//
// Output:
//   audio/bwr9__all.m4a
//   audio/bwr9-audio-cues.js   -> window.BWR9_AUDIO = {src, d, w:[{de,t,e}, ...]}
//
// Usage:
//   node tools/gen-bwr-audio.mjs          # rebuild
//   node tools/gen-bwr-audio.mjs --plan   # print what the voices will say
//
// Requires edge-tts (tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'bwr-egb.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-bwr-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const LEAD_IN = 0.3;
const GAP_LANG = 1.0;   // DE -> RU -> DE
const GAP_WORD = 2.0;   // between one word and the next
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const PLAN_ONLY = process.argv.includes('--plan');

// ---------- read the table out of the page ----------
function decode(s) {
  const named = { auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', amp: '&', mdash: '—', ndash: '–', nbsp: ' ', laquo: '«', raquo: '»', quot: '"' };
  return s.replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => named[n] ?? m).trim();
}
const html = fs.readFileSync(PAGE, 'utf8');
const tm = html.match(/<table class="vt" id="bwrVocab">([\s\S]*?)<\/table>/);
if (!tm) { console.error('table#bwrVocab not found in ' + PAGE); process.exit(1); }
const DATA = [...tm[1].matchAll(/<td class="de">([\s\S]*?)<\/td>\s*<td class="ru">([\s\S]*?)<\/td>/g)]
  .map(m => ({ de: decode(m[1]), ru: decode(m[2]) }));
if (!DATA.length) { console.error('no rows'); process.exit(1); }

// ---------- what the voices actually say ----------
const speakDe = raw => raw
  .replace(/\s*\(([^)]*)\)/g, ', $1')    // "die OHG (offene Handelsgesellschaft)" -> "die OHG, offene Handelsgesellschaft"
  .replace(/\s*\/\s*/g, ' oder ')        // "der Komplementär / die Komplementärin"
  .replace(/\s{2,}/g, ' ').trim();
// German terms inside the Russian explanation: the Russian voice can't read Latin script,
// so they are spelled the way a Russian speaker would say them.
const RU_SAY = [
  [/Vorab-Vergütung/g, 'фораб-фергютунг'], [/Vorab/g, 'фораб'], [/Zinsen/g, 'цинзен'],
  [/Kapitaleinlagen/g, 'капиталь-айнлаген'], [/Komplementär/g, 'комплементэр'], [/Kommanditist/g, 'коммандитист'],
  [/OHG/g, 'о-ха-гэ'], [/KG/g, 'ка-гэ'],
];
const speakRu = raw => RU_SAY.reduce((s, [re, to]) => s.replace(re, to), raw)
  .replace(/…/g, '')
  .replace(/\s*\(([^)]*)\)/g, ', $1')
  .replace(/\s*—\s*/g, ', ')
  .replace(/[«»]/g, '')
  .replace(/\s+,/g, ',').replace(/,\s*,/g, ',')
  .replace(/\s{2,}/g, ' ').replace(/[,\s]+$/, '').trim();

if (PLAN_ONLY) {
  DATA.forEach(v => console.log('\nDE  ' + speakDe(v.de) + '\nRU  ' + speakRu(v.ru) + '\nDE  ' + speakDe(v.de)));
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
const idFor = (voice, text) => 'bwr_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

// ---------- 1) fetch clips (2 unique per word) ----------
[MP3DIR, WAVDIR, OUTDIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
const clips = new Map();
const plan = DATA.map(v => {
  const de = speakDe(v.de), ru = speakRu(v.ru);
  const idDe = idFor(VOICE_DE, de), idRu = idFor(VOICE_RU, ru);
  clips.set(idDe, { id: idDe, voice: VOICE_DE, text: de });
  clips.set(idRu, { id: idRu, voice: VOICE_RU, text: ru });
  return { de: v.de, idDe, idRu };
});
const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`${clips.size} unique clips, ${missing.length} to fetch`);
if (missing.length) {
  const jobsFile = path.join(CACHE, 'jobs.json');
  fs.writeFileSync(jobsFile, JSON.stringify(missing));
  execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, '12'], { stdio: ['ignore', 'inherit', 'inherit'] });
}
const toConv = [...clips.keys()].filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
await pool(toConv, 8, async id => {
  const mp3 = path.join(MP3DIR, id + '.mp3');
  if (!fs.existsSync(mp3)) { console.log('  ! missing mp3 ' + id); return; }
  await execFileP('ffmpeg', ['-i', mp3, '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});

// ---------- 2) stitch one track ----------
const list = [], cues = [];
let t = 0;
const push = f => { if (!f || !fs.existsSync(f)) return; list.push(f); t += wavDuration(f); };
const r3 = x => Math.round(x * 1000) / 1000;
push(silence(LEAD_IN));
plan.forEach(e => {
  const start = t;
  const deWav = path.join(WAVDIR, e.idDe + '.wav'), ruWav = path.join(WAVDIR, e.idRu + '.wav');
  push(deWav); push(silence(GAP_LANG)); push(ruWav); push(silence(GAP_LANG)); push(deWav);
  const end = t;
  push(silence(GAP_WORD));
  cues.push({ de: e.de, t: r3(start), e: r3(end) });
});
const listFile = path.join(CACHE, '_list_all.txt');
fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
const m4a = path.join(OUTDIR, 'bwr9__all.m4a');
execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
console.log(`✓ bwr9__all.m4a  ${cues.length} words  ${Math.round(t)}s  ${(fs.statSync(m4a).size / 1048576).toFixed(2)} MB`);

fs.writeFileSync(path.join(OUTDIR, 'bwr9-audio-cues.js'),
  'window.BWR9_AUDIO = ' + JSON.stringify({ src: 'audio/bwr9__all.m4a', d: r3(t), w: cues }) + ';\n');
console.log('bwr9-audio-cues.js written');
