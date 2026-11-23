/* Satzbauer — Kern: Rollen, Regeln, Prüfung, Aufgaben (ohne DOM, läuft auch in Node: tools/check-satzbauer.mjs)
   Idee: jedes Satzglied ist ein Baustein mit einer Rolle (Vorfeld, Verb, Pronomen, Te/Ka/Mo/Lo, Dativ/Akkusativ, nicht, Verb-Rest …).
   Die Reihenfolge wird NICHT mit einer einzigen "Musterlösung" verglichen, sondern gegen Regeln geprüft:
     hart  → Fehler (echter Verstoß gegen eine feste Regel)
     weich → "möglich, aber markiert" (neutrale Reihenfolge anders, z. B. Akzent) — wird akzeptiert, mit Hinweis
   Die Reihenfolge der Bausteine in TASKS ist die neutrale Lösung (muss 0 Verstöße haben).                        */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) { module.exports = factory(); }
    else { root.SB = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ---------- Rollen → Haltestelle (1–7, 8 = Nachfeld) und Beschriftung ---------- */
    var ROLE = {
        C0:   { st: 0, lab: 'Position 0' },
        CONN: { st: 1, lab: 'Konnektor' },
        SUB:  { st: 1, lab: 'Konjunktion' },
        V:    { st: 2, lab: 'Verb' },
        S:    { st: 3, lab: 'Subjekt' },
        Sp:   { st: 3, lab: 'Subjekt' },
        Pa:   { st: 3, lab: 'Pron. Akk' },
        Pd:   { st: 3, lab: 'Pron. Dat' },
        Pr:   { st: 3, lab: 'sich' },
        SA:   { st: 3, lab: 'Satzadverb' },
        T:    { st: 4, lab: 'Te' },
        K:    { st: 4, lab: 'Ka' },
        Nd:   { st: 5, lab: 'Dativ' },
        Na:   { st: 5, lab: 'Akkusativ' },
        Np:   { st: 5, lab: 'Präp.-Objekt' },
        M:    { st: 6, lab: 'Mo' },
        L:    { st: 6, lab: 'Lo' },
        Dir:  { st: 6, lab: 'Lo (Ziel)' },
        Pred: { st: 6, lab: 'Prädikativ' },
        neg:  { st: 6, lab: 'nicht' },
        W:    { st: 7, lab: 'Verb-Rest' },
        VC:   { st: 7, lab: 'Verb-Ende' },
        NS:   { st: 1, lab: 'Nebensatz' },
        NSn:  { st: 8, lab: 'Nachfeld' }
    };
    var STATION = {
        1: { n: 'Vorfeld',        ru: 'первое место: ровно ОДИН член' },
        2: { n: 'Verb',           ru: 'изменяемый глагол — второй' },
        3: { n: 'kurz & bekannt', ru: 'подлежащее, местоимения, leider' },
        4: { n: 'Te · Ka',        ru: 'когда? почему?' },
        5: { n: 'Dativ → Akkusativ', ru: 'существительные-дополнения' },
        6: { n: 'Mo · Lo + nicht', ru: 'как? куда? — ближе к глаголу' },
        7: { n: 'Endstation',     ru: 'вторая часть глагола' },
        8: { n: 'Nachfeld',       ru: 'придаточное / группа с zu в конце' }
    };
    var RU = { T: 'Te — когда', K: 'Ka — почему', M: 'Mo — как', L: 'Lo — где', Dir: 'Lo — куда', Pred: 'Prädikativ', Np: 'Präp.-Objekt',
               Nd: 'Dativ', Na: 'Akkusativ', S: 'подлежащее', Sp: 'подлежащее', SA: 'отношение говорящего', neg: 'nicht', Pa: 'Pron. Akk', Pd: 'Pron. Dat', Pr: 'sich' };

    var PRON = ['Sp', 'Pa', 'Pd', 'Pr'];

    /* ---------- Hilfsfunktionen ---------- */
    function q(c, id) { return '«' + c.task.by[id].t + '»'; }
    function qs(c, ids) { return ids.map(function (i) { return q(c, i); }).join(' '); }
    function chlen(n) { var m = n % 10, h = n % 100; return n === 1 ? 'член' : ((m >= 2 && m <= 4 && !(h >= 12 && h <= 14)) ? 'члена' : 'членов'); }
    function qj(c, ids) { return '«' + ids.map(function (i) { return c.task.by[i].t; }).join(' ') + '»'; }
    function role(c, id) { return c.task.by[id].r; }
    function idsOf(c, roles) { return c.mf.filter(function (id) { return roles.indexOf(role(c, id)) > -1; }); }
    function isTail(c, id) { var ch = c.task.by[id]; return ch.r === 'Dir' || ch.r === 'Pred' || ch.r === 'Np' || ch.nt === true; }
    function lab(c, id) { var r = role(c, id); return RU[r] || ROLE[r].lab; }

    /* ---------- Kontext aus einer Reihenfolge ---------- */
    function ctxOf(task, order) {
        var c = { task: task, order: order, pos: {}, c0: null, vf: [], v: null, sub: null, after: [], mf: [], cl: [], nach: [] };
        order.forEach(function (id, i) { c.pos[id] = i; });
        var type = task.type || 'main', i0 = 0;
        if (order.length && task.by[order[0]].r === 'C0') { c.c0 = order[0]; i0 = 1; }
        if (type === 'main') {
            order.forEach(function (id) { if (task.by[id].r === 'V') { c.v = id; } });
            c.vf = order.slice(i0, c.pos[c.v]);
            c.after = order.slice(c.pos[c.v] + 1);
        } else if (type === 'sub') {
            c.sub = order[0];
            c.after = order.slice(1);
        } else {
            c.after = order.slice(i0);
        }
        c.after.forEach(function (id) {
            var r = task.by[id].r;
            if (r === 'W' || r === 'VC') { c.cl.push(id); }
            else if (r === 'NSn' || r === 'NS') { c.nach.push(id); }
            else { c.mf.push(id); }
        });
        return c;
    }

    /* ---------- Regeln (Reihenfolge = Priorität der Rückmeldung) ---------- */
    var RULES = [];
    function rule(o) { RULES.push(o); }

    /* V2 — Verb an Position 2 (Hauptsatz) */
    rule({ id: 'V2', sev: 'hard',
        test: function (c) { if (c.task.type !== 'main') { return []; } return c.vf.length === 1 ? [] : [{ ids: c.vf.concat([c.v]) }]; },
        bad: function (c, v) {
            var n = c.vf.length;
            if (n === 0) { return 'Перед глаголом ' + q(c, c.v) + ' нужен ровно ОДИН член предложения (Vorfeld) — сейчас перед ним пусто. В повествовательном предложении глагол второй, а не первый (первым он бывает в вопросе без вопросительного слова и в приказе).'; }
            return 'Перед глаголом ' + q(c, c.v) + ' стоят ' + n + ' ' + chlen(n) + ': ' + qs(c, c.vf) + '. В немецком повествовательном предложении перед изменяемым глаголом — ровно ОДИН член (Vorfeld); всё остальное идёт ПОСЛЕ глагола.';
        },
        ok: function (c) {
            if (c.task.type !== 'main') { return null; }
            var f = c.vf[0], r = role(c, f), pre = '';
            if (c.c0) { pre = q(c, c.c0) + ' — союз «позиции 0»: порядок слов после него не меняется. '; }
            if (r === 'CONN') { return 'Глагол ' + q(c, c.v) + ' — второй: ' + q(c, f) + ' занимает 1-е место (в отличие от und/aber/denn), поэтому глагол сразу за ним, а подлежащее уходит ПОСЛЕ глагола.'; }
            if (r === 'NS') { return 'Целое придаточное ' + q(c, f) + ' — это ОДИН член (Vorfeld), поэтому главный глагол ' + q(c, c.v) + ' стоит сразу за запятой.'; }
            if (r === 'Sp' || r === 'S') { return pre + 'Глагол ' + q(c, c.v) + ' — на 2-м месте: перед ним один член — подлежащее ' + q(c, f) + '.'; }
            return pre + 'Глагол ' + q(c, c.v) + ' — на 2-м месте: перед ним один член — ' + q(c, f) + '. Подлежащее при этом уходит после глагола (инверсия).';
        } });

    /* Vorfeld: nicht und das Nachfeld-Glied gehören nicht nach vorn; Verb-Rest vorn = möglich, aber markiert */
    rule({ id: 'VF_BAD', sev: 'hard',
        test: function (c) { return c.vf.filter(function (id) { var r = role(c, id); return r === 'neg' || r === 'NSn'; }).map(function (id) { return { ids: [id] }; }); },
        bad: function (c, v) {
            if (role(c, v.ids[0]) === 'neg') { return '«nicht» в начале предложения — только как противопоставление («Nicht ich, sondern er …»). Здесь отрицается всё предложение, поэтому nicht идёт ближе к концу.'; }
            return q(c, v.ids[0]) + ' — придаточное, которое в этом упражнении ставим в САМЫЙ КОНЕЦ (Nachfeld), а не на 1-е место.';
        },
        ok: function () { return null; } });
    rule({ id: 'VF_VERB', sev: 'soft',
        test: function (c) { return c.vf.filter(function (id) { var r = role(c, id); return r === 'W' || r === 'VC'; }).map(function (id) { return { ids: [id] }; }); },
        bad: function (c, v) { return 'Начать с глагольной части можно («Bearbeiten mussten wir die Bestellungen …»), но это особый приём: так выделяют само действие. В нейтральном предложении на 1-м месте — подлежащее, обстоятельство или дополнение.'; },
        ok: function () { return null; } });
    rule({ id: 'VF_PRON', sev: 'soft',
        test: function (c) { return c.vf.filter(function (id) { var r = role(c, id); return r === 'Pa' || r === 'Pd' || r === 'Pr'; }).map(function (id) { return { ids: [id] }; }); },
        bad: function (c, v) { return 'Безударное местоимение ' + q(c, v.ids[0]) + ' на 1-м месте — редкость (нужно сильное ударение). Обычно местоимения жмутся к глаголу и стоят сразу за ним.'; },
        ok: function () { return null; } });

    /* Klammer — Verb-Rest ganz am Ende (Hauptsatz / Infinitivgruppe) */
    rule({ id: 'KLAMMER', sev: 'hard',
        test: function (c) {
            if (c.task.type === 'sub' || !c.cl.length) { return []; }
            var firstW = Math.min.apply(null, c.cl.map(function (i) { return c.pos[i]; }));
            var bad = c.mf.filter(function (id) { return c.pos[id] > firstW; });
            return bad.length ? [{ ids: c.cl.concat(bad) }] : [];
        },
        bad: function (c) {
            var w = c.cl.filter(function (id) { return true; });
            var first = Math.min.apply(null, w.map(function (i) { return c.pos[i]; }));
            var x = c.mf.filter(function (id) { return c.pos[id] > first; });
            return 'Вторая часть глагола ' + qj(c, w) + ' стоит в САМОМ КОНЦЕ — после всех членов (' + qs(c, x) + ' нужно поставить раньше). Это «рамка» (Satzklammer): изменяемый глагол слева, остальное справа.';
        },
        ok: function (c) {
            if (c.task.type === 'sub' || !c.cl.length) { return null; }
            if (c.task.type === 'inf') { return 'Глагол ' + qj(c, c.cl) + ' — в самом конце группы: «zu + инфинитив» замыкает её.'; }
            return 'Вторая часть глагола ' + qj(c, c.cl) + ' — в самом конце: ' + q(c, c.v) + ' … ' + qj(c, c.cl) + ' держат предложение как скобки (Satzklammer).';
        } });

    /* Nebensatz: alle Verben ans Ende */
    rule({ id: 'SUB_END', sev: 'hard',
        test: function (c) {
            if (c.task.type !== 'sub' || !c.cl.length) { return []; }
            var first = Math.min.apply(null, c.cl.map(function (i) { return c.pos[i]; }));
            var bad = c.mf.filter(function (id) { return c.pos[id] > first; });
            return bad.length ? [{ ids: c.cl.concat(bad) }] : [];
        },
        bad: function (c) {
            var first = Math.min.apply(null, c.cl.map(function (i) { return c.pos[i]; }));
            var x = c.mf.filter(function (id) { return c.pos[id] > first; });
            return 'В придаточном ВСЕ глаголы уходят в самый конец: ' + qs(c, x) + ' должно стоять раньше. После союза идут подлежащее и остальные члены, а глаголы — последними.';
        },
        ok: function (c) {
            if (c.task.type !== 'sub') { return null; }
            return 'В придаточном все глаголы — в самом конце: ' + qj(c, c.cl) + '. Сразу после ' + q(c, c.sub) + ' идёт подлежащее, а не глагол.';
        } });

    /* Reihenfolge innerhalb des Verb-Endes */
    rule({ id: 'CLUSTER', sev: 'hard',
        test: function (c) {
            if (c.cl.length < 2) { return []; }
            var canon = c.task.cluster, got = c.cl.slice().sort(function (a, b) { return c.pos[a] - c.pos[b]; });
            var ok = got.every(function (id, i) { return id === canon[i]; });
            return ok ? [] : [{ ids: got }];
        },
        bad: function (c) {
            return 'Порядок глаголов в конце другой: нужно «' + c.task.cluster.map(function (i) { return c.task.by[i].t; }).join(' ') + '».' + (c.task.clusterNote ? ' ' + c.task.clusterNote : '');
        },
        ok: function (c) {
            if (c.cl.length < 2) { return null; }
            return 'Порядок глаголов в конце: «' + c.task.cluster.map(function (i) { return c.task.by[i].t; }).join(' ') + '».' + (c.task.clusterNote ? ' ' + c.task.clusterNote : '');
        } });

    /* Nebensatz im Satz: Vorfeld oder ganz am Ende */
    rule({ id: 'NS_PLACE', sev: 'hard',
        test: function (c) {
            var out = [], rest = c.mf.concat(c.cl);
            c.nach.forEach(function (n) {
                var after = rest.filter(function (x) { return c.pos[x] > c.pos[n]; });
                if (after.length) { out.push({ ids: [n].concat(after), ex: role(c, n) === 'NS' }); }
            });
            c.vf.forEach(function (id) { if (role(c, id) === 'NSn') { out.push({ ids: [id] }); } });
            return out;
        },
        bad: function (c, v) {
            var n = v.ids[0], x = v.ids.slice(1);
            if (role(c, n) === 'NSn') { return q(c, n) + ' — придаточное «выносится» в САМЫЙ КОНЕЦ: после глагольной части главного предложения' + (c.cl.length ? ' (' + qj(c, c.cl) + ')' : '') + ', с запятой перед ним.'; }
            return 'Придаточное ' + q(c, n) + ' можно вставить и в середину главного предложения (в письменной речи так пишут), но здесь мы тренируем два нейтральных места: в самом НАЧАЛЕ (тогда глагол сразу за запятой) или в самом КОНЦЕ, после глагола-рамки.';
        },
        ok: function (c) { if (!c.nach.length) { return null; } return 'Придаточное / группа ' + qs(c, c.nach) + ' — в самом конце (Nachfeld), после глагола-рамки; перед ним ставится запятая.'; } });

    /* Subjekt-Pronomen direkt hinter dem Verb */
    rule({ id: 'SP_FIRST', sev: 'hard',
        test: function (c) {
            var out = [];
            idsOf(c, ['Sp']).forEach(function (sp) {
                var before = c.mf.filter(function (o) { return o !== sp && c.pos[o] < c.pos[sp]; });
                if (before.length) { out.push({ ids: [sp].concat(before) }); }
            });
            return out;
        },
        bad: function (c, v) { return 'Подлежащее-местоимение ' + q(c, v.ids[0]) + ' идёт сразу за ' + (c.task.type === 'main' ? 'глаголом' : 'союзом') + ', до всего остального — а у тебя перед ним стоит ' + qs(c, v.ids.slice(1)) + '.'; },
        ok: function (c) {
            var sp = idsOf(c, ['Sp']);
            if (!sp.length) { return null; }
            return 'Подлежащее ' + q(c, sp[0]) + ' — сразу за ' + (c.task.type === 'main' ? 'глаголом ' + q(c, c.v) : 'союзом ' + q(c, c.sub)) + ' и перед всем остальным.';
        } });

    /* Pronomen: Akk vor Dat */
    rule({ id: 'PRON_AD', sev: 'hard',
        test: function (c) {
            var a = idsOf(c, ['Pa']), d = idsOf(c, ['Pd']), out = [];
            a.forEach(function (x) { d.forEach(function (y) { if (c.pos[y] < c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) { return 'Два местоимения: сначала Akk, потом Dat — «' + c.task.by[v.ids[0]].t + ' ' + c.task.by[v.ids[1]].t + '». В русском порядок обратный («ему это»), поэтому рука и тянется не туда.'; },
        ok: function (c) {
            var a = idsOf(c, ['Pa']), d = idsOf(c, ['Pd']);
            if (!a.length || !d.length) { return null; }
            return 'Два местоимения: ' + q(c, a[0]) + ' (Akk) → ' + q(c, d[0]) + ' (Dat). Сначала Akk, потом Dat — в русском наоборот («ему это»).';
        } });

    /* Pronomen vor Nomen (Objekte) */
    rule({ id: 'PRON_NOUN', sev: 'hard',
        test: function (c) {
            var out = [], p = idsOf(c, PRON), n = idsOf(c, ['Nd', 'Na', 'Np']);
            n.forEach(function (y) {
                var late = p.filter(function (x) { return c.pos[y] < c.pos[x]; });
                if (late.length) { out.push({ ids: [y].concat(late) }); }
            });
            return out;
        },
        bad: function (c, v) { return 'Местоимение ' + qs(c, v.ids.slice(1)) + ' должно идти раньше существительного ' + q(c, v.ids[0]) + ': короткое и «известное» слово встаёт перед длинным и новым.'; },
        ok: function (c) {
            var p = idsOf(c, ['Pa', 'Pd']), n = idsOf(c, ['Nd', 'Na']);
            if (!p.length || !n.length) { return null; }
            return 'Местоимение ' + q(c, p[0]) + ' стоит раньше существительного ' + q(c, n[0]) + ': короткое и известное — первым, длинное и новое — позже.';
        } });

    /* Pronomen vor Adverbien / nicht */
    var ADV = ['SA', 'T', 'K', 'M', 'L', 'Dir', 'Pred', 'neg'];
    rule({ id: 'PRON_ADV', sev: 'hard',
        test: function (c) {
            var out = [], p = idsOf(c, PRON);
            idsOf(c, ADV).forEach(function (y) {
                var late = p.filter(function (x) { return c.pos[y] < c.pos[x]; });
                if (late.length) { out.push({ ids: [y].concat(late) }); }
            });
            return out;
        },
        bad: function (c, v) { return 'Безударное местоимение ' + qs(c, v.ids.slice(1)) + ' должно стоять раньше ' + q(c, v.ids[0]) + ' (' + lab(c, v.ids[0]) + '): местоимения жмутся к глаголу, а обстоятельства и nicht идут после них.'; },
        ok: function (c) {
            var p = idsOf(c, PRON), o = idsOf(c, ['Pa', 'Pd', 'Pr']);
            if (!o.length || !idsOf(c, ADV).length) { return null; }
            return 'Местоимения (' + qs(c, p) + ') — в самом начале «среднего поля»: сразу за ' + (c.task.type === 'main' ? 'глаголом' : 'союзом') + ', до обстоятельств и nicht. Они короткие и уже известны.';
        } });

    /* nicht */
    function negTail(c, id) { var ch = c.task.by[id]; return ch.r === 'Dir' || ch.r === 'Pred' || ch.r === 'Np' || ch.r === 'M' || ch.nt === true; }
    function tailChips(c) { return c.mf.filter(function (id) { return negTail(c, id); }); }
    rule({ id: 'NEG', sev: 'hard',
        test: function (c) {
            var ng = idsOf(c, ['neg'])[0], out = [];
            if (!ng) { return out; }
            c.cl.forEach(function (w) { if (c.pos[w] < c.pos[ng]) { out.push({ ids: [ng, w], kind: 'W' }); } });
            c.mf.forEach(function (x) {
                if (x === ng || role(c, x) === 'L') { return; }
                if (negTail(c, x) && c.pos[x] < c.pos[ng]) { out.push({ ids: [ng, x], kind: 'LATE' }); }
                if (!negTail(c, x) && c.pos[x] > c.pos[ng]) { out.push({ ids: [ng, x], kind: 'EARLY' }); }
            });
            return out;
        },
        bad: function (c, v) {
            var x = v.ids[1];
            if (v.kind === 'W') { return '«nicht» стоит ПЕРЕД глагольной частью ' + q(c, x) + ', а не после неё.'; }
            if (v.kind === 'LATE') { return '«nicht» поставлено слишком поздно: ' + q(c, x) + ' (' + lab(c, x) + ') входит в «хвост» сказуемого, и nicht ставится ПЕРЕД ним (nicht nach Hause, nicht gut, nicht schnell).'; }
            if (role(c, x) === 'SA') { return 'Оценка говорящего ' + q(c, x) + ' идёт ДО отрицания: «' + c.task.by[x].t + ' nicht», а не «nicht ' + c.task.by[x].t + '».'; }
            return '«nicht» поставлено слишком рано: ' + q(c, x) + ' (' + lab(c, x) + ') должно стоять ДО него. Мы отрицаем всё предложение — тогда nicht уходит как можно дальше вправо, к глагольной части.';
        },
        ok: function (c) {
            var ng = idsOf(c, ['neg'])[0];
            if (!ng) { return null; }
            var tl = tailChips(c).filter(function (i) { return c.pos[i] > c.pos[ng]; });
            if (tl.length) { return '«nicht» стоит ПЕРЕД ' + q(c, tl[0]) + ' (' + lab(c, tl[0]) + '): этот член входит в «хвост» сказуемого, а при отрицании всего предложения nicht ставится перед «хвостом».'; }
            if (c.cl.length) { return '«nicht» — как можно дальше вправо, прямо перед глагольной частью ' + qj(c, c.cl) + ': отрицается всё предложение.'; }
            return '«nicht» — в самом конце, после всех членов: отрицается всё предложение.';
        } });

    /* Verbnahe Glieder (Ziel, Prädikativ, Präp.-Objekt) ganz rechts */
    rule({ id: 'TAIL', sev: 'hard',
        test: function (c) {
            var out = [], d = c.mf.filter(function (id) { var r = role(c, id); return r === 'Dir' || r === 'Pred' || r === 'Np'; });
            d.forEach(function (x) { idsOf(c, ['S', 'Sp', 'Pa', 'Pd', 'Pr', 'SA', 'Nd', 'Na']).forEach(function (y) { if (c.pos[y] > c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) { return q(c, v.ids[0]) + ' (' + lab(c, v.ids[0]) + ') тесно связано с глаголом — оно идёт в САМЫЙ КОНЕЦ, вплотную к глагольной части; ' + q(c, v.ids[1]) + ' нужно поставить раньше.'; },
        ok: function (c) {
            var d = c.mf.filter(function (id) { var r = role(c, id); return r === 'Dir' || r === 'Pred' || r === 'Np'; });
            if (!d.length) { return null; }
            return q(c, d[0]) + ' (' + lab(c, d[0]) + ') — вплотную к глагольной части: оно тесно связано с глаголом, поэтому стоит правее всех.';
        } });

    /* Te/Ka (gleichrangig) → Mo → Lo: eine Abweichung = markiert (weich), mehr = zu weit weg vom neutralen Satz (hart) */
    function rank(c, id) { var r = role(c, id); if (r === 'T' || r === 'K') { return 0; } if (r === 'M') { return 1; } if (r === 'L' || r === 'Dir' || r === 'Pred' || r === 'Np') { return 2; } return -1; }
    function inversions(c) {
        var out = [], xs = c.mf.filter(function (id) { return rank(c, id) > -1; });
        xs.forEach(function (a) { xs.forEach(function (b) { if (rank(c, a) < rank(c, b) && c.pos[b] < c.pos[a]) { out.push([a, b]); } }); });
        return out;
    }
    function boundLate(c, inv) { // Te/Ka stehen NACH einem verbnahen Glied (Ziel, Prädikativ, Präp.-Objekt)
        var r = role(c, inv[0]), b = role(c, inv[1]);
        return (r === 'T' || r === 'K') && (b === 'Dir' || b === 'Pred' || b === 'Np');
    }
    function canonTkml(c) { return c.task.canon.filter(function (id) { return c.task.by[id].r !== 'C0' && rank(c, id) > -1 && !c.task.by[id].locked; }).map(function (id) { return c.task.by[id].t; }); }
    rule({ id: 'TEKAMOLO_FAR', sev: 'hard',
        test: function (c) {
            var inv = inversions(c);
            if (inv.length >= 2) { return [{ ids: inv.reduce(function (a, p) { return a.concat(p); }, []), far: true }]; }
            if (inv.length === 1 && boundLate(c, inv[0])) { return [{ ids: inv[0], late: true }]; }
            return [];
        },
        bad: function (c, v) {
            if (v.late) { return q(c, v.ids[0]) + ' (' + lab(c, v.ids[0]) + ') после ' + q(c, v.ids[1]) + ' звучит неестественно: «куда» тесно связано с глаголом и стоит последним перед глагольной частью, а время и причину ставят раньше.'; }
            return 'Порядок обстоятельств слишком далёк от нейтрального: Te и Ka (когда, почему) → Mo (как) → Lo (где, куда). Нейтральный порядок здесь: «' + canonTkml(c).join(' → ') + '».';
        },
        ok: function () { return null; } });
    rule({ id: 'TEKAMOLO', sev: 'soft',
        test: function (c) {
            var inv = inversions(c);
            return (inv.length === 1 && !boundLate(c, inv[0])) ? [{ ids: inv[0] }] : [];
        },
        bad: function (c, v) { return 'Нейтральный порядок обстоятельств — Te и Ka → Mo → Lo: ' + q(c, v.ids[0]) + ' (' + lab(c, v.ids[0]) + ') обычно раньше ' + q(c, v.ids[1]) + ' (' + lab(c, v.ids[1]) + '). Твой вариант встречается, но это акцент на «' + c.task.by[v.ids[1]].t + '».'; },
        ok: function (c) {
            var xs = c.mf.filter(function (id) { return rank(c, id) > -1; });
            if (xs.length < 2) { return null; }
            var both = xs.some(function (i) { return role(c, i) === 'T'; }) && xs.some(function (i) { return role(c, i) === 'K'; });
            return 'Обстоятельства идут от «рамки ситуации» к самому действию: ' + xs.map(function (i) { return q(c, i) + ' (' + lab(c, i) + ')'; }).join(' → ') + '.' + (both ? ' Te и Ka можно менять местами.' : '') + ' Чем ближе слово по смыслу к действию, тем правее.';
        } });

    /* Dativ vor Akkusativ (zwei Nomen): bestimmtes Akk darf nach hinten (weich), unbestimmtes nicht (hart) */
    function datAkk(c) {
        var d = idsOf(c, ['Nd']), a = idsOf(c, ['Na']), out = [];
        d.forEach(function (x) { a.forEach(function (y) { if (c.pos[y] < c.pos[x]) { out.push({ ids: [x, y] }); } }); });
        return out;
    }
    rule({ id: 'DAT_AKK_HARD', sev: 'hard',
        test: function (c) { return datAkk(c).filter(function (v) { return c.task.by[v.ids[1]].ind; }); },
        bad: function (c, v) { return 'Два существительных: сначала Dativ («кому»), потом Akkusativ («что»): ' + q(c, v.ids[0]) + ' перед ' + q(c, v.ids[1]) + '. Неопределённое дополнение (einen/ein/-) почти никогда не стоит раньше Dativ: неопределённое = новое, а новое идёт ближе к концу.'; },
        ok: function () { return null; } });
    rule({ id: 'DAT_AKK', sev: 'soft',
        test: function (c) { return datAkk(c).filter(function (v) { return !c.task.by[v.ids[1]].ind; }); },
        bad: function (c, v) { return 'С двумя существительными нейтральный порядок — Dativ → Akkusativ: ' + q(c, v.ids[0]) + ' перед ' + q(c, v.ids[1]) + '. Обратный порядок возможен, если Dativ — новая, самая важная информация (её ставят в конец).'; },
        ok: function (c) {
            var d = idsOf(c, ['Nd']), a = idsOf(c, ['Na']);
            if (!d.length || !a.length) { return null; }
            return 'Два существительных: ' + q(c, d[0]) + ' (Dativ) → ' + q(c, a[0]) + ' (Akkusativ). Нейтральный порядок: сначала «кому», потом «что».';
        } });

    /* weich: Te/Ka nach einem NEUEN (unbestimmten) Nomen-Objekt */
    rule({ id: 'TK_AFTER_NEW', sev: 'soft',
        test: function (c) {
            var out = [], n = idsOf(c, ['Nd', 'Na']).filter(function (i) { return c.task.by[i].ind; }), a = idsOf(c, ['T', 'K']);
            n.forEach(function (x) { a.forEach(function (y) { if (c.pos[y] > c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) { return q(c, v.ids[1]) + ' (' + lab(c, v.ids[1]) + ') обычно стоит ДО нового (неопределённого) дополнения ' + q(c, v.ids[0]) + ': новое идёт в самый конец среднего поля, на нём ударение.'; },
        ok: function () { return null; } });

    /* weich: Pronomen vor Nomen-Subjekt, Subjekt vor Rest */
    rule({ id: 'PRON_S', sev: 'soft',
        test: function (c) {
            var out = [], p = idsOf(c, ['Pa', 'Pd', 'Pr']), s = idsOf(c, ['S']);
            p.forEach(function (x) { s.forEach(function (y) { if (c.pos[y] < c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) { return 'Местоимение ' + q(c, v.ids[0]) + ' обычно стоит РАНЬШЕ подлежащего-существительного ' + q(c, v.ids[1]) + ' («hat mir der Chef …»). Обратный порядок возможен, но звучит чуть иначе.'; },
        ok: function (c) {
            var p = idsOf(c, ['Pa', 'Pd', 'Pr']), s = idsOf(c, ['S']);
            if (!p.length || !s.length) { return null; }
            return 'Местоимение ' + q(c, p[0]) + ' стоит раньше подлежащего-существительного ' + q(c, s[0]) + ': известное слово идёт раньше нового, и подлежащее-существительное здесь не исключение.';
        } });
    rule({ id: 'S_OBJ', sev: 'soft',
        test: function (c) {
            var out = [], s = idsOf(c, ['S']), r = idsOf(c, ['Nd', 'Na']);
            s.forEach(function (x) { r.forEach(function (y) { if (c.pos[y] < c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) {
            return 'Нейтральный порядок — подлежащее ' + q(c, v.ids[0]) + ' («кто») раньше дополнения ' + q(c, v.ids[1]) + ' («кого/что»). Обратный порядок возможен, когда дополнение уже известно, а новость — именно подлежащее (так отвечают на вопрос «Кто…?»). Русский порядок свободный, поэтому рука часто ставит дополнение вперёд.';
        },
        ok: function () { return null; } });
    rule({ id: 'S_MANNER', sev: 'hard',
        test: function (c) {
            var out = [], s = idsOf(c, ['S']), m = idsOf(c, ['M']);
            s.forEach(function (x) { m.forEach(function (y) { if (c.pos[y] < c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) { return 'Подлежащее ' + q(c, v.ids[0]) + ' стоит раньше способа действия ' + q(c, v.ids[1]) + ': способ («как?») ближе к глаголу, поэтому идёт после подлежащего.'; },
        ok: function () { return null; } });
    rule({ id: 'S_FIRST_SUB', sev: 'soft',
        test: function (c) {
            if (c.task.type !== 'sub') { return []; }
            var out = [], s = idsOf(c, ['S']), r = idsOf(c, ['T', 'K', 'L']);
            s.forEach(function (x) { r.forEach(function (y) { if (c.pos[y] < c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) { return 'В придаточном подлежащее ' + q(c, v.ids[0]) + ' обычно стоит сразу после союза, до обстоятельств (' + q(c, v.ids[1]) + '). Твой вариант возможен, но это акцент.'; },
        ok: function () { return null; } });
    rule({ id: 'OBJ_MO', sev: 'soft',
        test: function (c) {
            var out = [], o = idsOf(c, ['Nd', 'Na']), m = idsOf(c, ['M']);
            o.forEach(function (x) { m.forEach(function (y) { if (c.pos[y] < c.pos[x]) { out.push({ ids: [x, y] }); } }); });
            return out;
        },
        bad: function (c, v) { return 'Способ действия ' + q(c, v.ids[1]) + ' (Mo) обычно стоит ПОСЛЕ существительного-дополнения ' + q(c, v.ids[0]) + ': Mo ближе к глаголу.'; },
        ok: function () { return null; } });

    /* ---------- Aufgaben vorbereiten ---------- */
    function prepare(task) {
        var all = [];
        function opt(a, k) { return typeof a[2] === 'string' && a[2].split(',').indexOf(k) > -1; }
        (task.lock || []).forEach(function (a) { all.push({ t: a[0], r: a[1], locked: true, nt: opt(a, 'nt'), def: opt(a, 'def'), ind: opt(a, 'ind') }); });
        task.chips.forEach(function (a) { all.push({ t: a[0], r: a[1], locked: false, nt: opt(a, 'nt'), def: opt(a, 'def'), ind: opt(a, 'ind') }); });
        task.by = {}; task.all = all; task.canon = [];
        all.forEach(function (ch, i) { ch.id = 'c' + i; task.by[ch.id] = ch; task.canon.push(ch.id); });
        task.cluster = all.filter(function (ch) { return ch.r === 'W' || ch.r === 'VC'; }).map(function (ch) { return ch.id; });
        task.type = task.type || 'main';
        task.end = task.end || '.';
        return task;
    }

    /* ---------- Satz als Text (Kommas, Großschreibung) ---------- */
    function sentence(task, order) {
        var parts = [];
        order.forEach(function (id, i) {
            var ch = task.by[id], t = ch.t;
            if (ch.r === 'NS') { t = (i === 0 || (i === 1 && task.by[order[0]].r === 'C0')) ? t + ',' : ',' + '\u0001' + t; }
            if (ch.r === 'NSn') { t = ',' + '\u0001' + t; }
            parts.push(t);
        });
        var s = parts.join(' ').replace(/ ,\u0001/g, ', ').replace(/,\u0001/g, ', ');
        if (!task.pre) { s = s.charAt(0).toUpperCase() + s.slice(1); }
        return (task.pre ? task.pre + ' ' : '') + s + task.end;
    }

    var FARNAME = { TEKAMOLO: 'порядок обстоятельств (Te, Ka → Mo → Lo)', DAT_AKK: 'Akkusativ раньше Dativ', PRON_S: 'подлежащее-существительное раньше местоимения', S_OBJ: 'дополнение или способ раньше подлежащего',
                    S_FIRST_SUB: 'обстоятельство раньше подлежащего в придаточном', OBJ_MO: 'способ действия раньше дополнения', VF_PRON: 'местоимение на 1-м месте', VF_VERB: 'глагольная часть на 1-м месте',
                    TK_AFTER_NEW: 'время или причина после нового дополнения' };

    /* ---------- Prüfung ---------- */
    function evaluate(task, order) {
        var c = ctxOf(task, order), hard = [], soft = [];
        RULES.forEach(function (r) {
            r.test(c).forEach(function (v) {
                var item = { rule: r.id, ids: v.ids, msg: r.bad(c, v), kind: v.kind, exercise: !!v.ex };
                if (r.sev === 'hard') { hard.push(item); } else { soft.push(item); }
            });
        });
        // Folgefehler: steht das Verb-Ende falsch, ist "nicht nach dem Verb" nur dieselbe Ursache
        if (hard.some(function (h) { return h.rule === 'KLAMMER' || h.rule === 'SUB_END'; })) {
            hard = hard.filter(function (h) { return !(h.rule === 'NEG' && h.kind === 'W'); });
        }
        var seen = {};
        hard = hard.filter(function (h) { if (seen[h.msg]) { return false; } seen[h.msg] = true; return true; });
        if (!hard.length && soft.length >= 2) {
            var names = soft.map(function (s) { return FARNAME[s.rule] || 'отступление от нейтрального порядка'; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
            hard.push({ rule: 'FAR', ids: [], msg: 'Сразу несколько отступлений от нейтрального порядка: ' + names.join('; ') + '. По отдельности такое встречается, но все вместе звучит неестественно. Верни нейтральный порядок.' });
        }
        return { status: hard.length ? 'bad' : (soft.length ? 'marked' : 'ok'), hard: hard, soft: soft, ctx: c };
    }

    /* Begründungen für die neutrale Lösung */
    function explain(task) {
        var c = ctxOf(task, task.canon), out = [];
        RULES.forEach(function (r) { if (r.sev === 'hard' || r.id === 'TEKAMOLO' || r.id === 'DAT_AKK' || r.id === 'PRON_S') { var t = r.ok(c); if (t) { out.push({ rule: r.id, text: t }); } } });
        return out;
    }

    /* Haltestelle jedes Bausteins in einer Reihenfolge */
    function stations(task, order) {
        var c = ctxOf(task, order), st = {};
        order.forEach(function (id) {
            var r = task.by[id].r, s = ROLE[r].st;
            if (c.vf.indexOf(id) > -1) { s = 1; }
            if (r === 'NS' && c.vf.indexOf(id) === -1) { s = 8; }
            st[id] = s;
        });
        return st;
    }

    /* ---------- Aufgaben ---------- */
    var LEVELS = [
        { n: 1, t: 'Старт: скелет и местоимения', s: 'глагол вторым · es → ihm · Rest-глагол в конец' },
        { n: 2, t: 'Mittelfeld: Te–Ka–Mo–Lo и дополнения', s: 'обстоятельства, существительные, nicht перед «хвостом»' },
        { n: 3, t: 'Первое место и связки', s: 'deshalb / aber / Придаточное в начале — куда уходит подлежащее' },
        { n: 4, t: 'Придаточные и цепочки глаголов', s: 'глаголы в конец · hat bezahlen können · gelöst werden muss' },
        { n: 5, t: 'Настоящие предложения B2', s: 'всё сразу: Vorfeld, местоимения, Te–Ka–Mo–Lo, nicht, Nachfeld' }
    ];

    var TASKS = [
        /* ===== Уровень 1 ===== */
        { id: '1-1', lvl: 1, ru: 'Я отправляю ей это сегодня.', lock: [['Ich', 'Sp']],
          chips: [['schicke', 'V'], ['es', 'Pa'], ['ihr', 'Pd'], ['heute', 'T']],
          hint: 'Глагол — сразу за «Ich». Потом местоимения: Akk (es) → Dat (ihr). Время — после них.' },
        { id: '1-2', lvl: 1, ru: 'Мы показали ему результаты.', lock: [['Wir', 'Sp']],
          chips: [['haben', 'V'], ['ihm', 'Pd'], ['die Ergebnisse', 'Na'], ['gezeigt', 'W']],
          hint: 'Местоимение (ihm) раньше существительного (die Ergebnisse). Gezeigt — в самый конец.' },
        { id: '1-3', lvl: 1, ru: 'Менеджер подарил её нашему клиенту. (её = сумка, die Tasche)', lock: [['Der Manager', 'S']],
          chips: [['hat', 'V'], ['sie', 'Pa'], ['unserem Kunden', 'Nd'], ['geschenkt', 'W']],
          hint: 'sie — местоимение, unserem Kunden — существительное: местоимение раньше.' },
        { id: '1-4', lvl: 1, ru: 'Вчера я им этого не объяснил.', lock: [['Gestern', 'T']],
          chips: [['habe', 'V'], ['ich', 'Sp'], ['es', 'Pa'], ['ihnen', 'Pd'], ['nicht', 'neg'], ['erklärt', 'W']],
          hint: 'После «Gestern» сразу глагол, потом ich. Дальше es → ihnen, потом nicht, в конце erklärt.' },
        { id: '1-5', lvl: 1, ru: 'Сегодня она принесла мне это.', lock: [['Heute', 'T']],
          chips: [['hat', 'V'], ['sie', 'Sp'], ['es', 'Pa'], ['mir', 'Pd'], ['gebracht', 'W']],
          hint: 'В русском «мне это», в немецком — es mir: Akk-местоимение раньше Dat.' },
        { id: '1-6', lvl: 1, ru: 'Я не могу тебе это объяснить.', lock: [['Ich', 'Sp']],
          chips: [['kann', 'V'], ['es', 'Pa'], ['dir', 'Pd'], ['nicht', 'neg'], ['erklären', 'W']],
          hint: 'Модальный глагол — второй, смысловой (erklären) — в конец. nicht — прямо перед ним.' },

        /* ===== Уровень 2 ===== */
        { id: '2-1', lvl: 2, ru: 'Завтра мы поедем на поезде в Берлин.', lock: [['Morgen', 'T']],
          chips: [['fahren', 'V'], ['wir', 'Sp'], ['mit dem Zug', 'M'], ['nach Berlin', 'Dir']],
          hint: 'После Morgen — глагол, потом wir. Дальше Mo (как) → Lo (куда).' },
        { id: '2-2', lvl: 2, ru: 'Сегодня из-за забастовки мы пошли в школу пешком.', lock: [['Wir', 'Sp']],
          chips: [['sind', 'V'], ['heute', 'T'], ['wegen des Streiks', 'K'], ['zu Fuß', 'M'], ['zur Schule', 'Dir'], ['gegangen', 'W']],
          hint: 'Te → Ka → Mo → Lo: когда, почему, как, куда. Gegangen — в конец.' },
        { id: '2-3', lvl: 2, ru: 'Она каждый день сосредоточенно занимается в библиотеке.', lock: [['Sie', 'Sp']],
          chips: [['lernt', 'V'], ['jeden Tag', 'T'], ['konzentriert', 'M'], ['in der Bibliothek', 'L']],
          hint: 'Когда → как → где.' },
        { id: '2-4', lvl: 2, ru: 'Лекция завтра из-за ремонта пройдёт в зале B.', lock: [['Die Vorlesung', 'S']],
          chips: [['findet', 'V'], ['morgen', 'T'], ['wegen der Renovierung', 'K'], ['im Raum B', 'L'], ['statt', 'W']],
          hint: 'Отделяемая приставка (statt) — в самый конец, как Partizip II.' },
        { id: '2-5', lvl: 2, ru: 'Я вчера положил документы на письменный стол.', lock: [['Ich', 'Sp']],
          chips: [['habe', 'V'], ['gestern', 'T'], ['die Unterlagen', 'Na'], ['auf den Schreibtisch', 'Dir'], ['gelegt', 'W']],
          hint: 'Куда (auf den Schreibtisch) связано с глаголом сильнее всего — оно стоит последним перед gelegt.' },
        { id: '2-6', lvl: 2, ru: 'Продавец вчера дал клиенту скидку.', lock: [['Der Verkäufer', 'S']],
          chips: [['hat', 'V'], ['gestern', 'T'], ['dem Kunden', 'Nd'], ['einen Rabatt', 'Na', 'ind'], ['gegeben', 'W']],
          hint: 'Два существительных: сначала «кому» (Dativ), потом «что» (Akkusativ).' },
        { id: '2-7', lvl: 2, ru: 'Сегодня мы, к сожалению, не можем решить эту проблему.', lock: [['Wir', 'Sp']],
          chips: [['können', 'V'], ['das Problem', 'Na'], ['heute', 'T'], ['leider', 'SA'], ['nicht', 'neg'], ['lösen', 'W']],
          hint: 'Отрицаем всё предложение: nicht — как можно дальше вправо, прямо перед lösen. leider — до nicht.' },
        { id: '2-8', lvl: 2, ru: 'Он вчера не пошёл домой.', lock: [['Er', 'Sp']],
          chips: [['ist', 'V'], ['gestern', 'T'], ['nicht', 'neg'], ['nach Hause', 'Dir'], ['gegangen', 'W']],
          hint: 'nach Hause — «глагольный» член (куда), nicht стоит ПЕРЕД ним.' },

        /* ===== Уровень 3 ===== */
        { id: '3-1', lvl: 3, ru: 'Поэтому мне сегодня нужно работать особенно тщательно.', lock: [['Deshalb', 'CONN']],
          chips: [['muss', 'V'], ['ich', 'Sp'], ['heute', 'T'], ['besonders sorgfältig', 'M'], ['arbeiten', 'W']],
          hint: 'Deshalb занимает первое место — значит, дальше глагол, а ich уходит после него.' },
        { id: '3-2', lvl: 3, ru: 'Тем не менее клиент не оплатил счёт.', lock: [['Trotzdem', 'CONN']],
          chips: [['hat', 'V'], ['der Kunde', 'S'], ['die Rechnung', 'Na'], ['nicht', 'neg'], ['bezahlt', 'W']],
          hint: 'Trotzdem — как deshalb: инверсия. nicht — после дополнения, перед bezahlt.' },
        { id: '3-3', lvl: 3, ru: 'Кроме того, за последний год ситуация заметно улучшилась.', lock: [['Außerdem', 'CONN']],
          chips: [['hat', 'V'], ['sich', 'Pr'], ['die Situation', 'S'], ['im letzten Jahr', 'T'], ['deutlich', 'M'], ['verbessert', 'W']],
          hint: 'sich — местоимение: оно раньше существительного-подлежащего (die Situation).' },
        { id: '3-4', lvl: 3, pre: 'Ich habe ihm geschrieben,', ru: '…, но он не ответил.', lock: [['aber', 'C0']],
          chips: [['er', 'Sp'], ['hat', 'V'], ['nicht', 'neg'], ['geantwortet', 'W']],
          hint: 'aber — союз «позиции 0»: после него порядок обычный, без инверсии. Первое место — er.' },
        { id: '3-5', lvl: 3, ru: 'Почему клиент не оплатил счёт?', end: '?', lock: [['Warum', 'K']],
          chips: [['hat', 'V'], ['der Kunde', 'S'], ['die Rechnung', 'Na'], ['nicht', 'neg'], ['bezahlt', 'W']],
          hint: 'Вопросительное слово — первый член, глагол сразу за ним.' },
        { id: '3-6', lvl: 3, ru: 'Поскольку система вышла из строя, нам пришлось обрабатывать заказы вручную.', free: true,
          chips: [['weil das System ausgefallen war', 'NS'], ['mussten', 'V'], ['wir', 'Sp'], ['die Bestellungen', 'Na'], ['per Hand', 'M'], ['bearbeiten', 'W']],
          hint: 'Придаточное можно поставить первым (тогда глагол сразу за запятой) или в самый конец. Выбери сам.' },
        { id: '3-7', lvl: 3, ru: 'И потом я ему позвонил.', lock: [['Und', 'C0'], ['dann', 'T']],
          chips: [['habe', 'V'], ['ich', 'Sp'], ['ihn', 'Pa'], ['angerufen', 'W']],
          hint: 'Und — позиция 0 (не считается), dann — первое место. Дальше глагол, потом ich.' },

        /* ===== Уровень 4 ===== */
        { id: '4-1', lvl: 4, type: 'sub', pre: 'Ich glaube,', ru: '…что он завтра летит в Гамбург.', lock: [['dass', 'SUB']],
          chips: [['er', 'Sp'], ['morgen', 'T'], ['nach Hamburg', 'Dir'], ['fliegt', 'VC']],
          hint: 'В придаточном глагол — в самом конце.' },
        { id: '4-2', lvl: 4, type: 'sub', pre: 'Der Techniker bleibt noch hier,', ru: '…потому что он не смог решить проблему.', lock: [['weil', 'SUB']],
          chips: [['er', 'Sp'], ['das Problem', 'Na'], ['nicht', 'neg'], ['lösen', 'VC'], ['konnte', 'VC']],
          hint: 'Оба глагола — в конец: сначала смысловой (lösen), последним — изменяемый (konnte).' },
        { id: '4-3', lvl: 4, type: 'sub', pre: 'Der Kunde hat sich beschwert,', ru: '…потому что он не смог забрать товар.', lock: [['weil', 'SUB']],
          chips: [['er', 'Sp'], ['die Ware', 'Na'], ['nicht', 'neg'], ['hat', 'VC'], ['abholen', 'VC'], ['können', 'VC']],
          clusterNote: 'Здесь «Ersatzinfinitiv»: после модального глагола в Perfekt два инфинитива, а hat встаёт ПЕРЕД ними.',
          hint: 'Perfekt + können в придаточном: hat идёт перед двумя инфинитивами (abholen können).' },
        { id: '4-4', lvl: 4, type: 'sub', pre: 'Der Chef sagt,', ru: '…что проблему нужно решить немедленно.', lock: [['dass', 'SUB']],
          chips: [['das Problem', 'S'], ['sofort', 'T'], ['gelöst', 'VC'], ['werden', 'VC'], ['muss', 'VC']],
          hint: 'Passiv + müssen: gelöst werden muss — изменяемый глагол последним.' },
        { id: '4-5', lvl: 4, type: 'sub', pre: 'Er hat die Frist verpasst,', ru: '…хотя мы напомнили ему ещё на прошлой неделе.', lock: [['obwohl', 'SUB']],
          chips: [['wir', 'Sp'], ['ihn', 'Pa'], ['schon letzte Woche', 'T'], ['erinnert', 'VC'], ['hatten', 'VC']],
          hint: 'Plusquamperfekt в придаточном: Partizip II (erinnert) и в самом конце hatten.' },
        { id: '4-6', lvl: 4, type: 'sub', pre: 'Das ist der Kunde,', ru: '…которому мы вчера отправили предложение.', lock: [['dem', 'SUB']],
          chips: [['wir', 'Sp'], ['gestern', 'T'], ['das Angebot', 'Na'], ['geschickt', 'VC'], ['haben', 'VC']],
          hint: 'Relativsatz — то же, что придаточное: dem (как союз), потом подлежащее, глаголы в конце.' },
        { id: '4-7', lvl: 4, type: 'sub', pre: 'Können Sie mir sagen,', end: '?', ru: '…когда поезд в Кёльн отправляется?', lock: [['wann', 'SUB']],
          chips: [['der Zug', 'S'], ['nach Köln', 'Dir'], ['abfährt', 'VC']],
          hint: 'Косвенный вопрос — без инверсии, глагол в конец (в придаточном abfahren не разделяется).' },
        { id: '4-8', lvl: 4, type: 'inf', pre: 'Wir haben beschlossen,', ru: '…не повышать цены в следующем году.',
          chips: [['die Preise', 'Na'], ['im nächsten Jahr', 'T'], ['nicht', 'neg'], ['zu erhöhen', 'W']],
          hint: 'В группе с zu: «zu erhöhen» — в конец, nicht — прямо перед ним.' },

        /* ===== Уровень 5 ===== */
        { id: '5-1', lvl: 5, ru: 'К сожалению, документы я смогу прислать тебе только завтра.', lock: [['Leider', 'SA']],
          chips: [['kann', 'V'], ['ich', 'Sp'], ['dir', 'Pd'], ['die Unterlagen', 'Na'], ['erst morgen', 'T'], ['schicken', 'W']],
          hint: 'После Leider — глагол; потом ich → dir (местоимения), затем существительное и время.' },
        { id: '5-2', lvl: 5, ru: 'После разговора начальник сразу предложил мне эту должность.', lock: [['Nach dem Gespräch', 'T']],
          chips: [['hat', 'V'], ['mir', 'Pd'], ['der Chef', 'S'], ['die Stelle', 'Na'], ['sofort', 'T'], ['angeboten', 'W']],
          hint: 'Местоимение mir — раньше подлежащего-существительного (der Chef).' },
        { id: '5-3', lvl: 5, ru: 'Хотя цены выросли, многие клиенты по-прежнему покупают у нас.', lock: [['obwohl die Preise gestiegen sind', 'NS']],
          chips: [['kaufen', 'V'], ['viele Kunden', 'S'], ['weiterhin', 'T'], ['bei uns', 'L']],
          hint: 'Целое придаточное в начале — один член: главный глагол сразу после запятой.' },
        { id: '5-4', lvl: 5, type: 'sub', pre: 'Ich würde mich freuen,', ru: '…если бы Вы прислали мне ответ до пятницы.', lock: [['wenn', 'SUB']],
          chips: [['Sie', 'Sp'], ['mir', 'Pd'], ['bis Freitag', 'T'], ['eine Antwort', 'Na', 'ind'], ['schicken', 'VC'], ['könnten', 'VC']],
          hint: 'Sie → mir (местоимения), потом время и существительное, в конце два глагола.' },
        { id: '5-5', lvl: 5, ru: 'Благодаря новому ПО мы теперь можем обрабатывать заказы гораздо быстрее.', lock: [['Dank der neuen Software', 'K']],
          chips: [['können', 'V'], ['wir', 'Sp'], ['die Bestellungen', 'Na'], ['jetzt', 'T'], ['viel schneller', 'M'], ['bearbeiten', 'W']],
          hint: 'После Dank … — глагол, потом wir. Способ (viel schneller) — ближе к глаголу, чем существительное.' },
        { id: '5-6', lvl: 5, ru: 'Поставщик вчера по телефону заверил нас, что сможет поставить товар не позднее понедельника.', lock: [['Der Lieferant', 'S']],
          chips: [['hat', 'V'], ['uns', 'Pd'], ['gestern', 'T'], ['telefonisch', 'M'], ['versichert', 'W'], ['dass er spätestens am Montag die Ware liefern kann', 'NSn']],
          hint: 'Придаточное (dass …) уходит в самый конец — после versichert (Nachfeld).' },
        { id: '5-7', lvl: 5, ru: 'Вчера нам, к сожалению, не удалось связаться с клиентом.', lock: [['Gestern', 'T']],
          chips: [['ist', 'V'], ['es', 'Sp'], ['uns', 'Pd'], ['leider', 'SA'], ['nicht', 'neg'], ['gelungen', 'W'], ['den Kunden zu erreichen', 'NSn']],
          hint: 'Группа «den Kunden zu erreichen» — в самый конец. Перед gelungen: leider, потом nicht.' }
    ].map(prepare);

    return { ROLE: ROLE, STATION: STATION, RU: RU, RULES: RULES, TASKS: TASKS, LEVELS: LEVELS,
             ctxOf: ctxOf, evaluate: evaluate, explain: explain, sentence: sentence, stations: stations, prepare: prepare };
});
