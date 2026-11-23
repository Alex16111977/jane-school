/* Kriterien-Check für Inhaltsangabe und Stellungnahme (deutsch-egb.html, Karten ia8/ia9).
   Findet Muster im Text (Basissatz-Bausteine, Präteritum, Ich-Form, Wertung, Zitate, Verben des Sagens, Konjunktiv I, Konnektoren …)
   und meldet, was nach den Kriterien der Lehrerin (Hilfekarte, M10, M13, M15, M16) fehlt oder stört.
   Das ist ein Hilfsmittel: es versteht keinen Inhalt und ersetzt keine Korrektur. UMD: im Browser window.IaCheck, in Node require('./ia-check.js'). */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) { module.exports = factory(); } else { root.IaCheck = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var LET = 'a-zäöüß';

    function wordCount(t) { var m = String(t).trim().match(/\S+/g); return m ? m.length : 0; }
    function norm(t) {                      // ' kleingeschrieben mit einfachen Leerzeichen '
        return ' ' + String(t).toLowerCase().replace(new RegExp('[^' + LET + '0-9]+', 'g'), ' ').replace(/\s+/g, ' ').trim() + ' ';
    }
    function has(n, phrase) { return n.indexOf(' ' + phrase + ' ') >= 0; }
    function found(n, list) { return list.filter(function (p) { return has(n, p); }); }
    function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

    /* ---------------- Wortlisten (klein geschrieben) ---------------- */
    // Präteritum – „wollte/sollte“ fehlen absichtlich: gleich wie Konjunktiv II („sie sollten“ = Ersatzform der Lehrerin)
    var PRAET = ['war', 'waren', 'hatte', 'hatten', 'wurde', 'wurden', 'sagte', 'sagten', 'schrieb', 'erklärte', 'betonte', 'meinte', 'nannte', 'empfahl',
        'riet', 'kam', 'ging', 'gab', 'stellte', 'wies', 'führte', 'zeigte', 'erwähnte', 'berichtete', 'fasste', 'beschrieb', 'nahm', 'sah', 'fand', 'blieb',
        'brauchte', 'konnte', 'konnten', 'musste', 'mussten', 'durfte', 'lag', 'stand', 'lief', 'aß', 'trank', 'begann', 'forderte', 'warnte', 'kritisierte',
        'verglich', 'begründete', 'schlug', 'hob', 'machte', 'sprach', 'fragte', 'antwortete', 'rief', 'dachte', 'glaubte', 'wusste', 'ließ', 'bot', 'las'];
    var ICH = ['ich', 'mich', 'mir', 'mein', 'meine', 'meinem', 'meinen', 'meiner', 'meines', 'wir', 'uns', 'unser', 'unsere', 'unserem', 'unseren', 'unserer', 'unseres'];
    var WERT = ['toll', 'super', 'schlecht', 'leider', 'zum glück', 'krass', 'echt', 'mega', 'total', 'schade', 'gefällt', 'gefällt mir', 'finde', 'denke', 'glaube',
        'meiner meinung', 'meiner meinung nach', 'hervorragend', 'unglaublich', 'langweilig', 'sinnlos', 'dumm', 'blöd', 'geil'];
    var UMG = ['voll', 'kriegt', 'kriegen', 'kriegte', 'labert', 'quatscht', 'nen', 'ne', 'halt', 'irgendwie', 'cool', 'nervt'];
    var SAGEN = ['erklärt', 'erläutert', 'betont', 'beschreibt', 'nennt', 'empfiehlt', 'rät', 'fordert', 'kritisiert', 'warnt', 'vergleicht', 'begründet', 'berichtet',
        'schreibt', 'erwähnt', 'verweist', 'erzählt', 'zeigt'];
    // trennbare Verben: das Subjekt darf dazwischen stehen („stellt der Autor fest“, „weist die Autorin darauf hin“)
    var SAGEN_SEP = [['stellt', 'fest'], ['hebt', 'hervor'], ['weist', 'darauf hin'], ['schlägt', 'vor'], ['führt', 'aus'], ['macht', 'deutlich'], ['gibt', 'an'],
        ['fasst', 'zusammen'], ['stellt', 'dar'], ['legt', 'dar'], ['kommt', 'zu dem ergebnis'], ['macht', 'darauf aufmerksam']];
    var KONNEKT = ['weil', 'da', 'denn', 'deshalb', 'deswegen', 'darum', 'daher', 'sodass', 'so dass', 'obwohl', 'auch wenn', 'jedoch', 'aber', 'allerdings', 'außerdem', 'darüber hinaus',
        'zudem', 'ferner', 'dadurch', 'damit', 'zunächst', 'zu beginn', 'anschließend', 'danach', 'im folgenden', 'abschließend', 'zum schluss', 'insgesamt', 'dagegen',
        'hingegen', 'im gegensatz dazu', 'während', 'wenn', 'falls', 'weshalb', 'somit', 'folglich', 'trotzdem', 'dennoch', 'sondern', 'als grund dafür', 'dazu', 'dabei'];
    var KI = ['sei', 'seien', 'habe', 'müsse', 'könne', 'solle', 'wolle', 'dürfe', 'werde', 'esse', 'trinke', 'nutze', 'bestehe', 'führe', 'fehle', 'erhalte', 'belaste',
        'erhöhe', 'empfehle', 'rate', 'nenne', 'brauche', 'bringe', 'gebe', 'lasse', 'nehme', 'sehe', 'wisse', 'tue', 'bleibe', 'falle', 'helfe', 'gehöre', 'ernähre',
        'lohne', 'schütze', 'steige', 'sinke', 'entscheide', 'wähle', 'verbessere', 'fördere', 'trage', 'achte', 'plane', 'sorge', 'verfüge', 'beeinflusse', 'stärke',
        'entstehe', 'schaffe', 'verbringe', 'profitiere', 'nutze', 'beitrage', 'erleichtere', 'verbrauche', 'liege', 'stehe', 'laufe', 'finde', 'beginne', 'enthalte', 'zeige'];
    var KI_ERSATZ = ['hätten', 'könnten', 'müssten', 'sollten', 'würden', 'wären', 'dürften', 'wollten', 'planten', 'bräuchten', 'würde'];

    var EINSTIEG = ['zu beginn', 'zunächst', 'der text beginnt'];
    var WEITER = ['anschließend', 'danach', 'im folgenden'];
    var ERGAENZ = ['außerdem', 'darüber hinaus'];
    var SCHLUSS = ['abschließend', 'zum schluss', 'insgesamt kommt'];
    var KERN = ['kernaussage'];

    /* ---------------- Hilfsfunktionen für den Basissatz ---------------- */
    var RE_TITEL = /[„"“‚‘»«]([^„"“”‚‘’»«\n]{6,}?)[“"”‘’«»]/;
    var RE_AUTOR = /(^|[^A-Za-zÄÖÜäöüß])von\s+[A-ZÄÖÜ][a-zäöüß]+/;
    var RE_DATUM = /\b\d{1,2}\.\s?\d{1,2}\.\s?(\d{2}|\d{4})\b|\b\d{1,2}\.\s?(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4}\b|\b(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4}\b/;

    function maskQuotes(t) {                // Titel in Anführungszeichen unkenntlich machen (ein „?“ im Titel beendet den Satz nicht)
        return t.replace(/[„"“‚‘»«][^„"“”‚‘’»«\n]{3,}?[“"”‘’«»]/g, function (m) { return new Array(m.length + 1).join('Q'); });
    }
    function firstSentenceEnd(t) {          // Ende des ersten Satzes (Punkt + Leerzeichen + Großbuchstabe), Daten wie 24.08.2021 stören nicht
        var m = /[.!?](?=\s+[A-ZÄÖÜ])/.exec(maskQuotes(t));
        return m ? m.index + 1 : t.length;
    }
    function sepFound(n, pairs) {           // ['stellt','fest'] → „stellt … fest“ mit bis zu 4 Wörtern dazwischen
        var out = [];
        pairs.forEach(function (p) {
            var re = new RegExp(' ' + p[0] + ' (?:[' + LET + '0-9]+ ){0,4}' + p[1] + ' ');
            if (re.test(n)) { out.push(p[0] + ' … ' + p[1]); }
        });
        return out;
    }

    function R(key, label, status, detail) { return { key: key, label: label, status: status, detail: detail || '' }; }
    function list(a) { return a.length ? '„' + a.join('“, „') + '“' : ''; }

    function lengthCheck(n, o) {
        var min = o && o.min, max = o && o.max;
        if (!min && !max) { return R('len', 'Länge', 'info', n + ' Wörter'); }
        var ok = n >= min && (!max || n <= max);
        var near = n >= min * 0.85 && (!max || n <= max * 1.15);
        return R('len', 'Länge', ok ? 'ok' : (near ? 'warn' : 'bad'),
            n + ' Wörter (Ziel ' + min + '–' + max + ')' + (ok ? '' : n < min ? ' — zu kurz: wichtige Inhalte fehlen vielleicht' : ' — zu lang: verdichte Beispiele und Aufzählungen'));
    }

    /* ---------------- Inhaltsangabe ---------------- */
    function inhaltsangabe(text, o) {
        var res = [], n = norm(text), nw = wordCount(text);
        res.push(lengthCheck(nw, o));

        // Basissatz (erster Satz)
        var cut = firstSentenceEnd(text), first = text.slice(0, Math.min(text.length, Math.max(cut, 1)));
        var nf = norm(first);
        var miss = [];
        if (!found(nf, ['artikel', 'blogbeitrag', 'kommentar', 'bericht', 'beitrag', 'ratgeber', 'ratgeberartikel', 'text', 'kurzgeschichte', 'interview', 'reportage', 'essay']).length) { miss.push('Textsorte'); }
        if (!RE_TITEL.test(first)) { miss.push('Titel in Anführungszeichen'); }
        if (!RE_AUTOR.test(first)) { miss.push('Autor/in („von …“)'); }
        if (!RE_DATUM.test(first)) { miss.push('Datum'); }
        if (!(has(nf, 'erschienen') || has(nf, 'erschienen ist') || has(nf, 'veröffentlicht') || has(nf, 'veröffentlicht wurde'))) { miss.push('Erscheinungsort (erschienen/veröffentlicht in/auf …)'); }
        else if (!(has(nf, 'in') || has(nf, 'im') || has(nf, 'auf') || has(nf, 'bei'))) { miss.push('Erscheinungsort'); }
        if (!(has(nf, 'geht es darum') || has(nf, 'geht es um') || has(nf, 'thematisiert') || has(nf, 'behandelt') || has(nf, 'befasst sich') || has(nf, 'beschäftigt sich'))) { miss.push('Thema („… geht es darum, …“)'); }
        res.push(R('basis', 'Basissatz (Einleitung)', miss.length ? 'bad' : 'ok',
            miss.length ? 'im ersten Satz fehlt: ' + miss.join(' · ') : 'Textsorte, Titel, Autor/in, Datum, Erscheinungsort und Thema sind da'));

        // Präteritum
        var toks = norm(text).trim().split(' '), pr = [];
        toks.forEach(function (w, i) {
            if (PRAET.indexOf(w) >= 0) {
                if ((w === 'wurde' || w === 'wurden') && toks[i - 1] === 'veröffentlicht') { return; }      // „veröffentlicht wurde“ steht so im Beispiel der Lehrerin (M12)
                pr.push(w);
            }
        });
        pr = uniq(pr);
        res.push(R('praes', 'Präsens (kein Präteritum)', pr.length ? 'bad' : 'ok',
            pr.length ? 'Präteritum gefunden: ' + list(pr) + ' → Präsens (Vorzeitigkeit: Perfekt)' : 'kein Präteritum erkannt'));

        // Ich-Form / Wertung / Ausruf
        var ich = uniq(ICH.filter(function (w) { return toks.indexOf(w) >= 0; }));
        var wert = uniq(found(n, WERT));
        var bad = ich.concat(wert);
        var ausruf = /!/.test(text);
        res.push(R('wert', 'Keine Ich-Form, keine Wertung', (bad.length || ausruf) ? 'bad' : 'ok',
            (bad.length || ausruf) ? 'gefunden: ' + (bad.length ? list(bad) : '') + (ausruf ? (bad.length ? ' · ' : '') + 'Ausrufezeichen' : '') + ' — Meinung gehört in die Stellungnahme' : 'keine Ich-Form und keine Wertung erkannt'));

        // wörtliche Rede / Zitate (nach dem ersten Satz)
        var rest = text.slice(cut), q = rest.match(/[„"“‚‘»«][^„"“”‚‘’»«\n]{3,}?[“"”‘’«»]/g) || [];
        res.push(R('zitat', 'Keine wörtliche Rede, keine Zitate', q.length ? 'bad' : 'ok',
            q.length ? 'in Anführungszeichen: ' + list(q.slice(0, 3)) + ' → in eigenen Worten, indirekte Rede' : 'keine Zitate erkannt'));

        // Verben des Sagens
        var sag = uniq(found(n, SAGEN).concat(sepFound(n, SAGEN_SEP)));
        res.push(R('sagen', 'Verben des Sagens (Autor/in als Urheber)', sag.length >= 4 ? 'ok' : (sag.length >= 2 ? 'warn' : 'bad'),
            sag.length ? sag.length + ' verschiedene: ' + list(sag.slice(0, 6)) + (sag.length < 4 ? ' — nimm mehr Abwechslung (M13)' : '') : 'keine erkannt → „erklärt, betont, weist darauf hin, empfiehlt …“'));

        // Konjunktiv I / indirekte Rede
        var afterIch = {};
        toks.forEach(function (w, i) { if (toks[i - 1] === 'ich') { afterIch[w] = true; } });      // „ich finde“ ist kein Konjunktiv I
        var ki = uniq(KI.filter(function (w) { return toks.indexOf(w) >= 0 && !afterIch[w]; }));
        var er = uniq(KI_ERSATZ.filter(function (w) { return toks.indexOf(w) >= 0 && !afterIch[w]; }));
        var kn = ki.length + er.length;
        res.push(R('ki', 'Indirekte Rede (Konjunktiv I / Ersatzform)', kn >= 3 ? 'ok' : (kn >= 1 ? 'warn' : 'bad'),
            kn ? 'erkannt: ' + list(ki.concat(er).slice(0, 8)) + (kn < 3 ? ' — zu wenig? Aussagen des Autors stehen im Konjunktiv I oder mit „dass“' : ' — prüfe selbst, ob jede Form stimmt (sie haben → hätten …)') :
                'keine Form erkannt → er sei, er habe, man könne … (die Liste ist begrenzt: prüfe selbst)'));

        // Konnektoren
        var kon = uniq(found(n, KONNEKT));
        res.push(R('konn', 'Konnektoren', kon.length >= 5 ? 'ok' : (kon.length >= 3 ? 'warn' : 'bad'),
            kon.length + ' verschiedene' + (kon.length ? ': ' + list(kon.slice(0, 8)) : '') + (kon.length < 5 ? ' — Zusammenhänge deutlicher machen (weil, deshalb, jedoch, außerdem …)' : '')));

        // Bausteine der Lehrerin: Hauptteil (Einstieg · Fortführung · Ergänzung) und Schluss (Abschluss / Ergebnis / Kernaussage — eine der drei Formeln genügt)
        var BAU = [['Einstieg', EINSTIEG], ['Fortführung', WEITER], ['Ergänzung', ERGAENZ], ['Schluss', SCHLUSS.concat(KERN)]];
        var bt = [];
        BAU.forEach(function (p) {
            if (found(n, p[1]).length || (p[0] === 'Ergänzung' && sepFound(n, [['weist', 'darauf hin']]).length)) { bt.push(p[0]); }
        });
        var fehl = BAU.map(function (p) { return p[0]; }).filter(function (x) { return bt.indexOf(x) < 0; });
        res.push(R('bausteine', 'Bausteine der Hilfekarte', bt.length >= 4 ? 'ok' : (bt.length >= 3 ? 'warn' : 'bad'),
            bt.length + ' von 4 (Einstieg · Fortführung · Ergänzung · Schluss)' + (fehl.length ? ' — fehlt: ' + fehl.join(', ') : ' — alle da')));

        // Umgangssprache
        var ug2 = uniq(UMG.filter(function (w) { return toks.indexOf(w) >= 0; }));
        res.push(R('umg', 'Sachlicher Stil', ug2.length ? 'warn' : 'ok', ug2.length ? 'Umgangssprache? ' + list(ug2) : 'keine Umgangssprache erkannt'));

        // Schluss ohne Meinung
        var tail = text.slice(Math.max(0, text.length - 320)), nt = norm(tail);
        res.push(R('schluss', 'Schluss: Kernaussage', (has(nt, 'kernaussage') || has(nt, 'abschließend') || has(nt, 'zum schluss') || has(nt, 'insgesamt')) ? 'ok' : 'warn',
            (has(nt, 'kernaussage') || has(nt, 'abschließend') || has(nt, 'zum schluss') || has(nt, 'insgesamt')) ? 'der Schluss nennt die Kernaussage (ohne eigene Meinung)' : 'am Ende fehlt „Abschließend … / Die Kernaussage des Textes besteht darin, dass …“'));
        return res;
    }

    /* ---------------- Stellungnahme ---------------- */
    function stellungnahme(text, o) {
        var res = [], n = norm(text), nw = wordCount(text);
        var body = nw; // Anrede und Gruß zählen mit (wie im Schreibfeld)
        res.push(lengthCheck(body, o));
        res.push(R('anrede', 'Anrede', /Sehr geehrte[rn]?\s+(Damen und Herren|Herr|Frau)/i.test(text) ? 'ok' : 'bad',
            /Sehr geehrte[rn]?\s+(Damen und Herren|Herr|Frau)/i.test(text) ? '„Sehr geehrter Herr Sales,“' : 'fehlt: „Sehr geehrter Herr Sales,“'));
        var anlass = has(n, 'gelesen') || has(n, 'habe den text gelesen') || has(n, 'habe den artikel gelesen');
        res.push(R('anlass', 'Anlass', anlass ? 'ok' : 'bad', anlass ? 'du sagst, was du gelesen hast' : 'fehlt: „ich habe den Text ‚[Titel]‘ von [Autor/in] gelesen und möchte Ihnen meine Einschätzung … mitteilen.“'));
        var posAt = -1;
        ['ich empfehle', 'ich rate', 'empfehle ich', 'ich bin dafür', 'ich bin dagegen'].forEach(function (p) {
            var i = n.indexOf(' ' + p + ' ');
            if (i >= 0 && (posAt < 0 || i < posAt)) { posAt = i; }
        });
        var posEarly = posAt >= 0 && posAt <= n.length * 0.5;         // Hilfekarte Teil B, Block 1: Anrede · Anlass · Position — die Position kommt vorne
        res.push(R('pos', 'Position (klare Entscheidung)', posAt < 0 ? 'bad' : (posEarly ? 'ok' : 'warn'),
            posAt < 0 ? 'fehlt: „Ich empfehle Ihnen, den Text [auf unserer Homepage zu veröffentlichen / nicht zu veröffentlichen].“' : (posEarly ? 'die Entscheidung steht früh im Text' : 'die Entscheidung kommt spät — nach der Hilfekarte gehört sie gleich hinter den Anlass')));
        var arg = uniq(found(n, ['erstens', 'zweitens', 'drittens', 'außerdem', 'darüber hinaus', 'allerdings', 'zum einen', 'zum anderen', 'einerseits', 'andererseits', 'zudem', 'ein weiterer', 'ein weiteres']));
        res.push(R('arg', 'Mindestens zwei Argumente', arg.length >= 2 ? 'ok' : (arg.length === 1 ? 'warn' : 'bad'),
            arg.length ? arg.length + ' Signalwörter: ' + list(arg) : 'keine Signalwörter: „Erstens … Zweitens … Außerdem … Allerdings …“'));
        var gt = n.trim().split(' '), grund = gt.filter(function (w) { return ['weil', 'da', 'denn', 'deshalb', 'darum', 'daher', 'sodass', 'dadurch'].indexOf(w) >= 0; });
        res.push(R('grund', 'Begründungen (Behauptung + Begründung)', grund.length >= 2 ? 'ok' : (grund.length === 1 ? 'warn' : 'bad'),
            grund.length ? grund.length + 'x: ' + list(uniq(grund)) + (grund.length < 2 ? ' — jedes Argument braucht eine Begründung' : '') : 'keine erkannt — jedes Argument braucht eine Begründung („weil …“)'));
        var bezug = /\bZ\.\s?\d+|Zeilen?\s+\d+/i.test(text) || found(n, ['im text', 'im artikel', 'im blogbeitrag', 'heißt es', 'wird erwähnt', 'so steht', 'schreibt der autor', 'schreibt die autorin', 'zum beispiel']).length > 0;
        res.push(R('bezug', 'Textbezug / Beispiel', bezug ? 'ok' : 'bad', bezug ? 'Beispiel oder Zeilenangabe erkannt' : 'fehlt: „Im Text wird zum Beispiel erwähnt, dass …“ / „(Zeile 15)“'));
        var tailN = ' ' + n.slice(Math.floor(n.length * 0.55));          // das Fazit steht im hinteren Teil
        var fazitAny = has(n, 'insgesamt') || has(n, 'fazit') || has(n, 'zusammenfassend');
        var fazitEnd = has(tailN, 'insgesamt') || has(tailN, 'fazit') || has(tailN, 'zusammenfassend');
        res.push(R('fazit', 'Fazit', fazitEnd ? 'ok' : (fazitAny ? 'warn' : 'bad'),
            fazitEnd ? 'Entscheidung noch einmal genannt' : (fazitAny ? '„Insgesamt …“ steht schon früh — das Fazit gehört ans Ende, vor den Vorschlag und den Gruß' : 'fehlt: „Insgesamt halte ich den Text für (un)geeignet, weil …“')));
        var vor = has(n, 'ich schlage vor');
        res.push(R('vorschlag', 'Vorschlag', vor ? 'ok' : 'warn', vor ? '„Ich schlage vor, dass wir …“' : 'fehlt: „Ich schlage vor, dass wir …“ (Hilfekarte)'));
        var gruss = has(n, 'mit freundlichen grüßen');
        res.push(R('gruss', 'Grußformel + Name', gruss && has(n, 'praktikant') ? 'ok' : (gruss ? 'warn' : 'bad'),
            gruss ? (has(n, 'praktikant') ? 'Gruß und „[Name], Praktikant/in“' : 'der Gruß steht — vergiss „[Name], Praktikant/in“ nicht') : 'fehlt: „Mit freundlichen Grüßen“ und „[Name], Praktikant/in“'));
        var ug = uniq(UMG.filter(function (w) { return norm(text).trim().split(' ').indexOf(w) >= 0; }));
        res.push(R('umg', 'Sachlicher Stil', ug.length ? 'warn' : 'ok', ug.length ? 'Umgangssprache? ' + list(ug) : 'keine Umgangssprache erkannt'));
        return res;
    }

    function analyze(text, kind, opts) {
        text = String(text || '');
        if (wordCount(text) < 8) { return { results: [], ok: 0, total: 0, empty: true }; }
        var results = kind === 'st' ? stellungnahme(text, opts) : inhaltsangabe(text, opts);
        var rated = results.filter(function (r) { return r.status !== 'info'; });
        var ok = rated.filter(function (r) { return r.status === 'ok'; }).length;
        return { results: results, ok: ok, total: rated.length, empty: false };
    }

    /* ---------------- Oberfläche (nur im Browser) ---------------- */
    var ICON = { ok: '✓', bad: '✗', warn: '◐', info: 'ℹ' };
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function render(out, outObj, kind) {
        if (outObj.empty) { out.innerHTML = '<div class="ck-empty">Schreib erst einen Text (mindestens ein paar Sätze) — dann kann ich ihn prüfen.</div>'; return; }
        var html = '<div class="ck-sum"><b>' + outObj.ok + ' von ' + outObj.total + '</b> Kriterien erkannt'
            + (outObj.ok === outObj.total ? ' — sieht gut aus. Lies ihn trotzdem noch einmal als Lehrerin.' : ' — arbeite zuerst an den roten Zeilen.') + '</div><ul class="ck-list">';
        outObj.results.forEach(function (r) {
            html += '<li class="ck-' + r.status + '"><span class="ck-i">' + ICON[r.status] + '</span><span><b>' + esc(r.label) + '</b>'
                + (r.detail ? ' — ' + esc(r.detail) : '') + '</span></li>';
        });
        html += '</ul><div class="ck-note">Das ist ein Mustersuch-Programm: ✓ heißt „erkannt“, nicht „richtig“. Inhalt, Vollständigkeit und Grammatik prüft nur ein Mensch — vergleiche mit der Checkliste M15 und der Hilfekarte.</div>';
        out.innerHTML = html;
    }

    function bindWrite(w) {
        var ta = w.querySelector('textarea');
        if (!ta || w.getAttribute('data-ck-bound')) { return; }
        w.setAttribute('data-ck-bound', '1');
        var kind = w.getAttribute('data-check') || 'ia';
        var min = +w.getAttribute('data-min') || 0, max = +w.getAttribute('data-max') || 0;
        var box = document.createElement('div'); box.className = 'ck-box';
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ck-btn'; btn.textContent = '🔎 Kriterien-Check';
        var out = document.createElement('div'); out.className = 'ck-out';
        box.appendChild(btn); box.appendChild(out);
        w.parentNode.insertBefore(box, w.nextSibling);
        btn.addEventListener('click', function () { render(out, analyze(ta.value, kind, { min: min, max: max }), kind); });
    }

    function bindFree(box) {
        if (box.getAttribute('data-ck-bound')) { return; }
        box.setAttribute('data-ck-bound', '1');
        var sel = box.querySelector('select'), ta = box.querySelector('textarea'), btn = box.querySelector('.ck-btn'), out = box.querySelector('.ck-out'), cnt = box.querySelector('.ck-cnt');
        function upd() { cnt.textContent = wordCount(ta.value) + ' Wörter'; }
        ta.addEventListener('input', upd); upd();
        btn.addEventListener('click', function () {
            var kind = sel.value, o = kind === 'st' ? { min: 120, max: 180 } : { min: 160, max: 260 };
            render(out, analyze(ta.value, kind, o), kind);
        });
    }

    function init() {
        if (typeof document === 'undefined') { return; }
        Array.prototype.forEach.call(document.querySelectorAll('.ci-write[data-check]'), bindWrite);
        Array.prototype.forEach.call(document.querySelectorAll('.ck-free'), bindFree);
        // Lernmodus der Hilfekarte: Formeln verdecken, Klick deckt auf
        function setLearn(id, on) {                                    // beide Knöpfe der Karte (Teil A und Teil B) zeigen denselben Zustand
            var l = document.getElementById(id); if (!l) { return; }
            if (on) { l.classList.add('hk-learn'); } else { l.classList.remove('hk-learn'); }
            Array.prototype.forEach.call(document.querySelectorAll('.hk-learn-btn[data-hk="' + id + '"]'), function (x) {
                x.classList.toggle('on', on);
                x.textContent = on ? '👁 Alle Formeln zeigen' : '🧠 Lernmodus: Formeln verdecken';
            });
            if (!on) { Array.prototype.forEach.call(l.querySelectorAll('.hk-f.show'), function (x) { x.classList.remove('show'); }); }
        }
        Array.prototype.forEach.call(document.querySelectorAll('.hk-learn-btn'), function (b) {
            b.addEventListener('click', function () {
                var id = b.getAttribute('data-hk'), l = document.getElementById(id); if (!l) { return; }
                setLearn(id, !l.classList.contains('hk-learn'));
            });
        });
        document.addEventListener('click', function (e) {
            var f = e.target.closest && e.target.closest('.hk-f');
            if (f && f.closest('.hk-learn')) { f.classList.toggle('show'); }
        });
        // Wortschatz-Suche
        Array.prototype.forEach.call(document.querySelectorAll('.ia-vfind input'), function (inp) {
            var tbl = document.getElementById(inp.getAttribute('data-t')); if (!tbl) { return; }
            var out = inp.parentNode.querySelector('span');
            var rows = Array.prototype.slice.call(tbl.querySelectorAll('tr')).filter(function (tr) { return tr.querySelector('td'); });
            function nf(s) { return s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ё/g, 'е'); }
            rows.forEach(function (tr) { tr.setAttribute('data-n', nf(tr.textContent)); });
            inp.addEventListener('input', function () {
                var q = nf(inp.value.trim()), n = 0;
                rows.forEach(function (tr) { var ok = !q || tr.getAttribute('data-n').indexOf(q) >= 0; tr.style.display = ok ? '' : 'none'; if (ok) { n++; } });
                out.textContent = q ? (n ? n + ' Treffer' : 'nichts gefunden') : '';
            });
        });
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
    }
    return { analyze: analyze, norm: norm, wordCount: wordCount };
}));
