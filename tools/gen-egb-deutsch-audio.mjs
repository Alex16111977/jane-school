#!/usr/bin/env node
// Generate "listen to this lesson" audio for deutsch-egb.html (EGB Deutsch, Thema 1 Kommunikation).
// One continuous .m4a per lesson card (kl1, k1, k4, k5, k6, k8, k9, k11, k29, k30, k13, k14,
// k16, k18, k20, k23, k25, k28), not many small files -- plus cue data (chunk start times, in
// seconds) for a bottom dock player with prev/next-chunk navigation.
//
// This page mixes German prose with Russian explanatory asides inside the same card, so --
// like tools/gen-lesson-audio.mjs -- narration is built by classifying each character as
// German/Russian script and splitting into contiguous same-language runs, each spoken in the
// matching neural voice.
//
// Content extraction walks the real DOM structure of THIS page's component vocabulary:
// .lesson-header-block, .note-card / .highlight-card / .tip-card, .sk-card (Die drei
// Situationen), .kb-msg (dialogue), .kb-q/.kb-a/.kb-why, .vs-grid > .vs-box (Schulz von Thun),
// .se-flow > .se-box, .kb-vs (2-3 column comparison), .rm-grid > .rm-item (+.rm-group-title),
// .ice-wrap > .ice-top/.ice-bottom (Eisbergmodell), .unit-table rows, ol.pk / ul.note-list
// <li>, plain <p>. A .sl block (site cross-links) is always stripped -- navigation, not
// narration. The self-test (#stListKomm, JS-rendered from SELBST_KOMM) is naturally skipped:
// its container is empty in the raw HTML.
//
// Hard-to-regex containers (kb-msg multi-line dialogue, vs-box/se-box/kb-vs/rm-item/ice-top
// /ice-bottom, which all nest a label + value across sibling divs) are first normalized into
// synthetic <p>LABEL: VALUE</p> tags in document order, then a small, generic final pass
// (table/h3/h4/sk-tag/kb-q/kb-a/kb-why/li/p) turns everything into the ordered unit list.
// Taxonomie badges (X/XX/XXX/XXXX in the Kann-Liste table) are expanded to words first, so
// they read as "Taxonomiestufe 3" instead of spelling out letters.
//
// Usage:
//   node tools/gen-egb-deutsch-audio.mjs                # all 18 lessons
//   node tools/gen-egb-deutsch-audio.mjs k29 k30         # just these ids
//   node tools/gen-egb-deutsch-audio.mjs --force
//   node tools/gen-egb-deutsch-audio.mjs --dry
//   node tools/gen-egb-deutsch-audio.mjs --plan k11      # print the speech plan, no TTS
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
const HTML_FILE = path.join(ROOT, 'deutsch-egb.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-egb-deutsch-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_RUN = 0.07;
const GAP_UNIT = 0.22;
const GAP_CHUNK = 0.6;
const LEAD_IN = 0.3;
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const LESSON_IDS = ['kl1', 'k1', 'k4', 'k5', 'k6', 'k8', 'k9', 'k11', 'k29', 'k30',
  'k13', 'k14', 'k16', 'k18', 'k20', 'k23', 'k25', 'k28'];
const CHUNK_CLASSES = ['lesson-header-block', 'note-card', 'sk-card'];

// ---------- entity decoding (same table as tools/gen-lesson-audio.mjs) ----------
const NAMED_ENT = {
  uuml: 'ü', auml: 'ä', ouml: 'ö', szlig: 'ß', Uuml: 'Ü', Auml: 'Ä', Ouml: 'Ö',
  mdash: '—', ndash: '–', hellip: '…', rarr: '→', larr: '←', harr: '↔',
  amp: '&', nbsp: ' ', quot: '"', laquo: '«', raquo: '»', bull: '•', middot: '·',
  shy: '', rsquo: '’', lsquo: '‘', sbquo: '‚', times: '×', deg: '°', copy: '©', minus: '−',
  bdquo: '„', ldquo: '"', rdquo: '"', euro: '€',
};
function safeCodePoint(cp) { try { return String.fromCodePoint(cp); } catch (e) { return ''; } }
function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in NAMED_ENT ? NAMED_ENT[name] : m));
}
function stripTags(html) { return decodeEntities(String(html).replace(/<[^>]+>/g, '')); }
function cleanWs(s) { return s.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, ' ').trim(); }
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
    if (b.start < coveredUntil) continue;
    out.push(b);
    coveredUntil = b.start + b.html.length;
  }
  return out;
}

// ---------- language-run splitting ----------
function classify(ch) {
  if (/[Ѐ-ӿ]/.test(ch)) return 'ru';
  if (/[a-zA-ZäöüßÄÖÜ]/.test(ch)) return 'de';
  return null;
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

function headerBlockToText(blockHtml) {
  const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(blockHtml);
  const sub = /<p class="lesson-header-sub"[^>]*>([\s\S]*?)<\/p>/i.exec(blockHtml);
  const parts = [];
  if (h2) parts.push(cleanWs(stripTags(h2[1])));
  if (sub) parts.push(cleanWs(stripTags(sub[1])));
  return parts.filter(Boolean).join('. ');
}

// ---------- normalize this page's custom components into synthetic <p> tags ----------
function replaceBlocksByClass(html, cls, toP) {
  let out = html, guard = 0;
  while (guard++ < 500) {
    const re = new RegExp('<div\\s+class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*>', 'i');
    const m = re.exec(out);
    if (!m) break;
    const block = findBalancedDiv(out, m.index);
    const inner = block.slice(m[0].length, -'</div>'.length);
    out = out.slice(0, m.index) + toP(inner) + out.slice(m.index + block.length);
  }
  return out;
}
function wrapP(text) { const t = cleanWs(text); return t ? `<p>${t}</p>` : ''; }

function normalizeTaxBadges(html) {
  return html
    .replace(/<span class="tax-badge"[^>]*>XXXX<\/span>/g, 'Taxonomiestufe vier, Problemlösung')
    .replace(/<span class="tax-badge"[^>]*>XXX<\/span>/g, 'Taxonomiestufe drei, Transfer')
    .replace(/<span class="tax-badge"[^>]*>XX<\/span>/g, 'Taxonomiestufe zwei, Reorganisation')
    .replace(/<span class="tax-badge"[^>]*>X<\/span>/g, 'Taxonomiestufe eins, Reproduktion');
}

function normalizeForSpeech(blockHtml) {
  let html = blockHtml;
  html = removeBlocksByClass(html, 'sl');
  html = normalizeTaxBadges(html);

  // kb-msg: dialogue, possibly several <br>-separated speaker turns
  html = replaceBlocksByClass(html, 'kb-msg', (inner) => {
    const lines = inner.split(/<br\s*\/?>/i);
    return lines.map((line) => {
      const bm = /^\s*<b>([\s\S]*?)<\/b>([\s\S]*)$/i.exec(line);
      if (bm) return wrapP(stripTags(bm[1]) + ': ' + stripTags(bm[2]));
      return wrapP(stripTags(line));
    }).join('');
  });

  // kb-vs: 2-3 unclassed <div><h5>Label</h5>Text</div> children
  html = replaceBlocksByClass(html, 'kb-vs', (inner) => {
    const itemRe = /<div>\s*<h5>([\s\S]*?)<\/h5>([\s\S]*?)<\/div>/gi;
    let out = '', m;
    while ((m = itemRe.exec(inner))) out += wrapP(stripTags(m[1]) + ': ' + stripTags(m[2]));
    return out;
  });

  // vs-grid > vs-box: num/name/def/ex
  html = replaceBlocksByClass(html, 'vs-box', (inner) => {
    const name = /<span class="vs-name"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    const def = /<div class="vs-def"[^>]*>([\s\S]*?)<\/div>/i.exec(inner);
    const ex = /<div class="vs-ex"[^>]*>([\s\S]*?)<\/div>/i.exec(inner);
    const parts = [name && stripTags(name[1]), def && stripTags(def[1]), ex && stripTags(ex[1])].filter(Boolean);
    return wrapP(parts.join('. '));
  });

  // se-flow > se-box (b + span); se-arrow dropped entirely
  html = replaceBlocksByClass(html, 'se-arrow', () => '');
  html = replaceBlocksByClass(html, 'se-box', (inner) => {
    const b = /<b>([\s\S]*?)<\/b>/i.exec(inner);
    const span = /<span>([\s\S]*?)<\/span>/i.exec(inner);
    const parts = [b && stripTags(b[1]), span && stripTags(span[1])].filter(Boolean);
    return wrapP(parts.join(': '));
  });

  // rm-grid: group title + de/ru item pairs
  html = replaceBlocksByClass(html, 'rm-group-title', (inner) => wrapP(stripTags(inner)));
  html = replaceBlocksByClass(html, 'rm-item', (inner) => {
    const de = /<div class="rm-de"[^>]*>([\s\S]*?)<\/div>/i.exec(inner);
    const ru = /<div class="rm-ru"[^>]*>([\s\S]*?)<\/div>/i.exec(inner);
    const parts = [de && stripTags(de[1]), ru && stripTags(ru[1])].filter(Boolean);
    return wrapP(parts.join(' — '));
  });

  // ice-wrap > ice-top / ice-bottom: pct + bold label + trailing span
  for (const cls of ['ice-top', 'ice-bottom']) {
    html = replaceBlocksByClass(html, cls, (inner) => {
      const pct = /<span class="ice-pct"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
      const b = /<b>([\s\S]*?)<\/b>/i.exec(inner);
      const spans = [...inner.matchAll(/<span(?: class="[^"]*")?[^>]*>([\s\S]*?)<\/span>/gi)];
      const lastSpan = spans.length ? spans[spans.length - 1][1] : null;
      const parts = [pct && stripTags(pct[1]), b && stripTags(b[1]), lastSpan && lastSpan !== (pct && pct[1]) && stripTags(lastSpan)].filter(Boolean);
      return wrapP(parts.join('. '));
    });
  }

  return html;
}

// ---------- final simple pass: table / h3,h4 / sk-tag / kb-q,kb-a,kb-why / li / p ----------
const UNIT_RE = new RegExp(
  '<table[^>]*class="[^"]*unit-table[^"]*"[^>]*>([\\s\\S]*?)<\\/table>' +
  '|<h[34][^>]*>([\\s\\S]*?)<\\/h[34]>' +
  '|<div class="sk-tag"[^>]*>([\\s\\S]*?)<\\/div>' +
  '|<div class="[^"]*\\bkb-q\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/div>' +
  '|<div class="[^"]*\\bkb-a\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/div>' +
  '|<div class="[^"]*\\bkb-why\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/div>' +
  '|<li[^>]*>([\\s\\S]*?)<\\/li>' +
  '|<p(?: class="[^"]*")?[^>]*>([\\s\\S]*?)<\\/p>',
  'gi'
);
function terminate(t) { return t + (/[.!?…]$/.test(t) ? '' : '.'); }
function blockToUnits(blockHtml) {
  const normalized = normalizeForSpeech(blockHtml);
  const units = [];
  const re = new RegExp(UNIT_RE.source, 'gi');
  let m;
  while ((m = re.exec(normalized))) {
    if (m[1] !== undefined) {
      const rows = [...m[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      for (const rm of rows) {
        if (!/<td/i.test(rm[1])) continue;
        const cells = [...rm[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cm => cleanWs(stripTags(cm[1]))).filter(Boolean);
        if (cells.length) units.push(terminate(cells.join(', ')));
      }
      continue;
    }
    const inner = m[2] ?? m[3] ?? m[4] ?? m[5] ?? m[6] ?? m[7] ?? m[8];
    const t = cleanWs(stripTags(inner));
    if (t) units.push(terminate(t));
  }
  return units.filter(Boolean);
}

// ---------- whole-page extraction: one lesson id -> ordered chunks ----------
function extractLesson(html, id) {
  const marker = 'id="ls-' + id + '"';
  const openIdx = html.indexOf(marker);
  if (openIdx < 0) { console.log(`✗ ${id}  marker not found`); return []; }
  const divStart = html.lastIndexOf('<div', openIdx);
  const block = findBalancedDiv(html, divStart);

  let found = [];
  for (const cls of CHUNK_CLASSES) found = found.concat(findBlocksByClass(block, cls));
  found = topLevelOnly(found);

  const chunks = [];
  for (const b of found) {
    const isHeader = b.cls === 'lesson-header-block';
    const units = isHeader ? (() => { const t = headerBlockToText(b.html); return t ? [t] : []; })() : blockToUnits(b.html);
    if (units.length) {
      let label;
      if (isHeader) {
        const h2m = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(b.html);
        label = h2m ? cleanWs(stripTags(h2m[1])) : units[0].slice(0, 70);
      } else {
        label = speakify(units[0]).replace(/\.$/, '').slice(0, 70);
      }
      chunks.push({ kind: isHeader ? 'header' : 'card', units, label });
    }
  }
  return chunks;
}

// ---------- WAV helpers ----------
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
const idFor = (voice, text) => 'egbde_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

function planChunks(chunks) {
  const plan = [];
  const cueMeta = [];
  let isFirstChunkOverall = true;
  chunks.forEach((chunk) => {
    let firstInChunk = true;
    cueMeta.push({ kind: chunk.kind, label: chunk.label, planIdx: plan.length });
    chunk.units.forEach((unit) => {
      const runs = splitRuns(speakify(unit));
      runs.forEach((run, ri) => {
        const voice = run.lang === 'ru' ? VOICE_RU : VOICE_DE;
        let gap;
        if (firstInChunk && ri === 0) gap = isFirstChunkOverall ? 0 : GAP_CHUNK;
        else if (ri === 0) gap = GAP_UNIT;
        else gap = GAP_RUN;
        plan.push({ id: idFor(voice, run.text), voice, text: run.text, gap });
        firstInChunk = false;
      });
    });
    isFirstChunkOverall = false;
  });
  return { plan, cueMeta };
}

function buildLesson(id, html) {
  const chunks = extractLesson(html, id);
  const { plan, cueMeta } = planChunks(chunks);
  if (!plan.length) { console.log(`✗ ${id}  no narratable content found`); return null; }

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

  const cues = cueMeta.map(cm => ({ kind: cm.kind, label: cm.label, t: Math.round((timeAtPlanIdx[cm.planIdx] ?? total) * 1000) / 1000 }));

  const listFile = path.join(WAVDIR, `_list_${id}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  fs.mkdirSync(OUTDIR, { recursive: true });
  const m4a = path.join(OUTDIR, `egb-deutsch-${id}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  console.log(`✓ ${id}  ${chunks.length} chunks  ${plan.length} clips  ${Math.round(total)}s  ${Math.round(fs.statSync(m4a).size / 1024)}KB`);
  return { id, total, cues, title: cues[0] ? cues[0].label : id };
}

// ---------- main ----------
const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const planIdx = args.indexOf('--plan');
const cIdx = args.indexOf('--concurrency');
const CONCURRENCY = cIdx >= 0 ? parseInt(args[cIdx + 1], 10) : 16;
const optVals = new Set([planIdx, cIdx].filter(i => i >= 0).map(i => args[i + 1]));   // values of --plan / --concurrency, not lesson ids
const idArgs = args.filter(a => !a.startsWith('--') && !optVals.has(a));
const targets = (planIdx >= 0 ? [args[planIdx + 1]] : (idArgs.length ? idArgs : LESSON_IDS))
  .filter(s => LESSON_IDS.includes(s) || console.log(`unknown lesson id: ${s}`));

const html = fs.readFileSync(HTML_FILE, 'utf8');

if (planIdx >= 0) {
  const id = targets[0];
  const chunks = extractLesson(html, id);
  const { plan } = planChunks(chunks);
  chunks.forEach((c, i) => console.log(`\n[chunk ${i} - ${c.kind}]\n  ${c.units.join('\n  ')}`));
  console.log(`\n${chunks.length} chunks, ${plan.length} tts clips`);
  process.exit(0);
}

const allChunksById = {};
for (const id of targets) allChunksById[id] = extractLesson(html, id);

if (dry) {
  let totalChunks = 0, totalClips = 0;
  for (const id of targets) {
    const { plan } = planChunks(allChunksById[id]);
    totalChunks += allChunksById[id].length; totalClips += plan.length;
    console.log(`${id}  ${allChunksById[id].length} chunks  ${plan.length} clips`);
  }
  console.log(`\nTotal: ${totalChunks} chunks, ${totalClips} tts clip-slots across ${targets.length} lesson(s)`);
  process.exit(0);
}

const todo = targets.filter(id => force || !fs.existsSync(path.join(OUTDIR, `egb-deutsch-${id}.m4a`)));
if (!todo.length) { console.log('nothing to build (all present; use --force)'); process.exit(0); }

console.log(`Lessons: ${todo.join(', ')}  |  DE ${VOICE_DE}  RU ${VOICE_RU}`);
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const jobMap = new Map();
const plansById = {};
for (const id of todo) {
  const { plan } = planChunks(allChunksById[id]);
  plansById[id] = plan;
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

const results = {};
for (const id of todo) {
  try {
    const r = buildLesson(id, html);
    if (r) results[id] = r;
  } catch (e) { console.log(`✗ ${id}  FAILED: ${e && e.message ? e.message : e}`); }
}

// merge cues into the single shared cues.js (keep existing entries for lessons not rebuilt this run)
const cuesPath = path.join(OUTDIR, 'egb-deutsch-cues.js');
let existing = {};
if (fs.existsSync(cuesPath)) {
  const m = /window\.EGB_DEUTSCH_AUDIO\s*=\s*(\{[\s\S]*\});?\s*$/.exec(fs.readFileSync(cuesPath, 'utf8'));
  if (m) { try { existing = JSON.parse(m[1]); } catch (e) { existing = {}; } }
}
for (const id of Object.keys(results)) {
  existing[id] = { src: `audio/egb-deutsch-${id}.m4a`, d: results[id].total, title: results[id].title, c: results[id].cues };
}
fs.writeFileSync(cuesPath, 'window.EGB_DEUTSCH_AUDIO = ' + JSON.stringify(existing) + ';\n');
console.log(`\nWrote ${cuesPath} (${Object.keys(existing).length} lessons total)`);
