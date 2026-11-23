// Tests für js/ia-check.js (Kriterien-Check Inhaltsangabe / Stellungnahme): die Mustertexte der Seite müssen bestehen, schlechte Texte müssen auffallen.
//   node tools/check-ia.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const IA = require(path.join(ROOT, 'js/ia-check.js'));
const html = fs.readFileSync(path.join(ROOT, 'deutsch-egb.html'), 'utf8');

function portion(id) {
    const i = html.indexOf('<div class="ci-p" data-p="' + id + '"');
    if (i < 0) throw new Error('portion not found: ' + id);
    const j = html.indexOf('<div class="ci-p" data-p="', i + 10);
    return html.slice(i, j < 0 ? undefined : j);
}
function model(id) {
    const p = portion(id);
    const m = /<div class="ci-model-b">([\s\S]*?)<\/div><\/details>/.exec(p);
    if (!m) throw new Error('no model in ' + id);
    return m[1].replace(/<span class="ci-wc">[\s\S]*?<\/span>/g, '').replace(/<\/p>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\n\s*\n/g, '\n').trim();
}
let fails = 0;
function show(title, r) {
    console.log('\n=== ' + title + ': ' + r.ok + '/' + r.total);
    r.results.forEach(x => console.log('  ' + ({ ok: '✓', bad: '✗', warn: '◐', info: 'ℹ' })[x.status] + ' ' + x.label + ' — ' + x.detail));
}
function expectAll(title, r, allow) {            // every criterion must be ok, except the listed warn keys
    const bad = r.results.filter(x => x.status !== 'ok' && x.status !== 'info' && !(allow || []).includes(x.key));
    if (bad.length) { fails++; console.log('  ✗✗ ' + title + ': unexpected non-ok: ' + bad.map(b => b.key + '(' + b.status + ')').join(', ')); }
}
function expectBad(title, r, keys) {
    keys.forEach(k => { const x = r.results.find(y => y.key === k); if (!x || x.status !== 'bad') { fails++; console.log('  ✗✗ ' + title + ': expected "' + k + '" to be bad, got ' + (x ? x.status : 'missing')); } });
}

const D_IA = model('ia5-2'), D_ST = model('ia5-5'), E_IA = model('ia6-4'), E_ST = model('ia6-5');
const rDia = IA.analyze(D_IA, 'ia', { min: 180, max: 250 });  show('Muster Text D · Inhaltsangabe', rDia);
const rEia = IA.analyze(E_IA, 'ia', { min: 160, max: 260 });  show('Muster Text E · Inhaltsangabe', rEia);
const rDst = IA.analyze(D_ST, 'st', { min: 120, max: 180 }); show('Muster Text D · Stellungnahme', rDst);
const rEst = IA.analyze(E_ST, 'st', { min: 120, max: 180 }); show('Muster Text E · Stellungnahme', rEst);
// the page's own models must pass (a model that fails its own checker is a bug in the model or in the checker)
expectAll('Muster D Inhaltsangabe', rDia); expectAll('Muster E Inhaltsangabe', rEia);
expectAll('Muster D Stellungnahme', rDst); expectAll('Muster E Stellungnahme', rEst);

// bad texts
const BAD_IA = 'Ich finde den Text über das Essen im Homeoffice echt gut. Der Autor sagte: „Eine ausgewogene Ernährung ist wichtig.“ Er schrieb auch, dass man Obst essen soll! Leider nannte er keine Quellen. Das war voll krass. Am Ende hatte der Autor noch Tipps, die ich super finde.';
const rBad = IA.analyze(BAD_IA, 'ia', { min: 160, max: 260 }); show('SCHLECHT · Inhaltsangabe', rBad);
expectBad('schlechte Inhaltsangabe', rBad, ['basis', 'praes', 'wert', 'zitat', 'ki', 'len']);
const BAD_ST = 'Hallo, der Text ist ganz ok. Ich fand ihn gut. Man kann ihn nehmen.';
const rBadSt = IA.analyze(BAD_ST, 'st', { min: 120, max: 180 }); show('SCHLECHT · Stellungnahme', rBadSt);
expectBad('schlechte Stellungnahme', rBadSt, ['anrede', 'pos', 'arg', 'fazit', 'gruss', 'len']);
// Position kommt erst spät / Fazit steht schon früh → Warnung (nicht „bad“, nicht „ok“)
const LATE_POS = 'Sehr geehrter Herr Sales, ich habe den Artikel „Bewegung im Alltag zählt“ von Miriam Seidel gelesen und möchte Ihnen meine Einschätzung mitteilen. '
    + 'Erstens passt das Thema zu uns, weil wir Fahrräder herstellen. Im Text wird zum Beispiel erwähnt, dass Bewegung gesund ist. Zweitens ist der Text leicht zu lesen, weil die Sätze kurz sind. '
    + 'Außerdem gibt es viele Beispiele, deshalb bleibt er verständlich. Allerdings ist er etwas lang, sodass man kürzen sollte. Ich empfehle Ihnen deshalb, den Text zu veröffentlichen. '
    + 'Insgesamt halte ich den Text für geeignet, weil er zu unserer Zielgruppe passt. Ich schlage vor, dass wir ihn kürzen. Mit freundlichen Grüßen [Name], Praktikant/in';
const rLate = IA.analyze(LATE_POS, 'st', { min: 120, max: 180 });
const lateP = rLate.results.find(x => x.key === 'pos');
if (!lateP || lateP.status !== 'warn') { fails++; console.log('  ✗✗ späte Position: erwartet warn, ist ' + (lateP && lateP.status)); }
const EARLY_FAZIT = 'Sehr geehrter Herr Sales, insgesamt halte ich den Text für geeignet. Ich habe den Artikel „Bewegung im Alltag zählt“ von Miriam Seidel gelesen und möchte Ihnen meine Einschätzung mitteilen. '
    + 'Ich empfehle Ihnen, den Text zu veröffentlichen. Erstens passt das Thema zu uns, weil wir Fahrräder herstellen. Im Text wird zum Beispiel erwähnt, dass Bewegung gesund ist. '
    + 'Zweitens ist der Text leicht zu lesen, weil die Sätze kurz sind. Außerdem gibt es viele Beispiele, deshalb bleibt er verständlich. Allerdings ist er etwas lang, sodass man kürzen sollte. '
    + 'Ich schlage vor, dass wir ihn kürzen und mit einem Bild ergänzen, damit er besser aussieht. Mit freundlichen Grüßen [Name], Praktikant/in';
const rEF = IA.analyze(EARLY_FAZIT, 'st', { min: 120, max: 180 });
const efF = rEF.results.find(x => x.key === 'fazit');
if (!efF || efF.status !== 'warn') { fails++; console.log('  ✗✗ frühes Fazit: erwartet warn, ist ' + (efF && efF.status)); }
// Muster: Bausteine „4 von 4“
[rDia, rEia].forEach((r, i) => { const b = r.results.find(x => x.key === 'bausteine'); if (!b || !/^4 von 4/.test(b.detail)) { fails++; console.log('  ✗✗ Bausteine Muster ' + (i ? 'E' : 'D') + ': ' + (b && b.detail)); } });
// edge: too short → empty result, no crash
const rEmpty = IA.analyze('Hallo', 'ia', {});
if (!rEmpty.empty) { fails++; console.log('  ✗✗ empty text not detected'); }
console.log('\n' + (fails ? '✗✗✗ ' + fails + ' Problem(e)' : '✓ alle Erwartungen erfüllt'));
process.exit(fails ? 1 : 0);
