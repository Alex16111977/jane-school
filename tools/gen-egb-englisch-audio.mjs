#!/usr/bin/env node
// Generate "listen to this lesson" audio for englisch-egb.html, tab u1m "Preparation for the First Exam"
// (everything EXCEPT the "Plan auf 2 Tage" card, #exam-plan).
//
// The tab is split into two continuous tracks (one .m4a each, plus cue data for a bottom dock player):
//   u1m-guides : header, "Worum es geht", and the three guide cards (Mediation, Comment, Grammatik)
//   u1m-sheet  : the solved exam sheet, parts 1-7, plus the closing checklist
//
// Three languages are mixed on this page: English (exam content), German (explanations from the
// sheet, the German job ad) and Russian (the guides). Cyrillic is split off by script. English and
// German share the Latin alphabet, so every Latin clause is classified by a small stop-word / umlaut
// scorer; German quotes („...") default to English (they quote the reading text), brackets inherit
// the surrounding language, and table columns whose header says "Deutsch" are forced to German.
// Tables are read with per-table templates (the letters of a matching exercise mean nothing in audio).
//
// Usage:
//   node tools/gen-egb-englisch-audio.mjs                 # both tracks
//   node tools/gen-egb-englisch-audio.mjs u1m-guides       # one track
//   node tools/gen-egb-englisch-audio.mjs --force
//   node tools/gen-egb-englisch-audio.mjs --dry
//   node tools/gen-egb-englisch-audio.mjs --plan u1m-sheet # print units with language tags, no TTS
//
// Requires edge-tts (via tools/edge_batch.py) and ffmpeg.
// Voices: en-US-AvaMultilingualNeural, de-DE-KatjaNeural, ru-RU-SvetlanaNeural
// (override with EDGE_VOICE_EN / EDGE_VOICE_DE / EDGE_VOICE_RU).

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML_FILE = path.join(ROOT, 'englisch-egb.html');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-egb-englisch-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICES = {
  en: process.env.EDGE_VOICE_EN || 'en-US-AvaMultilingualNeural',
  de: process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural',
  ru: process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural',
};
const SR = 24000;
const BITRATE = '48k';
const GAP_RUN = 0.07;
const GAP_UNIT = 0.25;
const GAP_CHUNK = 0.7;
const LEAD_IN = 0.3;
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

const LESSON_ID = 'u1m';
const SKIP_CARD_IDS = ['exam-plan'];
const SPLIT_AFTER_CARD_ID = 'guide-grammar';
const TRACKS = [
  { id: 'u1m-guides', title: 'Anleitungen & Grammatik' },
  { id: 'u1m-sheet', title: 'Prüfungsblatt: Teil 1–7' },
];

// ---------- entities ----------
const NAMED_ENT = {
  uuml: 'ü', auml: 'ä', ouml: 'ö', szlig: 'ß', Uuml: 'Ü', Auml: 'Ä', Ouml: 'Ö', eacute: 'é',
  mdash: '—', ndash: '–', hellip: '…', rarr: '→', larr: '←', harr: '↔', middot: '·', bull: '•',
  amp: '&', nbsp: ' ', quot: '"', laquo: '«', raquo: '»', lt: '<', gt: '>',
  bdquo: '„', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', sbquo: '‚',
  ne: '≠', asymp: '≈', times: '×', deg: '°', copy: '©', minus: '−', euro: '€', shy: '',
};
function safeCodePoint(cp) { try { return String.fromCodePoint(cp); } catch (e) { return ''; } }
function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in NAMED_ENT ? NAMED_ENT[name] : m));
}
function stripTags(html) { return decodeEntities(String(html).replace(/<[^>]+>/g, '')); }
function cleanWs(s) { return s.replace(/[ \t\u00a0]+/g, ' ').replace(/\s*\n\s*/g, ' ').trim(); }

// everything that should not be spoken literally, or that TTS would read badly
function speechClean(s) {
  return cleanWs(
    s.replace(/\u2260/g, ' не равно ')
     .replace(/\u2248/g, ' примерно ')
     .replace(/\s*[→⇒]\s*/g, ', ')
     .replace(/\s*·\s*/g, ', ')
     .replace(/\s*\/\s*/g, ', ')
     .replace(/\s*=\s*/g, ', ')
     .replace(/_{2,}/g, ' blank ')
     .replace(/\[Name\]/g, 'Name')
     .replace(/\[[^\]]*\]/g, ' blank ')
     .replace(/[\[\]]/g, '')
     .replace(/[✅✓☑]/g, ' ')
     .replace(/[\u{1F1E6}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
     .replace(/([.!?])\s*,/g, '$1')
     .replace(/,\s*,+/g, ',')
     .replace(/\s+([,.;:!?])/g, '$1')
  );
}

// ---------- div helpers (exact class-token matching) ----------
function classOpenRe(cls, flags) {
  return new RegExp('<div\\s[^>]*?class="(?:[^"]*\\s)?' + cls + '(?:\\s[^"]*)?"[^>]*>', flags);
}
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
  const re = classOpenRe(cls, 'gi');
  let m;
  while ((m = re.exec(html))) out.push({ start: m.index, cls, openTag: m[0], html: findBalancedDiv(html, m.index) });
  return out;
}
function removeBlocksByClass(html, cls) {
  let out = html, guard = 0;
  while (guard++ < 2000) {
    const m = classOpenRe(cls, 'i').exec(out);
    if (!m) break;
    const block = findBalancedDiv(out, m.index);
    out = out.slice(0, m.index) + out.slice(m.index + block.length);
  }
  return out;
}
function replaceBlocksByClass(html, cls, toStr) {
  let out = html, guard = 0, from = 0;
  while (guard++ < 5000) {
    const re = classOpenRe(cls, 'i');
    const m = re.exec(out.slice(from));
    if (!m) break;
    const idx = from + m.index;
    const block = findBalancedDiv(out, idx);
    const inner = block.slice(m[0].length, -'</div>'.length);
    const rep = toStr(inner);
    out = out.slice(0, idx) + rep + out.slice(idx + block.length);
    from = idx + rep.length;
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

// ---------- language scoring for Latin text ----------
const DE_ONLY = new Set(('der den dem des die das ein eine einen einem einer eines und oder nicht ist sind waren wird werden wurde ' +
  'mit von für auf im zu zum zur beim vom am aus über wenn dass weil auch noch nur schon sehr sich als wie dann aber zwischen jede jeder ' +
  'jedes jeden genau damit dabei dort dafür deshalb daher also kein keine keinen alle alles muss müssen soll sollen kann können darf ' +
  'hat haben hatte hatten gibt steht stehen bleibt geht kommt macht heißt bedeutet wir ihr sie es uns euch ihre ihrer ihrem ihren ' +
  'dieser diese dieses diesen warum wann welche welcher wo wer etwas nichts viel viele mehr immer nie ganz danach davor dazu darum ' +
  'zuerst zweimal einmal bitte nämlich eigentlich vielleicht jetzt hier ohne gegen durch seit während wegen trotz statt unter ' +
  'firma zeitraum unternehmen wirtschaft umgang einblick ansprechperson termin kantine anbindung besprechung kontrollieren bearbeiten unterstützen tabelle liefertermin gute deutschkenntnisse praktikum anforderungen passt zusätzlich beispiel beispiele aufgabe aufgaben satz sätze absatz antwort antworten lücke teil teile text im').split(' ').filter(w => w !== 'text'));
const EN_ONLY = new Set(('the a and of to is are were with for that this it you your he she they have has can would should not on at by ' +
  'from but or if when because what which who how there their his her its our we my me do does did been being than then more most ' +
  'very just only about into over after before between each every other another some any as be i').split(' '));
function scoreLatin(text) {
  const toks = text.toLowerCase().match(/[a-zäöüßé]+/g) || [];
  let de = 0, en = 0;
  for (const t of toks) {
    if (/[äöüß]/.test(t)) de += 3;
    else if (DE_ONLY.has(t)) de += 2;
    else if (EN_ONLY.has(t)) en += 2;
    else if (t.length > 6 && /(ungen|ung|keit|heit|schaft|lichen|liche|lich|ische|ischen|isch|chen)$/.test(t)) de += 1;
  }
  return { de, en };
}
function classifyLatin(text) {
  const { de, en } = scoreLatin(text);
  if (de > en) return 'de';
  if (en > 0) return 'en';
  return null;
}

// ---------- split a unit piece into language runs ----------
const isCyr = ch => /[Ѐ-ӿ]/.test(ch);
const isLat = ch => /[a-zA-ZäöüßÄÖÜé]/.test(ch);

// tokenise into atoms at sentence ends, dashes, quotes and brackets, remembering the enclosing mode
function atomize(text) {
  const t = text.replace(/\s[—–]\s/g, ' ‖ ');
  const atoms = [];
  let buf = '', mode = 'normal', modeStack = [];
  const flush = () => { if (buf.trim()) atoms.push({ text: buf, mode }); buf = ''; };
  const chars = Array.from(t);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], next = chars[i + 1];
    if (ch === '‖') { flush(); atoms.push({ text: '', brk: true }); continue; }
    if (ch === '„' || (ch === '“' && mode !== 'quote') || (ch === '"' && mode !== 'quote')) {
      flush(); modeStack.push(mode); mode = 'quote'; continue;
    }
    if ((ch === '“' || ch === '”' || ch === '"') && mode === 'quote') {
      flush(); mode = modeStack.pop() || 'normal'; continue;
    }
    if (ch === '(') { flush(); modeStack.push(mode); mode = 'paren'; continue; }
    if (ch === ')') { flush(); mode = modeStack.pop() || 'normal'; continue; }
    buf += ch;
    if (/[.!?;]/.test(ch) && (next === undefined || /\s/.test(next)) && !(/\d/.test(chars[i - 1] || ''))) flush();
  }
  flush();
  return atoms;
}
function splitByScript(text) {
  const segs = [];
  let cur = '', kind = null;
  for (const ch of Array.from(text)) {
    const k = isCyr(ch) ? 'ru' : (isLat(ch) ? 'lat' : null);
    if (k === null) { cur += ch; continue; }
    if (kind === null) { kind = k; cur += ch; continue; }
    if (k === kind) { cur += ch; continue; }
    segs.push({ kind, text: cur });
    cur = ch; kind = k;
  }
  if (cur) segs.push({ kind: kind || 'lat', text: cur });
  return segs;
}
function toRuns(text, hint) {
  text = text.replace(/\u2260/g, ' не равно ').replace(/\u2248/g, ' примерно ');
  const defaultLat = hint || 'en';
  const parts = [];                       // {lang|null, text, mode, dashBefore, atom}
  let pendingDash = false, atomNo = 0;
  for (const atom of atomize(text)) {
    if (atom.brk) { pendingDash = true; continue; }
    atomNo++;
    for (const seg of splitByScript(atom.text)) {
      if (!/[a-zA-ZäöüßÄÖÜéЀ-ӿ]/.test(seg.text)) {
        if (parts.length) { const lp = parts[parts.length - 1]; lp.text += (lp.atom !== atomNo ? ' ' : '') + seg.text; }
        else parts.push({ lang: null, text: seg.text, mode: atom.mode, atom: atomNo });
        continue;
      }
      let lang;
      if (seg.kind === 'ru') lang = 'ru';
      else {
        lang = classifyLatin(seg.text);
        if (lang === null && atom.mode === 'quote') lang = 'en';
      }
      parts.push({ lang, text: seg.text, mode: atom.mode, dashBefore: pendingDash, atom: atomNo });
      pendingDash = false;
    }
  }
  // fill unknown (no-signal) Latin parts: inherit previous Latin language, else next, else the default
  let last = null;
  for (const p of parts) { if (p.lang === 'en' || p.lang === 'de') last = p.lang; else if (p.lang === null && last) p.lang = last; }
  for (const p of parts) if (p.lang === null) p.lang = defaultLat;
  // merge neighbours of the same language
  const runs = [];
  for (const p of parts) {
    const prev = runs[runs.length - 1];
    if (prev && prev.lang === p.lang) prev.text += (p.dashBefore ? ', ' : (p.atom !== prev.lastAtom ? ' ' : '')) + p.text;
    else runs.push({ lang: p.lang, text: p.text });
    runs[runs.length - 1].lastAtom = p.atom;
  }
  return runs.map(r => ({ lang: r.lang, text: speechClean(r.text) })).filter(r => /[a-zA-ZäöüßÄÖÜéЀ-ӿ]/.test(r.text));
}

// ---------- normalise this page's components into <p> tags ----------
function brSplitToP(inner) {
  return inner.split(/<br\s*\/?>/i).map(s => cleanWs(stripTags(s))).filter(Boolean).map(s => `<p>${s}</p>`).join('');
}
function frItem(inner, kind) {
  const h5 = /<h5[^>]*>([\s\S]*?)<\/h5>/i.exec(inner);
  const rest = inner.replace(/<h5[^>]*>[\s\S]*?<\/h5>/i, '');
  const h5text = h5 ? cleanWs(stripTags(h5[1]).replace(/[\u{1F1E6}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')) : '';
  const label = h5text ? '' : (kind === 'f' ? 'Неправильно.' : 'Правильно.');
  const segs = rest.split(/<br\s*\/?>/i).map(s => cleanWs(stripTags(s))).filter(Boolean);
  if (!segs.length && h5text) return `<p>${h5text}</p>`;
  return segs.map((s, i) => `<p>${i === 0 ? (label ? label + ' ' : '') + (h5text ? h5text + ' ' : '') : ''}${s}</p>`).join('');
}
function normalize(html) {
  let h = html;
  h = removeBlocksByClass(h, 'sl');
  h = h.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, (m, t) => `<p>${t}</p>`).replace(/<\/?details[^>]*>/gi, '');
  h = replaceBlocksByClass(h, 'f', inner => frItem(inner, 'f'));
  h = replaceBlocksByClass(h, 'r', inner => frItem(inner, 'r'));
  for (const cls of ['dsatz-ru', 'dsatz', 'gd-de', 'gd-warn', 'gd-frame', 'tx-en']) h = replaceBlocksByClass(h, cls, brSplitToP);
  return h;
}

// ---------- tables ----------
function cellsOf(rowHtml) {
  return [...rowHtml.matchAll(/<t([dh])([^>]*)>([\s\S]*?)<\/t[dh]>/gi)].map(m => ({
    th: m[1].toLowerCase() === 'h',
    colspan: (/colspan="?(\d+)/.exec(m[2]) || [0, 1])[1] * 1,
    text: cleanWs(stripTags(m[3])),
  }));
}
const P = (t, h) => ({ t, h });
// hint cells look like "Köln → Cologne (...)" or "bearbeiten ≠ edit; здесь = answer": the term before the sign is German
function hintPieces(text) {
  const m = /^([^→=≠А-Яа-яЁё]+?)\s*([→=≠])\s*(.*)$/.exec(text) || /^([^→=≠А-Яа-яЁё]+?)\s+(?=[А-Яа-яЁё])(.*)$/.exec(text);
  if (!m) return [P(text)];
  if (m.length === 4) return [P(m[1], 'de'), P((m[2] === '≠' ? '≠ ' : '') + m[3], 'en')];
  return [P(m[1], 'de'), P(m[2], 'en')];
}
function tableUnits(tableHtml) {
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => cellsOf(m[1])).filter(r => r.length);
  const headerRow = rows.find(r => r.every(c => c.th));
  const headers = headerRow ? headerRow.map(c => c.text.toLowerCase()) : [];
  const data = rows.filter(r => r !== headerRow);
  const J = headers.join('|');
  const units = [];
  const blank = s => s.replace(/_{2,}/g, ' blank ');
  for (const r of data) {
    const c = r.map(x => x.text);
    if (r.length === 1 && r[0].colspan > 1) { units.push([P(c[0], 'en')]); continue; }
    let pieces;
    if (/^wort\|antwort\|definition/.test(J)) pieces = [P(`${c[0]}: ${c[2]}`, 'en')];
    else if (/^satz\|antwort\|warum/.test(J)) pieces = [P(`${blank(c[0])} Answer: ${c[1]}.`, 'en'), P(c[2], 'de')];
    else if (/^satz\|antwort$/.test(J)) pieces = [P(`${blank(c[0])} Answer: ${c[1]}.`, 'en')];
    else if (/^verb\|nomen/.test(J)) pieces = [P(`${c[0]}, ${c[1]}`, 'en')];
    else if (/^a\|antwort\|b/.test(J)) pieces = [P(`${c[0]} ${c[2]}`, 'en')];
    else if (/^absatz\|überschrift/.test(J)) pieces = [P(c[0], 'de'), P(c[1].replace(/^[A-F]\s*[—–-]\s*/, ''), 'en')];
    else if (/^deutsch\|antwort im text/.test(J)) pieces = [P(c[0], 'de'), P(c[1], 'en')];
    else if (/^deutsch \(aus der anzeige\)/.test(J)) pieces = [P(c[0], 'de'), P(c[1], 'en'), ...hintPieces(c[2])];
    else if (/^пункт\|где в немецком/.test(J)) pieces = [P(c[0]), ...(c[1] === c[0].replace(/^\d+\.\s*/, '') ? [] : [P(c[1], 'de')]), P(c[2], 'en')];
    else if (/^абзац\|что в нём/.test(J)) pieces = [P(`${c[0]}: ${c[1]}. Примерно ${c[2].replace(/[≈\s]/g, '')} слов.`)];
    else if (/^роль\|предложение/.test(J)) pieces = [P(`${c[0]}.`), P(c[1], 'en'), P(`Фраза: ${c[2]}`, 'en')];
    else if (/^зачем\|слова/.test(J)) pieces = [P(`${c[0]}: ${c[1]}`)];
    else if (/^тема \/ сторона/.test(J)) pieces = [P(`${c[0]}:`), P(c[1], 'en')];
    else if (!headers.length && c.length === 2) pieces = [P(`${c[0]} ${c[1]}`, 'en')];
    else pieces = [P(c.join(', '))];
    units.push(pieces);
  }
  return units;
}

// ---------- unit extraction for one card ----------
const UNIT_RE = new RegExp(
  '<table[^>]*class="[^"]*unit-table[^"]*"[^>]*>([\\s\\S]*?)<\\/table>' +
  '|<h[345][^>]*>([\\s\\S]*?)<\\/h[345]>' +
  '|<li[^>]*>([\\s\\S]*?)<\\/li>' +
  '|<p(?:\\s[^>]*)?>([\\s\\S]*?)<\\/p>',
  'gi'
);
function terminate(t) { return t + (/[.!?…:,;]$/.test(t) ? '' : '.'); }
function blockToUnits(blockHtml) {
  const normalized = normalize(blockHtml);
  const units = [];
  const re = new RegExp(UNIT_RE.source, 'gi');
  let m;
  while ((m = re.exec(normalized))) {
    if (m[1] !== undefined) { for (const u of tableUnits(m[1])) units.push(u); continue; }
    const inner = m[2] ?? m[3] ?? m[4];
    const t = cleanWs(stripTags(inner));
    if (t) units.push([P(terminate(t))]);
  }
  return units.filter(u => u.some(p => p.t && /[a-zA-ZäöüßÄÖÜéЀ-ӿ]/.test(p.t)));
}
function headerBlockToUnit(blockHtml) {
  const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(blockHtml);
  const sub = /<p class="lesson-header-sub"[^>]*>([\s\S]*?)<\/p>/i.exec(blockHtml);
  const parts = [];
  if (h2) parts.push(cleanWs(stripTags(h2[1])));
  if (sub) parts.push(cleanWs(stripTags(sub[1])));
  const t = parts.filter(Boolean).join('. ');
  return t ? [[P(terminate(t))]] : [];
}

// units -> runs (merge neighbouring same-language runs of one unit)
function unitRuns(unit) {
  const runs = [];
  for (const p of unit) {
    for (const r of toRuns(p.t, p.h)) {
      const prev = runs[runs.length - 1];
      if (prev && prev.lang === r.lang) prev.text += ' ' + r.text; else runs.push({ ...r });
    }
  }
  return runs;
}

// ---------- extract the lesson -> ordered chunks ----------
function extractChunks(html) {
  const marker = 'id="ls-' + LESSON_ID + '"';
  const openIdx = html.indexOf(marker);
  if (openIdx < 0) throw new Error('lesson marker not found');
  const block = findBalancedDiv(html, html.lastIndexOf('<div', openIdx));
  let found = [];
  for (const cls of ['lesson-header-block', 'note-card']) found = found.concat(findBlocksByClass(block, cls));
  found = topLevelOnly(found);
  const chunks = [];
  for (const b of found) {
    const idm = /\sid="([^"]+)"/.exec(b.openTag);
    const id = idm ? idm[1] : null;
    if (id && SKIP_CARD_IDS.includes(id)) continue;
    const isHeader = b.cls === 'lesson-header-block';
    const units = isHeader ? headerBlockToUnit(b.html) : blockToUnits(b.html);
    if (!units.length) continue;
    let label;
    if (isHeader) {
      const h2m = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(b.html);
      label = h2m ? cleanWs(stripTags(h2m[1])) : 'Start';
    } else {
      label = speechClean(units[0].map(p => p.t).join(' ')).replace(/\.$/, '').slice(0, 70);
    }
    chunks.push({ id, kind: isHeader ? 'header' : 'card', units, label });
  }
  return chunks;
}
function splitTracks(chunks) {
  const idx = chunks.findIndex(c => c.id === SPLIT_AFTER_CARD_ID);
  if (idx < 0) throw new Error('split card not found: ' + SPLIT_AFTER_CARD_ID);
  return { 'u1m-guides': chunks.slice(0, idx + 1), 'u1m-sheet': chunks.slice(idx + 1) };
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
const idFor = (voice, text) => 'egben_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);

function planChunks(chunks) {
  const plan = [], cueMeta = [];
  let firstChunk = true;
  chunks.forEach((chunk) => {
    let firstInChunk = true;
    cueMeta.push({ kind: chunk.kind, label: chunk.label, planIdx: plan.length });
    chunk.units.forEach((unit) => {
      unitRuns(unit).forEach((run, ri) => {
        const voice = VOICES[run.lang];
        let gap;
        if (firstInChunk && ri === 0) gap = firstChunk ? 0 : GAP_CHUNK;
        else if (ri === 0) gap = GAP_UNIT;
        else gap = GAP_RUN;
        plan.push({ id: idFor(voice, run.text), voice, lang: run.lang, text: run.text, gap });
        firstInChunk = false;
      });
    });
    firstChunk = false;
  });
  return { plan, cueMeta };
}

function buildTrack(trackId, chunks) {
  const { plan, cueMeta } = planChunks(chunks);
  if (!plan.length) { console.log(`✗ ${trackId}  nothing to narrate`); return null; }
  const list = [], timeAt = [];
  let t = 0;
  const push = (file) => { if (!file) return; list.push(file); t += wavDuration(file); };
  push(silence(LEAD_IN));
  plan.forEach((clip, i) => {
    timeAt[i] = t;
    if (clip.gap) push(silence(clip.gap));
    push(wavFor(clip.id));
  });
  const total = Math.round(t * 1000) / 1000;
  const cues = cueMeta.map(cm => ({ kind: cm.kind, label: cm.label, t: Math.round((timeAt[cm.planIdx] ?? total) * 1000) / 1000 }));
  const listFile = path.join(WAVDIR, `_list_${trackId}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  fs.mkdirSync(OUTDIR, { recursive: true });
  const m4a = path.join(OUTDIR, `egb-englisch-${trackId}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  console.log(`✓ ${trackId}  ${chunks.length} chunks  ${plan.length} clips  ${Math.round(total)}s (${Math.round(total / 60)} min)  ${Math.round(fs.statSync(m4a).size / 1024)}KB`);
  return { total, cues };
}

// ---------- main ----------
const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const planIdx = args.indexOf('--plan');
const cIdx = args.indexOf('--concurrency');
const CONCURRENCY = cIdx >= 0 ? parseInt(args[cIdx + 1], 10) : 16;
const named = args.filter(a => !a.startsWith('--') && a !== args[planIdx + 1] && a !== args[cIdx + 1]);
const wanted = planIdx >= 0 ? [args[planIdx + 1]] : (named.length ? named : TRACKS.map(t => t.id));
const html = fs.readFileSync(HTML_FILE, 'utf8');
const tracks = splitTracks(extractChunks(html));

if (planIdx >= 0) {
  const id = wanted[0];
  const chunks = tracks[id];
  chunks.forEach((c, i) => {
    console.log(`\n[chunk ${i} - ${c.kind}${c.id ? ' #' + c.id : ''}] ${c.label}`);
    c.units.forEach(u => console.log('  ' + unitRuns(u).map(r => `[${r.lang}] ${r.text}`).join('  ')));
  });
  const { plan } = planChunks(chunks);
  const chars = plan.reduce((n, p) => n + p.text.length, 0);
  console.log(`\n${chunks.length} chunks, ${plan.length} tts clips, ${chars} characters`);
  process.exit(0);
}

if (dry) {
  for (const id of wanted) {
    const { plan } = planChunks(tracks[id]);
    const byLang = plan.reduce((o, p) => (o[p.lang] = (o[p.lang] || 0) + p.text.length, o), {});
    console.log(`${id}  ${tracks[id].length} chunks  ${plan.length} clips  chars by language: ${JSON.stringify(byLang)}`);
  }
  process.exit(0);
}

const todo = wanted.filter(id => force || !fs.existsSync(path.join(OUTDIR, `egb-englisch-${id}.m4a`)));
if (!todo.length) { console.log('nothing to build (all present; use --force)'); process.exit(0); }
console.log(`Tracks: ${todo.join(', ')}  |  EN ${VOICES.en}  DE ${VOICES.de}  RU ${VOICES.ru}`);
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const jobMap = new Map();
for (const id of todo) {
  for (const clip of planChunks(tracks[id]).plan) if (!jobMap.has(clip.id)) jobMap.set(clip.id, { id: clip.id, voice: clip.voice, text: clip.text });
}
const jobs = [...jobMap.values()];
const jobsFile = path.join(CACHE, 'jobs.json');
fs.writeFileSync(jobsFile, JSON.stringify(jobs));
console.log(`Fetching ${jobs.length} unique tts clips (concurrency ${CONCURRENCY})...`);
execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, String(CONCURRENCY)], { stdio: 'inherit' });

const have = jobs.map(j => j.id).filter(id => fs.existsSync(path.join(MP3DIR, id + '.mp3')));
const missing = jobs.length - have.length;
if (missing) console.log(`WARNING: ${missing} clip(s) failed to download; re-run to retry`);
const toConv = have.filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
console.log(`Converting ${toConv.length}/${have.length} clips to wav...`);
await pool(toConv, 8, async (id) => {
  await execFileP('ffmpeg', ['-i', path.join(MP3DIR, id + '.mp3'), '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});

const results = {};
for (const id of todo) {
  try { const r = buildTrack(id, tracks[id]); if (r) results[id] = r; }
  catch (e) { console.log(`✗ ${id}  FAILED: ${e && e.message ? e.message : e}`); }
}

const cuesPath = path.join(OUTDIR, 'egb-englisch-cues.js');
let existing = {};
if (fs.existsSync(cuesPath)) {
  const m = /window\.EGB_ENGLISCH_AUDIO\s*=\s*(\{[\s\S]*\});?\s*$/.exec(fs.readFileSync(cuesPath, 'utf8'));
  if (m) { try { existing = JSON.parse(m[1]); } catch (e) { existing = {}; } }
}
for (const id of Object.keys(results)) {
  const meta = TRACKS.find(t => t.id === id);
  existing[id] = { src: `audio/egb-englisch-${id}.m4a`, d: results[id].total, title: meta ? meta.title : id, c: results[id].cues };
}
fs.writeFileSync(cuesPath, 'window.EGB_ENGLISCH_AUDIO = ' + JSON.stringify(existing) + ';\n');
console.log(`\nWrote ${cuesPath} (${Object.keys(existing).length} track(s))`);
