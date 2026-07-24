#!/usr/bin/env node
// Extract every synonym / antonym / real-life collocation (German) for days 1..20
// of deutsch-c1-gesellschaft.html, so they can be translated to Ukrainian for the
// audio tracks. Writes chunk files scratch/c1ua/chunk_NN.json for translation agents.
//
// Usage: node tools/extract-c1-ua-input.mjs <scratchDir> [firstDay] [lastDay] [cardsPerChunk]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'deutsch-c1-gesellschaft.html');

const scratch = process.argv[2];
if (!scratch) { console.error('need scratchDir'); process.exit(1); }
const first = parseInt(process.argv[3] || '1', 10);
const last = parseInt(process.argv[4] || '20', 10);
const per = parseInt(process.argv[5] || '40', 10);

const ENT = {
  '&uuml;': 'ü', '&auml;': 'ä', '&ouml;': 'ö', '&szlig;': 'ß',
  '&Uuml;': 'Ü', '&Auml;': 'Ä', '&Ouml;': 'Ö', '&amp;': '&', '&nbsp;': ' '
};
const decodeEnt = s => String(s == null ? '' : s)
  .replace(/&#x[0-9a-fA-F]+;/g, '').replace(/&#\d+;/g, '')
  .replace(/&[a-zA-Z]+;/g, m => (ENT[m] !== undefined ? ENT[m] : ' '));
const clean = s => decodeEnt(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function extractExtras(html) {
  const marker = 'window.C1_EXTRAS=';
  const i = html.indexOf(marker);
  const start = i + marker.length;
  const end = html.indexOf('</script>', start);
  let lit = html.slice(start, end).trim();
  if (lit.endsWith(';')) lit = lit.slice(0, -1);
  return JSON.parse(lit);
}
function parseDayCards(html, day) {
  const open = html.indexOf('data-day="' + day + '">');
  if (open < 0) return [];
  const next = html.indexOf('data-day="' + (day + 1) + '">', open + 1);
  const block = html.slice(open, next < 0 ? html.length : next);
  const re = /<div class="fcard-num">#(\d+)<\/div><div class="fcard-word">([\s\S]*?)<\/div><div class="fcard-hint">[\s\S]*?<div class="fcard-ua">([\s\S]*?)<\/div>/g;
  const cards = []; let m;
  while ((m = re.exec(block)) !== null) cards.push({ num: parseInt(m[1], 10), word: clean(m[2]), ua: clean(m[3]) });
  return cards;
}

const html = fs.readFileSync(HTML, 'utf8');
const extras = extractExtras(html);
const items = [];
for (let d = first; d <= last; d++) {
  for (const c of parseDayCards(html, d)) {
    const ex = extras[String(c.num)] || {};
    const s = (ex.s || []).map(clean), a = (ex.a || []).map(clean), r = (ex.r || []).map(clean);
    if (!s.length && !a.length && !r.length) continue;
    items.push({ num: c.num, day: d, word: c.word, ua: c.ua, s, a, r });
  }
}

const dir = path.join(scratch, 'c1ua');
fs.mkdirSync(dir, { recursive: true });
let chunkN = 0, count = 0;
for (let i = 0; i < items.length; i += per) {
  chunkN++;
  fs.writeFileSync(path.join(dir, `chunk_${String(chunkN).padStart(2, '0')}.json`),
    JSON.stringify(items.slice(i, i + per), null, 1));
  count += Math.min(per, items.length - i);
}
const totS = items.reduce((n, x) => n + x.s.length, 0);
const totA = items.reduce((n, x) => n + x.a.length, 0);
const totR = items.reduce((n, x) => n + x.r.length, 0);
console.log(`cards ${items.length}  |  syn ${totS}  ant ${totA}  real-life ${totR}  |  phrases ${totS + totA + totR}`);
console.log(`wrote ${chunkN} chunk(s) of <=${per} cards -> ${dir}`);
