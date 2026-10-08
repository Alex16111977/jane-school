#!/usr/bin/env node
// Offline neural "Hör-Training" for deutsch-egb.html, lesson kt1 (Kontrolle am Montag): 12 exam questions on the
// Kann-Liste "Kommunikation", each followed by a thinking pause and the model answer, read by the German voice,
// then one short Russian tip. ONE continuous track with one cue per question, so the lesson dock (the same one that
// plays the other EGB Deutsch lessons) can step through the questions with prev/next.
//
// Source: #kannDrill .kd-det blocks of deutsch-egb.html (summary = short title, .kd-q question, .kd-a answer, .kd-tip tip).
//
// Output:
//   audio/egb-deutsch-kt1.m4a
//   audio/egb-deutsch-cues.js  (merged: window.EGB_DEUTSCH_AUDIO.kt1 = {src, d, title, c:[{kind,label,t}]}, other lessons kept)
//
// Usage:
//   node tools/gen-kann-audio.mjs            # build
//   node tools/gen-kann-audio.mjs --plan     # print what the voices will say, no TTS
//
// Requires edge-tts (tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'deutsch-egb.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-kann-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const VOICE = { de: VOICE_DE, ru: VOICE_RU };
const SR = 24000;
const BITRATE = '48k';
const LEAD_IN = 0.3;
const GAP_RUN = 0.12;     // between runs of different language inside one sentence
const GAP_AFTER_LABEL = 0.5;  // "Frage 3." -> question
const GAP_BEFORE_TIP = 0.9;
const GAP_CHUNK = 1.6;    // between questions
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';
const PLAN_ONLY = process.argv.includes('--plan');

const NAMED = { auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', amp: '&', mdash: '—', ndash: '–', nbsp: ' ',
  laquo: '«', raquo: '»', quot: '"', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', bdquo: '„', hellip: '…', middot: '·', rarr: '→', euro: '€' };
function decode(s) {
  return s.replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m).replace(/\s+/g, ' ').trim();
}

function readItems() {
  const html = fs.readFileSync(PAGE, 'utf8');
  const start = html.indexOf('id="kannDrill"');
  if (start < 0) throw new Error('#kannDrill not found');
  const end = html.indexOf('</div>', html.lastIndexOf('</details>', html.indexOf('Spickzettel', start)));
  const block = html.slice(start, end > start ? end : undefined);
  const items = [];
  const re = /<details class="kd-det">([\s\S]*?)<\/details>/g;
  let m;
  while ((m = re.exec(block))) {
    const g = (cls) => { const x = new RegExp('<(?:p|span)[^>]*class="' + cls + '"[^>]*>([\\s\\S]*?)</(?:p|span)>').exec(m[1]); return x ? decode(x[1]) : ''; };
    const n = +g('kd-n');
    items.push({ n, title: g('kd-qt'), q: g('kd-q'), a: g('kd-a'), tip: g('kd-tip') });
  }
  if (items.length !== 12) throw new Error('expected 12 questions, found ' + items.length);
  return items;
}

// ---------- what the voices say ----------
const LAT = /[A-Za-zÄÖÜäöüß]/, CYR = /[А-Яа-яЁё]/;
function clean(raw) {
  return raw.replace(/…/g, '').replace(/[«»„“”"‘’]/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/\s*[·→]\s*/g, ', ')
    .replace(/\s*\(([^)]*)\)/g, ', $1').replace(/%/g, ' Prozent').replace(/\s+,/g, ',').replace(/,\s*,+/g, ',').replace(/\s{2,}/g, ' ').trim();
}
function terminate(t) { return /[.!?:]$/.test(t) ? t : t + '.'; }
function runsOf(raw, defaultLang) {
  const s = terminate(clean(raw));
  const runs = [];
  let cur = null;
  for (const tok of s.split(/(\s+)/)) {
    if (!tok) continue;
    const lang = LAT.test(tok) && !CYR.test(tok) ? 'de' : CYR.test(tok) ? 'ru' : null;
    if (lang === null || (cur && cur.lang === lang)) {
      if (cur) cur.text += tok; else cur = { lang: defaultLang, text: tok };
    } else {
      if (cur) runs.push(cur);
      cur = { lang, text: tok };
    }
  }
  if (cur) runs.push(cur);
  return runs.map(r => ({ lang: r.lang, text: r.text.trim().replace(/^[,;:.\s]+/, '').replace(/[,;:\s]+$/, '').replace(/\s{2,}/g, ' ') }))
    .filter(r => /[\p{L}\d]/u.test(r.text));
}
const words = t => t.split(/\s+/).filter(Boolean).length;
function planOf(items) {
  return items.map(it => ({
    item: it,
    label: runsOf('Frage ' + it.n, 'de'),
    q: runsOf(it.q, 'de'),
    think: Math.min(9, Math.max(5, 4 + words(it.a) / 25)),
    aLabel: runsOf('Antwort', 'de'),
    a: runsOf(it.a, 'de'),
    tip: it.tip ? runsOf('Совет. ' + it.tip, 'ru') : [],
  }));
}

if (PLAN_ONLY) {
  const plan = planOf(readItems());
  let w = 0;
  plan.forEach(p => {
    console.log(`\n[${p.item.n}] ${p.item.title}`);
    console.log('  Q  ' + p.q.map(r => `[${r.lang}] ${r.text}`).join('  '));
    console.log(`  … ${p.think.toFixed(1)} s Pause`);
    console.log('  A  ' + p.a.map(r => `[${r.lang}] ${r.text}`).join('  '));
    console.log('  T  ' + p.tip.map(r => `[${r.lang}] ${r.text}`).join('  '));
    w += p.q.concat(p.a, p.tip).reduce((n, r) => n + words(r.text), 0);
  });
  console.log(`\n12 questions, ~${w} spoken words`);
  process.exit(0);
}

// ---------- audio helpers ----------
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
const idFor = (voice, text) => 'kann_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);
const r3 = x => Math.round(x * 1000) / 1000;

// ---------- main ----------
const plan = planOf(readItems());
[MP3DIR, WAVDIR, OUTDIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
const clips = new Map();
const addClip = (r) => { const id = idFor(VOICE[r.lang], r.text); clips.set(id, { id, voice: VOICE[r.lang], text: r.text }); return id; };
plan.forEach(p => { for (const k of ['label', 'q', 'aLabel', 'a', 'tip']) p[k + 'Ids'] = p[k].map(addClip); });

const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`kt1: 12 questions, ${clips.size} unique clips, ${missing.length} to fetch`);
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

const list = [], cues = [];
let t = 0;
const push = f => { if (!f || !fs.existsSync(f)) return; list.push(f); t += wavDuration(f); };
const wav = id => path.join(WAVDIR, id + '.wav');
const speak = (ids) => ids.forEach((id, i) => { if (i) push(silence(GAP_RUN)); push(wav(id)); });
push(silence(LEAD_IN));
plan.forEach((p, i) => {
  if (i) push(silence(GAP_CHUNK));
  const start = t;
  speak(p.labelIds); push(silence(GAP_AFTER_LABEL));
  speak(p.qIds);
  push(silence(p.think));                         // time to answer out loud
  speak(p.aLabelIds); push(silence(GAP_AFTER_LABEL));
  speak(p.aIds);
  if (p.tipIds.length) { push(silence(GAP_BEFORE_TIP)); speak(p.tipIds); }
  const label = p.item.n + ' · ' + p.item.title;
  cues.push({ kind: 'card', label: label.length > 72 ? label.slice(0, 71) + '…' : label, t: r3(start) });
});
const listFile = path.join(CACHE, '_list_kt1.txt');
fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
const m4a = path.join(OUTDIR, 'egb-deutsch-kt1.m4a');
execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);

// merge into the shared cues file of the EGB Deutsch lessons
const cuesPath = path.join(OUTDIR, 'egb-deutsch-cues.js');
let existing = {};
if (fs.existsSync(cuesPath)) {
  const m = /window\.EGB_DEUTSCH_AUDIO\s*=\s*(\{[\s\S]*\});?\s*$/.exec(fs.readFileSync(cuesPath, 'utf8'));
  if (m) { try { existing = JSON.parse(m[1]); } catch (e) { existing = {}; } }
}
existing.kt1 = { src: 'audio/egb-deutsch-kt1.m4a', d: r3(t), title: 'Hör-Training: 12 Fragen & Antworten', c: cues };
fs.writeFileSync(cuesPath, 'window.EGB_DEUTSCH_AUDIO = ' + JSON.stringify(existing) + ';\n');
console.log(`✓ egb-deutsch-kt1.m4a  12 questions  ${Math.round(t)}s (${(t / 60).toFixed(1)} min)  ${(fs.statSync(m4a).size / 1048576).toFixed(2)} MB  + cues merged (${Object.keys(existing).length} lessons)`);
