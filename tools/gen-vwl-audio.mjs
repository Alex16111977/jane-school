#!/usr/bin/env node
// Offline neural audio for vwl-egb.html, tab v0 "Überblick": a short spoken introduction to the subject
// (what VWL is, how the unit "Mein Geld, meine Entscheidung." works, what you must be able to explain).
//
// ONE continuous track with one cue per card (the six [data-ov] cards of #ls-v0), played by the bottom dock
// of the page. The text is Russian prose with German terms and quotes inside, so it is split by script:
// Cyrillic runs -> ru-RU-SvetlanaNeural, Latin runs -> de-DE-KatjaNeural.
//
// Units read per card: <h3> (spoken as "Блок N. <title>"), <p>, <li>. Everything else is ignored.
//
// Output:
//   audio/vwl-overview.m4a
//   audio/vwl-overview-cues.js -> window.VWL_OV_AUDIO = {src, d, w:[{de, t, e}]}   (de = card title shown in the dock)
//
// Usage:
//   node tools/gen-vwl-audio.mjs           # build
//   node tools/gen-vwl-audio.mjs --plan    # print what the voices will say, no TTS
//
// The vocabulary table of the same tab (table#vwlVocab, DE -> RU -> DE) is built by tools/gen-egb-vocab-audio.mjs vwl0.
// Requires edge-tts (tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'vwl-egb.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-vwl-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const VOICE = { de: VOICE_DE, ru: VOICE_RU };
const SR = 24000;
const BITRATE = '48k';
const LEAD_IN = 0.3;
const GAP_RUN = 0.1;     // between a Russian and a German run inside one sentence
const GAP_UNIT = 0.45;   // between paragraphs / list items
const GAP_TITLE = 0.7;   // after the spoken card title
const GAP_CHUNK = 1.2;   // between cards
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const PLAN_ONLY = process.argv.includes('--plan');

// ---------- html helpers ----------
const NAMED = { auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', amp: '&', mdash: '—', ndash: '–', nbsp: ' ',
  laquo: '«', raquo: '»', quot: '"', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', bdquo: '„', hellip: '…', middot: '·', rarr: '→', euro: '€' };
function decode(s) {
  return s.replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m).replace(/\s+/g, ' ').trim();
}
function balancedDiv(html, start) {
  const re = /<div\b[^>]*>|<\/div>/gi;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (/^<div/i.test(m[0])) depth++; else depth--;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  return html.slice(start);
}
function readCards() {
  const html = fs.readFileSync(PAGE, 'utf8');
  const li = html.indexOf('id="ls-v0"');
  if (li < 0) throw new Error('lesson ls-v0 not found');
  const lesson = balancedDiv(html, html.lastIndexOf('<div', li));
  const cards = [];
  const re = /<div class="note-card"[^>]*data-ov="(\d+)"[^>]*>/g;
  let m;
  while ((m = re.exec(lesson))) {
    const block = balancedDiv(lesson, m.index);
    const units = [];
    const ur = /<(h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let u;
    while ((u = ur.exec(block))) {
      const text = decode(u[2]);
      if (text) units.push({ kind: u[1].toLowerCase(), text });
    }
    const title = units.find(x => x.kind === 'h3');
    if (!title) throw new Error('card ' + m[1] + ' has no h3');
    cards.push({ n: +m[1], title: title.text, units });
  }
  if (!cards.length) throw new Error('no [data-ov] cards found');
  return cards;
}

// ---------- what the voices say ----------
const LAT = /[A-Za-zÄÖÜäöüß]/, CYR = /[А-Яа-яЁё]/;
function clean(raw) {
  return raw
    .replace(/…/g, '')
    .replace(/[«»„“”"‘’]/g, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s*[·→]\s*/g, ', ')
    .replace(/\s*\(([^)]*)\)/g, ', $1')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+,/g, ',').replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ').trim();
}
function terminate(t) { return /[.!?:]$/.test(t) ? t : t + '.'; }
function runsOf(raw) {
  const s = terminate(clean(raw));
  const runs = [];
  let cur = null;
  for (const tok of s.split(/(\s+)/)) {
    if (!tok) continue;
    const lang = LAT.test(tok) && !CYR.test(tok) ? 'de' : CYR.test(tok) ? 'ru' : null;
    if (lang === null || (cur && cur.lang === lang)) {
      if (cur) cur.text += tok; else cur = { lang: 'ru', text: tok };
    } else {
      if (cur) runs.push(cur);
      cur = { lang, text: tok };
    }
  }
  if (cur) runs.push(cur);
  return runs.map(r => {
    let t = r.text.trim().replace(/^[,;:.\s]+/, '').replace(/[,;:\s]+$/, '');
    if (r.lang === 'ru') t = t.replace(/€/g, ' евро').replace(/\s\/\s/g, ' или ');
    else t = t.replace(/€/g, ' Euro').replace(/\s\/\s/g, ' oder ');
    return { lang: r.lang, text: t.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim() };
  }).filter(r => /[\p{L}\d]/u.test(r.text));
}
function speechUnits(card) {
  return card.units.map(u => {
    let t = u.text;
    if (u.kind === 'h3') t = t.replace(/^(\d+)\s*·\s*/, 'Блок $1. ');
    return { kind: u.kind, runs: runsOf(t) };
  });
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
const idFor = (voice, text) => 'vwlov_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);
const r3 = x => Math.round(x * 1000) / 1000;

// ---------- main ----------
const cards = readCards();
const plan = cards.map(c => ({ card: c, units: speechUnits(c) }));

if (PLAN_ONLY) {
  let words = 0;
  plan.forEach(p => {
    console.log(`\n[card ${p.card.n}] ${p.card.title}`);
    p.units.forEach(u => {
      console.log('  ' + u.runs.map(r => `[${r.lang}] ${r.text}`).join('  '));
      words += u.runs.reduce((n, r) => n + r.text.split(/\s+/).length, 0);
    });
  });
  console.log(`\n${plan.length} cards, ~${words} words (≈ ${Math.round(words / 130)} min at 130 wpm)`);
  process.exit(0);
}

[MP3DIR, WAVDIR, OUTDIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
const clips = new Map();
const addClip = (lang, text) => { const id = idFor(VOICE[lang], text); clips.set(id, { id, voice: VOICE[lang], text }); return id; };
plan.forEach(p => p.units.forEach(u => { u.ids = u.runs.map(r => addClip(r.lang, r.text)); }));

const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`overview: ${plan.length} cards, ${clips.size} unique clips, ${missing.length} to fetch`);
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
push(silence(LEAD_IN));
plan.forEach((p, ci) => {
  if (ci) push(silence(GAP_CHUNK));
  const start = t;
  p.units.forEach((u, ui) => {
    if (ui) push(silence(u.kind === 'p' || u.kind === 'li' ? (p.units[ui - 1].kind === 'h3' ? GAP_TITLE : GAP_UNIT) : GAP_UNIT));
    u.ids.forEach((id, ri) => { if (ri) push(silence(GAP_RUN)); push(wav(id)); });
  });
  cues.push({ de: p.card.title, t: r3(start), e: r3(t) });
});
const listFile = path.join(CACHE, '_list_overview.txt');
fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
const m4a = path.join(OUTDIR, 'vwl-overview.m4a');
execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
fs.writeFileSync(path.join(OUTDIR, 'vwl-overview-cues.js'),
  'window.VWL_OV_AUDIO = ' + JSON.stringify({ src: 'audio/vwl-overview.m4a', d: r3(t), w: cues }) + ';\n');
console.log(`✓ vwl-overview.m4a  ${cues.length} cards  ${Math.round(t)}s (${(t / 60).toFixed(1)} min)  ${(fs.statSync(m4a).size / 1048576).toFixed(2)} MB  + vwl-overview-cues.js`);
