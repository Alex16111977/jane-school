#!/usr/bin/env node
// One-shot (re-runnable) injector: wires the shared "listen to this lesson"
// audio player (css/lesson-audio.css + js/lesson-audio-player.js) into each
// of the 15 A2 grammar lesson pages -- a button in the page header, the
// overlay markup right after .page-content closes, and the two <script>
// tags (this page's own cues file + the shared player) before </body>.
// Idempotent: re-running on an already-wired page is a no-op for that page.
//
// Usage: node tools/inject-lesson-audio-ui.mjs [slug...]   # defaults to all 15

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = {
  'verwechslungen': 'deutsch-verwechslungen.html',
  'zwei-verben': 'deutsch-zwei-verben.html',
  'praefix-verben': 'deutsch-praefix-verben.html',
  'adjektive': 'deutsch-adjektive.html',
  'komparativ': 'deutsch-komparativ.html',
  'adverbien': 'deutsch-adverbien.html',
  'von-innen': 'deutsch-von-innen.html',
  'vor-kurzem': 'deutsch-vor-kurzem.html',
  'meinetwegen': 'deutsch-meinetwegen.html',
  'adj-vs-adv': 'deutsch-adj-vs-adv.html',
  'mengen': 'deutsch-mengen.html',
  'masse': 'deutsch-masse.html',
  'fehler': 'deutsch-fehler.html',
  'fremdwoerter': 'deutsch-fremdwoerter.html',
  'schreibregeln': 'deutsch-schreibregeln.html',
};

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

const OVERLAY = `
    <!-- ===== Lektion anhören: Player (siehe css/lesson-audio.css + js/lesson-audio-player.js) =====
         Docked bottom bar, not a full-screen overlay -- the page stays scrollable/clickable while it plays. -->
    <div class="lsa-dock" id="lsa-dock">
        <div class="lsa-panel" id="lsa-panel">
            <div class="lsa-now" id="lsa-now"></div>
            <div class="lsa-settings">
                <div class="lsa-group">
                    <button class="lsa-c" data-set="speed" data-val="0.85">0.85&times;</button>
                    <button class="lsa-c" data-set="speed" data-val="1">1&times;</button>
                    <button class="lsa-c" data-set="speed" data-val="1.15">1.15&times;</button>
                    <button class="lsa-c" data-set="speed" data-val="1.3">1.3&times;</button>
                </div>
                <div class="lsa-group">
                    <span style="align-self:center;color:#7a8494;font-size:.78rem;padding:0 .3rem;">\u{1F501}</span>
                    <button class="lsa-c" data-set="repeat" data-val="1">1&times;</button>
                    <button class="lsa-c" data-set="repeat" data-val="2">2&times;</button>
                    <button class="lsa-c" data-set="repeat" data-val="0">&#8734;</button>
                </div>
            </div>
            <div class="lsa-hint">Bildschirm sperren, in die Tasche &mdash; läuft weiter. Steuerung vom Sperrbildschirm oder über Kopfhörer.</div>
        </div>
        <div class="lsa-bar">
            <button class="lsa-bar-btn" id="lsa-prev" aria-label="Zurück">&#9198;</button>
            <button class="lsa-bar-btn lsa-bar-main" id="lsa-play" aria-label="Play/Pause">&#9654;</button>
            <button class="lsa-bar-btn" id="lsa-next" aria-label="Weiter">&#9197;</button>
            <button class="lsa-bar-info" id="lsa-bar-info" type="button" aria-label="Details ein-/ausblenden">
                <div class="lsa-bar-text" id="lsa-bar-text"></div>
                <div class="lsa-bar-progress" id="lsa-bar-progress"></div>
            </button>
            <button class="lsa-bar-close" onclick="closeLessonAudio()" aria-label="Schließen">&times;</button>
        </div>
    </div>
`;

function inject(slug) {
  const file = path.join(ROOT, PAGES[slug]);
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('lsa-dock')) { console.log(`- ${slug}: already wired, skipping`); return; }

  // 1) stylesheet link, right after the last existing stylesheet <link> in <head>
  const linkRe = /(<link rel="stylesheet"[^>]*>\s*)+/i;
  const lm = linkRe.exec(html);
  if (!lm) throw new Error('no <link rel="stylesheet"> found');
  const linkInsertAt = lm.index + lm[0].length;
  html = html.slice(0, linkInsertAt) + '<link rel="stylesheet" href="css/lesson-audio.css">\n' + html.slice(linkInsertAt);

  // 2) button, right after the page-subtitle paragraph (inside .page-header)
  const subRe = /<p class="page-subtitle"[^>]*>[\s\S]*?<\/p>/i;
  const sm = subRe.exec(html);
  if (!sm) throw new Error('no <p class="page-subtitle"> found');
  const btnInsertAt = sm.index + sm[0].length;
  const button = `\n            <button class="lsa-open-btn" onclick="openLessonAudio()">&#x1F3A7; Diese Lektion anhören</button>`;
  html = html.slice(0, btnInsertAt) + button + html.slice(btnInsertAt);

  // 3) overlay markup, right after .page-content closes (before <footer)
  const pcIdx = html.indexOf('class="page-content');
  if (pcIdx < 0) throw new Error('no .page-content found');
  const pcDivStart = html.lastIndexOf('<div', pcIdx);
  const pcBlock = findBalancedDiv(html, pcDivStart);
  const pcEnd = pcDivStart + pcBlock.length;
  html = html.slice(0, pcEnd) + '\n' + OVERLAY + html.slice(pcEnd);

  // 4) cues + shared player scripts, right before </body>
  const scripts = `    <script src="audio/lesson-${slug}-cues.js"></script>\n    <script src="js/lesson-audio-player.js"></script>\n`;
  html = html.replace(/<\/body>/i, scripts + '</body>');

  fs.writeFileSync(file, html, 'utf8');
  console.log(`✓ ${slug}: wired`);
}

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const targets = args.length ? args : Object.keys(PAGES);
for (const slug of targets) {
  if (!PAGES[slug]) { console.log(`unknown slug: ${slug}`); continue; }
  try { inject(slug); } catch (e) { console.log(`✗ ${slug}: FAILED - ${e.message}`); }
}
