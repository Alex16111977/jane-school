#!/usr/bin/env node
// Offline neural audio for deutsch-grundwortschatz.html — replaces the browser's
// robotic speechSynthesis with real edge-tts voices.
//
// Reads the GROUPS array straight out of the page, so the audio can never drift
// from the word list. One .m4a per theme, containing for every entry:
//     [German word]  ·  pause  ·  [Russian translation]  ·  pause
// plus a cue file with per-word offsets, so the page can
//   * play a single word (seek to w.t, stop at w.we)   -> the 🔊 button
//   * play the whole theme hands-free with the lesson-audio dock.
//
// Output:
//   audio/gw__<group>.m4a
//   audio/gw-audio-cues.js   -> window.GW_AUDIO = { <group>: {src, d, w:[...]} }
//
// Usage:
//   node tools/gen-grundwortschatz-audio.mjs              # all themes
//   node tools/gen-grundwortschatz-audio.mjs zeit natur   # only these
//   node tools/gen-grundwortschatz-audio.mjs --plan
//
// Requires edge-tts (tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'deutsch-grundwortschatz.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-gw-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_INNER = 0.28;   // German -> Russian
const GAP_WORD = 0.5;     // between entries
const LEAD_IN = 0.25;
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const PLAN_ONLY = process.argv.includes('--plan');

// ---------- read GROUPS out of the page ----------
function extractArray(html, name) {
  const start = html.indexOf('const ' + name + ' = [');
  if (start < 0) throw new Error('cannot find ' + name + ' in ' + PAGE);
  const from = html.indexOf('[', start);
  let depth = 0, end = -1;
  for (let i = from; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  return (0, eval)('(' + html.slice(from, end + 1) + ')');
}
const html = fs.readFileSync(PAGE, 'utf8');
const GROUPS = extractArray(html, 'GROUPS');
const targets = args.length ? GROUPS.filter(g => args.includes(g.id)) : GROUPS;

// ---------- what the voices actually say ----------
const ENT = { '&auml;':'ä','&ouml;':'ö','&uuml;':'ü','&Auml;':'Ä','&Ouml;':'Ö','&Uuml;':'Ü','&szlig;':'ß',
              '&mdash;':'—','&middot;':'·','&hellip;':'…','&amp;':'&','&quot;':'"','&nbsp;':' ' };
const deent = s => String(s).replace(/&[a-zA-Z]+;/g, m => ENT[m] !== undefined ? ENT[m] : ' ');

// "die Brücke, -n" -> "die Brücke"   ·   "fliegen, flog, ist geflogen" -> all three forms
// "¨e" / "-n" plural markers and "(Pl.)" notes are never spoken.
function speakDe(raw) {
  let s = deent(raw)
    .replace(/\((?:Pl\.|Adv\.|\+ ?(?:Akk|Dat|Gen)\.?)\)/g, ' ')
    .replace(/\s*&\s*/g, ' und ')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/…|\.{3}/g, ' ')
    .trim();
  const parts = s.split(',').map(p => p.trim()).filter(Boolean);
  // drop bare plural/comparative markers: -n, -e, ¨e, ¨er, -en, -s, -nen, -ien …
  const kept = parts.filter(p => !/^[¨-][a-zäöüß]*$/.test(p) && !/^¨$/.test(p));
  return (kept.length ? kept : parts).join(', ').replace(/\s{2,}/g, ' ').trim();
}
function speakRu(raw) {
  return deent(raw).replace(/\s*\/\s*/g, ', ').replace(/[«»]/g, '').replace(/\s{2,}/g, ' ').trim();
}

if (PLAN_ONLY) {
  targets.forEach(g => {
    console.log('\n### ' + g.id);
    g.words.slice(0, 8).forEach(w => console.log('  DE  ' + speakDe(w[0]) + '\n  RU  ' + speakRu(w[1])));
  });
  console.log('\n' + targets.reduce((s, g) => s + g.words.length, 0) + ' entries in ' + targets.length + ' themes');
  process.exit(0);
}

// ---------- helpers (same approach as the other generators here) ----------
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
const idFor = (voice, text) => 'gw_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

// ---------- 1) collect clips ----------
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const clips = new Map();  // id -> {id, voice, text}
const plan = {};          // groupId -> [{de, ru, idDe, idRu}]
targets.forEach(g => {
  plan[g.id] = g.words.map(w => {
    const de = speakDe(w[0]), ru = speakRu(w[1]);
    const idDe = idFor(VOICE_DE, de), idRu = idFor(VOICE_RU, ru);
    clips.set(idDe, { id: idDe, voice: VOICE_DE, text: de });
    clips.set(idRu, { id: idRu, voice: VOICE_RU, text: ru });
    return { de: w[0], ru: w[1], idDe, idRu };
  });
});

const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`${clips.size} unique clips, ${missing.length} to fetch`);
if (missing.length) {
  const jobsFile = path.join(CACHE, 'jobs.json');
  fs.writeFileSync(jobsFile, JSON.stringify(missing.map(c => ({ id: c.id, voice: c.voice, text: c.text }))));
  execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, '14'],
    { stdio: ['ignore', 'inherit', 'inherit'] });
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

// ---------- 2) stitch one track per theme ----------
const out = {};
for (const g of targets) {
  const list = [], cues = [];
  let t = 0;
  const push = f => { if (!f || !fs.existsSync(f)) return; list.push(f); t += wavDuration(f); };
  const r3 = x => Math.round(x * 1000) / 1000;

  push(silence(LEAD_IN));
  plan[g.id].forEach(e => {
    const start = t;
    push(path.join(WAVDIR, e.idDe + '.wav'));
    const deEnd = t;
    push(silence(GAP_INNER));
    push(path.join(WAVDIR, e.idRu + '.wav'));
    const ruEnd = t;
    push(silence(GAP_WORD));
    cues.push({ de: e.de, ru: e.ru, t: r3(start), we: r3(deEnd), re: r3(ruEnd) });
  });

  const listFile = path.join(CACHE, `_list_${g.id}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  const m4a = path.join(OUTDIR, `gw__${g.id}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  out[g.id] = { src: `audio/gw__${g.id}.m4a`, d: r3(t), w: cues };
  console.log(`✓ ${g.id.padEnd(14)} ${String(cues.length).padStart(3)} words  ${String(Math.round(t)).padStart(4)}s  ${(fs.statSync(m4a).size / 1048576).toFixed(1)} MB`);
}

// ---------- 3) cue file (merge with themes built in an earlier run) ----------
const cuesFile = path.join(OUTDIR, 'gw-audio-cues.js');
let merged = {};
if (fs.existsSync(cuesFile)) {
  try { merged = JSON.parse(fs.readFileSync(cuesFile, 'utf8').replace(/^window\.GW_AUDIO = /, '').replace(/;\s*$/, '')); }
  catch (e) { merged = {}; }
}
Object.assign(merged, out);
fs.writeFileSync(cuesFile, 'window.GW_AUDIO = ' + JSON.stringify(merged) + ';\n');
console.log(`\ngw-audio-cues.js: ${Object.keys(merged).length} theme(s)`);
