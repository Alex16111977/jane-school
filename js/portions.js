/* Lern-Engine "kleine Portionen" — für alle EGB-Seiten (Klassen-Präfix ci-)
   .ci-root  → Portionen (.ci-p) mit Fortschritt
   .ci-q     → "Rechne selbst" (Zahl)           .ci-mc    → Multiple-Choice mit Begründung
   .ci-write → Schreibfeld mit Wortzähler       .ci-check → anklickbare Checkliste
   .ci-timer → Countdown                        .ci-grade → Punkte → Note (Notenschlüssel CBF)
   [data-ci-deck="name"] → Merkkarten aus window.CI_DECKS[name]                                    */
(function () {
    'use strict';
    var KEY = 'neostudy_portions';
    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
    var state = load();
    state.p = state.p || {};      // erledigte Portionen
    state.decks = state.decks || {};
    state.w = state.w || {};      // Schreibfelder
    state.ck = state.ck || {};    // Checklisten
    state.g = state.g || {};      // Punkte

    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (txt != null) { e.textContent = txt; } return e; }

    /* ---------- Portionen ---------- */
    function initRoot(root) {
        root.classList.add('ci-js');
        var ps = Array.prototype.slice.call(root.querySelectorAll('.ci-p'));
        if (!ps.length) { return; }

        var prog = el('div', 'ci-prog');
        prog.innerHTML = '<span>Fortschritt: <b class="ci-n">0</b> / ' + ps.length + ' Portionen</span>' +
            '<div class="ci-prog-bar"><i></i></div>' +
            '<button type="button" class="ci-all">alle öffnen</button>' +
            '<button type="button" class="ci-reset">zurücksetzen</button>';
        var head = root.querySelector('.lesson-header-block');
        if (head) { head.insertAdjacentElement('afterend', prog); } else { ps[0].parentNode.insertBefore(prog, ps[0]); }

        function refresh() {
            var n = 0;
            ps.forEach(function (p) {
                var done = !!state.p[p.getAttribute('data-p')];
                p.classList.toggle('done', done);
                if (done) { n++; }
                var ok = p.querySelector('.ci-ok');
                if (ok) { ok.textContent = done ? '✓ erledigt — klick, um es zurückzusetzen' : '✓ Habe ich verstanden — weiter'; }
            });
            prog.querySelector('.ci-n').textContent = n;
            prog.querySelector('.ci-prog-bar i').style.width = (n / ps.length * 100) + '%';
        }
        function nextOpen(from) {
            for (var i = from + 1; i < ps.length; i++) { if (!state.p[ps[i].getAttribute('data-p')]) { return ps[i]; } }
            return null;
        }

        ps.forEach(function (p, i) {
            var h = el('div', 'ci-p-h');
            var t = el('span', 'ci-p-t');
            t.appendChild(el('b', '', p.getAttribute('data-t') || ''));
            t.appendChild(el('span', '', p.getAttribute('data-s') || ''));
            h.appendChild(el('span', 'ci-p-n', String(i + 1)));
            h.appendChild(t);
            h.appendChild(el('span', 'ci-p-min', p.getAttribute('data-m') || ''));
            h.appendChild(el('span', 'ci-p-chev', '▶'));
            p.insertBefore(h, p.firstChild);
            h.addEventListener('click', function () { p.classList.toggle('open'); });

            var body = p.querySelector('.ci-p-b');
            var ok = el('button', 'ci-ok'); ok.type = 'button';
            body.appendChild(ok);
            ok.addEventListener('click', function () {
                var id = p.getAttribute('data-p');
                if (state.p[id]) { delete state.p[id]; save(state); refresh(); return; }
                state.p[id] = true; save(state);
                p.classList.remove('open');
                var nx = nextOpen(i);
                if (nx) { nx.classList.add('open'); nx.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
                refresh();
            });
        });

        var first = ps.filter(function (p) { return !state.p[p.getAttribute('data-p')]; })[0];
        if (first) { first.classList.add('open'); }
        refresh();

        var allOpen = false;
        prog.querySelector('.ci-all').addEventListener('click', function () {
            allOpen = !allOpen;
            ps.forEach(function (p) { p.classList.toggle('open', allOpen); });
            this.textContent = allOpen ? 'alle schließen' : 'alle öffnen';
        });
        prog.querySelector('.ci-reset').addEventListener('click', function () {
            ps.forEach(function (p) { delete state.p[p.getAttribute('data-p')]; p.classList.remove('open'); });
            save(state); refresh();
            ps[0].classList.add('open');
        });
    }

    /* ---------- Rechne selbst (Zahl) ---------- */
    function parseNum(s) {
        s = String(s).replace(/[€\s]/g, '');
        if (!s) { return NaN; }
        if (s.indexOf(',') > -1) { s = s.replace(/\./g, '').replace(',', '.'); }
        else if (/^\d{1,3}(\.\d{3})+$/.test(s)) { s = s.replace(/\./g, ''); }
        return parseFloat(s);
    }
    function fmt(n) {
        return n.toLocaleString('de-DE', { minimumFractionDigits: (Math.round(n * 100) % 100 ? 2 : 0), maximumFractionDigits: 2 });
    }
    function initQuestions(scope) {
        Array.prototype.forEach.call(scope.querySelectorAll('.ci-q[data-ans]'), function (q) {
            var inp = q.querySelector('input'), btn = q.querySelector('button'), fb = q.querySelector('.ci-fb');
            var ans = parseFloat(q.getAttribute('data-ans')), why = q.getAttribute('data-why') || '', tries = 0;
            function check() {
                var v = parseNum(inp.value);
                q.classList.remove('ok', 'bad');
                if (isNaN(v)) { fb.textContent = 'Tipp eine Zahl ein, z. B. 12.345,67'; return; }
                if (Math.abs(v - ans) < 0.005) {
                    q.classList.add('ok');
                    fb.textContent = '✓ richtig: ' + fmt(ans) + (why ? ' — ' + why : '');
                } else {
                    tries++;
                    q.classList.add('bad');
                    fb.textContent = tries < 2 ? '✗ noch nicht — rechne noch einmal.' : '✗ Lösung: ' + fmt(ans) + (why ? ' — ' + why : '');
                }
            }
            btn.addEventListener('click', check);
            inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { check(); } });
        });
    }

    /* ---------- Multiple-Choice ---------- */
    function initMC(scope) {
        Array.prototype.forEach.call(scope.querySelectorAll('.ci-mc'), function (mc) {
            var ans = parseInt(mc.getAttribute('data-ans'), 10), why = mc.getAttribute('data-why') || '';
            var fb = mc.querySelector('.ci-fb');
            var btns = Array.prototype.slice.call(mc.querySelectorAll('.ci-mc-o button'));
            btns.forEach(function (b, i) {
                b.addEventListener('click', function () {
                    btns.forEach(function (x) { x.classList.remove('ok', 'bad'); });
                    if (i === ans) {
                        b.classList.add('ok'); mc.classList.add('solved');
                        fb.textContent = '✓ richtig' + (why ? ' — ' + why : '');
                        fb.className = 'ci-fb okc';
                    } else {
                        b.classList.add('bad');
                        fb.textContent = '✗ nicht ganz — überleg noch einmal.';
                        fb.className = 'ci-fb badc';
                    }
                });
            });
        });
    }

    /* ---------- Schreibfeld mit Wortzähler ---------- */
    function countWords(t) { var m = t.trim().match(/\S+/g); return m ? m.length : 0; }
    function initWrite(scope) {
        Array.prototype.forEach.call(scope.querySelectorAll('.ci-write'), function (w) {
            var key = w.getAttribute('data-key'), min = +w.getAttribute('data-min') || 0, max = +w.getAttribute('data-max') || 0;
            var ta = el('textarea');
            ta.rows = +w.getAttribute('data-rows') || 9;
            ta.placeholder = w.getAttribute('data-ph') || 'Schreib hier …';
            ta.value = state.w[key] || '';
            var info = el('div', 'ci-write-n');
            w.appendChild(ta); w.appendChild(info);
            function upd() {
                var n = countWords(ta.value);
                info.textContent = n + ' Wörter' + (min || max ? ' (Ziel: ' + min + '–' + max + ')' : '');
                info.className = 'ci-write-n' + (n === 0 ? '' : (n < min ? ' low' : (max && n > max ? ' high' : ' ok')));
            }
            ta.addEventListener('input', function () { state.w[key] = ta.value; save(state); upd(); });
            upd();
        });
    }

    /* ---------- Checkliste ---------- */
    function initChecks(scope) {
        Array.prototype.forEach.call(scope.querySelectorAll('ul.ci-check'), function (ul) {
            var key = ul.getAttribute('data-key');
            state.ck[key] = state.ck[key] || {};
            var items = Array.prototype.slice.call(ul.querySelectorAll('li'));
            var cnt = el('div', 'ci-check-n');
            ul.insertAdjacentElement('afterend', cnt);
            function upd() {
                var n = 0;
                items.forEach(function (li, i) { var on = !!state.ck[key][i]; li.classList.toggle('on', on); if (on) { n++; } });
                cnt.textContent = n + ' / ' + items.length + ' erfüllt';
                cnt.classList.toggle('all', n === items.length);
            }
            items.forEach(function (li, i) {
                li.addEventListener('click', function () {
                    if (state.ck[key][i]) { delete state.ck[key][i]; } else { state.ck[key][i] = true; }
                    save(state); upd();
                });
            });
            upd();
        });
    }

    /* ---------- Countdown ---------- */
    function initTimers(scope) {
        Array.prototype.forEach.call(scope.querySelectorAll('.ci-timer'), function (t) {
            var total = (+t.getAttribute('data-min') || 90) * 60, left = total, iv = null;
            var out = el('span', 'ci-timer-t'), b1 = el('button', '', '▶ Start'), b2 = el('button', '', '↺');
            b1.type = 'button'; b2.type = 'button';
            t.appendChild(out); t.appendChild(b1); t.appendChild(b2);
            function show() { var m = Math.floor(left / 60), s = left % 60; out.textContent = m + ':' + (s < 10 ? '0' : '') + s; }
            b1.addEventListener('click', function () {
                if (iv) { clearInterval(iv); iv = null; b1.textContent = '▶ Weiter'; return; }
                if (left <= 0) { left = total; }
                b1.textContent = '⏸ Pause';
                iv = setInterval(function () {
                    left--; show();
                    if (left <= 0) { clearInterval(iv); iv = null; out.textContent = 'Zeit ist um!'; b1.textContent = '▶ Neu'; }
                }, 1000);
            });
            b2.addEventListener('click', function () { if (iv) { clearInterval(iv); iv = null; } left = total; b1.textContent = '▶ Start'; show(); });
            show();
        });
    }

    /* ---------- Punkte → Note (Notenschlüssel CBF) ---------- */
    var NOTEN = [[98, '1+'], [93, '1'], [90, '1-'], [87, '2+'], [78, '2'], [75, '2-'], [72, '3+'], [63, '3'],
                 [60, '3-'], [57, '4+'], [48, '4'], [45, '4-'], [42, '5+'], [33, '5'], [30, '5-'], [0, '6']];
    function noteFor(pct) { for (var i = 0; i < NOTEN.length; i++) { if (pct + 1e-9 >= NOTEN[i][0]) { return NOTEN[i][1]; } } return '6'; }
    function initGrade(scope) {
        Array.prototype.forEach.call(scope.querySelectorAll('.ci-grade'), function (g) {
            var parts = g.getAttribute('data-parts').split(',').map(Number);
            var labels = (g.getAttribute('data-labels') || '').split(',');
            var key = g.getAttribute('data-key') || 'grade';
            var max = parts.reduce(function (a, b) { return a + b; }, 0);
            var saved = state.g[key] || [];
            var inputs = [];
            var row = el('div', 'ci-grade-in');
            parts.forEach(function (mx, i) {
                var lab = el('label', '', (labels[i] || ('Aufgabe ' + (i + 1))) + ' (max. ' + mx + ')');
                var inp = el('input'); inp.type = 'number'; inp.min = 0; inp.max = mx; inp.step = 0.5; inp.inputMode = 'decimal';
                if (saved[i] != null) { inp.value = saved[i]; }
                lab.appendChild(inp); row.appendChild(lab); inputs.push(inp);
            });
            var out = el('div', 'ci-grade-out');
            g.appendChild(row); g.appendChild(out);
            function upd() {
                var sum = 0, any = false, vals = [];
                inputs.forEach(function (inp, i) {
                    var v = parseFloat(String(inp.value).replace(',', '.'));
                    if (isNaN(v)) { vals.push(null); return; }
                    v = Math.max(0, Math.min(parts[i], v)); sum += v; any = true; vals.push(v);
                });
                state.g[key] = vals; save(state);
                if (!any) { out.textContent = 'Trag deine Punkte ein — dann siehst du die Note.'; return; }
                var pct = sum / max * 100;
                out.innerHTML = '<b>' + fmt(sum) + ' / ' + max + ' Punkte</b> · ' + pct.toFixed(1).replace('.', ',') + ' % → Note <b class="ci-note-big">' + noteFor(pct) + '</b>';
            }
            inputs.forEach(function (inp) { inp.addEventListener('input', upd); });
            upd();
        });
    }

    /* ---------- Merkkarten ---------- */
    function initDeck(box) {
        var name = box.getAttribute('data-ci-deck');
        var DECK = (window.CI_DECKS || {})[name];
        if (!DECK || !DECK.length) { return; }
        state.decks[name] = state.decks[name] || {};
        var known = state.decks[name];
        var queue = [], pos = 0, flipped = false;
        function build() {
            queue = [];
            DECK.forEach(function (c, i) { if (!known[i]) { queue.push(i); } });
            pos = 0; flipped = false;
        }
        function render() {
            var n = Object.keys(known).length;
            box.innerHTML = '';
            var top = el('div', 'ci-deck-top');
            top.innerHTML = '<span>gewusst: <b>' + n + '</b> / ' + DECK.length + '</span>';
            var rb = el('button', '', '↺ von vorn'); rb.type = 'button';
            rb.addEventListener('click', function () { state.decks[name] = known = {}; save(state); build(); render(); });
            top.appendChild(rb);
            box.appendChild(top);
            if (!queue.length) {
                var done = el('div', 'ci-card flip');
                done.innerHTML = '<div class="ci-card-q">🎉 Alle ' + DECK.length + ' Karten gewusst!</div><div class="ci-card-w">Tipp „von vorn“, um sie in ein paar Tagen noch einmal zu prüfen.</div>';
                box.appendChild(done);
                return;
            }
            var c = DECK[queue[pos % queue.length]];
            var card = el('div', 'ci-card' + (flipped ? ' flip' : ''));
            card.innerHTML = flipped
                ? '<div class="ci-card-a">' + c.a + '</div><div class="ci-card-w">' + c.w + '</div>'
                : '<div class="ci-card-q">' + c.q + '</div><div class="ci-card-hint">erst im Kopf antworten — dann antippen</div>';
            card.addEventListener('click', function () { flipped = !flipped; render(); });
            box.appendChild(card);
            var btns = el('div', 'ci-deck-btns');
            var again = el('button', 'again', '↩ nochmal'); again.type = 'button';
            var know = el('button', 'know', '✓ gewusst'); know.type = 'button';
            again.addEventListener('click', function () { pos++; flipped = false; render(); });
            know.addEventListener('click', function () {
                known[queue[pos % queue.length]] = true; save(state);
                queue.splice(pos % queue.length, 1);
                flipped = false; render();
            });
            btns.appendChild(again); btns.appendChild(know);
            box.appendChild(btns);
        }
        build(); render();
    }

    /* ---------- Start ---------- */
    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('.ci-root'), initRoot);
        initQuestions(document); initMC(document); initWrite(document); initChecks(document); initTimers(document); initGrade(document);
        Array.prototype.forEach.call(document.querySelectorAll('[data-ci-deck]'), initDeck);
        Array.prototype.forEach.call(document.querySelectorAll('.ci-root .st-item'), function (e) {
            e.addEventListener('click', function () { e.classList.toggle('open'); });
        });
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
