#!/usr/bin/env node
// Offline neural audio for deutsch-egb.html, lesson kt3 (Übungsklausur Kommunikation): a short Russian intro + the order of the text,
// then the model solution of Klausur A read by the German voice paragraph by paragraph (each with a short Russian pointer),
// a Konjunktiv-I speaking drill and a last checklist. ONE continuous track with one cue per block, so the lesson dock
// (the same one that plays the other EGB Deutsch lessons) can step through the blocks with prev/next.
//
// Source: <!--KLMODEL-A--> … <!--/KLMODEL-A--> in deutsch-egb.html (.kl-mh headings, .kl-mp paragraphs: data-say, data-pts, .kl-mt text, .kl-mru tip).
// The intro / order / drill / checklist texts only exist here (they are audio-only).
//
// Output:
//   audio/egb-deutsch-kt3.m4a
//   audio/egb-deutsch-cues.js  (merged: window.EGB_DEUTSCH_AUDIO.kt3 = {src, d, title, c:[{kind,label,t}]}, other lessons kept)
//
// Usage:
//   node tools/gen-klausur-audio.mjs            # build
//   node tools/gen-klausur-audio.mjs --plan     # print what the voices will say, no TTS
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
const CACHE = path.join(os.tmpdir(), 'jane-school-kann-audio-cache');   // shared with gen-kann-audio.mjs (clip ids are content hashes)
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const VOICE = { de: VOICE_DE, ru: VOICE_RU };
const SR = 24000;
const BITRATE = '48k';
const LEAD_IN = 0.3;
const GAP_RUN = 0.12;          // between runs of different language inside one sentence
const GAP_AFTER_LABEL = 0.55;  // "Eisbergmodell. Zehn Punkte." -> text
const GAP_BEFORE_TIP = 0.9;
const GAP_CHUNK = 1.5;         // between blocks
const GAP_SENT = 0.45;         // between sentences of the intro
const DRILL_PAUSE = 4.2;       // time to repeat a drill sentence aloud
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';
const PLAN_ONLY = process.argv.includes('--plan');

const NAMED = { auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', amp: '&', mdash: '—', ndash: '–', nbsp: ' ',
  laquo: '«', raquo: '»', quot: '"', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', bdquo: '„', hellip: '…', middot: '·', rarr: '→', euro: '€', lt: '<', gt: '>' };
function decode(s) {
  return s.replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m).replace(/\s+/g, ' ').trim();
}

const RU_PTS = { 2: 'два балла', 3: 'три балла', 5: 'пять баллов', 10: 'десять баллов', 20: 'двадцать баллов' };
const SPECIAL_PTS = {   // blocks whose points cover several paragraphs
  'Einstieg': 'Картинка. Десять баллов за весь блок.',
  'erstes Axiom': 'Десять баллов за оба Axiome.',
  'Vier-Ebenen-Modell, Überblick': 'Двадцать баллов за весь блок.',
};
const HEAD_SAY = ['Aufgabe eins. Bildanalyse.', 'Aufgabe zwei. Gesprächsanalyse, ein zusammenhängender Text.'];
const HEAD_LABEL = ['Aufgabe 1', 'Aufgabe 2'];

function readModel() {
  const html = fs.readFileSync(PAGE, 'utf8');
  const a = html.indexOf('<!--KLMODEL-A-->'), b = html.indexOf('<!--/KLMODEL-A-->');
  if (a < 0 || b < 0) throw new Error('KLMODEL-A markers not found');
  const block = html.slice(a, b);
  const re = /<h4 class="kl-mh">([\s\S]*?)<\/h4>|<div class="kl-mp" data-sec="([^"]*)" data-say="([^"]*)" data-pts="([^"]*)">([\s\S]*?)<\/div>\s*(?=<h4|<div class="kl-mp"|$)/g;
  const items = [];
  let m, h = -1;
  while ((m = re.exec(block))) {
    if (m[1] !== undefined) { h++; continue; }
    const body = m[5];
    const g = (cls) => { const x = new RegExp('<p class="' + cls + '">([\\s\\S]*?)</p>').exec(body); return x ? decode(x[1]) : ''; };
    items.push({ head: h, sec: decode(m[2]), say: decode(m[3]), pts: m[4] ? +m[4] : 0, text: g('kl-mt'), tip: g('kl-mru').replace(/^Почему так:\s*/, ''), first: false });
  }
  items.forEach((it, i) => { it.first = i === 0 || items[i - 1].head !== it.head; });
  if (items.length !== 16) throw new Error('expected 16 model paragraphs for A, found ' + items.length);
  return items;
}

// ---------- what the voices say ----------
const LAT = /[A-Za-zÄÖÜäöüß]/, CYR = /[А-Яа-яЁё]/;
function spoken(raw) {   // fixes for things TTS would mis-read
  return raw.replace(/Konjunktiv\s+I\b/g, 'Konjunktiv eins').replace(/\b1\.\s*Axiom/g, 'erstes Axiom').replace(/\b5\.\s*Axiom/g, 'fünftes Axiom')
    .replace(/\b4 Ebenen\b/g, 'vier Ebenen').replace(/\bKonjunktiv II\b/g, 'Konjunktiv zwei');
}
function clean(raw) {
  let t = spoken(raw)
    .replace(/\b([1-4])\)/g, (m, d) => ({ 1: 'Раз:', 2: 'Два:', 3: 'Три:', 4: 'Четыре:' }[d]))
    .replace(/„([^“”]+)[“”]/g, ', $1, ').replace(/«([^»]+)»/g, ', $1, ')       // quoted chunks become short pauses
    .replace(/…/g, '').replace(/[„“”"‘’]/g, '').replace(/\s=\s/g, ' — ')
    .replace(/\s*[—–]\s*/g, ', ').replace(/\s*[·→]\s*/g, ', ')
    .replace(/\s*\(([^)]*)\)/g, ', $1').replace(/%/g, ' Prozent');
  return t.replace(/\s+([,.;:])/g, '$1').replace(/([,;:])\s*([,;])/g, '$1').replace(/:\s*,/g, ':').replace(/\.\s*,/g, '.').replace(/,\s*\./g, '.')
    .replace(/\.{2,}/g, '.').replace(/,{2,}/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,;:\s]+/, '').trim();
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

// ---------- the audio-only texts ----------
const INTRO = [
  'Контрольная по Kommunikation. Ты прислала Übungsklausur учителя: это образец, и в понедельник будет похожая. Сначала я расскажу, как она устроена, потом ты услышишь образец текста.',
  'Первое: Ausgangssituation. Короткая вводная: кто, где и что случилось.',
  'Второе: Aufgabe eins, картинка. Нужно описать Mimik, Gestik и Körperhaltung обоих людей и объяснить, что это говорит о ситуации.',
  'Третье: Aufgabe zwei, диалог. Его нужно разобрать одним связным текстом, не пунктами. Для этого есть четыре инструмента: Eisbergmodell; verbale, nonverbale und paraverbale Kommunikation; erstes und fünftes Axiom von Watzlawick; и Vier-Ebenen-Modell von Schulz von Thun.',
  'Всего сто баллов. Семьдесят за содержание и тридцать за форму: структура, язык и правильность. Больше всего дают два блока: Vier-Ebenen-Modell, двадцать баллов, и Sprachrichtigkeit, шестнадцать баллов: орфография, запятые и грамматика. Поэтому пиши не красиво, а правильно и по порядку.',
];
const ORDER = [
  'Порядок текста в Aufgabe zwei, как в Erwartungshorizont учителя.',
  'Раз: Einleitung, два предложения, три балла. Два: Situationsbeschreibung, пересказ своими словами, десять баллов. Три: Überleitung, одно предложение-мостик, два балла. Четыре: Eisbergmodell, десять баллов. Пять: erstes und fünftes Axiom, десять баллов. Шесть: nonverbale und paraverbale Kommunikation, пять баллов. Семь: Vier-Ebenen-Modell, двадцать баллов. И в конце, если останется время, короткий Schluss.',
  'В Aufgabe eins порядок такой: сначала картинка в целом, потом Frau Keller, потом Jonas, потом вывод.',
  'Теперь послушай образец. Это мой текст по Erwartungshorizont. На контрольной можно писать короче, главное, чтобы были все пункты.',
];
const DRILL_INTRO = 'Redewiedergabe. Когда ты пересказываешь слова человека, глагол ставится в Konjunktiv eins. Повторяй каждое предложение вслух после паузы.';
const DRILL = [
  'Frau Keller wirft Jonas vor, er habe die Folien nicht selbst kontrolliert.',
  'Jonas erklärt, er habe gestern viel um die Ohren gehabt.',
  'Frau Keller betont, schnell reiche ihr nicht.',
  'Sie kündigt an, sie werde die Präsentation allein übernehmen, falls er die Fehler nicht innerhalb von zehn Minuten korrigiere.',
  'Tim unterstellt Lena, sie wolle sich vor Herrn Schmitz profilieren.',
  'Beide sagen, sie hätten großen Druck.',
];
const DRILL_RULE = 'Правило: для er, sie, es к основе глагола добавляется e: er habe, sie sei, es passe, sie werde, er korrigiere. Если форма совпадает с обычной, как sie haben, берём Konjunktiv zwei: sie hätten, sie würden korrigieren.';
const CHECK = [
  'Перед сдачей проверь семь вещей.',
  'Первое: это связный текст, а не список. Второе: везде Präsens. Третье: чужие слова стоят в Konjunktiv eins. Четвёртое: каждое утверждение с примером из диалога или с картинки. Пятое: das и dass, большие буквы у существительных. Шестое: запятые перед dass, weil и wenn. Седьмое: нет слова ich и разговорных выражений.',
  'Удачи в понедельник!',
];

// a block = ordered steps: { say: raw, lang, gap } | { pause: seconds }
function buildBlocks(model) {
  const blocks = [];
  const say = (steps, raw, lang, gapAfter = GAP_SENT) => { steps.push({ runs: runsOf(raw, lang), gap: gapAfter }); };
  { const s = []; INTRO.forEach(t => say(s, t, 'ru')); blocks.push({ label: 'Так устроена контрольная', steps: s }); }
  { const s = []; ORDER.forEach(t => say(s, t, 'ru')); blocks.push({ label: 'Порядок текста', steps: s }); }
  model.forEach(it => {
    const s = [];
    if (it.first) { say(s, HEAD_SAY[it.head], 'de', GAP_AFTER_LABEL); }
    const ptsRu = SPECIAL_PTS[it.say] || (it.pts ? RU_PTS[it.pts] + '.' : '');
    s.push({ runs: runsOf(it.say, 'de').concat(ptsRu ? runsOf(ptsRu, 'ru') : []), gap: GAP_AFTER_LABEL });
    s.push({ runs: runsOf(it.text, 'de'), gap: GAP_BEFORE_TIP });
    if (it.tip) { s.push({ runs: runsOf('Совет. ' + it.tip, 'ru'), gap: 0 }); }
    const label = HEAD_LABEL[it.head] + ' · ' + it.sec + (it.pts && !SPECIAL_PTS[it.say] ? ' (' + it.pts + ' P.)' : '');
    blocks.push({ label: label.length > 72 ? label.slice(0, 71) + '…' : label, steps: s });
  });
  { const s = []; say(s, DRILL_INTRO, 'ru', GAP_AFTER_LABEL);
    DRILL.forEach(t => { s.push({ runs: runsOf(t, 'de'), gap: 0 }); s.push({ pause: DRILL_PAUSE }); });
    say(s, DRILL_RULE, 'ru', 0); blocks.push({ label: 'Redewiedergabe: Konjunktiv I zum Nachsprechen', steps: s }); }
  { const s = []; CHECK.forEach(t => say(s, t, 'ru')); blocks.push({ label: 'Checkliste vor der Abgabe', steps: s }); }
  return blocks;
}

if (PLAN_ONLY) {
  const blocks = buildBlocks(readModel());
  let w = 0;
  blocks.forEach((b, i) => {
    console.log(`\n[${i + 1}] ${b.label}`);
    b.steps.forEach(st => {
      if (st.pause) { console.log(`  … ${st.pause} s Pause`); return; }
      console.log('  ' + st.runs.map(r => `[${r.lang}] ${r.text}`).join('  '));
      w += st.runs.reduce((n, r) => n + words(r.text), 0);
    });
  });
  console.log(`\n${blocks.length} blocks, ~${w} spoken words`);
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
const blocks = buildBlocks(readModel());
[MP3DIR, WAVDIR, OUTDIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
const clips = new Map();
const addClip = (r) => { const id = idFor(VOICE[r.lang], r.text); clips.set(id, { id, voice: VOICE[r.lang], text: r.text }); return id; };
blocks.forEach(b => b.steps.forEach(st => { if (st.runs) st.ids = st.runs.map(addClip); }));

const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`kt3: ${blocks.length} blocks, ${clips.size} unique clips, ${missing.length} to fetch`);
if (missing.length) {
  const jobsFile = path.join(CACHE, 'jobs_kt3.json');
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
blocks.forEach((b, i) => {
  if (i) push(silence(GAP_CHUNK));
  const start = t;
  b.steps.forEach(st => {
    if (st.pause) { push(silence(st.pause)); return; }
    speak(st.ids);
    if (st.gap) push(silence(st.gap));
  });
  cues.push({ kind: 'card', label: b.label, t: r3(start) });
});
const listFile = path.join(CACHE, '_list_kt3.txt');
fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
const m4a = path.join(OUTDIR, 'egb-deutsch-kt3.m4a');
execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);

// merge into the shared cues file of the EGB Deutsch lessons
const cuesPath = path.join(OUTDIR, 'egb-deutsch-cues.js');
let existing = {};
if (fs.existsSync(cuesPath)) {
  const m = /window\.EGB_DEUTSCH_AUDIO\s*=\s*(\{[\s\S]*\});?\s*$/.exec(fs.readFileSync(cuesPath, 'utf8'));
  if (m) { try { existing = JSON.parse(m[1]); } catch (e) { existing = {}; } }
}
existing.kt3 = { src: 'audio/egb-deutsch-kt3.m4a', d: r3(t), title: 'Übungsklausur: Aufbau & Musterlösung (Klausur A)', c: cues };
fs.writeFileSync(cuesPath, 'window.EGB_DEUTSCH_AUDIO = ' + JSON.stringify(existing) + ';\n');
console.log(`✓ egb-deutsch-kt3.m4a  ${blocks.length} blocks  ${Math.round(t)}s (${(t / 60).toFixed(1)} min)  ${(fs.statSync(m4a).size / 1048576).toFixed(2)} MB  + cues merged (${Object.keys(existing).length} lessons)`);
