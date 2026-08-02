#!/usr/bin/env node
// Offline neural audio for deutsch-fuehrerschein.html — replaces the browser's
// robotic speechSynthesis with real edge-tts voices.
//
// Reads the DATA array straight out of the page, so the audio can never drift
// from the word list. One .m4a per block, containing for every entry:
//     [German]  ·  pause  ·  [Ukrainian]  ·  pause
// plus a cue file with per-word offsets, so the page can
//   * play one German word (seek to w.t, stop at w.we)   -> the 🔊 button
//   * play the whole block hands-free with the bottom dock.
//
// Output:
//   audio/fs__<block>.m4a
//   audio/fs-audio-cues.js   -> window.FS_AUDIO = { <block>: {src, d, w:[...]} }
//
// Usage:
//   node tools/gen-fs-audio.mjs                 # all blocks
//   node tools/gen-fs-audio.mjs licht reifen    # only these
//   node tools/gen-fs-audio.mjs --plan          # print what the voices will say
//
// Requires edge-tts (tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'deutsch-fuehrerschein.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-fs-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_UA = process.env.EDGE_VOICE_UA || 'uk-UA-PolinaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_INNER = 0.3;    // German -> Ukrainian
const GAP_WORD = 0.55;    // between entries
const LEAD_IN = 0.25;
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const PLAN_ONLY = process.argv.includes('--plan');

// ---------- read DATA out of the page ----------
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
const DATA = extractArray(html, 'DATA');
const targets = args.length ? DATA.filter(s => args.includes(s.id)) : DATA;
if (!targets.length) { console.error('no matching block'); process.exit(1); }

// ---------- what the voices actually say ----------
const stripTags = s => String(s).replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();

// "nächste Straße (links/rechts)" -> "nächste Straße links oder rechts"
// "einschalten von …" -> "einschalten von"
function speakDe(it) {
  if (it.say) return it.say;
  let s = (it.art ? it.art + ' ' : '') + stripTags(it.de);
  return s.replace(/\((.*?)\)/g, (m, inner) => inner.replace(/\s*\/\s*/g, ' oder '))
          .replace(/\s*\/\s*/g, ' oder ')
          .replace(/…|\.{3}/g, ' ')
          .replace(/\s{2,}/g, ' ').trim();
}
function speakUa(raw) {
  return String(raw)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[«»"]/g, '')
    .replace(/\s*\/\s*/g, ' або ')
    .replace(/…|\.{3}/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

if (PLAN_ONLY) {
  targets.forEach(sec => {
    console.log('\n### ' + sec.id + '  (' + sec.title + ')');
    sec.items.forEach(it => console.log('  ' + String(it.n).padStart(2) + ' DE  ' + speakDe(it) + '\n     UA  ' + speakUa(it.ua)));
  });
  console.log('\n' + targets.reduce((s, x) => s + x.items.length, 0) + ' entries in ' + targets.length + ' block(s)');
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
const idFor = (voice, text) => 'fs_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

// ---------- 1) collect clips ----------
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const clips = new Map();  // id -> {id, voice, text}
const plan = {};          // blockId -> [{n, de, ua, idDe, idUa}]
targets.forEach(sec => {
  plan[sec.id] = sec.items.map(it => {
    const de = speakDe(it), ua = speakUa(it.ua);
    const idDe = idFor(VOICE_DE, de), idUa = idFor(VOICE_UA, ua);
    clips.set(idDe, { id: idDe, voice: VOICE_DE, text: de });
    clips.set(idUa, { id: idUa, voice: VOICE_UA, text: ua });
    return { n: it.n, de, ua, idDe, idUa };
  });
});

const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`${clips.size} unique clips, ${missing.length} to fetch`);
if (missing.length) {
  const jobsFile = path.join(CACHE, 'jobs.json');
  fs.writeFileSync(jobsFile, JSON.stringify(missing.map(c => ({ id: c.id, voice: c.voice, text: c.text }))));
  execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, '12'],
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

// ---------- 2) stitch one track per block ----------
const out = {};
for (const sec of targets) {
  const list = [], cues = [];
  let t = 0;
  const push = f => { if (!f || !fs.existsSync(f)) return; list.push(f); t += wavDuration(f); };
  const r3 = x => Math.round(x * 1000) / 1000;

  push(silence(LEAD_IN));
  plan[sec.id].forEach(e => {
    const start = t;
    push(path.join(WAVDIR, e.idDe + '.wav'));
    const deEnd = t;
    push(silence(GAP_INNER));
    push(path.join(WAVDIR, e.idUa + '.wav'));
    const uaEnd = t;
    push(silence(GAP_WORD));
    cues.push({ n: e.n, de: e.de, ua: e.ua, t: r3(start), we: r3(deEnd), re: r3(uaEnd) });
  });

  const listFile = path.join(CACHE, `_list_${sec.id}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  const m4a = path.join(OUTDIR, `fs__${sec.id}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  out[sec.id] = { src: `audio/fs__${sec.id}.m4a`, d: r3(t), w: cues };
  console.log(`✓ ${sec.id.padEnd(12)} ${String(cues.length).padStart(3)} words  ${String(Math.round(t)).padStart(4)}s  ${(fs.statSync(m4a).size / 1048576).toFixed(2)} MB`);
}

// ---------- 3) cue file (merge with blocks built in an earlier run) ----------
const cuesFile = path.join(OUTDIR, 'fs-audio-cues.js');
let merged = {};
if (fs.existsSync(cuesFile)) {
  try { merged = JSON.parse(fs.readFileSync(cuesFile, 'utf8').replace(/^window\.FS_AUDIO = /, '').replace(/;\s*$/, '')); }
  catch (e) { merged = {}; }
}
Object.assign(merged, out);
fs.writeFileSync(cuesFile, 'window.FS_AUDIO = ' + JSON.stringify(merged) + ';\n');
console.log(`\nfs-audio-cues.js: ${Object.keys(merged).length} block(s)`);
