#!/usr/bin/env node
// Offline neural audio for the vocabulary tables on the EGB pages.
//
// Reads each word table straight out of its page (by table id; 1st column = German,
// 2nd column = Russian explanation), so the audio never drifts from the list.
// ONE continuous track per table with per-word cues (dock at the bottom + a 🔊 per row).
// Each word says:
//   [Deutsch] · pause · [Russisch: Erklärung] · pause · [Deutsch] again · longer pause
// German terms inside the Russian explanation are split off by script and read by the
// German voice, so "GmbH", "Vorstand", "Privatvermögen" are pronounced properly.
//
// Output per target:  audio/<key>__all.m4a  +  audio/<key>-audio-cues.js -> window.<GLOBAL> = {src, d, w:[{de,t,e}]}
//
// Usage:
//   node tools/gen-egb-vocab-audio.mjs              # all targets
//   node tools/gen-egb-vocab-audio.mjs rf9          # one target
//   node tools/gen-egb-vocab-audio.mjs rf9 --plan   # print what the voices will say
//
// Requires edge-tts (tools/edge_batch.py) and ffmpeg.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-egb-vocab-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const LEAD_IN = 0.3;
const GAP_LANG = 1.0;   // DE -> RU -> DE
const GAP_WORD = 2.0;   // between one word and the next
const GAP_RUN = 0.15;   // between Russian and German runs inside one explanation

const TARGETS = {
  bwr9: { page: 'bwr-egb.html', table: 'bwrVocab', global: 'BWR9_AUDIO' },
  rf9:  { page: 'iw-egb.html',  table: 'rfVocab',  global: 'RF9_AUDIO' },
};
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const PLAN_ONLY = process.argv.includes('--plan');
const picked = process.argv.slice(2).filter(a => !a.startsWith('--'));
const KEYS = picked.length ? picked : Object.keys(TARGETS);
KEYS.forEach(k => { if (!TARGETS[k]) { console.error('unknown target ' + k); process.exit(1); } });

// ---------- read a table out of a page ----------
function decode(s) {
  const named = { auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', amp: '&', mdash: '—', ndash: '–', nbsp: ' ', laquo: '«', raquo: '»', quot: '"', rsquo: '’', lsquo: '‘', euro: '€', rarr: '→' };
  return s.replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => named[n] ?? m).replace(/\s+/g, ' ').trim();
}
function readTable(tg) {
  const html = fs.readFileSync(path.join(ROOT, tg.page), 'utf8');
  const tm = html.match(new RegExp('<table[^>]*id="' + tg.table + '"[^>]*>([\\s\\S]*?)</table>'));
  if (!tm) throw new Error('table#' + tg.table + ' not found in ' + tg.page);
  const rows = [...tm[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map(m => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1]))
    .filter(cells => cells.length >= 2)
    .map(cells => ({ de: decode(cells[0]), ru: decode(cells[1]) }));
  if (!rows.length) throw new Error('no rows in table#' + tg.table);
  return rows;
}

// ---------- what the voices actually say ----------
const speakDe = raw => raw
  .replace(/\betw\./g, 'etwas')
  .replace(/\s*\(([^)]*)\)/g, ', $1')    // "die OHG (offene Handelsgesellschaft)" -> "die OHG, offene Handelsgesellschaft"
  .replace(/\s*\/\s*/g, ' oder ')        // "der Komplementär / die Komplementärin"
  .replace(/\s{2,}/g, ' ').trim();

// Russian explanation -> runs [{lang:'ru'|'de', text}], split by script, so that German terms
// are read by the German voice instead of being mangled by the Russian one.
const LAT = /[A-Za-zÄÖÜäöüß]/, CYR = /[А-Яа-яЁё]/;
function ruRuns(raw) {
  const s = raw
    .replace(/…/g, '')
    .replace(/(\d)\.(\d{3})\b/g, '$1$2')   // 25.000 -> 25000
    .replace(/(\d),(\d)/g, '$1,$2')
    .replace(/\s*—\s*/g, ', ')
    .replace(/[«»"]/g, '')
    .replace(/,?\s*=\s*/g, ', то же, что ')
    .replace(/\s*\(([^)]*)\)/g, ', $1')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+,/g, ',').replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ').replace(/[,\s]+$/, '').trim();
  const runs = [];
  let cur = null;
  for (const tok of s.split(/(\s+)/)) {
    if (!tok) continue;
    let lang = LAT.test(tok) && !CYR.test(tok) ? 'de' : CYR.test(tok) ? 'ru' : null;
    if (tok.trim() === '/') lang = null;
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
    if (r.lang === 'ru') t = t.replace(/€/g, ' евро').replace(/%/g, ' процентов').replace(/\s\/\s/g, ' или ');
    else t = t.replace(/€/g, ' Euro').replace(/\s\/\s/g, ' oder ').replace(/^&\s*/, '');
    return { lang: r.lang, text: t.replace(/\s{2,}/g, ' ').trim() };
  }).filter(r => /[\p{L}\d]/u.test(r.text));
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
const idFor = (voice, text) => 'egbv_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);
const VOICE = { de: VOICE_DE, ru: VOICE_RU };
const r3 = x => Math.round(x * 1000) / 1000;

[MP3DIR, WAVDIR, OUTDIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

for (const key of KEYS) {
  const tg = TARGETS[key];
  const DATA = readTable(tg);

  if (PLAN_ONLY) {
    console.log('\n===== ' + key + ' (' + tg.page + ') =====');
    DATA.forEach(v => console.log('\nDE  ' + speakDe(v.de) + '\nRU  ' + ruRuns(v.ru).map(r => r.lang === 'de' ? '[' + r.text + ']' : r.text).join(' ') + '\nDE  ' + speakDe(v.de)));
    console.log('\n' + DATA.length + ' word(s)');
    continue;
  }

  // 1) clips
  const clips = new Map();
  const add = (lang, text) => { const id = idFor(VOICE[lang], text); clips.set(id, { id, voice: VOICE[lang], text }); return id; };
  const plan = DATA.map(v => ({ de: v.de, idDe: add('de', speakDe(v.de)), ruIds: ruRuns(v.ru).map(r => add(r.lang, r.text)) }));
  const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
  console.log(`${key}: ${DATA.length} words, ${clips.size} unique clips, ${missing.length} to fetch`);
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

  // 2) one continuous track
  const list = [], cues = [];
  let t = 0;
  const push = f => { if (!f || !fs.existsSync(f)) return; list.push(f); t += wavDuration(f); };
  const wav = id => path.join(WAVDIR, id + '.wav');
  push(silence(LEAD_IN));
  plan.forEach(e => {
    const start = t;
    push(wav(e.idDe)); push(silence(GAP_LANG));
    e.ruIds.forEach((id, i) => { if (i) push(silence(GAP_RUN)); push(wav(id)); });
    push(silence(GAP_LANG)); push(wav(e.idDe));
    const end = t;
    push(silence(GAP_WORD));
    cues.push({ de: e.de, t: r3(start), e: r3(end) });
  });
  const listFile = path.join(CACHE, `_list_${key}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  const m4a = path.join(OUTDIR, `${key}__all.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  fs.writeFileSync(path.join(OUTDIR, `${key}-audio-cues.js`),
    `window.${tg.global} = ` + JSON.stringify({ src: `audio/${key}__all.m4a`, d: r3(t), w: cues }) + ';\n');
  console.log(`✓ ${key}__all.m4a  ${cues.length} words  ${Math.round(t)}s  ${(fs.statSync(m4a).size / 1048576).toFixed(2)} MB  + ${key}-audio-cues.js`);
}
