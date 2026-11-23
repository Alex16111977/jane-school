// Prüft die Satzbauer-Aufgaben (js/satzbauer-core.js): geht ALLE Reihenfolgen durch und zeigt, was akzeptiert wird.
//   node tools/check-satzbauer.mjs            → Zusammenfassung + Warnungen
//   node tools/check-satzbauer.mjs --all      → zusätzlich alle akzeptierten Sätze jeder Aufgabe (zum Durchlesen)
//   node tools/check-satzbauer.mjs 4-3 5-6    → nur diese Aufgaben, mit allen akzeptierten Sätzen
// Neue Aufgabe in TASKS eintragen → hier laufen lassen: die neutrale Lösung muss "ok" sein, und die Liste der akzeptierten
// Sätze muss durchgelesen werden (kein ungrammatischer Satz darf durchrutschen).
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const SB = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'satzbauer-core.js'));

const args = process.argv.slice(2);
const showAll = args.includes('--all');
const only = args.filter(a => !a.startsWith('--'));

function* perms(arr) {
    if (arr.length <= 1) { yield arr.slice(); return; }
    for (let i = 0; i < arr.length; i++) {
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        for (const p of perms(rest)) { yield [arr[i]].concat(p); }
    }
}

let problems = 0;
for (const task of SB.TASKS) {
    if (only.length && !only.includes(task.id)) { continue; }
    const locked = task.all.filter(c => c.locked).map(c => c.id);
    const free = task.all.filter(c => !c.locked).map(c => c.id);
    const canon = SB.evaluate(task, task.canon);
    const bad = [];
    if (canon.status !== 'ok') {
        problems++;
        console.log('!! ' + task.id + ': neutrale Lösung ist NICHT ok → ' + canon.status + ' ' + canon.hard.concat(canon.soft).map(v => v.rule + ': ' + v.msg).join(' | '));
    }
    const ok = [], marked = [];
    for (const p of perms(free)) {
        const order = locked.concat(p);
        const r = SB.evaluate(task, order);
        if (r.status === 'ok') { ok.push(SB.sentence(task, order)); }
        else if (r.status === 'marked') { marked.push(SB.sentence(task, order) + '   [' + r.soft.map(s => s.rule).filter((v, i, a) => a.indexOf(v) === i).join(',') + ']'); }
    }
    const total = (function f(n) { return n <= 1 ? 1 : n * f(n - 1); })(free.length);
    console.log(task.id.padEnd(4) + ' ok=' + String(ok.length).padStart(3) + '  markiert=' + String(marked.length).padStart(3) + '  von ' + total + '   ' + SB.sentence(task, task.canon));
    if (showAll || only.length) {
        ok.forEach(s => console.log('      ✓ ' + s));
        marked.forEach(s => console.log('      ~ ' + s));
    }
    if (ok.length > 8 || marked.length > 14) { console.log('      (viele akzeptierte Varianten — bitte mit --all durchlesen)'); }
    // Erklärungen müssen existieren
    const ex = SB.explain(task);
    if (ex.length < 2) { problems++; console.log('!! ' + task.id + ': weniger als 2 Begründungen'); }
    // jede Aufgabe: Hinweis und Übersetzung vorhanden
    if (!task.hint || !task.ru) { problems++; console.log('!! ' + task.id + ': hint/ru fehlt'); }
}
console.log('\n' + (problems ? problems + ' Problem(e)' : 'alle neutralen Lösungen ok'));
process.exit(problems ? 1 : 0);
