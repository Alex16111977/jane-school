/* Getippte Lückenaufgaben für deutsch-egb.html (Karte ia10): Konjunktiv I / Ersatzform und Konnektoren.
   Markup:
     <div class="ia-gap-set"> … <div class="ia-gap" data-id="ig-a01" data-kind="ki" data-type="own|ersatz" data-ans="brauche" data-ind="braucht" data-k2="bräuchte" data-prat="brauchte"
              data-hint="…" data-why="…" data-wr="form=>Erklärung||form2=>Erklärung" data-show="Lösung, die bei 2 Fehlern angezeigt wird (sonst alle data-ans)">
          <span class="ia-gap-q">… <input> …</span><button type="button">prüfen</button><div class="ci-fb"></div></div> </div>
     Konnektoren: data-kind="konn" data-need="Grund|Folge|Konzessiv|Gegensatz|Zusatz" data-pos="end|adv|conj0" data-ans="weil|da"
        — richtig ist auch jedes Wort aus der Liste CONN mit derselben Beziehung und Verbstellung.
   Verglichen wird ohne Groß-/Kleinschreibung und ohne Umlaute (ä = ae); ein vorangestelltes „er/sie/man …“ wird ignoriert.
   Falsche Antworten werden erklärt (Indikativ, Konjunktiv II, Präteritum, Beziehung, Wortstellung).
   Das ist ein Hilfsmittel für Übungen — keine Korrektur der Lehrerin. UMD: im Browser window.IaGaps, in Node require('./ia-gaps.js') (judge() ist testbar). */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) { module.exports = factory(); } else { root.IaGaps = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function nz(s) {                         // Vergleichsform: klein, ä→ae, ö→oe, ü→ue, ß→ss, nur Buchstaben/Ziffern/Leerzeichen
        return String(s == null ? '' : s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function list(v) { return String(v || '').split('|').map(nz).filter(function (x) { return x; }); }
    function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
    function lev(a, b) {
        var m = a.length, n = b.length, d = [], i, j;
        for (i = 0; i <= m; i++) { d[i] = [i]; }
        for (j = 1; j <= n; j++) { d[0][j] = j; }
        for (i = 1; i <= m; i++) {
            for (j = 1; j <= n; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); }
        }
        return d[m][n];
    }
    // häufige Wörter, die nur zufällig fast wie eine Lösung aussehen (dann ≠ denn, das ≠ da) — kein „Tippfehler“-Hinweis
    var NOT_TYPO = list('dann|das|dass|dies|der|die|den|dem|wann|wer|was|wie|man|dir|mir|ihr|ihm|ist|sind|war|hat|und|ob|zu|um');
    function near(a, answers) { return a.length >= 4 && NOT_TYPO.indexOf(a) < 0 && answers.some(function (x) { return lev(a, x) <= 1; }); }

    /* ---------------- Konnektoren: Beziehung und Wortstellung ---------------- */
    var KIND = { Grund: 'причина (Kausal)', Folge: 'следствие (Konsekutiv)', Konzessiv: 'уступка (Konzessiv)', Gegensatz: 'противопоставление (Gegensatz)',
        Zusatz: 'добавление (Ergänzung)', Bedingung: 'условие (Konditional)', Zweck: 'цель (Final)' };
    var POS = { end: 'после него глагол уходит в конец придаточного предложения',
        adv: 'сразу после него стоит глагол (инверсия: «Deshalb essen sie …»)',
        conj0: 'после него идут подлежащее и глагол (прямой порядок слов: «…, denn sie haben …»)' };
    function here(pos) {
        if (pos === 'end') { return 'В этом предложении глагол стоит в конце — нужен подчинительный союз (weil, obwohl, sodass …).'; }
        if (pos === 'adv') { return 'В этом предложении глагол стоит сразу после пропуска — нужно наречие-связка (deshalb, trotzdem, außerdem …).'; }
        return 'После пропуска идут подлежащее и глагол на втором месте — нужен сочинительный союз (для причины denn, для противопоставления aber / doch, для добавления und).';
    }
    var CONN = Object.create(null);
    [['weil', 'Grund', 'end'], ['da', 'Grund', 'end'], ['zumal', 'Grund', 'end'], ['denn', 'Grund', 'conj0'],
        ['deshalb', 'Folge', 'adv'], ['daher', 'Folge', 'adv'], ['deswegen', 'Folge', 'adv'], ['darum', 'Folge', 'adv'], ['dadurch', 'Folge', 'adv'],
        ['folglich', 'Folge', 'adv'], ['infolgedessen', 'Folge', 'adv'], ['somit', 'Folge', 'adv'],
        ['sodass', 'Folge', 'end'], ['so dass', 'Folge', 'end'], ['weshalb', 'Folge', 'end'], ['wodurch', 'Folge', 'end'],
        ['obwohl', 'Konzessiv', 'end'], ['obgleich', 'Konzessiv', 'end'], ['wenngleich', 'Konzessiv', 'end'], ['auch wenn', 'Konzessiv', 'end'],
        ['selbst wenn', 'Konzessiv', 'end'], ['wenn auch', 'Konzessiv', 'end'], ['trotzdem', 'Konzessiv', 'adv'], ['dennoch', 'Konzessiv', 'adv'],
        ['jedoch', 'Gegensatz', 'adv'], ['allerdings', 'Gegensatz', 'adv'], ['dagegen', 'Gegensatz', 'adv'], ['hingegen', 'Gegensatz', 'adv'],
        ['im gegensatz dazu', 'Gegensatz', 'adv'], ['aber', 'Gegensatz', 'conj0'], ['doch', 'Gegensatz', 'conj0'],
        ['außerdem', 'Zusatz', 'adv'], ['zudem', 'Zusatz', 'adv'], ['darüber hinaus', 'Zusatz', 'adv'], ['zusätzlich', 'Zusatz', 'adv'], ['ferner', 'Zusatz', 'adv'],
        ['überdies', 'Zusatz', 'adv'], ['obendrein', 'Zusatz', 'adv'], ['weiterhin', 'Zusatz', 'adv'], ['des weiteren', 'Zusatz', 'adv'], ['und', 'Zusatz', 'conj0'],
        ['wenn', 'Bedingung', 'end'], ['falls', 'Bedingung', 'end'], ['damit', 'Zweck', 'end']
    ].forEach(function (c) { CONN[nz(c[0])] = [c[1], c[2]]; });

    function bad(msg) { return { state: 'bad', msg: msg }; }

    function judgeKonn(cfg, a, raw) {
        var q = '«' + String(raw).trim() + '»', c = CONN[a];
        if (cfg.ans.indexOf(a) >= 0 || (c && c[0] === cfg.need && c[1] === cfg.pos)) { return { state: 'ok', msg: '' }; }
        if (c) {
            if (c[0] !== cfg.need) { return bad(q + ' — ' + KIND[c[0]] + '. Здесь нужно слово со значением: ' + KIND[cfg.need] + '.'); }
            return bad(q + ' — ' + KIND[c[0]] + ': по смыслу подходит, но не по порядку слов — ' + POS[c[1]] + '. ' + here(cfg.pos));
        }
        if (near(a, cfg.ans)) { return { state: 'near', msg: 'Почти — проверь написание.' }; }
        return bad('Не подошло. Нужно слово со значением: ' + KIND[cfg.need] + '. ' + here(cfg.pos));
    }

    /* ---------------- Konjunktiv I ---------------- */
    function judgeKi(cfg, a, raw) {
        var q = '«' + String(raw).trim() + '»', hint = cfg.hint ? ' ' + cfg.hint : '';
        if (cfg.ans.indexOf(a) >= 0) { return { state: 'ok', msg: '' }; }
        if (has(cfg.wr, a)) { return bad(cfg.wr[a]); }
        if (cfg.ind.indexOf(a) >= 0) {
            return bad(cfg.type === 'ersatz'
                ? q + ' выглядит как Indikativ — косвенная речь не видна. Здесь Konjunktiv I совпал бы с Indikativ, поэтому нужна Ersatzform (Konjunktiv II).' + hint
                : q + ' — Indikativ. В косвенной речи нужна форма Konjunktiv I.' + hint);
        }
        if (cfg.k2.indexOf(a) >= 0) {
            return bad(cfg.type === 'ersatz'
                ? q + ' — Konjunktiv II, но не та форма: проверь слово и лицо.' + hint
                : q + ' — Konjunktiv II. Здесь есть собственная форма Konjunktiv I; по правилу учительницы (M13) Konjunktiv II нужен как Ersatzform, когда Konjunktiv I совпадает с Indikativ.' + hint);
        }
        if (cfg.prat.indexOf(a) >= 0) { return bad(q + ' — Präteritum. Здесь нужен Konjunktiv I (прошедшее выражаем через Perfekt), а не Präteritum.' + hint); }
        if (near(a, cfg.ans)) { return { state: 'near', msg: 'Почти — проверь написание (Umlaut? окончание?).' }; }
        return bad('Не подошло.' + (hint || (cfg.type === 'ersatz'
            ? ' Konjunktiv I = Indikativ → берём Konjunktiv II (hätten, könnten, müssten, sollten, würden …).'
            : ' Konjunktiv I: основа инфинитива + -e (er/sie/es/man).')));
    }

    function readCfg(get) {
        var wr = Object.create(null);
        String(get('data-wr') || '').split('||').forEach(function (p) {
            var i = p.indexOf('=>');
            if (i > 0) { wr[nz(p.slice(0, i))] = p.slice(i + 2).trim(); }
        });
        var all = String(get('data-ans') || '').split('|');
        return { kind: get('data-kind') || 'ki', type: get('data-type') || 'own', ans: list(get('data-ans')), ind: list(get('data-ind')), k2: list(get('data-k2')),
            prat: list(get('data-prat')), need: get('data-need'), pos: get('data-pos'), hint: get('data-hint') || '', why: get('data-why') || '', wr: wr,
            shown: get('data-show') || all.join(' / '), first: all[0] };
    }

    function judge(cfg, raw) {
        var a = nz(raw);
        if (!a) { return { state: 'empty', msg: 'Сначала впиши слово.' }; }
        if (cfg.kind !== 'konn') { a = a.replace(/^(er|sie|es|man|ich|wir|ihr|du) /, ''); }          // „er brauche“ → „brauche“
        var maxWords = cfg.kind === 'konn' ? 3 : 2;                                                   // „im Gegensatz dazu“ = 3 Wörter
        if (a.split(' ').length > maxWords && cfg.ans.indexOf(a) < 0) { return bad('Впиши только пропущенное слово, а не всё предложение.'); }
        return cfg.kind === 'konn' ? judgeKonn(cfg, a, raw) : judgeKi(cfg, a, raw);
    }

    /* ---------------- Oberfläche (nur im Browser) ---------------- */
    var KEY = 'neostudy_gaps';
    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ohne Speicher weiter */ } }

    function init() {
        if (typeof document === 'undefined') { return; }
        var state = load();
        Array.prototype.forEach.call(document.querySelectorAll('.ia-gap-set'), function (set) {
            var items = Array.prototype.slice.call(set.querySelectorAll('.ia-gap'));
            var bar = document.createElement('div'); bar.className = 'ia-gap-bar';
            bar.innerHTML = '<span class="ia-gap-score"></span><button type="button" class="ia-gap-reset">↺ neu starten</button>';
            set.insertBefore(bar, set.firstChild);
            var score = bar.querySelector('.ia-gap-score');
            function upd() {
                var n = items.filter(function (e) { return e.classList.contains('ok'); }).length;
                score.textContent = n + ' / ' + items.length + ' richtig';
                bar.classList.toggle('full', n === items.length);
            }
            items.forEach(function (el) {
                var cfg = readCfg(function (k) { return el.getAttribute(k); });
                var inp = el.querySelector('input'), btn = el.querySelector('button'), fb = el.querySelector('.ci-fb'), id = el.getAttribute('data-id'), tries = 0;
                function solved() { el.classList.remove('bad', 'near'); el.classList.add('ok'); fb.className = 'ci-fb okc'; fb.textContent = '✓ richtig — ' + cfg.why; }
                function check() {
                    var r = judge(cfg, inp.value);
                    if (r.state === 'empty') { fb.className = 'ci-fb'; fb.textContent = r.msg; return; }
                    if (r.state === 'ok') { solved(); if (id) { state[id] = 1; save(state); } upd(); return; }
                    tries++;
                    el.classList.remove('ok'); el.classList.add(r.state === 'near' ? 'near' : 'bad');
                    fb.className = 'ci-fb badc';
                    fb.textContent = '✗ ' + r.msg + (tries >= 2 ? '  → Lösung: ' + cfg.shown + ' — ' + cfg.why : '');
                    upd();
                }
                el._reset = function () { el.classList.remove('ok', 'bad', 'near'); inp.value = ''; fb.className = 'ci-fb'; fb.textContent = ''; tries = 0; if (id) { delete state[id]; } };
                btn.addEventListener('click', check);
                inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
                if (id && state[id]) { inp.value = cfg.first; solved(); }
            });
            bar.querySelector('.ia-gap-reset').addEventListener('click', function () { items.forEach(function (e) { e._reset(); }); save(state); upd(); });
            upd();
        });
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
    }
    return { judge: judge, readCfg: readCfg, nz: nz };
}));
