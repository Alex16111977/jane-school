/* Satzbauer — Oberfläche: Bausteine antippen → Satz bauen → prüfen (Regeln aus js/satzbauer-core.js)
   Markup: <div id="sb-root"></div>   Fortschritt: localStorage "neostudy_sb"                              */
(function () {
    'use strict';
    if (typeof SB === 'undefined') { return; }
    var root = document.getElementById('sb-root');
    if (!root) { return; }

    var KEY = 'neostudy_sb';
    var state = { solved: {}, lvl: 0 };
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.solved) { state = s; } } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

    var RGB = { 0: '139,148,158', 1: '121,192,255', 2: '86,211,100', 3: '210,168,255', 4: '255,166,87', 5: '255,154,194', 6: '227,179,65', 7: '255,123,114', 8: '63,185,168' };

    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (html != null) { e.innerHTML = html; } return e; }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

    /* ---------- Kopf: Gesamtfortschritt + Stufen ---------- */
    var head = el('div', 'sb-head');
    var overall = el('div', 'sb-overall');
    var pills = el('div', 'sb-pills');
    var body = el('div', 'sb-body');
    head.appendChild(overall); head.appendChild(pills);
    root.appendChild(head); root.appendChild(body);

    function countLevel(n) {
        var tasks = SB.TASKS.filter(function (t) { return t.lvl === n; });
        var d = tasks.filter(function (t) { return state.solved[t.id]; }).length;
        return { d: d, n: tasks.length };
    }
    function refreshHead() {
        var total = SB.TASKS.length, done = SB.TASKS.filter(function (t) { return state.solved[t.id]; }).length;
        overall.innerHTML = '<span>Решено: <b>' + done + '</b> / ' + total + '</span><div class="sb-bar"><i style="width:' + (done / total * 100) + '%"></i></div>' +
            '<button type="button" class="sb-reset">сбросить прогресс</button>';
        overall.querySelector('.sb-reset').addEventListener('click', function () {
            if (!window.confirm('Сбросить отметки «решено» во всех уровнях?')) { return; }
            state.solved = {}; save(); showLevel(state.lvl || SB.LEVELS[0].n, true); refreshHead();
        });
        Array.prototype.forEach.call(pills.children, function (b) {
            var c = countLevel(+b.getAttribute('data-lvl'));
            b.querySelector('em').textContent = c.d + '/' + c.n;
            b.classList.toggle('full', c.d === c.n);
        });
    }
    SB.LEVELS.forEach(function (L) {
        var b = el('button', 'sb-pill', '<b>' + L.n + '</b><span>' + esc(L.t) + '</span><em></em>');
        b.type = 'button'; b.setAttribute('data-lvl', L.n);
        b.addEventListener('click', function () { showLevel(L.n); });
        pills.appendChild(b);
    });

    /* ---------- Aufgabe ---------- */
    function mount(task) {
        var card = el('div', 'sb-task');
        card.id = 'sb-' + task.id;
        var line = [], pool = [], tries = 0, finished = false, hintOn = false;

        var top = el('div', 'sb-top', '<span class="sb-num">' + task.id + '</span><span class="sb-ru">' + esc(task.ru) + '</span><span class="sb-st"></span>');
        var pre = task.pre ? el('div', 'sb-pre', esc(task.pre)) : null;
        var lineBox = el('div', 'sb-line');
        var poolBox = el('div', 'sb-pool');
        var acts = el('div', 'sb-acts');
        var bCheck = el('button', 'sb-btn main', 'Проверить'), bReset = el('button', 'sb-btn', '↺ сначала'), bHint = el('button', 'sb-btn', '💡 подсказка');
        [bCheck, bReset, bHint].forEach(function (b) { b.type = 'button'; acts.appendChild(b); });
        var hintBox = el('div', 'sb-hint'); hintBox.style.display = 'none'; hintBox.textContent = task.hint || '';
        var fb = el('div', 'sb-fb'); fb.setAttribute('aria-live', 'polite');
        card.appendChild(top); if (pre) { card.appendChild(pre); }
        card.appendChild(lineBox); card.appendChild(poolBox); card.appendChild(acts); card.appendChild(hintBox); card.appendChild(fb);

        function lockedIds() { return task.all.filter(function (c) { return c.locked; }).map(function (c) { return c.id; }); }
        function reset() {
            line = lockedIds();
            var free = task.all.filter(function (c) { return !c.locked; }).map(function (c) { return c.id; });
            var s = shuffle(free), guard = 0;
            while (free.length > 1 && s.join() === free.join() && guard++ < 10) { s = shuffle(free); }
            pool = s; tries = 0; finished = false;
            fb.className = 'sb-fb'; fb.innerHTML = '';
            bCheck.disabled = false; bCheck.style.display = ''; poolBox.style.display = '';
            render(); setState();
        }
        function setState() {
            top.querySelector('.sb-st').textContent = state.solved[task.id] ? '✓' : '';
            card.classList.toggle('solved', !!state.solved[task.id]);
        }
        function chipEl(id, where) {
            var ch = task.by[id], b = el('button', 'sb-chip' + (ch.locked ? ' locked' : ''));
            b.type = 'button';
            var idx = line.indexOf(id), first = where === 'line' && !task.pre && idx === 0;
            b.textContent = first ? cap(ch.t) : ch.t;
            b.setAttribute('data-id', id);
            if (finished && where === 'line') {
                var st = SB.stations(task, line)[id];
                b.className += ' done'; b.style.setProperty('--rgb', RGB[st] || RGB[0]);
                b.innerHTML = esc(b.textContent) + '<i>' + esc(SB.ROLE[ch.r].lab) + '</i>';
                b.disabled = true;
            } else if (ch.locked) { b.disabled = true; }
            return b;
        }
        function render() {
            lineBox.innerHTML = ''; poolBox.innerHTML = '';
            line.forEach(function (id, i) {
                var ch = task.by[id];
                if ((ch.r === 'NS' || ch.r === 'NSn') && i > 0 && !(i === 1 && task.by[line[0]].r === 'C0')) { lineBox.appendChild(el('span', 'sb-p', ',')); }
                var b = chipEl(id, 'line');
                if (!ch.locked && !finished) { b.addEventListener('click', function () { line.splice(line.indexOf(id), 1); pool.push(id); render(); }); }
                lineBox.appendChild(b);
                if (ch.r === 'NS' && (i === 0 || (i === 1 && task.by[line[0]].r === 'C0'))) { lineBox.appendChild(el('span', 'sb-p', ',')); }
            });
            lineBox.appendChild(el('span', 'sb-p end', esc(task.end)));
            lineBox.classList.toggle('empty', line.length === lockedIds().length);
            pool.forEach(function (id) {
                var b = chipEl(id, 'pool');
                b.addEventListener('click', function () { if (finished) { return; } pool.splice(pool.indexOf(id), 1); line.push(id); fb.className = 'sb-fb'; fb.innerHTML = ''; render(); });
                poolBox.appendChild(b);
            });
            if (!pool.length && !finished) { poolBox.appendChild(el('span', 'sb-ready', 'все блоки поставлены — нажми «Проверить»')); }
        }

        function whyHtml() {
            var items = SB.explain(task);
            if (!items.length) { return ''; }
            return '<div class="sb-why"><b>Почему именно так:</b><ul>' + items.map(function (e) { return '<li>' + esc(e.text) + '</li>'; }).join('') + '</ul></div>';
        }
        function legendHtml() {
            return '<div class="sb-leg">цвет = остановка «Satz-Bahn»: ' + [1, 2, 3, 4, 5, 6, 7].map(function (n) { return '<span style="--rgb:' + RGB[n] + '">' + n + ' ' + esc(SB.STATION[n].n) + '</span>'; }).join('') + '</div>';
        }

        function finish(r, shown) {
            finished = true; render();
            bCheck.style.display = 'none'; poolBox.style.display = 'none';
            var html = '';
            if (shown) { html += '<div class="sb-msg info">Вот решение. Попробуй собрать это предложение сам: нажми «↺ сначала».</div>'; }
            else if (r.status === 'ok') { html += '<div class="sb-msg ok">✅ Верно!</div>'; }
            else { html += '<div class="sb-msg mark">🟡 Принято — предложение возможное, но не самое нейтральное.</div>'; }
            if (r.status === 'marked' && !shown) {
                html += '<ul class="sb-notes">' + r.soft.slice(0, 2).map(function (s) { return '<li>' + esc(s.msg) + '</li>'; }).join('') + '</ul>';
                html += '<div class="sb-neutral">Нейтральный порядок: <b>' + esc(SB.sentence(task, task.canon)) + '</b></div>';
            }
            html += legendHtml() + whyHtml();
            html += '<div class="sb-next"><button type="button" class="sb-btn main">Дальше →</button></div>';
            fb.className = 'sb-fb show ' + (shown ? 'info' : r.status);
            fb.innerHTML = html;
            fb.querySelector('.sb-next button').addEventListener('click', function () {
                var nx = card.nextElementSibling;
                if (nx && nx.classList.contains('sb-task')) { nx.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
                else { head.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            });
            if (!shown && !state.solved[task.id]) { state.solved[task.id] = 1; save(); refreshHead(); }
            setState();
        }

        bCheck.addEventListener('click', function () {
            if (finished) { return; }
            if (pool.length) { fb.className = 'sb-fb show warn'; fb.innerHTML = '<div class="sb-msg warn">Сначала поставь все блоки — осталось ' + pool.length + '.</div>'; return; }
            var r = SB.evaluate(task, line);
            tries++;
            if (r.status !== 'bad') { finish(r, false); return; }
            // ошибочные блоки подсветить
            var bad = {};
            r.hard.forEach(function (h) { (h.ids || []).forEach(function (id) { bad[id] = 1; }); });
            Array.prototype.forEach.call(lineBox.querySelectorAll('.sb-chip'), function (b) { b.classList.toggle('warn', !!bad[b.getAttribute('data-id')] && !task.by[b.getAttribute('data-id')].locked); });
            var shown = r.hard.slice(0, 2);
            var allEx = r.hard.length > 0 && r.hard.every(function (h) { return h.exercise; });
            var html = (allEx ? '<div class="sb-msg warn">↺ Так тоже пишут, но в этом упражнении нужен другой порядок:</div>' : '<div class="sb-msg bad">✗ Здесь есть ошибка в порядке слов:</div>') + '<ul class="sb-notes">' + shown.map(function (h) { return '<li>' + esc(h.msg) + '</li>'; }).join('') + '</ul>';
            if (r.hard.length > shown.length) { html += '<div class="sb-more">…и ещё ' + (r.hard.length - shown.length) + '. Исправь это и проверь снова.</div>'; }
            html += '<div class="sb-tip">Нажми на блок в строке, чтобы убрать его и поставить иначе.' + (tries >= 2 ? ' <button type="button" class="sb-link">показать решение</button>' : '') + '</div>';
            fb.className = 'sb-fb show ' + (allEx ? 'warn' : 'bad'); fb.innerHTML = html;
            var lk = fb.querySelector('.sb-link');
            if (lk) { lk.addEventListener('click', function () { line = task.canon.slice(); pool = []; finish(SB.evaluate(task, line), true); }); }
        });
        bReset.addEventListener('click', reset);
        bHint.addEventListener('click', function () { hintOn = !hintOn; hintBox.style.display = hintOn ? '' : 'none'; bHint.textContent = hintOn ? '💡 скрыть' : '💡 подсказка'; });
        reset();
        return card;
    }

    /* ---------- Stufe anzeigen ---------- */
    var cache = {};
    function showLevel(n, force) {
        state.lvl = n; save();
        Array.prototype.forEach.call(pills.children, function (b) { b.classList.toggle('on', +b.getAttribute('data-lvl') === n); });
        var L = SB.LEVELS.filter(function (x) { return x.n === n; })[0];
        body.innerHTML = '';
        body.appendChild(el('div', 'sb-lvl-h', '<h3>Уровень ' + n + ' · ' + esc(L.t) + '</h3><p>' + esc(L.s) + '</p>'));
        SB.TASKS.filter(function (t) { return t.lvl === n; }).forEach(function (t) {
            if (force || !cache[t.id]) { cache[t.id] = mount(t); }
            body.appendChild(cache[t.id]);
        });
        refreshHead();
    }
    var startLvl = state.lvl || 0;
    if (!startLvl) {
        var first = SB.LEVELS.filter(function (L) { var c = countLevel(L.n); return c.d < c.n; })[0];
        startLvl = first ? first.n : 1;
    }
    showLevel(startLvl);
})();
