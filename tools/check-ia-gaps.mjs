// Tests für js/ia-gaps.js (getippte Lückenaufgaben, Karte ia10 in deutsch-egb.html):
// jede Aufgabe der Seite muss ihre eigene Lösung akzeptieren, die genannten Fehlformen erkennen und erklären.
//   node tools/check-ia-gaps.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const G = require(path.join(ROOT, 'js/ia-gaps.js'));
const html = fs.readFileSync(path.join(ROOT, 'deutsch-egb.html'), 'utf8');

function unesc(v) { return v.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
const items = [];
for (const m of html.matchAll(/<div class="ia-gap"([^>]*)>/g)) {
    const a = {};
    for (const x of m[1].matchAll(/ data-([a-z0-9-]+)="([^"]*)"/g)) { a[x[1]] = unesc(x[2]); }
    items.push(a);
}
let fails = 0, checks = 0;
function expect(cond, msg) { checks++; if (!cond) { fails++; console.log('  ✗✗ ' + msg); } }
const cfgOf = a => G.readCfg(k => a[k.replace('data-', '')]);

console.log('Lückenaufgaben auf der Seite: ' + items.length);
const ids = items.map(a => a.id);
expect(new Set(ids).size === ids.length, 'IDs nicht eindeutig');
expect(items.length === 39, 'erwartet 39 Aufgaben (15 + 10 + 14), gefunden ' + items.length);

items.forEach(a => {
    const cfg = cfgOf(a), id = a.id;
    expect(!!a.why, id + ': data-why fehlt');
    expect(!!a.ans, id + ': data-ans fehlt');
    // 1) jede erlaubte Lösung ist richtig — auch ohne Umlaute und mit Großschreibung / Leerzeichen
    a.ans.split('|').forEach(x => {
        expect(G.judge(cfg, x).state === 'ok', id + ': Lösung "' + x + '" nicht akzeptiert');
        expect(G.judge(cfg, '  ' + x.toUpperCase() + ' ').state === 'ok', id + ': Lösung "' + x + '" in Großbuchstaben nicht akzeptiert');
        expect(G.judge(cfg, x.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')).state === 'ok', id + ': Lösung "' + x + '" ohne Umlaute nicht akzeptiert');
    });
    expect(G.judge(cfg, '').state === 'empty', id + ': leere Antwort nicht erkannt');
    if (a.kind === 'ki') {
        // 2) Indikativ / Konjunktiv II / Präteritum werden abgelehnt und erklärt
        ['ind', 'k2', 'prat'].forEach(f => (a[f] || '').split('|').filter(Boolean).forEach(x => {
            if (a.ans.split('|').map(G.nz).includes(G.nz(x))) { return; }          // gleiche Form wie die Lösung (z. B. „wollten“) — dann ist sie richtig
            const r = G.judge(cfg, x);
            expect(r.state === 'bad' && r.msg.length > 15, id + ': Fehlform "' + x + '" (' + f + ') nicht erklärt: ' + JSON.stringify(r));
        }));
        // 3) eine völlig falsche Form bekommt einen Hinweis
        const r = G.judge(cfg, 'xyzzy');
        expect(r.state === 'bad' && r.msg.length > 15, id + ': Fehlantwort ohne Hinweis');
        // 4) ein Tippfehler in der Lösung ist „fast richtig“
        const first = a.ans.split('|')[0];
        if (first.length >= 5) { expect(G.judge(cfg, first.slice(0, -1)).state !== 'ok', id + ': Tippfehler als richtig gewertet'); }
        // 5) ganze Sätze werden abgelehnt
        expect(G.judge(cfg, 'er hat das gesagt weil').state === 'bad', id + ': ganzer Satz nicht abgelehnt');
    }
});

// gezielte Konnektoren-Erwartungen (Reihenfolge wie in content2.KONN)
const konn = items.filter(a => a.kind === 'konn');
expect(konn.length === 14, 'erwartet 14 Konnektoren-Aufgaben, gefunden ' + konn.length);
const J = (i, w) => G.judge(cfgOf(konn[i]), w);
expect(J(0, 'weil').state === 'ok' && J(0, 'da').state === 'ok', 'K1: weil/da');
expect(/уступка/.test(J(0, 'obwohl').msg), 'K1: obwohl → Gegensatz erklärt');
expect(/порядку слов/.test(J(0, 'denn').msg), 'K1: denn → Wortstellung erklärt: ' + J(0, 'denn').msg);
expect(/следствие/.test(J(0, 'deshalb').msg), 'K1: deshalb → „следствие“ erklärt: ' + J(0, 'deshalb').msg);
expect(J(1, 'deshalb').state === 'ok' && J(1, 'darum').state === 'ok', 'K2: deshalb/darum');
expect(/причина/.test(J(1, 'weil').msg), 'K2: weil → „причина“ erklärt: ' + J(1, 'weil').msg);
expect(/порядку слов/.test(J(1, 'sodass').msg), 'K2: sodass (Folge, aber Verb am Ende) → Wortstellung erklärt: ' + J(1, 'sodass').msg);
expect(J(2, 'denn').state === 'ok' && J(2, 'weil').state === 'bad', 'K3: denn ok, weil falsch');
expect(J(3, 'sodass').state === 'ok' && J(3, 'so dass').state === 'ok' && J(3, 'weshalb').state === 'ok', 'K4: sodass / so dass / weshalb');
expect(/причина/.test(J(3, 'weil').msg), 'K4: weil → „причина“ erklärt');
expect(J(4, 'Obwohl').state === 'ok' && J(4, 'auch wenn').state === 'ok', 'K5: obwohl / auch wenn');
expect(J(5, 'trotzdem').state === 'ok' && J(5, 'dennoch').state === 'ok' && J(5, 'obwohl').state === 'bad' && J(5, 'jedoch').state === 'bad', 'K6');
expect(J(6, 'aber').state === 'ok' && J(6, 'doch').state === 'ok' && J(6, 'trotzdem').state === 'bad', 'K7');
expect(J(7, 'außerdem').state === 'ok' && J(7, 'ausserdem').state === 'ok' && J(7, 'darüber hinaus').state === 'ok' && J(7, 'zudem').state === 'ok', 'K8');
expect(J(8, 'dadurch').state === 'ok' && J(8, 'deshalb').state === 'ok' && J(8, 'sodass').state === 'bad', 'K9');
expect(J(12, 'denn').state === 'ok' && J(12, 'weil').state === 'bad', 'K13');
expect(J(0, 'weill').state === 'near', 'K1: Tippfehler „weill“ → near');

// Konjunktiv-Aufgaben: gezielte Erwartungen
const ki = items.filter(a => a.kind === 'ki');
const byAns = x => ki.find(a => a.ans.split('|')[0] === x);
const K = (ans, w) => G.judge(cfgOf(byAns(ans)), w);
expect(/Indikativ/.test(K('gebe', 'gibt').msg), 'gebe/gibt');
expect(/Konjunktiv II/.test(K('gebe', 'gäbe').msg), 'gebe/gäbe');
expect(/Präteritum/.test(K('gebe', 'gab').msg), 'gebe/gab');
expect(/Ersatzform/.test(K('hätten', 'haben').msg), 'hätten/haben');
expect(/единственное/.test(K('seien', 'sei').msg), 'seien/sei → Singular erklärt');
expect(K('würden', 'werden').state === 'bad' && K('würden', 'stiegen').state === 'bad', 'würden/werden, stiegen');
expect(K('wollten', 'wollen').state === 'bad' && K('wollten', 'wollten').state === 'ok', 'wollten');
expect(K('hätten', 'hatten').state === 'bad', 'hätten/hatten (Präteritum)');

// neue Erwartungen nach der unabhängigen Prüfung
expect(/условие/.test(J(0, 'wenn').msg) && J(0, 'wenn').state === 'bad', 'K1: wenn → Bedingung erklärt: ' + J(0, 'wenn').msg);
expect(J(0, 'zumal').state === 'ok', 'K1: zumal');
expect(J(2, 'dann').state === 'bad' && !/Почти/.test(J(2, 'dann').msg), 'K3: dann ist kein Tippfehler von denn: ' + JSON.stringify(J(2, 'dann')));
expect(J(1, 'folglich').state === 'ok' && J(1, 'somit').state === 'ok' && J(1, 'infolgedessen').state === 'ok', 'K2: folglich / somit / infolgedessen');
expect(J(3, 'wodurch').state === 'ok', 'K4: wodurch');
expect(J(4, 'selbst wenn').state === 'ok' && J(4, 'wenn auch').state === 'ok' && J(4, 'obgleich').state === 'ok' && J(4, 'wenngleich').state === 'ok', 'K5: selbst wenn / wenn auch / obgleich / wenngleich');
expect(J(7, 'zusätzlich').state === 'ok' && J(7, 'ferner').state === 'ok' && J(7, 'des Weiteren').state === 'ok' && J(7, 'überdies').state === 'ok', 'K8: zusätzlich / ferner / des Weiteren / überdies');
expect(J(13, 'Im Gegensatz dazu').state === 'ok' && J(13, 'dagegen').state === 'ok' && J(13, 'hingegen').state === 'ok' && J(13, 'jedoch').state === 'ok', 'K14: Gegensatz/adv');
expect(J(13, 'trotzdem').state === 'bad' && /уступка/.test(J(13, 'trotzdem').msg), 'K14: trotzdem ist Konzessiv');
expect(!/«und».*обычный порядок.*\(denn, aber\)/.test(J(6, 'und').msg), 'K7: kein irreführendes „(denn, aber)“ für Gegensatz');
for (const w of ['constructor', 'toString', '__proto__']) {
    konn.forEach((a, i) => expect(!/undefined/.test(G.judge(cfgOf(a), w).msg), 'Konnektor ' + (i + 1) + ': „' + w + '“ gibt undefined aus'));
    ki.forEach(a => expect(!/undefined/.test(G.judge(cfgOf(a), w).msg), a.id + ': „' + w + '“ gibt undefined aus'));
}
expect(K('brauche', 'er brauche').state === 'ok' && K('hätten', 'sie hätten').state === 'ok' && K('sei', 'er sei').state === 'ok', 'vorangestelltes Pronomen wird ignoriert');
expect(K('würden', 'würden steigen').state === 'ok' && K('würden', 'sie würden steigen').state === 'ok', '„würden steigen“ (ganze Verbform) wird akzeptiert');
expect(/stiegen/.test(K('würden', 'stiegen').msg) && /Präteritum/.test(K('würden', 'stiegen').msg), 'stiegen: Erklärung');
const seienGap = items.find(a => a.id === 'ig-b02');
const rSind = G.judge(cfgOf(seienGap), 'sind');
expect(!/основа инфинитива \+ -e/.test(rSind.msg) && /seien/.test(rSind.msg), 'sein: keine falsche „Stamm + -e“-Regel: ' + rSind.msg);
expect(/Konjunktiv I совпадает/.test(K('hätten', 'habe').msg) && !/у него/.test(K('hätten', 'habe').msg), 'hätten/habe: Erklärung ohne „у него“');
expect(!/пишем Präsens/.test(K('hätten', 'hatten').msg), 'Präteritum-Meldung ohne „пишем Präsens“');
// alle Singularformen der Lehrerinnen-Tabelle werden geübt
['sei', 'habe', 'könne', 'müsse', 'solle', 'werde'].forEach(x => expect(!!ki.find(a => a.ans.split('|')[0] === x), 'Singularform „' + x + '“ fehlt in den Aufgaben'));

// E-Mail-Fragen: Schlüssel verteilt und die Anrede ist die der Hilfekarte
const p4 = html.slice(html.indexOf('data-p="ia10-4"'), html.indexOf('data-p="ia10-5"'));
const mcs = [...p4.matchAll(/<div class="ci-mc" data-ans="(\d+)"[^>]*>[\s\S]*?<div class="ci-mc-o">([\s\S]*?)<\/div><div class="ci-fb">/g)];
expect(mcs.length === 6, 'erwartet 6 E-Mail-Fragen, gefunden ' + mcs.length);
const keys = mcs.map(m => +m[1]);
expect(new Set(keys).size >= 4, 'E-Mail-Fragen: Schlüssel nicht verteilt: ' + keys.join(','));
const opt = (m, i) => [...m[2].matchAll(/<button type="button">([\s\S]*?)<\/button>/g)].map(x => x[1])[i];
expect(opt(mcs[0], keys[0]) === 'Sehr geehrter Herr Sales,', 'Anrede: Schlüssel zeigt auf ' + opt(mcs[0], keys[0]));
expect(opt(mcs[2], keys[2]) === 'Mit freundlichen Grüßen', 'Gruß: Schlüssel zeigt auf ' + opt(mcs[2], keys[2]));
expect(opt(mcs[3], keys[3]) === 'Ihnen', 'Ihnen: Schlüssel zeigt auf ' + opt(mcs[3], keys[3]));

console.log('\n' + checks + ' Prüfungen — ' + (fails ? '✗✗✗ ' + fails + ' Problem(e)' : '✓ alle bestanden'));
process.exit(fails ? 1 : 0);
