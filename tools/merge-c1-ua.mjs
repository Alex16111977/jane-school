#!/usr/bin/env node
// Merge the per-chunk Ukrainian translations (scratch/c1ua/out_*.json) into
// tools/c1-ua-extras.json, and validate array alignment against the German
// C1_EXTRAS for days 1..20. Prints any mismatches; writes nothing on hard errors.
//
// Usage: node tools/merge-c1-ua.mjs <scratchDir>

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'deutsch-c1-gesellschaft.html');
const scratch = process.argv[2];
if (!scratch) { console.error('need scratchDir [firstDay] [lastDay]'); process.exit(1); }
const FIRST = parseInt(process.argv[3] || '1', 10);
const LAST = parseInt(process.argv[4] || '20', 10);
const dir = path.join(scratch, 'c1ua');

const ENT = { '&uuml;':'ü','&auml;':'ä','&ouml;':'ö','&szlig;':'ß','&Uuml;':'Ü','&Auml;':'Ä','&Ouml;':'Ö','&amp;':'&','&nbsp;':' ' };
const decodeEnt = s => String(s==null?'':s).replace(/&#x[0-9a-fA-F]+;/g,'').replace(/&#\d+;/g,'').replace(/&[a-zA-Z]+;/g,m=>(ENT[m]!==undefined?ENT[m]:' '));
const clean = s => decodeEnt(s).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();

function extractExtras(html){ const m='window.C1_EXTRAS=';const i=html.indexOf(m);const s=i+m.length;const e=html.indexOf('</script>',s);let lit=html.slice(s,e).trim();if(lit.endsWith(';'))lit=lit.slice(0,-1);return JSON.parse(lit); }
function parseDayCards(html,day){ const open=html.indexOf('data-day="'+day+'">');if(open<0)return[];const next=html.indexOf('data-day="'+(day+1)+'">',open+1);const block=html.slice(open,next<0?html.length:next);const re=/<div class="fcard-num">#(\d+)<\/div>/g;const nums=[];let m;while((m=re.exec(block))!==null)nums.push(parseInt(m[1],10));return nums; }

const html = fs.readFileSync(HTML,'utf8');
const extras = extractExtras(html);

// expected German lengths per card, days 1..20
const expected = {};
for(let d=FIRST;d<=LAST;d++){ for(const num of parseDayCards(html,d)){ const ex=extras[String(num)]||{}; const s=(ex.s||[]).map(clean),a=(ex.a||[]).map(clean),r=(ex.r||[]).map(clean); if(!s.length&&!a.length&&!r.length)continue; expected[num]={s:s.length,a:a.length,r:r.length}; } }

// merge out files
const merged = {};
let files = fs.readdirSync(dir).filter(f=>/^out_\d+\.json$/.test(f)).sort();
for(const f of files){ const obj=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); for(const k of Object.keys(obj)) merged[k]=obj[k]; }

// validate
const errs=[], latin=[];
const hasLatin = str => /[A-Za-zÄÖÜäöüß]/.test(str);
for(const num of Object.keys(expected)){
  const e=expected[num], g=merged[num];
  if(!g){ errs.push(`#${num}: MISSING from translations`); continue; }
  ['s','a','r'].forEach(k=>{ const len=(g[k]||[]).length; if(len!==e[k]) errs.push(`#${num}.${k}: got ${len}, expected ${e[k]}`); });
  ['s','a','r'].forEach(k=>{ (g[k]||[]).forEach((v,i)=>{ if(hasLatin(v)) latin.push(`#${num}.${k}[${i}] = "${v}"`); }); });
}
const extra = Object.keys(merged).filter(k=>!expected[k]);

console.log(`expected cards: ${Object.keys(expected).length}   translated cards: ${Object.keys(merged).length}`);
console.log(`length mismatches / missing: ${errs.length}`);
errs.slice(0,40).forEach(e=>console.log('  ✗ '+e));
if(extra.length) console.log(`extra (unexpected) cards: ${extra.length} -> ${extra.slice(0,20).join(', ')}`);
console.log(`strings still containing Latin/German letters: ${latin.length}`);
latin.slice(0,40).forEach(e=>console.log('  ⚠ '+e));

if(errs.length===0){
  // MERGE new range into the existing file (keep previously-translated days)
  const outFile = path.join(ROOT,'tools','c1-ua-extras.json');
  let all={}; try { all=JSON.parse(fs.readFileSync(outFile,'utf8')); } catch(e){}
  const before=Object.keys(all).length;
  Object.keys(expected).map(Number).sort((a,b)=>a-b).forEach(n=>{ const g=merged[n]; all[String(n)]={s:g.s||[],a:g.a||[],r:g.r||[]}; });
  const sorted={}; Object.keys(all).map(Number).sort((a,b)=>a-b).forEach(n=>sorted[n]=all[n]);
  fs.writeFileSync(outFile, JSON.stringify(sorted));
  console.log(`\n✓ merged ${Object.keys(expected).length} cards (days ${FIRST}-${LAST}); total in file: ${before} -> ${Object.keys(sorted).length}`);
} else {
  console.log('\n✗ NOT writing output — fix mismatches first. Bad cards: '+[...new Set(errs.map(e=>e.match(/#(\d+)/)[1]))].join(', '));
}
