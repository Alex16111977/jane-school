/* Reihenfolge-Aufgaben („Bringe die Schritte in die richtige Reihenfolge“) für die EGB-Seiten (z. B. bwr-egb.html).
   Markup: <div class="ia-order" data-id="o1" data-items='["erst","dann","zuletzt"]' data-hint="…" data-why="…"><div class="ia-order-q">Frage</div></div>
   data-items = die RICHTIGE Reihenfolge (JSON). Der Browser mischt die Karten; Antippen in der richtigen Reihenfolge legt sie ab,
   eine falsche Karte wackelt und gibt den Hinweis; nach zwei Fehlern erscheint „Lösung zeigen“.
   Das ist ein Hilfsmittel für Übungen — keine Korrektur der Lehrerin. UMD: im Browser window.IaOrder, in Node require('./ia-order.js'). */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) { module.exports = factory(); } else { root.IaOrder = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function shuffle(a) {                       // Fisher–Yates; das Ergebnis darf nie schon die Lösung sein
        var b = a.slice(), i, j, t, tries = 0;
        do {
            for (i = b.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = b[i]; b[i] = b[j]; b[j] = t; }
            tries++;
        } while (tries < 8 && b.length > 1 && b.every(function (x, k) { return x === a[k]; }));
        return b;
    }
    // nächste richtige Karte: ok = Reihenfolge stimmt
    function step(items, placed, pick) {
        if (placed.length >= items.length) { return { ok: false, done: true }; }
        var ok = items[placed.length] === pick;
        return { ok: ok, done: ok && placed.length + 1 === items.length };
    }

    function init() {
        if (typeof document === 'undefined') { return; }
        Array.prototype.forEach.call(document.querySelectorAll('.ia-order'), function (el) {
            var items;
            try { items = JSON.parse(el.getAttribute('data-items') || '[]'); } catch (e) { items = []; }
            if (items.length < 2) { return; }
            var hint = el.getAttribute('data-hint') || '', why = el.getAttribute('data-why') || '', fails = 0, placed = [];
            var pool = document.createElement('div'); pool.className = 'ia-order-pool';
            var list = document.createElement('ol'); list.className = 'ia-order-list';
            var bar = document.createElement('div'); bar.className = 'ia-order-bar';
            var fb = document.createElement('div'); fb.className = 'ci-fb';
            var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'ia-order-reset'; reset.textContent = '↺ neu mischen';
            var sol = document.createElement('button'); sol.type = 'button'; sol.className = 'ia-order-sol'; sol.textContent = '📖 Lösung zeigen'; sol.hidden = true;
            bar.appendChild(reset); bar.appendChild(sol);
            el.appendChild(pool); el.appendChild(list); el.appendChild(bar); el.appendChild(fb);

            function add(text) {
                placed.push(text);
                var li = document.createElement('li'); li.textContent = text; list.appendChild(li);
            }
            function finish(msg) { pool.textContent = ''; sol.hidden = true; el.classList.add('done'); fb.className = 'ci-fb okc'; fb.textContent = msg + (why ? ' — ' + why : ''); }
            function build() {
                placed = []; fails = 0; list.textContent = ''; pool.textContent = ''; fb.className = 'ci-fb'; fb.textContent = ''; sol.hidden = true; el.classList.remove('done');
                shuffle(items).forEach(function (text) {
                    var b = document.createElement('button'); b.type = 'button'; b.className = 'ia-order-card'; b.textContent = text;
                    b.addEventListener('click', function () {
                        var r = step(items, placed, text);
                        if (r.ok) { add(text); b.remove(); fb.className = 'ci-fb'; fb.textContent = ''; if (r.done) { finish('✓ richtig'); } return; }
                        fails++;
                        b.classList.add('wrong'); setTimeout(function () { b.classList.remove('wrong'); }, 500);
                        fb.className = 'ci-fb badc';
                        fb.textContent = '✗ Das ist noch nicht dran.' + (hint ? ' ' + hint : '');
                        if (fails >= 2) { sol.hidden = false; }
                    });
                    pool.appendChild(b);
                });
            }
            reset.addEventListener('click', build);
            sol.addEventListener('click', function () { items.slice(placed.length).forEach(add); finish('📖 Lösung'); });
            build();
        });
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
    }
    return { shuffle: shuffle, step: step };
}));
