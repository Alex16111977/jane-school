#!/usr/bin/env node
// Offline neural audio for the PowerPoint-Klassenarbeit cards in iw-egb.html (cards pp1 / pp3). Two continuous tracks, one cue per item,
// so the bottom dock (js/iw-ppt.js) can step through them with prev/next and never blocks scrolling:
//   audio/iw-ppt-drill.m4a  — Kann-Liste: German task · pause to say the menu path aloud · German answer · short Russian tip; then the 12 traps and the 90-minute order
//   audio/iw-ppt-vocab.m4a  — Wortschatz: DE · RU · DE for every term of the vocabulary tab
//   audio/iw-ppt-cues.js    — window.PPT_AUDIO = { drill: {src, d, title, w:[{de,t,e,id?}]}, vocab: {...} }
// Sources: KANN ids/labels, TRAPS, ORDER, VOCAB from js/iw-ppt-data.js; the spoken drill texts (q / a / r) only exist in this file.
//
// Usage:   node tools/gen-ppt-audio.mjs            # build both tracks
//          node tools/gen-ppt-audio.mjs --plan     # print what the voices will say, no TTS
// Requires ffmpeg and edge-tts (>= 7.3; older versions get HTTP 403 from the service). Point EDGE_PY at a python that has it:
//          EDGE_PY=/path/to/venv/bin/python node tools/gen-ppt-audio.mjs

import fs from 'fs';
import path from 'path';
import os from 'os';
import vm from 'vm';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(ROOT, 'audio');
const CACHE = path.join(os.tmpdir(), 'jane-school-kann-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3'), WAVDIR = path.join(CACHE, 'wav');
const VOICE = { de: process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural', ru: process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural' };
const PY = process.env.EDGE_PY || 'python3';
const SR = 24000, BITRATE = '48k', LEAD_IN = 0.3, GAP_RUN = 0.12, GAP_CHUNK = 1.3, GAP_SENT = 0.45, DRILL_PAUSE = 5.2, GAP_AFTER_Q = 0.0, GAP_BEFORE_TIP = 0.6;
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';
const PLAN_ONLY = process.argv.includes('--plan');

// ---------- data from the page scripts ----------
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'iw-ppt-data.js'), 'utf8'), sandbox);
const P = sandbox.window.PPT;
const kLabel = k => (typeof k.n === 'number' ? 'K' + k.n : k.n);
const plain = s => String(s).replace(/<[^>]*>/g, '').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\{\{([^}]+)\}\}/g, '$1').replace(/\*\*/g, '');

// ---------- spoken drill texts: q = the task in German, a = the answer in German, r = one Russian tip (optional) ----------
const DRILL = {
  k1: ['Ein Design oder eine Designvariante anwenden.', 'Entwurf, Designs: ein Design anklicken. Oder Entwurf, Varianten, Farben.', 'Дизайн и варианты — вкладка Entwurf. Чужой дизайн ломает фирменный стиль.'],
  k2: ['Folien erstellen, duplizieren, löschen und verschieben.', 'Start, Neue Folie. Rechtsklick auf die Folie, Folie duplizieren. Entfernen löscht. Ziehen verschiebt, am besten in der Foliensortierung.', 'Для перестановки многих слайдов удобнее Foliensortierung.'],
  k3: ['Einer Folie ein anderes Layout zuweisen.', 'Start, Layout, das Layout anklicken. Danach Start, Zurücksetzen.', 'Layout — это расположение, Design — оформление.'],
  k4: ['Ein Textfeld einfügen und in der Größe ändern.', 'Einfügen, Textfeld, auf der Folie aufziehen. Genaue Größe: Formformat, Größe.', 'Тянуть за угол меняет рамку, а не шрифт.'],
  k5: ['Schriftart, Schriftgröße, Schriftfarbe und Schriftschnitt ändern.', 'Start, Schriftart, Schriftgrad, Schriftfarbe aus den Designfarben. F, K, U für Fett, Kursiv, Unterstrichen. Format übertragen. Schriftarten ersetzen.', 'Цвет — только из Designfarben.'],
  k6: ['Text ausrichten, mit Aufzählungszeichen und Einzügen gliedern.', 'Start, Absatz: linksbündig, zentriert, rechtsbündig, Aufzählungszeichen. Tab macht eine Ebene tiefer, Umschalt Tab eine Ebene höher.', ''],
  k7: ['Text kürzen und foliengerecht formulieren.', 'Ganze Sätze zu Stichpunkten kürzen. Den langen Text ausschneiden und in die Notizen einfügen.', 'Подробности не удалять, а переносить в Notizen.'],
  k8: ['Hintergrund und Farben einer Folie ändern.', 'Entwurf, Hintergrund formatieren, einfarbige Füllung, Designfarbe. Unten: Hintergrund zurücksetzen oder Auf alle anwenden.', 'Фон отдельного слайда может отличаться от макета.'],
  k9: ['Ein Bild einfügen, Größe und Position ändern.', 'Einfügen, Bilder, Dieses Gerät. Größe nur an der Ecke ziehen. Genau: Bildformat, Größe.', 'Боковые ручки искажают картинку.'],
  k10: ['Ein Bild zuschneiden.', 'Bildformat, Zuschneiden. Zuschneiden, Pfeil, Seitenverhältnis, eins zu eins. Das Bild im Rahmen verschieben. Escape beendet.', 'Zuschneiden — это не Größe ändern.'],
  k11: ['Bildrahmen, Bildformen und Bildeffekte einsetzen.', 'Bildformat: Bildrahmen, Bildeffekte, Schatten. Zuschneiden, Auf Form zuschneiden, Oval. Kein Rahmen, kein Schatten.', 'Либо всем одинаково, либо никому.'],
  k12: ['Ein Piktogramm einfügen und passend auswählen.', 'Einfügen, Piktogramme. Oder ein fertiges Piktogramm kopieren und einfügen. Weiß färben: Grafikformat, Grafikfüllung, Weiß.', 'Иконка должна подходить по смыслу и быть видна на фоне.'],
  k13: ['Eine Form einfügen und formatieren.', 'Einfügen, Formen. Formformat: Fülleffekt, Formkontur, Größe. Form markieren und tippen ist die Beschriftung.', 'У новой фигуры по умолчанию заливка Akzent 1.'],
  k14: ['Objekte ausrichten und verteilen.', 'Objekte markieren. Bildformat oder Formformat, Ausrichten: Oben ausrichten. Dann Horizontal verteilen.', 'Ausrichten — на одну линию, Verteilen — равные промежутки.'],
  k15: ['Objekte in den Vordergrund oder Hintergrund legen.', 'Rechtsklick, In den Vordergrund oder In den Hintergrund. Oder Start, Anordnen, Auswahlbereich.', 'Если текст не читается — сначала проверь слои.'],
  k16: ['Elemente gruppieren.', 'Objekte markieren, Rechtsklick, Gruppieren. Zurück: Gruppierung aufheben.', 'Анимация вешается на группу целиком.'],
  k17: ['Text, Bilder, Piktogramme und Formen kombinieren.', 'Karte, Kreis, Piktogramm, Titel und Kurztext, wie bei Unsere Services. Gleiche Größen, gleiche Abstände, Designfarben.', ''],
  k18: ['Eine Tabelle erstellen.', 'Einfügen, Tabelle: Spalten und Zeilen im Raster anklicken. Tab in der letzten Zelle fügt eine Zeile hinzu.', ''],
  k19: ['Eine Tabelle formatieren.', 'Tabellenentwurf: Kopfzeile, gebänderte Zeilen, Tabellenformatvorlage. Layout: Ausrichtung und Spaltenbreite.', 'Стандартный стиль янтарный — подбери Akzent 2.'],
  k20: ['Ein Organigramm als SmartArt erstellen.', 'Einfügen, SmartArt, Hierarchie, Organigramm. Oder Start, In SmartArt konvertieren. Danach SmartArt-Entwurf, Form hinzufügen.', 'Новый отдел ставь туда, куда сказано в тексте.'],
  k21: ['Eine SmartArt verändern.', 'SmartArt-Entwurf: Layout, Farben ändern, SmartArt-Formatvorlagen. Layout, Links hängend, für die unterste Ebene.', ''],
  k22: ['Zusammenhänge mit Pfeilen darstellen.', 'Einfügen, Formen, Blockpfeile oder Linie mit Pfeilspitze. Verbinder rasten an den Formen ein.', ''],
  k23: ['Einen Folienübergang einstellen.', 'Übergänge, Verblassen. Dauer. Für alle übernehmen.', 'Один спокойный переход на всех слайдах.'],
  k24: ['Einem Objekt eine Animation zuweisen.', 'Objekt markieren. Animationen, Eingang, Verblassen. Ein zweiter Effekt: Animation hinzufügen.', 'Без «Animation hinzufügen» второй эффект заменит первый.'],
  k25: ['Animationsreihenfolge und Animationsstart ändern.', 'Animationen, Animationsbereich. Früher oder Später. Start: Beim Klicken, Mit Vorheriger, Nach Vorheriger.', 'Новый эффект встаёт в конец списка.'],
  k26: ['Einen Hyperlink einfügen.', 'Einfügen, Link. Datei oder Webseite, oder Aktuelles Dokument und eine Folie wählen. Testen in der Bildschirmpräsentation.', 'Ссылку лучше ставить на фигуру, а не на текст.'],
  k27: ['Ein Inhaltsverzeichnis mit Navigation erstellen.', 'Agenda-Folie: jede Karte ist eine Form. Strg K, Aktuelles Dokument, erste Folie des Kapitels. Mit F fünf testen.', 'Сначала порядок слайдов, потом ссылки.'],
  x1: ['Notizen verwenden.', 'Ansicht, Notizen. Den Text ausschneiden und in den Notizenbereich einfügen.', ''],
  x2: ['Das Logo im Folienmaster einfügen.', 'Ansicht, Folienmaster. Das Layout LU Inhalt anklicken, Logo einfügen, Masteransicht schließen. Folie eins und Folie fünfzehn kontrollieren.', ''],
  x3: ['Foliennummern einfügen.', 'Einfügen, Foliennummer. Haken bei Foliennummer und bei Auf Titelfolie nicht anzeigen. Dann Für alle übernehmen.', 'Сначала галочки, потом кнопка.'],
  x4: ['Schriftarten ersetzen.', 'Start, Ersetzen, Schriftarten ersetzen. Cambria durch Calibri.', ''],
  x5: ['Format übertragen.', 'Start, Format übertragen: Quelle markieren, Pinsel, Ziel anklicken. Doppelklick für mehrere Ziele.', ''],
  x6: ['Designfarben und RGB-Werte benutzen.', 'Farbmenü, Designfarben, oberste Reihe. Oder Weitere Farben, Benutzerdefiniert, Rot, Grün, Blau.', ''],
  x7: ['Die Datei richtig speichern.', 'Datei, Speichern unter. Dateiname P K, P P T, Klasse, Nachname, Vorname. Dateityp P P T X. Danach regelmäßig Strg S.', 'Сохранить сразу в начале.'],
  x8: ['Die Präsentation testen.', 'Bildschirmpräsentation, Von Beginn an, F fünf. Ab aktueller Folie, Umschalt F fünf.', '']
};
const INTRO_DRILL = [
  'Это аудио-тренировка по Kann-Liste для практической контрольной по PowerPoint.',
  'Я называю задачу по-немецки. У тебя пять секунд — назови вслух путь в меню. Потом я говорю правильный ответ и коротко подсказываю, где обычно ошибаются.',
  'Цель — чтобы названия вкладок и кнопок звучали привычно. Параллельно делай мини-упражнения руками в PowerPoint. Начинаем.'
];
const OUTRO_DRILL = ['Это всё. Теперь пройдись по картам ещё раз вечером и завтра утром, а мини-упражнения сделай руками в PowerPoint. Удачи на контрольной!'];
const INTRO_VOCAB = ['Слова PowerPoint для контрольной. Я говорю слово по-немецки, потом перевод на русский, потом снова слово по-немецки.'];

// ---------- what the voices say ----------
const LAT = /[A-Za-zÄÖÜäöüß]/, CYR = /[А-Яа-яЁё]/;
const NAMED = { auml: 'ä', ouml: 'ö', uuml: 'ü', amp: '&', nbsp: ' ' };
function clean(raw) {
  let t = plain(raw).replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m)
    .replace(/„([^“”]+)[“”]/g, ', $1, ').replace(/«([^»]+)»/g, ', $1, ')
    .replace(/…/g, '').replace(/[„“”"‘’]/g, '').replace(/\s*\/\s*/g, ', ').replace(/\s=\s/g, ' — ')
    .replace(/\s*[—–]\s*/g, ', ').replace(/\s*[·→]\s*/g, ', ').replace(/\s*\(([^)]*)\)/g, ', $1').replace(/%/g, ' Prozent').replace(/\+/g, ' plus ')
    .replace(/\b(\d+)\s*Min\b/g, '$1 Minuten').replace(/≈/g, 'около').replace(/×/g, ' mal ').replace(/→/g, ', ').replace(/▾/g, '').replace(/☑/g, '');
  return t.replace(/\s+([,.;:])/g, '$1').replace(/([,;:])\s*([,;])/g, '$1').replace(/:\s*,/g, ':').replace(/\.\s*,/g, '.').replace(/,\s*\./g, '.')
    .replace(/\.{2,}/g, '.').replace(/,{2,}/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,;:\s]+/, '').trim();
}
const terminate = t => (/[.!?:]$/.test(t) ? t : t + '.');
function runsOf(raw, defaultLang, term = true) {
  const s = term ? terminate(clean(raw)) : clean(raw);
  const runs = []; let cur = null;
  for (const tok of s.split(/(\s+)/)) {
    if (!tok) continue;
    const lang = LAT.test(tok) && !CYR.test(tok) ? 'de' : CYR.test(tok) ? 'ru' : null;
    if (lang === null || (cur && cur.lang === lang)) { if (cur) cur.text += tok; else cur = { lang: defaultLang, text: tok }; }
    else { if (cur) runs.push(cur); cur = { lang, text: tok }; }
  }
  if (cur) runs.push(cur);
  return runs.map(r => ({ lang: r.lang, text: r.text.trim().replace(/^[,;:.\s]+/, '').replace(/[,;:\s]+$/, '').replace(/\s{2,}/g, ' ') })).filter(r => /[\p{L}\d]/u.test(r.text));
}

// ---------- blocks: { label, id?, steps:[{runs,gap}|{pause}] } ----------
function drillBlocks() {
  const blocks = [], say = (s, raw, lang, gap = GAP_SENT) => s.push({ runs: runsOf(raw, lang), gap });
  { const s = []; INTRO_DRILL.forEach(t => say(s, t, 'ru')); blocks.push({ label: 'Einführung — так устроена тренировка', steps: s }); }
  P.KANN.forEach(k => {
    const d = DRILL[k.id]; if (!d) return;
    const s = [{ runs: runsOf(d[0], 'de'), gap: GAP_AFTER_Q }, { pause: DRILL_PAUSE }, { runs: runsOf(d[1], 'de'), gap: d[2] ? GAP_BEFORE_TIP : 0 }];
    if (d[2]) s.push({ runs: runsOf(d[2], 'ru'), gap: 0 });
    const label = kLabel(k) + ' · ' + d[0].replace(/\.$/, '');
    blocks.push({ label: label.length > 72 ? label.slice(0, 71) + '…' : label, id: k.id, steps: s });
  });
  { const s = []; say(s, 'Теперь двенадцать ловушек из файла пробной контрольной.', 'ru', 0.7);
    P.TRAPS.forEach((t, i) => { say(s, 'Ловушка ' + (i + 1) + '. ' + t[0] + '. ' + t[1], 'ru', 0.8); });
    blocks.push({ label: '12 Fallen aus der Ausgangsdatei', steps: s }); }
  { const s = []; say(s, 'И порядок работы на девяносто минут.', 'ru', 0.7);
    P.ORDER.forEach((o, i) => { say(s, 'Шаг ' + (i + 1) + ', ' + o.m + ' минут. ' + plain(o.t), 'ru', 0.6); });
    blocks.push({ label: 'Arbeitsreihenfolge für 90 Minuten', steps: s }); }
  { const s = []; OUTRO_DRILL.forEach(t => say(s, t, 'ru')); blocks.push({ label: 'Schluss', steps: s }); }
  return blocks;
}
function vocabBlocks() {
  const blocks = [], s0 = [];
  INTRO_VOCAB.forEach(t => s0.push({ runs: runsOf(t, 'ru'), gap: GAP_SENT }));
  blocks.push({ label: 'Einführung', steps: s0 });
  P.VOCAB.forEach(g => g[1].forEach(v => {
    blocks.push({ label: v[0], steps: [{ runs: runsOf(v[0], 'de'), gap: 0.7 }, { runs: runsOf(v[1], 'ru'), gap: 0.7 }, { runs: runsOf(v[0], 'de'), gap: 0 }] });
  }));
  return blocks;
}
const TRACKS = [
  { key: 'drill', file: 'iw-ppt-drill.m4a', title: 'Kann-Liste hören: Aufgabe → Pause → Antwort', blocks: drillBlocks() },
  { key: 'vocab', file: 'iw-ppt-vocab.m4a', title: 'Wortschatz PowerPoint: DE → RU → DE', blocks: vocabBlocks() }
];

if (PLAN_ONLY) {
  TRACKS.forEach(tr => {
    let w = 0; console.log('\n=== ' + tr.key + ' — ' + tr.blocks.length + ' blocks');
    tr.blocks.forEach((b, i) => {
      console.log(`[${i + 1}] ${b.label}`);
      b.steps.forEach(st => { if (st.pause) { console.log('   … ' + st.pause + ' s'); return; } console.log('   ' + st.runs.map(r => `[${r.lang}] ${r.text}`).join('  ')); w += st.runs.reduce((n, r) => n + r.text.split(/\s+/).length, 0); });
    });
    console.log('~' + w + ' spoken words');
  });
  process.exit(0);
}

// ---------- audio helpers ----------
function wavDuration(file) {
  const b = fs.readFileSync(file); let off = 12;
  while (off + 8 <= b.length) { const id = b.toString('ascii', off, off + 4), size = b.readUInt32LE(off + 4); if (id === 'data') return size / (SR * 2); off += 8 + size + (size % 2); }
  return 0;
}
const silenceCache = {};
function silence(sec) {
  const key = Math.round(sec * 1000); if (silenceCache[key]) return silenceCache[key];
  fs.mkdirSync(WAVDIR, { recursive: true });
  const f = path.join(WAVDIR, `_sil_${key}.wav`);
  if (!fs.existsSync(f)) execFileSync('ffmpeg', ['-f', 'lavfi', '-i', `anullsrc=r=${SR}:cl=mono`, '-t', String(sec), '-c:a', 'pcm_s16le', f, '-y', '-loglevel', 'error']);
  return (silenceCache[key] = f);
}
async function pool(items, limit, worker) {
  let i = 0, active = 0, done = 0;
  return new Promise((resolve, reject) => {
    if (!items.length) return resolve();
    (function launch() { while (active < limit && i < items.length) { const it = items[i++]; active++; worker(it).then(() => { active--; done++; (done === items.length) ? resolve() : launch(); }).catch(reject); } })();
  });
}
const execFileP = (cmd, a) => new Promise((res, rej) => execFile(cmd, a, { timeout: 60000 }, e => (e ? rej(e) : res())));
const idFor = (voice, text) => 'kann_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);
const r3 = x => Math.round(x * 1000) / 1000;

// ---------- main ----------
[MP3DIR, WAVDIR, OUTDIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
const clips = new Map();
const addClip = r => { const id = idFor(VOICE[r.lang], r.text); clips.set(id, { id, voice: VOICE[r.lang], text: r.text }); return id; };
TRACKS.forEach(tr => tr.blocks.forEach(b => b.steps.forEach(st => { if (st.runs) st.ids = st.runs.map(addClip); })));
const missing = [...clips.values()].filter(c => !fs.existsSync(path.join(WAVDIR, c.id + '.wav')));
console.log(`ppt: ${TRACKS.map(t => t.key + ' ' + t.blocks.length).join(', ')} blocks, ${clips.size} unique clips, ${missing.length} to fetch`);
if (missing.length) {
  const jobsFile = path.join(CACHE, 'jobs_ppt.json');
  fs.writeFileSync(jobsFile, JSON.stringify(missing));
  execFileSync(PY, [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, '10'], { stdio: ['ignore', 'inherit', 'inherit'] });
}
const toConv = [...clips.keys()].filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
await pool(toConv, 8, async id => {
  const mp3 = path.join(MP3DIR, id + '.mp3');
  if (!fs.existsSync(mp3) || fs.statSync(mp3).size === 0) { console.log('  ! missing mp3 ' + id); return; }
  await execFileP('ffmpeg', ['-i', mp3, '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});
const stillMissing = [...clips.keys()].filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
if (stillMissing.length) { console.error('✗ ' + stillMissing.length + ' clips failed — nothing written. Re-run (finished clips are cached).'); process.exit(1); }

const out = {};
for (const tr of TRACKS) {
  const list = [], cues = []; let t = 0;
  const push = f => { if (!f || !fs.existsSync(f)) return; list.push(f); t += wavDuration(f); };
  const wav = id => path.join(WAVDIR, id + '.wav');
  push(silence(LEAD_IN));
  tr.blocks.forEach((b, i) => {
    if (i) push(silence(GAP_CHUNK));
    const start = t;
    b.steps.forEach(st => { if (st.pause) { push(silence(st.pause)); return; } st.ids.forEach((id, k) => { if (k) push(silence(GAP_RUN)); push(wav(id)); }); if (st.gap) push(silence(st.gap)); });
    const cue = { de: b.label, t: r3(start), e: 0 }; if (b.id) cue.id = b.id; cues.push(cue);
  });
  cues.forEach((c, i) => { c.e = i + 1 < cues.length ? r3(cues[i + 1].t - GAP_CHUNK) : r3(t); });
  const listFile = path.join(CACHE, `_list_ppt_${tr.key}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  const m4a = path.join(OUTDIR, tr.file);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  out[tr.key] = { src: 'audio/' + tr.file, d: r3(t), title: tr.title, w: cues };
  console.log(`✓ ${tr.file}  ${tr.blocks.length} cues  ${Math.round(t)}s (${(t / 60).toFixed(1)} min)  ${(fs.statSync(m4a).size / 1048576).toFixed(2)} MB`);
}
fs.writeFileSync(path.join(OUTDIR, 'iw-ppt-cues.js'), 'window.PPT_AUDIO = ' + JSON.stringify(out) + ';\n');
console.log('✓ audio/iw-ppt-cues.js');
