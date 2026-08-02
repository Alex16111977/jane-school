#!/usr/bin/env node
// Generate the offline audio track for deutsch-stammformen.html.
//
// Unlike gen-lesson-audio.mjs (which narrates a whole lesson page), this one
// reads the VERBS/GROUPS data arrays straight out of the page's <script> block,
// so the track can never drift from the table: one German clip per verb
// ("nehmen. er nimmt. nahm. hat genommen.") immediately followed by the Russian
// meaning, grouped by Ablautreihe with a spoken group announcement.
//
// Output (same contract as the other lesson pages):
//   audio/lesson-stammformen.m4a
//   audio/lesson-stammformen-cues.js   -> window.LESSON_AUDIO = {src, d, c:[...]}
//
// Usage:
//   node tools/gen-stammformen-audio.mjs           # build (reuses cached clips)
//   node tools/gen-stammformen-audio.mjs --plan    # print the speech plan, no TTS
//
// Requires edge-tts (via tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'deutsch-stammformen.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-stammformen-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_DE_RU = 0.22;   // German forms -> Russian meaning
const GAP_VERB = 0.55;    // between verbs (time to say it yourself)
const GAP_GROUP = 0.7;    // after a group announcement
const LEAD_IN = 0.3;
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const PLAN_ONLY = process.argv.includes('--plan');

// ---------- read the data arrays out of the page ----------
function extractArray(html, name) {
  const start = html.indexOf('const ' + name + ' = [');
  if (start < 0) throw new Error('cannot find ' + name + ' in ' + PAGE);
  const from = html.indexOf('[', start);
  let depth = 0, end = -1;
  for (let i = from; i < html.length; i++) {
    const ch = html[i];
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error('unbalanced array ' + name);
  // The arrays are plain object literals with JS (unquoted) keys -> eval, not JSON.parse.
  return (0, eval)('(' + html.slice(from, end + 1) + ')');
}

const html = fs.readFileSync(PAGE, 'utf8');
const GROUPS = extractArray(html, 'GROUPS');
const VERBS = extractArray(html, 'VERBS');

// ---------- speech text ----------
const orify = s => String(s).replace(/\//g, ' oder ');
const GROUP_SPEECH = {
  '1a': 'Reihe eins a. ei, i, i.',
  '1b': 'Reihe eins b. ei, ie, ie.',
  '2':  'Reihe zwei. ie, o, o.',
  '3a': 'Reihe drei a. i, a, u.',
  '3b': 'Reihe drei b. i, a, o.',
  '4':  'Reihe vier. e, a, o.',
  '5':  'Reihe fünf. e, a, e.',
  '6':  'Reihe sechs. a, u, a.',
  '7':  'Reihe sieben. a, ie, a.',
  'x':  'Sonderfälle.',
  'm':  'Mischverben.',
  'mod':'Modalverben.'
};
function verbSpeech(v) {
  const parts = [v.i];
  if (v.p3) parts.push('er ' + v.p3);
  parts.push(orify(v.pt));
  parts.push(orify(v.a) + ' ' + orify(v.pp));
  return parts.join('. ') + '.';
}
function verbLine(v) {
  return v.i + ' – ' + v.pt + ' – ' + v.a + ' ' + v.pp + (v.p3 ? '  (er ' + v.p3 + ')' : '');
}

// ---------- plan: ordered clips + cues ----------
const plan = [];   // {id, voice, text, gap}
const cues = [];   // {kind, units, planIdx}
const idFor = (voice, text) => 'sf_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

GROUPS.forEach(g => {
  const list = VERBS.filter(v => v.g === g.id);
  if (!list.length) return;
  cues.push({ kind: 'tab', units: [g.name], planIdx: plan.length });
  plan.push({ id: idFor(VOICE_DE, GROUP_SPEECH[g.id]), voice: VOICE_DE, text: GROUP_SPEECH[g.id], gap: plan.length ? GAP_GROUP : 0 });
  list.forEach(v => {
    cues.push({ kind: 'unit', units: [verbLine(v), v.ru], planIdx: plan.length });
    plan.push({ id: idFor(VOICE_DE, verbSpeech(v)), voice: VOICE_DE, text: verbSpeech(v), gap: GAP_VERB });
    plan.push({ id: idFor(VOICE_RU, v.ru), voice: VOICE_RU, text: v.ru, gap: GAP_DE_RU });
  });
});

if (PLAN_ONLY) {
  plan.forEach(p => console.log((p.voice === VOICE_RU ? 'RU  ' : 'DE  ') + p.text));
  console.log(`\n${plan.length} clips · ${VERBS.length} verbs · ${GROUPS.length} groups`);
  process.exit(0);
}

// ---------- WAV helpers (same approach as the other generators here) ----------
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

// ---------- TTS ----------
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const uniq = new Map();
plan.forEach(p => uniq.set(p.id, p));
const jobs = [...uniq.values()].filter(p => !fs.existsSync(path.join(WAVDIR, p.id + '.wav')))
  .map(p => ({ id: p.id, voice: p.voice, text: p.text }));
console.log(`${uniq.size} unique clips, ${jobs.length} to fetch`);
if (jobs.length) {
  const jobsFile = path.join(CACHE, 'jobs.json');
  fs.writeFileSync(jobsFile, JSON.stringify(jobs));
  execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, '14'],
    { stdio: ['ignore', 'inherit', 'inherit'] });
}
const toConv = [...uniq.keys()].filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
console.log(`Converting ${toConv.length} clips to wav...`);
await pool(toConv, 8, async id => {
  const mp3 = path.join(MP3DIR, id + '.mp3');
  if (!fs.existsSync(mp3)) throw new Error('missing mp3 for ' + id);
  await execFileP('ffmpeg', ['-i', mp3, '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});

// ---------- concat ----------
const list = [], timeAt = [];
let t = 0;
const push = f => { list.push(f); t += wavDuration(f); };
push(silence(LEAD_IN));
plan.forEach((clip, i) => {
  if (clip.gap) push(silence(clip.gap));
  timeAt[i] = t;
  push(path.join(WAVDIR, clip.id + '.wav'));
});
const total = t;
const outCues = cues.map(c => ({ kind: c.kind, units: c.units, t: +(timeAt[c.planIdx] - 0.12).toFixed(2) }))
                    .map(c => ({ ...c, t: Math.max(0, c.t) }));

const listFile = path.join(CACHE, 'concat.txt');
fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
const m4a = path.join(OUTDIR, 'lesson-stammformen.m4a');
execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
fs.writeFileSync(path.join(OUTDIR, 'lesson-stammformen-cues.js'),
  'window.LESSON_AUDIO = ' + JSON.stringify({ src: 'audio/lesson-stammformen.m4a', d: total, c: outCues }) + ';\n');

console.log(`✓ lesson-stammformen.m4a  ${Math.round(total)}s  ${outCues.length} cues  ${(fs.statSync(m4a).size / 1048576).toFixed(1)} MB`);
