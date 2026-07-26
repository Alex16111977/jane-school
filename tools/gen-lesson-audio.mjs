#!/usr/bin/env node
// Generate "listen to this lesson" audio for the 15 A2 grammar lesson pages
// (deutsch-verwechslungen.html, deutsch-zwei-verben.html, ... see PAGES below).
// Unlike the vocab-deck audio pages, these lessons code-switch mid-sentence
// (German grammar terms embedded inside Russian explanatory prose, and back),
// so the narration is built by classifying each character as German/Russian
// script and splitting the extracted text into contiguous same-language runs,
// each spoken in the matching neural voice, concatenated with a short gap.
//
// Content extraction walks each page's real DOM structure (no HTML parser
// dependency, just balanced-<div> scanning tuned to this project's shared
// lesson template: .tabs > .tab-content > .zp-notes > .note-section >
// .lesson-header-block + .note-card, with .unit-table for tables). Quiz/
// exercise blocks (.quiz-container / .quiz-question, wrapped or bare) are
// always stripped -- they're interactive, not narration content. A tab whose
// only content is an exercise (no note-card left after stripping) is skipped
// entirely, including its own announcement.
// deutsch-masse.html uses a different component set (.unit-card, .ex-row,
// .rule-box, .section-label, .kitchen-card instead of .note-card) -- the
// PAGES table below overrides which classes count as a "chunk" per page, but
// the actual text-collecting code (unit/table/li/p/ex-row/etc.) is the same.
//
// One audio/lesson-<slug>.m4a + audio/lesson-<slug>.json (cue data) per page,
// plus a matching audio/lesson-<slug>-cues.js (assigns window.LESSON_AUDIO,
// loaded via <script src> so it works from file:// too, no fetch needed).
//
// Usage:
//   node tools/gen-lesson-audio.mjs                        # all 15 pages
//   node tools/gen-lesson-audio.mjs meinetwegen von-innen   # just these slugs
//   node tools/gen-lesson-audio.mjs --force
//   node tools/gen-lesson-audio.mjs --dry
//   node tools/gen-lesson-audio.mjs --plan meinetwegen      # print the speech plan, no TTS
//
// Requires edge-tts (via tools/edge_batch.py) and ffmpeg.
// Voices: German = de-DE-KatjaNeural, Russian = ru-RU-SvetlanaNeural
// (override with EDGE_VOICE_DE / EDGE_VOICE_RU).

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-lesson-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_RUN = 0.07;    // between language-switch runs inside one sentence/unit
const GAP_UNIT = 0.22;   // between units (li/p/table-row) inside one chunk
const GAP_CHUNK = 0.6;   // between chunks (header/note-card/tab-announcement)
const LEAD_IN = 0.3;
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const DEFAULT_CHUNK_CLASSES = ['lesson-header-block', 'note-card'];
const PAGES = {
  'verwechslungen': { file: 'deutsch-verwechslungen.html' },
  'zwei-verben': { file: 'deutsch-zwei-verben.html' },
  'praefix-verben': { file: 'deutsch-praefix-verben.html' },
  'adjektive': { file: 'deutsch-adjektive.html' },
  'komparativ': { file: 'deutsch-komparativ.html' },
  'adverbien': { file: 'deutsch-adverbien.html' },
  'von-innen': { file: 'deutsch-von-innen.html' },
  'vor-kurzem': { file: 'deutsch-vor-kurzem.html' },
  'meinetwegen': { file: 'deutsch-meinetwegen.html' },
  'adj-vs-adv': { file: 'deutsch-adj-vs-adv.html' },
  'mengen': { file: 'deutsch-mengen.html' },
  'masse': { file: 'deutsch-masse.html', chunkClasses: ['lesson-header-block', 'section-label', 'note-card', 'rule-box', 'unit-grid', 'ex-list'] },
  'fehler': { file: 'deutsch-fehler.html' },
  'fremdwoerter': { file: 'deutsch-fremdwoerter.html' },
  'schreibregeln': { file: 'deutsch-schreibregeln.html' },
};

// ---------- entity decoding ----------
const NAMED_ENT = {
  uuml: 'ü', auml: 'ä', ouml: 'ö', szlig: 'ß', Uuml: 'Ü', Auml: 'Ä', Ouml: 'Ö',
  mdash: '—', ndash: '–', hellip: '…', rarr: '→', larr: '←', harr: '↔',
  amp: '&', nbsp: ' ', quot: '"', laquo: '«', raquo: '»', bull: '•', middot: '·',
  shy: '', rsquo: '’', lsquo: '‘', times: '×', deg: '°', copy: '©',
  minus: '−',
};
function safeCodePoint(cp) { try { return String.fromCodePoint(cp); } catch (e) { return ''; } }
function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in NAMED_ENT ? NAMED_ENT[name] : m));
}
// tags are removed with NO inserted space: inline emphasis (<strong>et</strong> inside
// "mein<strong>et</strong>wegen") must reassemble into one word, not "mein et wegen".
// Block/list/cell boundaries are already separate regex captures elsewhere, and any real
// word-break next to a tag (e.g. around <br>) already has literal whitespace in the source.
function stripTags(html) { return decodeEntities(String(html).replace(/<[^>]+>/g, '')); }
function cleanWs(s) { return s.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, ' ').trim(); }

// speech-only cleanup: keep the right/wrong signal from tick/cross marks as words, drop other emoji/symbols
function speakify(s) {
  return cleanWs(
    s.replace(/[✅✓☑]/g, ' Richtig: ')
     .replace(/[❌✗✘]/g, ' Falsch: ')
     .replace(/[\u{1F1E6}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
  );
}

// ---------- balanced <div>...</div> matcher ----------
function findBalancedDiv(html, startIdx) {
  const tagRe = /<div\b[^>]*>|<\/div>/gi;
  tagRe.lastIndex = startIdx;
  let depth = 0, m;
  while ((m = tagRe.exec(html))) {
    if (/^<div/i.test(m[0])) depth++; else depth--;
    if (depth === 0) return html.slice(startIdx, m.index + m[0].length);
  }
  return html.slice(startIdx);
}
function findBlocksByClass(html, cls) {
  const out = [];
  const re = new RegExp('<div\\s+class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*>', 'gi');
  let m;
  while ((m = re.exec(html))) out.push({ start: m.index, cls, html: findBalancedDiv(html, m.index) });
  return out;
}
function removeBlocksByClass(html, cls) {
  let out = html, changed = true;
  while (changed) {
    changed = false;
    const re = new RegExp('<div\\s+class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*>', 'i');
    const m = re.exec(out);
    if (m) { const block = findBalancedDiv(out, m.index); out = out.slice(0, m.index) + out.slice(m.index + block.length); changed = true; }
  }
  return out;
}
function topLevelOnly(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const out = [];
  let coveredUntil = -1;
  for (const b of sorted) {
    if (b.start < coveredUntil) continue; // nested inside an already-kept block -> its text is already included
    out.push(b);
    coveredUntil = b.start + b.html.length;
  }
  return out;
}

// ---------- language-run splitting: classify each character, split into contiguous DE/RU runs ----------
function classify(ch) {
  if (/[Ѐ-ӿ]/.test(ch)) return 'ru';
  if (/[a-zA-ZäöüßÄÖÜ]/.test(ch)) return 'de';
  return null; // neutral: digits, punctuation, spaces, symbols -- always extends the current run
}
function splitRuns(text) {
  const runs = [];
  let buf = '', lang = null;
  for (const ch of Array.from(text)) {
    const c = classify(ch);
    if (c === null) { buf += ch; continue; }
    if (lang === null) { lang = c; buf += ch; continue; }
    if (c === lang) { buf += ch; continue; }
    runs.push({ lang, text: buf });
    buf = ch; lang = c;
  }
  if (buf) runs.push({ lang: lang || 'de', text: buf });
  return runs.map(r => ({ lang: r.lang, text: r.text.trim() }))
    .filter(r => r.text && /[a-zA-ZäöüßÄÖÜЀ-ӿ]/.test(r.text));
}

// ---------- one <div class="lesson-header-block"> -> a single announcement string ----------
function headerBlockToText(blockHtml) {
  const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(blockHtml);
  const sub = /<p class="lesson-header-sub"[^>]*>([\s\S]*?)<\/p>/i.exec(blockHtml);
  const parts = [];
  if (h2) parts.push(cleanWs(stripTags(h2[1])));
  if (sub) parts.push(cleanWs(stripTags(sub[1])));
  return parts.filter(Boolean).join('. ');
}

// ---------- any other chunk container -> an ordered array of speakable "units" ----------
const UNIT_RE = new RegExp(
  '<table[^>]*class="[^"]*(?:unit-table|compare-table)[^"]*"[^>]*>([\\s\\S]*?)<\\/table>' +
  '|<h[34][^>]*>([\\s\\S]*?)<\\/h[34]>' +
  '|<div class="rule-title"[^>]*>([\\s\\S]*?)<\\/div>' +
  '|<li[^>]*>([\\s\\S]*?)<\\/li>' +
  '|<div class="ex-row"[^>]*>\\s*<span class="ex-de"[^>]*>([\\s\\S]*?)<\\/span>\\s*<span class="ex-ru"[^>]*>([\\s\\S]*?)<\\/span>' +
  '|<div class="unit-card"[^>]*>[\\s\\S]*?<div class="unit-name"[^>]*>([\\s\\S]*?)<\\/div>\\s*<div class="unit-equiv"[^>]*>([\\s\\S]*?)<\\/div>' +
  '|<div class="kitchen-card"[^>]*>[\\s\\S]*?<div class="kitchen-full"[^>]*>([\\s\\S]*?)<\\/div>\\s*<div class="kitchen-ru"[^>]*>([\\s\\S]*?)<\\/div>' +
  '|<p[^>]*>([\\s\\S]*?)<\\/p>',
  'gi'
);
function terminate(t) { return t + (/[.!?…]$/.test(t) ? '' : '.'); }
function blockToUnits(blockHtml) {
  const html = removeBlocksByClass(removeBlocksByClass(blockHtml, 'quiz-container'), 'quiz-question');
  const units = [];
  const re = new RegExp(UNIT_RE.source, 'gi');
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) {
      const rows = [...m[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      for (const rm of rows) {
        if (!/<td/i.test(rm[1])) continue; // header-only row, skip
        const cells = [...rm[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cm => cleanWs(stripTags(cm[1]))).filter(Boolean);
        if (cells.length) units.push(terminate(cells.join(', ')));
      }
    } else if (m[5] !== undefined) {
      const de = cleanWs(stripTags(m[5])).replace(/[.!?…]+$/, '');
      const ru = cleanWs(stripTags(m[6]));
      const t = [de, ru].filter(Boolean).join('. — ');
      if (t) units.push(terminate(t));
    } else if (m[7] !== undefined) {
      const t = [cleanWs(stripTags(m[7])), cleanWs(stripTags(m[8]))].filter(Boolean).join(', ');
      if (t) units.push(terminate(t));
    } else if (m[9] !== undefined) {
      const t = [cleanWs(stripTags(m[9])), cleanWs(stripTags(m[10]))].filter(Boolean).join(', ');
      if (t) units.push(terminate(t));
    } else {
      const inner = m[2] ?? m[3] ?? m[4] ?? m[11];
      const t = cleanWs(stripTags(inner));
      if (t) units.push(terminate(t));
    }
  }
  return units.filter(Boolean);
}

// ---------- whole-page extraction -> ordered list of {kind, units[]} chunks ----------
function extractPage(html, chunkClasses) {
  const chunks = [];
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const subtitle = /<p class="page-subtitle"[^>]*>([\s\S]*?)<\/p>/i.exec(html);
  const introUnits = [];
  if (h1) introUnits.push(terminate(cleanWs(stripTags(h1[1]))));
  if (subtitle) introUnits.push(terminate(cleanWs(stripTags(subtitle[1]))));
  if (introUnits.length) chunks.push({ kind: 'title', units: introUnits });

  const tabBtnRe = /<button class="tab[^"]*" data-tab="([^"]+)">([\s\S]*?)<\/button>/gi;
  const tabs = [];
  let tm;
  while ((tm = tabBtnRe.exec(html))) tabs.push({ key: tm[1], label: cleanWs(stripTags(tm[2])) });

  for (const tab of tabs) {
    const idMarker = 'id="tab-' + tab.key + '"';
    const openIdx = html.indexOf(idMarker);
    if (openIdx < 0) continue;
    const divStart = html.lastIndexOf('<div', openIdx);
    const block = findBalancedDiv(html, divStart);

    let found = [];
    for (const cls of chunkClasses) found = found.concat(findBlocksByClass(block, cls));
    found = topLevelOnly(found);

    const tabChunks = [];
    for (const b of found) {
      const units = b.cls === 'lesson-header-block' ? (() => { const t = headerBlockToText(b.html); return t ? [t] : []; })() : blockToUnits(b.html);
      if (units.length) tabChunks.push({ kind: 'card', units });
    }
    if (!tabChunks.length) continue; // exercise-only or empty tab -> skip entirely, including its own announcement

    chunks.push({ kind: 'tab', units: [tab.label] });
    chunks.push(...tabChunks);
  }
  return chunks;
}

// ---------- WAV helpers (identical approach to the other generators in this repo) ----------
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
const execFileP = (cmd, a) => new Promise((res, rej) => execFile(cmd, a, { timeout: 30000 }, e => e ? rej(e) : res()));
const wavFor = id => { const f = path.join(WAVDIR, id + '.wav'); return fs.existsSync(f) ? f : null; };
const idFor = (voice, text) => 'ls_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

// ---------- turn chunks into an ordered clip plan: [{id, voice, text, gap}], plus chunk cue offsets ----------
function planChunks(chunks) {
  const plan = [];
  const cueMeta = []; // { kind, units, firstClipIdx }
  chunks.forEach((chunk) => {
    let firstInChunk = true;
    cueMeta.push({ kind: chunk.kind, units: chunk.units, planIdx: plan.length });
    chunk.units.forEach((unit) => {
      const runs = splitRuns(speakify(unit));
      runs.forEach((run, ri) => {
        const voice = run.lang === 'ru' ? VOICE_RU : VOICE_DE;
        const gap = firstInChunk ? 0 : (ri === 0 ? GAP_UNIT : GAP_RUN);
        plan.push({ id: idFor(voice, run.text), voice, text: run.text, gap });
        firstInChunk = false;
      });
    });
  });
  return { plan, cueMeta };
}

function buildLesson(slug, html, chunkClasses) {
  const chunks = extractPage(html, chunkClasses);
  const { plan, cueMeta } = planChunks(chunks);
  if (!plan.length) { console.log(`✗ ${slug}  no narratable content found`); return null; }

  const list = [], timeAtPlanIdx = [];
  let t = 0;
  const push = (file) => { if (!file) return; list.push(file); t += wavDuration(file); };
  push(silence(LEAD_IN));
  plan.forEach((clip, i) => {
    timeAtPlanIdx[i] = t;
    if (clip.gap) push(silence(clip.gap));
    push(wavFor(clip.id));
  });
  const total = Math.round(t * 1000) / 1000;

  const cues = cueMeta.map(cm => ({ kind: cm.kind, units: cm.units, t: Math.round((timeAtPlanIdx[cm.planIdx] ?? total) * 1000) / 1000 }));

  const listFile = path.join(WAVDIR, `_list_lesson_${slug}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  fs.mkdirSync(OUTDIR, { recursive: true });
  const m4a = path.join(OUTDIR, `lesson-${slug}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  fs.writeFileSync(path.join(OUTDIR, `lesson-${slug}.json`), JSON.stringify({ d: total, voiceDe: VOICE_DE, voiceRu: VOICE_RU, c: cues }));
  fs.writeFileSync(path.join(OUTDIR, `lesson-${slug}-cues.js`),
    'window.LESSON_AUDIO = ' + JSON.stringify({ src: `audio/lesson-${slug}.m4a`, d: total, c: cues }) + ';\n');
  console.log(`✓ ${slug}  ${chunks.length} chunks  ${plan.length} clips  ${Math.round(total)}s  ${Math.round(fs.statSync(m4a).size / 1024)}KB`);
  return { slug, chunks, plan, total };
}

// ---------- main ----------
const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const planIdx = args.indexOf('--plan');
const cIdx = args.indexOf('--concurrency');
const CONCURRENCY = cIdx >= 0 ? parseInt(args[cIdx + 1], 10) : 16;
const slugArgs = args.filter(a => !a.startsWith('--') && a !== args[planIdx + 1]);
const targets = (planIdx >= 0 ? [args[planIdx + 1]] : (slugArgs.length ? slugArgs : Object.keys(PAGES)))
  .filter(s => PAGES[s] || console.log(`unknown slug: ${s}`));

function loadHtml(slug) { return fs.readFileSync(path.join(ROOT, PAGES[slug].file), 'utf8'); }

if (planIdx >= 0) {
  const slug = targets[0];
  const html = loadHtml(slug);
  const chunks = extractPage(html, PAGES[slug].chunkClasses || DEFAULT_CHUNK_CLASSES);
  const { plan } = planChunks(chunks);
  chunks.forEach((c, i) => console.log(`\n[chunk ${i} - ${c.kind}]\n  ${c.units.join('\n  ')}`));
  console.log(`\n${chunks.length} chunks, ${plan.length} tts clips`);
  process.exit(0);
}

const allChunksBySlug = {};
for (const slug of targets) allChunksBySlug[slug] = extractPage(loadHtml(slug), PAGES[slug].chunkClasses || DEFAULT_CHUNK_CLASSES);

if (dry) {
  let totalChunks = 0, totalClips = 0;
  for (const slug of targets) {
    const { plan } = planChunks(allChunksBySlug[slug]);
    totalChunks += allChunksBySlug[slug].length; totalClips += plan.length;
    console.log(`${slug}  ${allChunksBySlug[slug].length} chunks  ${plan.length} clips`);
  }
  console.log(`\nTotal: ${totalChunks} chunks, ${totalClips} tts clip-slots across ${targets.length} page(s)`);
  process.exit(0);
}

const todo = targets.filter(slug => force || !fs.existsSync(path.join(OUTDIR, `lesson-${slug}.m4a`)));
if (!todo.length) { console.log('nothing to build (all present; use --force)'); process.exit(0); }

console.log(`Pages: ${todo.join(', ')}  |  DE ${VOICE_DE}  RU ${VOICE_RU}`);
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const jobMap = new Map();
const plansBySlug = {};
for (const slug of todo) {
  const { plan } = planChunks(allChunksBySlug[slug]);
  plansBySlug[slug] = plan;
  for (const clip of plan) if (!jobMap.has(clip.id)) jobMap.set(clip.id, { id: clip.id, voice: clip.voice, text: clip.text });
}
const jobs = [...jobMap.values()];
const jobsFile = path.join(CACHE, 'jobs.json');
fs.writeFileSync(jobsFile, JSON.stringify(jobs));
console.log(`Fetching ${jobs.length} unique tts clips (concurrency ${CONCURRENCY})...`);
execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, String(CONCURRENCY)], { stdio: 'inherit' });

const have = jobs.map(j => j.id).filter(id => fs.existsSync(path.join(MP3DIR, id + '.mp3')));
const toConv = have.filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
console.log(`Converting ${toConv.length}/${have.length} clips to wav...`);
await pool(toConv, 8, async (id) => {
  await execFileP('ffmpeg', ['-i', path.join(MP3DIR, id + '.mp3'), '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});

for (const slug of todo) {
  try { buildLesson(slug, loadHtml(slug), PAGES[slug].chunkClasses || DEFAULT_CHUNK_CLASSES); }
  catch (e) { console.log(`✗ ${slug}  FAILED: ${e && e.message ? e.message : e}`); }
}
