#!/usr/bin/env node
// Generate a single narrated overview track for deutsch.html's A2 section:
// each of the 15 A2 grammar topics is read as German title -> Russian
// explanation -> German examples, with pauses; bookended by a short DE+RU
// intro/outro, so the whole thing works as a stand-alone "listen in the car"
// refresher of what A2 covers.
//
// One audio/deutsch-a2-overview.m4a + audio/deutsch-a2-overview.json (raw cue
// data) + audio/deutsch-a2-cues.js (assigns window.DEUTSCH_A2_AUDIO, loaded
// via <script src> so it works from file:// too, no fetch needed).
//
// Usage:
//   node tools/gen-deutsch-a2-audio.mjs             # build (skips if m4a exists)
//   node tools/gen-deutsch-a2-audio.mjs --force     # rebuild from scratch
//   node tools/gen-deutsch-a2-audio.mjs --dry       # counts/estimate only
//   node tools/gen-deutsch-a2-audio.mjs --plan      # print the full speech plan, no TTS
//
// Requires edge-tts's Python package (via tools/edge_batch.py) and ffmpeg.
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
const BASE = 'deutsch-a2-overview';
const CACHE = path.join(os.tmpdir(), 'jane-school-deutsch-a2-audio-cache');
const MP3DIR = path.join(CACHE, 'mp3');
const WAVDIR = path.join(CACHE, 'wav');

const VOICE_DE = process.env.EDGE_VOICE_DE || 'de-DE-KatjaNeural';
const VOICE_RU = process.env.EDGE_VOICE_RU || 'ru-RU-SvetlanaNeural';
const SR = 24000;
const BITRATE = '48k';
const GAP_INNER = 0.40;   // between title -> explanation -> examples
const GAP_CARD = 1.00;    // between topics -- a clear breath before the next one
const LEAD_IN = 0.30;
// edge-tts bakes leading/trailing silence into every clip; strip it (keep ~30ms)
// so the gaps above are the ONLY pauses the listener hears (see deutsch-c1-gesellschaft's generator).
const TRIM = 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse,' +
             'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-40dB:detection=peak,areverse';

// ---------- content: title (DE) -> explanation (RU) -> examples (DE) ----------
const TOPICS = [
  { k: 'intro', de: 'Deutsch, Niveau A2. Ein kurzer Hör-Überblick über fünfzehn Grammatik-Themen — mit Erklärung und Beispielen.',
    ru: 'Уровень А2. Короткий аудио-обзор пятнадцати тем грамматики — с объяснением и примерами на немецком.', ex: '' },

  { k: 'verwechslungen', de: 'Verwechslungen',
    ru: 'Здесь собраны слова, которые новички часто путают друг с другом: указательное и безличное местоимение, союз для придаточных предложений, два разных способа сказать «когда», разные падежи слова «я», и пара слов, которая отличает причину от очерёдности.',
    ex: 'Das ist gut. Es regnet. Ich hoffe, dass es klappt. Wenn ich Zeit habe, rufe ich an. Als ich Kind war, wohnte ich in Berlin. Er ruft mich an. Er hilft mir gern. Ich komme, denn ich habe Lust. Zuerst die Suppe, dann der Nachtisch.' },

  { k: 'zwei-verben', de: 'Zwei Verben im Satz',
    ru: 'Как правильно поставить два глагола в одном предложении. Спрягаемая часть остаётся на втором месте, а второй глагол уходит в самый конец — это инфинитив после модального глагола, причастие в Perfekt, или конструкция с частицей «цу». Такую рамку называют Verbklammer.',
    ex: 'Ich kann heute nicht kommen. Ich habe das Buch schon gelesen. Ich habe vor, morgen zu fahren. Er versucht, pünktlich zu sein.' },

  { k: 'praefix-verben', de: 'Verben mit Präfixen',
    ru: 'Глаголы с приставками бывают отделяемые и неотделяемые. У отделяемых ударение падает на приставку, и в простом предложении она уходит в самый конец. У неотделяемых приставка всегда остаётся слитно с глаголом.',
    ex: 'Ich mache das Fenster auf. Ich mache das Licht an. Ich mache die Tür zu. Ich verstehe das gut. Er bekommt ein Geschenk.' },

  { k: 'adjektive', de: 'Adjektive',
    ru: 'Окончания прилагательных зависят от рода, падежа и от того, что стоит перед прилагательным — определённый артикль, неопределённый или вообще ничего. Это одна из самых объёмных тем уровня А2, но у неё есть чёткая система.',
    ex: 'Der gute Mann. Ein guter Mann. Gute Männer. Das kleine Kind. Ein kleines Kind.' },

  { k: 'komparativ', de: 'Komparativ & Superlativ',
    ru: 'Сравнительная степень прилагательного образуется прибавлением окончания, а превосходная — с помощью слова «am» и особого окончания. У многих коротких прилагательных гласная в корне меняется на умлаут.',
    ex: 'Schnell, schneller, am schnellsten. Gut, besser, am besten. Groß, größer, am größten. Gern, lieber, am liebsten.' },

  { k: 'adverbien', de: 'Adverbien',
    ru: 'Наречия отвечают на вопрос «как», «когда» или «где». В отличие от прилагательных, они никогда не склоняются и не меняют форму.',
    ex: 'Er läuft schnell. Ich gehe oft ins Kino. Das freut mich sehr. Vielleicht kommt sie morgen.' },

  { k: 'von-innen', de: 'von innen, von oben …',
    ru: 'Наречия места и направления показывают, откуда, куда и в какую сторону происходит движение. Слова с «hin» показывают направление от говорящего, а слова с «her» — по направлению к говорящему.',
    ex: 'Von innen. Von oben. Nach oben. Hinein und heraus. Komm her! Geh hin!' },

  { k: 'vor-kurzem', de: 'vor kurzem, seit kurzem …',
    ru: 'Эти наречия времени показывают, насколько давно или скоро что-то происходит — от «совсем недавно» до «уже скоро».',
    ex: 'Vor kurzem habe ich sie getroffen. Neulich war ich im Kino. Ich bin gerade angekommen. Bald ist Sommer.' },

  { k: 'meinetwegen', de: 'meinetwegen & Co.',
    ru: 'Эта группа слов означает «из-за меня» или «ради тебя», а в разговорной речи одно из них значит просто «да ладно, мне всё равно». Более книжный вариант той же идеи строится отдельным предлогом.',
    ex: 'Meinetwegen kannst du gehen. Das mache ich deinetwegen. Um Gottes willen! Um der Sicherheit willen.' },

  { k: 'adj-vs-adv', de: 'Adjektiv vs. Adverb',
    ru: 'В немецком одно и то же слово часто работает и как прилагательное, и как наречие — форма при этом не меняется. Разница видна по позиции в предложении: перед существительным появляется окончание, а рядом с глаголом слово остаётся без окончания.',
    ex: 'Ein schnelles Auto. Er fährt schnell. Ein gutes Essen. Sie kocht gut.' },

  { k: 'mengen', de: 'Mengenangaben',
    ru: 'Слова количества показывают, сколько чего-то есть — много, мало, немного, некоторые. В единственном числе они обычно не склоняются, а во множественном получают окончание.',
    ex: 'Viel Zeit. Viele Freunde. Wenig Geld. Wenige Leute. Einige Bücher. Manche Menschen.' },

  { k: 'masse', de: 'Maße & Mengen',
    ru: 'Единицы измерения нужны для рецептов и повседневных покупок — килограммы, литры, метры, градусы. После числительного такие меры обычно остаются в единственном числе.',
    ex: 'Ein Kilo Äpfel. Zwei Liter Milch. Drei Meter Stoff. Dreißig Grad. Ein Gramm Salz.' },

  { k: 'fehler', de: 'Typische Fehler',
    ru: 'Здесь собраны самые частые ошибки учеников уровня А2 — рядом с каждой сразу звучит правильный вариант, чтобы сразу услышать разницу.',
    ex: 'Nicht: Ich bin zwanzig Jahre. Sondern: Ich bin zwanzig Jahre alt. Nicht: Ich habe Hunger, weil ich möchte essen. Sondern: Ich habe Hunger, weil ich essen möchte.' },

  { k: 'fremdwoerter', de: 'Fremdwörter',
    ru: 'Немецкий язык заимствовал много интернациональных слов, которые звучат почти как в русском или английском, но пишутся и произносятся уже по немецким правилам.',
    ex: 'Der Computer. Das Restaurant. Das Telefon. Die Universität. Das Hotel.' },

  { k: 'schreibregeln', de: 'Schreibregeln',
    ru: 'Правила письма отвечают на три вопроса: когда писать один вариант шипящего звука, а когда другой; когда слово пишется с большой буквы; и где в предложении нужна запятая.',
    ex: 'Die Straße. Der Fluss. Ich weiß es. Das Haus ist groß. Ich glaube, dass es regnet.' },

  { k: 'outro', de: 'Das war der Überblick über die fünfzehn Themen von A2. Öffne eine Karte auf der Seite, um mehr zu lernen. Viel Erfolg!',
    ru: 'Это был обзор пятнадцати тем уровня А2. Открой любую карточку на странице, чтобы изучить тему подробнее. Удачи!', ex: '' },
];

// ---------- speech plan ----------
function cleanSpeech(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
const idFor = (voice, text) => 'a2_' + crypto.createHash('md5').update(voice + '\n' + text).digest('hex').slice(0, 16);
function planTopic(t) {
  const segs = [];
  const add = (voice, text, gap) => { text = cleanSpeech(text); if (!text) return; segs.push({ id: idFor(voice, text), voice, text, gap }); };
  add(VOICE_DE, t.de, 0);
  add(VOICE_RU, t.ru, GAP_INNER);
  if (t.ex) add(VOICE_DE, t.ex, GAP_INNER);
  return segs;
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

// ---------- stitch the track ----------
function buildTrack() {
  const list = [], cues = [];
  let t = 0;
  const push = (file) => { if (!file) return; list.push(file); t += wavDuration(file); };
  push(silence(LEAD_IN));
  TOPICS.forEach((topic) => {
    const cueT = t;
    for (const s of planTopic(topic)) { if (s.gap) push(silence(s.gap)); push(wavFor(s.id)); }
    push(silence(GAP_CARD));
    cues.push({ k: topic.k, de: topic.de, ru: topic.ru, ex: topic.ex, t: Math.round(cueT * 1000) / 1000 });
  });
  const listFile = path.join(WAVDIR, `_list_${BASE}.txt`);
  fs.writeFileSync(listFile, list.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  fs.mkdirSync(OUTDIR, { recursive: true });
  const m4a = path.join(OUTDIR, `${BASE}.m4a`);
  execFileSync('ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:a', 'aac', '-b:a', BITRATE, '-ac', '1', '-ar', String(SR), '-movflags', '+faststart', m4a, '-y', '-loglevel', 'error']);
  const total = Math.round(t * 1000) / 1000;
  fs.writeFileSync(path.join(OUTDIR, `${BASE}.json`), JSON.stringify({ d: total, voiceDe: VOICE_DE, voiceRu: VOICE_RU, c: cues }));
  fs.writeFileSync(path.join(OUTDIR, 'deutsch-a2-cues.js'), 'window.DEUTSCH_A2_AUDIO = ' + JSON.stringify({ d: total, c: cues }) + ';\n');
  console.log(`✓ ${BASE}  ${TOPICS.length} topics  ${Math.round(total)}s  ${Math.round(fs.statSync(m4a).size / 1024)}KB`);
}

// ---------- main ----------
const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const plan = args.includes('--plan');
const cIdx = args.indexOf('--concurrency');
const CONCURRENCY = cIdx >= 0 ? parseInt(args[cIdx + 1], 10) : 16;

if (plan) {
  TOPICS.forEach((topic, i) => {
    console.log(`\n[${i}] ${topic.k}`);
    planTopic(topic).forEach(s => console.log(`  [${s.voice === VOICE_DE ? 'DE' : 'RU'}] +${s.gap}  ${s.text}`));
  });
  process.exit(0);
}

const jobMap = new Map();
for (const topic of TOPICS) for (const s of planTopic(topic)) if (!jobMap.has(s.id)) jobMap.set(s.id, { id: s.id, voice: s.voice, text: s.text });
const jobs = [...jobMap.values()];

if (dry) {
  console.log(`${TOPICS.length} topics, ${jobs.length} unique tts clips`);
  console.log(`at concurrency ${CONCURRENCY} ~ ${Math.round(jobs.length / CONCURRENCY)}s of fetching`);
  process.exit(0);
}

const m4aPath = path.join(OUTDIR, `${BASE}.m4a`);
if (fs.existsSync(m4aPath) && !force) {
  console.log(`${BASE}.m4a already exists (use --force to rebuild)`);
  process.exit(0);
}

console.log(`DE voice: ${VOICE_DE}  |  RU voice: ${VOICE_RU}  |  ${jobs.length} unique clips`);
fs.mkdirSync(MP3DIR, { recursive: true });
fs.mkdirSync(WAVDIR, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const jobsFile = path.join(CACHE, 'jobs.json');
fs.writeFileSync(jobsFile, JSON.stringify(jobs));
console.log(`Fetching ${jobs.length} tts clips (concurrency ${CONCURRENCY})...`);
execFileSync('python3', [path.join(ROOT, 'tools', 'edge_batch.py'), jobsFile, MP3DIR, String(CONCURRENCY)], { stdio: 'inherit' });

const have = jobs.map(j => j.id).filter(id => fs.existsSync(path.join(MP3DIR, id + '.mp3')));
const toConv = have.filter(id => !fs.existsSync(path.join(WAVDIR, id + '.wav')));
console.log(`Converting ${toConv.length}/${have.length} clips to wav...`);
await pool(toConv, 8, async (id) => {
  await execFileP('ffmpeg', ['-i', path.join(MP3DIR, id + '.mp3'), '-ar', String(SR), '-ac', '1', '-af', TRIM, '-c:a', 'pcm_s16le', path.join(WAVDIR, id + '.wav'), '-y', '-loglevel', 'error']);
});

buildTrack();
