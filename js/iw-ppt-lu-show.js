/* PowerPoint-Klassenarbeit — КАДРЫ к заданиям пробной работы LUMIO (pp2, 14 заданий) и второй работы B (pp3): миниатюры СЛАЙДОВ LUMIO + недостающие группы ленты.
   Размеры и тексты на миниатюрах взяты из файла LUMIO_Probeklausur_PPT_Ausgangsdatei.pptx (см; слайд 33,87 × 19,05).
   Движок тот же, что у «Начни здесь» (js/iw-ppt-show.js) и у карточки pp5 (js/iw-ppt-own-show.js).
   ВАЖНО: это СХЕМА по знанию интерфейса Microsoft 365 (немецкий) и справке Microsoft, НЕ скриншоты; в самом PowerPoint не проверено.
   Подключается ПОСЛЕ iw-ppt-own-show.js и ДО iw-ppt-lu-a.js / iw-ppt-lu-b.js. */
window.PPT = window.PPT || {};
(function (P) {
  'use strict';
  var K = P.showKit; if (!K || !P.svg || !P.C || !P.mocks) { return; }
  var RB = K.RB, SV = K.sv, btn = K.btn, fld = K.fld, grp = K.grp, col = K.col, gal = K.gal;
  var C = P.C, OR = '#fb923c', BL = '#3b82f6', RED = '#ef4444';

  /* ------------------------------------------------------------------ zusätzliche Ribbon-Gruppen */
  RB['Start']['Zeichnen'] = function () {
    return grp('Zeichnen', gal() + col(btn('arr', 'Anordnen', '⬒', { dd: 1 }), btn('qstyle', 'Schnellformat-vorlagen', '◨', { dd: 1 })) + col(btn('fill', 'Formfüllung', '◼', { dd: 1 }), btn('line', 'Formkontur', '▭', { dd: 1 }), btn('eff', 'Formeffekte', '✦', { dd: 1 })));
  };
  RB['Start']['Schrift18'] = function () { return RB['Start']['Schriftart'](); };
  RB['Bildformat']['GrößeLogo'] = function () { return grp('Größe', btn('crop', 'Zuschneiden', '⌗', { dd: 1 }) + col(fld('h', 'Höhe:', '1,54 cm'), fld('w', 'Breite:', '6,6 cm'))); };
  RB['Bildformat']['GrößeLogoM'] = function () { return grp('Größe', btn('crop', 'Zuschneiden', '⌗', { dd: 1 }) + col(fld('h', 'Höhe:', '1,12 cm'), fld('w', 'Breite:', '4,79 cm'))); };
  RB['Bildformat']['GrößeFoto'] = function () { return grp('Größe', btn('crop', 'Zuschneiden', '⌗', { dd: 1 }) + col(fld('h', 'Höhe:', '6,9 cm'), fld('w', 'Breite:', '6,9 cm'))); };
  RB['Formformat']['GrößeBox'] = function () { return grp('Größe', col(fld('h', 'Höhe:', '10,4 cm'), fld('w', 'Breite:', '6,9 cm'))); };
  RB['Tabellenentwurf']['Vorlagen+'] = function () {
    return grp('Tabellenformatvorlagen', gal() + btn('tmore', 'Mehr', '▾', { tip: 'Alle Vorlagen' }) + col(btn('shade', 'Schattierung', '◼', { dd: 1 }), btn('borders', 'Rahmen', '▦', { dd: 1 }), btn('teff', 'Effekte', '✦', { dd: 1 })));
  };
  RB['Animationen']['Zeit'] = function () { return grp('Anzeigedauer', col(btn('astart', 'Start: Beim Klicken', '▸', { dd: 1 }), fld('adur', 'Dauer:', '00,50'), fld('adel', 'Verzögerung:', '00,00'))); };
  RB['Animationen']['Neu'] = function () { return grp('Animation neu anordnen', col(btn('aearlier', 'Früher verschieben', '▲'), btn('alater', 'Später verschieben', '▼'))); };
  RB['Animationen']['EA2'] = function () { return grp('Erweiterte Animation', col(btn('apane', 'Animationsbereich', '☰'), btn('aadd', 'Animation hinzufügen', '➕', { dd: 1 }), btn('apaint', 'Animation übertragen', '🖌'))); };
  RB['Bildformat']['GrößeRund'] = function () { return grp('Größe', btn('crop', 'Zuschneiden', '⌗', { dd: 1 }) + col(fld('h', 'Höhe:', '6,5 cm'), fld('w', 'Breite:', '6,5 cm'))); };
  RB['Entwurf']['Anpassen'] = function () { return grp('Anpassen', col(btn('slsize', 'Foliengröße', '▭', { dd: 1 }), btn('bgfmt', 'Hintergrund formatieren', '▨'))); };
  RB['SmartArt-Entwurf']['Grafik erstellen'] = function () {
    return grp('Grafik erstellen', col(btn('addshape', 'Form hinzufügen', '➕', { dd: 1 }), btn('textpane', 'Textbereich', '☰')) + col(btn('promote', 'Höher stufen', '⇤'), btn('demote', 'Tiefer stufen', '⇥')) + btn('lay', 'Layout', '▤', { dd: 1 }));
  };
  RB['SmartArt-Entwurf']['Layouts'] = function () { return grp('Layouts', gal()); };
  RB['Format'] = { 'Formenarten': function () { return RB['Formformat']['Formenarten'](); } };   // Diagrammtools → Format

  /* ------------------------------------------------------------------ Zeichen-Bausteine (cm) */
  function ex(e, o) { var k; for (k in (o || {})) { e[k] = o[k]; } return e; }
  function R(x, y, w, h, o) { return ex({ t: 'rect', x: x, y: y, w: w, h: h }, o); }
  function E(x, y, w, h, o) { return ex({ t: 'ell', x: x, y: y, w: w, h: h }, o); }
  function L(x1, y1, x2, y2, c, sw, dash) { return { t: 'line', x1: x1, y1: y1, x2: x2, y2: y2, color: c, sw: sw || 0.1, dash: dash }; }
  function T(x, y, w, h, html, pt, o) { o = o || {}; return { t: 'txt', x: x, y: y, w: w, h: h, html: html, pt: pt, b: o.b, i: o.i, color: o.c || C.anth, al: o.al, va: o.va, pad: o.pad || 0 }; }
  function IM(src, x, y, w, h, o) { return ex({ t: 'img', src: src, x: x, y: y, w: w, h: h }, o); }
  function S(a) { return P.svg(a, 'Слайд LUMIO (схема)'); }
  function sel(x, y, w, h) {
    var a = [R(x, y, w, h, { stroke: BL, sw: 0.1 })];
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h], [x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]].forEach(function (q) { a.push(R(q[0] - 0.28, q[1] - 0.28, 0.56, 0.56, { fill: '#fff', stroke: BL, sw: 0.08 })); });
    return a;
  }
  function dash(x, y, w, h, c) { return R(x, y, w, h, { stroke: c || OR, sw: 0.14, dash: 1, r: 0.15 }); }
  function tag(x, y, w, txt, c) { return T(x, y, w, 1.0, txt, 14, { b: 1, c: c || OR, va: 'm' }); }
  function arrowR(x, y, w) { return { t: 'poly', fill: OR, pts: [[x, y + 0.4], [x + w - 0.8, y + 0.4], [x + w - 0.8, y], [x + w, y + 0.9], [x + w - 0.8, y + 1.8], [x + w - 0.8, y + 1.4], [x, y + 1.4]] }; }

  /* Inhaltsfolie wie im Layout „LU Inhalt“ */
  function chrome(chap, title, num, logo) {
    var a = [E(1.52, 0.89, 0.56, 0.56, { fill: C.bern }), T(2.34, 0.76, 20.32, 0.81, chap, 13, { b: 1, c: C.petrol2, va: 'm' }), T(1.52, 1.57, 25.4, 1.91, title, 30, { b: 1, c: C.petrol, va: 'm' }),
      T(1.52, 17.73, 17.78, 0.76, 'LUMIO Licht &amp; Design GmbH &nbsp;|&nbsp; Unternehmenspräsentation 2026', 10, { c: C.acc4, va: 'm' })];
    if (num) { a.push(T(30.56, 17.6, 1.78, 0.89, String(num), 10, { c: C.acc4, al: 'r', va: 'm' })); }
    if (logo) { a.push(IM('lumio-logo-dark.png', 27.55, 0.55, 4.79, 1.12)); }
    return a;
  }

  var LS = {};
  SV.lu = function (o) { return LS[o.s](o); };

  /* ---- Folie 1: Titel */
  LS.s1 = function (o) {
    var a = [R(0, 0, 33.87, 19.05, { fill: C.petrol }), E(21.34, 2.29, 16.76, 16.76, { fill: C.petrol2 }), E(25.15, 5.84, 9.65, 9.65, { fill: C.bern }),
      T(2.03, 6.48, 18.8, 4.06, 'Gutes Licht für jeden Raum', 40, { b: 1, c: '#fff', va: 'b' }), T(2.03, 10.92, 18.8, 2.54, 'Unternehmenspräsentation der LUMIO Licht &amp; Design GmbH<br>Hausmesse 2026, Bonn', 18, { c: C.acc5 })];
    if (o.logo === 'paste') { a.push(IM('lumio-logo-white.png', 10.92, 4.88, 7.62, 1.78)); if (o.sel) { a = a.concat(sel(10.92, 4.88, 7.62, 1.78)); } }
    if (o.logo === 'dark') { a.push(IM('lumio-logo-dark.png', 2.03, 1.78, 6.6, 1.54), tag(9.0, 1.9, 14, '✗ dunkles Logo auf Petrol — unlesbar', RED)); }
    if (o.logo === 'small') {
      a.push(IM('lumio-logo-white.png', 2.03, 1.78, 6.6, 1.54));
      if (o.sel) { a = a.concat(sel(2.03, 1.78, 6.6, 1.54)); }
      if (o.hl) { a.push(dash(1.6, 1.4, 7.4, 2.3), tag(9.3, 2.0, 12, 'weißes Logo · 6,6 cm · oben links')); }
    }
    if (o.bar) { a.push(R(0, 0, 33.87, 1.6, { fill: '#B7472A' }), T(0.5, 0, 33, 1.6, 'PK_PPT_11b_Meyer_Lena.pptx – PowerPoint', 20, { c: '#fff', b: 1, va: 'm' }), dash(0.3, 0.2, 33.3, 1.2)); }
    return S(a);
  };

  /* ---- Folie 16: Material */
  var CDTXT = '<b style="font-size:1.2em;color:' + C.petrol + '">Corporate Design</b><br><br>Schriftart: Calibri<br>Folientitel: 30 pt, fett, Petrol<br><br>Petrol: RGB 15 / 61 / 62<br>Petrol hell: RGB 30 / 107 / 108<br>Anthrazit (Fließtext): RGB 43 / 45 / 47<br>Akzent Bernstein: RGB 242 / 169 / 0<br>Hellgrau (Flächen): RGB 238 / 242 / 241<br>Hintergrund Inhaltsfolien: Weiß<br><br>Alle CD-Farben finden Sie in der Farbauswahl unter „Designfarben“.';
  var ICONS = ['truck', 'bulb', 'euro', 'medal', 'handshake', 'clock', 'heart', 'leaf'];
  LS.s16 = function (o) {
    var a = chrome('Intern', 'Material für die Fertigstellung', null, false), s = o.sel, i, b;
    a.push(T(1.52, 3.94, 8.64, 0.76, 'Logo für helle Hintergründe', 12, { c: C.acc4, va: 'm' }), IM('lumio-logo-dark.png', 1.52, 4.83, 7.62, 1.78),
      T(10.41, 3.94, 8.64, 0.76, 'Logo für dunkle Hintergründe', 12, { c: C.acc4, va: 'm' }), R(10.41, 4.7, 8.64, 2.16, { fill: C.petrol }), IM('lumio-logo-white.png', 10.92, 4.88, 7.62, 1.78),
      T(1.52, 7.87, 17.53, 0.76, 'Piktogramme', 12, { c: C.acc4, va: 'm' }));
    ICONS.forEach(function (n, k) { a.push(IM('icon-' + n + '.png', [1.91, 6.35, 10.79, 15.24][k % 4], k < 4 ? 9.14 : 12.95, 2.41, 2.41)); });
    a.push(R(20.57, 3.94, 11.76, 12.7, { fill: C.grau, r: 0.55 }), T(21.4, 4.85, 10.2, 11.2, CDTXT, 15));
    if (s === 'white') { a = a.concat(sel(10.92, 4.88, 7.62, 1.78)); }
    if (s === 'dark') { a = a.concat(sel(1.52, 4.83, 7.62, 1.78)); }
    i = ICONS.indexOf(s);
    if (i > -1) { b = [[1.91, 6.35, 10.79, 15.24][i % 4], i < 4 ? 9.14 : 12.95]; a = a.concat(sel(b[0], b[1], 2.41, 2.41)); }
    if (o.hl === 'cd') { a.push(dash(20.2, 3.6, 12.5, 13.4)); }
    if (o.del) { a.push(R(0, 0, 33.87, 19.05, { fill: 'rgba(255,255,255,0.55)' }), T(2, 7.5, 30, 3, '🗑  Folie 16 gelöscht — als Letztes!', 40, { b: 1, c: RED, al: 'c', va: 'm' })); }
    return S(a);
  };

  /* ---- Folie 3: Über uns */
  var STECK = 'Die LUMIO Licht &amp; Design GmbH wurde 2004 von Elena Marković und Tobias Reuter in Bonn als kleines Ingenieurbüro für Lichtplanung gegründet. Inzwischen entwickeln und fertigen wir an unserem Hauptsitz in Bonn-Beuel hochwertige LED-Leuchten für Büros, Hotels und Geschäfte. Zusätzlich präsentieren wir unsere Produkte in zwei Showrooms in Berlin und Frankfurt am Main. Insgesamt arbeiten 126 Mitarbeiterinnen und Mitarbeiter für LUMIO, darunter 31 Auszubildende. Im Geschäftsjahr 2025 haben wir einen Umsatz von 21,8 Millionen Euro erwirtschaftet. Unsere Leuchten werden heute an Kunden in 11 Ländern Europas geliefert. Seit 2021 wird das Unternehmen von Katrin Albers als Geschäftsführerin geleitet; die beiden Gründer sind weiterhin als Gesellschafter beteiligt.';
  LS.s3 = function (o) {
    var a;
    if (o.st === 'after') { return P.mocks.m2(); }
    a = chrome('01 | Über uns', 'Über uns', null, false);
    a.push(T(1.52, 4.32, 19.3, 12.45, STECK, 16), IM('photo-firmensitz.jpg', 22.23, 4.32, 10.11, 10.95), T(22.23, 15.49, 10.11, 0.89, 'Hauptsitz Bonn-Beuel', 12, { i: 1, c: C.acc4, va: 'm' }));
    if (o.sel) { a = a.concat(sel(1.52, 4.32, 19.3, 12.45)); }
    if (o.btn) {   // Schalter „Agenda“ unten rechts, links neben dem Platz der Foliennummer
      a.push(R(30.56, 17.6, 1.78, 0.89, { stroke: '#9a9a9a', sw: 0.05, dash: 1 }), R(26.6, 17.3, 3.5, 1.15, { fill: C.petrol2, r: 0.575 }), T(26.6, 17.3, 3.5, 1.15, 'Agenda', 14, { b: 1, c: '#fff', al: 'c', va: 'm' }));
      if (o.sel === 'btn') { a = a.concat(sel(26.6, 17.3, 3.5, 1.15)); }
      if (o.hand) { a.push(T(28.6, 15.6, 2.6, 2.2, '👆', 40, { al: 'c', va: 'm' }), tag(15.0, 15.7, 13, 'Klick → springt zur Agenda-Folie')); }
    }
    return S(a);
  };
  LS.notes = function (o) {   // Normalansicht mit Notizenbereich
    var a = [R(0, 0, 33.87, 19.05, { fill: '#e9edf1' }), R(7.4, 0.5, 19.0, 10.7, { fill: '#fff', stroke: '#9aa7b5', sw: 0.06 }), E(8.2, 1.4, 0.4, 0.4, { fill: C.bern }), T(9.0, 1.2, 12, 1.0, '01 | Über uns', 11, { b: 1, c: C.petrol2, va: 'm' }),
      T(8.2, 2.3, 12, 1.4, 'Über uns', 22, { b: 1, c: C.petrol, va: 'm' })];
    ['2004 · Bonn', 'Bonn-Beuel · Berlin · Frankfurt', '126 Mitarbeitende', '21,8 Mio. €'].forEach(function (s, k) { a.push(T(8.2, 4.4 + k * 1.3, 11, 1.1, s, 14, { va: 'm' })); });
    a.push(R(21.2, 4.2, 4.6, 5.4, { fill: '#cfd9d8' }), R(1.0, 11.9, 31.9, 6.4, { fill: '#fff', stroke: o.filled ? '#9aa7b5' : OR, sw: o.filled ? 0.06 : 0.14 }));
    a.push(T(1.4, 12.1, 31.1, 6.0, o.filled ? STECK : 'Klicken Sie, um Notizen hinzuzufügen', o.filled ? 14 : 20, { c: o.filled ? C.anth : '#8a8886' }));
    a.push(T(1.0, 10.9, 31.9, 0.9, '▲ Notizenbereich (Ansicht → Notizen)', 12, { c: OR, b: 1, va: 'm' }));
    return S(a);
  };

  /* ---- Folie 5: Werte ---- Folie 8: Services */
  var VAL = [['bulb', 'Ideen, die leuchten', 'Wir entwickeln Leuchten, die Gestaltung und Technik auf neue Weise verbinden.'], ['leaf', 'Verantwortung für die Umwelt', 'Wir fertigen klimaneutral und achten auf langlebige, reparierbare Produkte.'], ['handshake', 'Nah am Kunden', 'Wir planen gemeinsam mit unseren Kunden und bleiben auch nach dem Kauf erreichbar.']];
  var SVCS = [['bulb', 'Lichtplanung', 'Lichtkonzepte und Simulationen für jeden Raum'], ['truck', 'Lieferung &amp; Installation', 'Termingerechte Lieferung und fachgerechte Montage'], ['recycle', 'Wartung &amp; Austausch', 'Prüfung, Reparatur und Austausch von LED-Modulen'], ['growth', 'Energieberatung', 'Berechnung von Einsparpotenzialen und Fördermitteln']];
  function svcCard(x, y, i) {
    var d = SVCS[i];
    return [R(x, y, 7.24, 10.29, { fill: C.grau, r: 0.55 }), E(x + 0.77, y + 0.89, 2.41, 2.41, { fill: C.petrol2 }), IM('icon-' + d[0] + '-white.png', x + 1.3, y + 1.43, 1.35, 1.35), T(x + 0.77, y + 3.81, 6.22, 2.03, d[1], 19, { b: 1, c: C.petrol }), T(x + 0.77, y + 5.97, 5.84, 3.81, d[2], 15)];
  }
  function valCard(x, y, i, ic) {
    var d = VAL[i], a = [R(x, y, 9.78, 8.7, { fill: C.grau, r: 0.55 }), E(x + 0.89, y + 1.0, 2.41, 2.41, { fill: C.petrol2 })];
    if (ic === 'dark') { a.push(IM('icon-' + d[0] + '.png', x + 1.42, y + 1.53, 1.35, 1.35)); }
    if (ic === 'white') { a.push(IM('icon-' + d[0] + '-white.png', x + 1.42, y + 1.53, 1.35, 1.35)); }
    a.push(T(x + 0.89, y + 3.8, 8.1, 1.9, d[1], 19, { b: 1, c: C.petrol }), T(x + 0.89, y + 5.65, 8.1, 2.8, d[2], 15));
    return a;
  }
  LS.s5 = function (o) {
    var a, i, X = [1.52, 12.04, 22.56];
    if (o.st === 'after') { return P.mocks.m3(); }
    a = chrome('02 | Werte und Ziele', 'Unsere Werte', null, false);
    a.push(T(1.52, 4.19, 30.73, 2.79, '„Wir bringen gutes Licht in jeden Raum – energieeffizient, langlebig und schön gestaltet.“', 22, { i: 1, c: C.petrol, va: 'm' }));
    if (o.old) {
      a.push(T(1.52, 7.75, 22.86, 8.89, VAL.map(function (v) { return '<div style="font-weight:700;color:' + C.petrol + '">' + v[1] + '</div><div style="margin-bottom:.5em">' + v[2] + '</div>'; }).join(''), 16));
    }
    if (o.cards === 'stack') { for (i = 2; i >= 0; i--) { a = a.concat(svcCard(1.52 + i * 1.0, 6.22 + i * 0.7, 0)); } }
    if (o.cards === 'row') { for (i = 0; i < 3; i++) { a = a.concat(valCard(X[i], 7.55, i, o.ic || 'none')); } }
    if (o.sel === 'icon') { a = a.concat(sel(X[0] + 1.42, 7.55 + 1.53, 1.35, 1.35)); }
    if (o.sel === 'all') { for (i = 0; i < 3; i++) { a = a.concat(sel(X[i] - 0.15, 7.4, 10.08, 9.0)); } }
    if (o.sel === 'circle') { a = a.concat(sel(X[0] + 0.89, 7.55 + 1.0, 2.41, 2.41), sel(X[0] + 1.42, 7.55 + 1.53, 1.35, 1.35)); }
    if (o.guide) { a.push(L(0.4, 7.55, 33.5, 7.55, OR, 0.1, 1), T(23, 6.55, 10.5, 0.9, 'oben auf einer Höhe', 14, { b: 1, c: OR, al: 'r', va: 'm' })); }
    return S(a);
  };
  LS.s8 = function (o) {
    var a = chrome('03 | Produkte und Services', 'Unsere Services', null, false);
    a.push(T(1.52, 3.94, 30.73, 1.52, 'Von der ersten Idee bis zum Austausch einzelner Module begleiten wir unsere Kunden über die gesamte Nutzungsdauer ihrer Beleuchtung.', 16, { va: 'm' }));
    [1.52, 9.4, 17.27, 25.15].forEach(function (x, i) { a = a.concat(svcCard(x, 6.22, i)); });
    if (o.band) { a.push(R(1.0, 5.7, 8.2, 11.4, { fill: 'rgba(59,130,246,0.14)', stroke: BL, sw: 0.1, dash: 1 }), tag(9.6, 5.0, 14, 'Gummiband: von leerer Stelle aufziehen', BL)); }
    return S(a);
  };

  /* ---- Folie 6: Ziele (drei Gruppen) */
  var ZIEL = [['growth', 'Wachstum', ['Umsatz bis 2028 auf 26 Mio. € steigern', 'Zwei neue Exportmärkte erschließen']], ['recycle', 'Nachhaltigkeit', ['Rücknahmesystem für alle Leuchten', 'Verpackungen zu 100 % plastikfrei']], ['people', 'Mitarbeitende', ['Jedes Jahr 10 neue Ausbildungsplätze', 'Weiterbildungsbudget für alle']]];
  LS.s6 = function (o) {
    var a = chrome('02 | Werte und Ziele', 'Unsere Ziele bis 2030', null, false), X = [1.52, 12.04, 22.56];
    ZIEL.forEach(function (z, i) {
      var x = X[i];
      if (o.ghost && o.ghost.indexOf(i) > -1) { a.push(R(x, 4.95, 9.78, 10.41, { stroke: '#b9c7c6', sw: 0.12, dash: 1, r: 0.55 }), T(x, 4.95, 9.78, 10.41, 'noch nicht sichtbar', 20, { c: C.acc4, al: 'c', va: 'm', i: 1 })); return; }
      a.push(R(x, 4.95, 9.78, 10.41, { fill: C.grau, r: 0.55 }), E(x + 0.89, 5.97, 2.41, 2.41, { fill: C.petrol2 }), IM('icon-' + z[0] + '-white.png', x + 1.43, 6.5, 1.35, 1.35), T(x + 0.89, 9.02, 8.0, 1.4, z[1], 22, { b: 1, c: C.petrol, va: 'm' }),
        T(x + 0.89, 10.79, 8.13, 4.06, '<div>• ' + z[2][0] + '</div><div>• ' + z[2][1] + '</div>', 16));
    });
    (o.badge || []).forEach(function (n, i) { if (n) { a.push(R(X[i] - 1.0, 4.95, 0.85, 0.85, { fill: '#fff', stroke: OR, sw: 0.1 }), T(X[i] - 1.0, 4.95, 0.85, 0.85, String(n), 14, { b: 1, c: OR, al: 'c', va: 'm' })); } });
    if (o.sel !== undefined && o.sel !== null) { a = a.concat(sel(X[o.sel], 4.95, 9.78, 10.41)); }
    if (o.show) { a.push(T(0, 16.4, 33.87, 1.2, '▶ Bildschirmpräsentation — ' + o.show, 20, { b: 1, c: OR, al: 'c', va: 'm' })); }
    return S(a);
  };

  /* ---- Folie 7: Leuchten */
  var PROD = [['prod-stehleuchte.jpg', 600, 450, [2.03, 4.57, 7.11, 5.33], 'Nova Floor', { cx: 0.5, cy: 0.5, s: 0.75 }], ['prod-pendelleuchte.jpg', 800, 450, [10.67, 4.19, 9.4, 5.28], 'Arc Pendant', { cx: 0.7185, cy: 0.5, s: 0.5625 }],
    ['prod-tischleuchte.jpg', 450, 600, [4.06, 10.67, 4.32, 5.77], 'Desk One', { cx: 0.5, cy: 0.533, s: 1 }], ['prod-wandleuchte.jpg', 500, 500, [12.45, 10.79, 4.95, 4.95], 'Wall Line', { cx: 0.5, cy: 0.5, s: 1 }]];
  function roundMask(cx, cy, r) {   // vier weiße Eckstücke → aus dem Quadrat wird ein Kreis
    var a = [], n = 14;
    [[-1, -1, 180], [1, -1, 270], [1, 1, 0], [-1, 1, 90]].forEach(function (c) {
      var pts = [[cx + c[0] * r, cy + c[1] * r]], i, g;
      for (i = 0; i <= n; i++) { g = (c[2] + 90 * i / n) * Math.PI / 180; pts.push([cx + r * Math.cos(g), cy + r * Math.sin(g)]); }
      a.push({ t: 'poly', fill: '#fff', pts: pts });
    });
    return a;
  }
  var PLIST = '<b style="color:' + C.petrol + '">Nova Floor</b><br>Stehleuchte für Lounge und Empfang<br><br><b style="color:' + C.petrol + '">Arc Pendant</b><br>Pendelleuchte für Besprechungstische<br><br><b style="color:' + C.petrol + '">Desk One</b><br>Schreibtischleuchte mit Dimmfunktion<br><br><b style="color:' + C.petrol + '">Wall Line</b><br>Wandleuchte für Flure und Hotelzimmer';
  LS.s7 = function (o) {
    var a, i, p, x, st = o.st || 'before';
    if (st === 'after') { return P.mocks.m5(); }
    a = chrome('03 | Produkte und Services', 'Unsere Leuchten', null, false);
    if (st === 'before' || st === 'crop') {
      PROD.forEach(function (d, k) {
        p = d[3];
        if (k === 0) { a.push(R(p[0] + 0.18, p[1] + 0.18, p[2], p[3], { fill: 'rgba(0,0,0,0.25)' })); }
        a.push(IM(d[0], p[0], p[1], p[2], p[3]));
        if (k === 0) { a.push(R(p[0], p[1], p[2], p[3], { stroke: C.bern, sw: 0.42 })); }
      });
      a.push(T(22.61, 4.45, 9.73, 11.68, PLIST, 15));
      if (st === 'crop') {   // Zuschneide-Modus an der Pendelleuchte: Fenster 5,28 × 5,28, rechts am Bildrand
        a.push(R(10.67, 4.19, 4.12, 5.28, { fill: 'rgba(0,0,0,0.55)' }));
        [[14.79, 4.19], [20.07, 4.19], [14.79, 9.47], [20.07, 9.47]].forEach(function (q) { a.push(R(q[0] - 0.1, q[1] - 0.1, 0.9, 0.22, { fill: '#000' }), R(q[0] - 0.1, q[1] - 0.1, 0.22, 0.9, { fill: '#000' })); });
        a.push(tag(10.67, 9.7, 12, '← Foto nach links ziehen', OR));
      }
      if (o.mark) { a.push(tag(9.3, 3.1, 14, 'Lampe sitzt rechts, nicht in der Mitte', OR), tag(1.4, 3.1, 7.7, 'Rahmen + Schatten nur hier', RED)); }
    } else {
      for (i = 0; i < 4; i++) {
        x = 1.52 + i * (6.9 + 1.043);
        a.push(IM(PROD[i][0], x, 4.7, 6.9, 6.9, { iw: PROD[i][1], ih: PROD[i][2], crop: PROD[i][5] }));
        if (o.round) { a = a.concat(roundMask(x + 3.45, 4.7 + 3.45, 3.45)); }
        if (o.ring) { a.push(E(x, 4.7, 6.9, 6.9, { stroke: C.petrol2, sw: 0.2 })); }
        if (st === 'framed') { a.push(R(x, 4.7, 6.9, 6.9, { stroke: C.acc6, sw: 0.07 })); }
        if (o.sel) { a = a.concat(sel(x, 4.7, 6.9, 6.9)); }
        if (st === 'labels') { a.push(T(x, 11.9, 6.9, 2.8, '<b style="font-size:1.12em;color:' + C.petrol + '">' + PROD[i][4] + '</b>', 14)); }
      }
      if (o.guide) { a.push(L(0.4, 4.7, 33.5, 4.7, OR, 0.1, 1), tag(1.52, 3.6, 18, 'oben auf einer Höhe · gleiche Abstände')); }
    }
    return S(a);
  };

  /* ---- Folie 9: Zahlen */
  LS.s9 = function (o) {
    var fix = o.st === 'fixed', ff = fix ? 'Calibri, Carlito, Arial, sans-serif' : 'Arial, Helvetica, sans-serif', a = [R(0, 0, 33.87, 19.05, { fill: fix ? '#fff' : '#FFF7E0' })].concat(chrome('01 | Über uns', 'LUMIO in Zahlen', null, false)), V = [15.2, 16.9, 18.1, 20.3, 21.8], i, v, h, x, bc = fix ? C.petrol2 : '#70AD47';
    a.push(T(1.52, 4.19, 20, 1.0, '<span style="font-family:' + ff + '">Umsatz in Mio. €</span>', 14, { b: 1, va: 'm' }));
    [0, 5, 10, 15, 20, 25].forEach(function (g) { var y = 15.6 - g * 0.4; a.push(L(2.8, y, 21.4, y, '#d9d9d9', 0.05), T(1.52, y - 0.4, 1.1, 0.8, '<span style="font-family:' + ff + '">' + g + '</span>', 12, { al: 'r', va: 'm', c: fix ? C.anth : '#000' })); });
    for (i = 0; i < 5; i++) {
      v = V[i]; h = v * 0.4; x = 3.5 + i * 3.7;
      a.push(R(x, 15.6 - h, 2.5, h, { fill: bc }), T(x - 0.4, 15.7, 3.3, 0.9, '<span style="font-family:' + ff + '">' + (2021 + i) + '</span>', 12, { al: 'c', va: 'm' }));
    }
    [['+43 %', 'Umsatzwachstum 2021–2025'], ['126', 'Mitarbeitende'], ['11', 'Länder in Europa']].forEach(function (k, j) {
      if (o.ghost && o.ghost.indexOf(j) > -1) { a.push(R(23.11, 4.83 + j * 4.19, 9.14, 3.55, { stroke: '#b9c7c6', sw: 0.1, dash: 1 }), T(23.11, 4.83 + j * 4.19, 9.14, 3.55, 'noch nicht sichtbar', 16, { c: C.acc4, al: 'c', va: 'm', i: 1 })); return; }
      a.push(T(23.11, 4.83 + j * 4.19, 9.14, 2.41, k[0], 48, { b: 1, c: C.petrol2, va: 'm' }), T(23.11, 7.24 + j * 4.19, 9.14, 1.14, k[1], 15, { va: 'm' }));
    });
    if (o.sel === 'k1') { a = a.concat(sel(23.11, 4.83, 9.14, 2.41)); }
    if (o.sel === 'k1t') { a = a.concat(sel(23.11, 7.24, 9.14, 1.14)); }
    if (o.show) { a.push(T(0, 16.7, 33.87, 1.0, '▶ Bildschirmpräsentation — ' + o.show, 18, { b: 1, c: OR, al: 'c', va: 'm' })); }
    if (o.sel === 'bars') { a = a.concat(sel(3.5, 15.6 - 15.2 * 0.4, 2.5, 15.2 * 0.4)); a.push(tag(7.0, 7.0, 13, '← Balken anklicken', OR)); }
    if (o.sel === 'axis') { a = a.concat(sel(1.4, 4.8, 1.4, 11.2)); a.push(tag(3.0, 4.5, 15, '← Zahlen der Werteachse', OR)); }
    if (o.sel === 'bg') { a.push(dash(0.3, 0.3, 33.3, 18.4)); a.push(tag(8, 17.3, 18, 'Hintergrund: cremefarben statt Weiß', OR)); }
    return S(a);
  };

  /* ---- Folie 10: Vom Bauteil zur fertigen Leuchte */
  var FLOW = [{ x: 1.52, w: 6.9, h: 'Lieferanten', hc: C.petrol2, items: ['LED-Module', 'Aluminiumprofile', 'Glasschirme', 'Steuerungs- &amp; Sensortechnik'] }, { x: 10.2, w: 5.7, h: 'LUMIO', hc: C.petrol, dark: 1, items: ['<b style="font-size:1.25em">Fertigung in Bonn</b>', 'montieren', 'prüfen'] },
    { x: 17.7, w: 5.7, h: 'Vertrieb', hc: C.petrol2, items: ['Showrooms', 'Onlineshop', 'Außendienst'] }, { x: 25.2, w: 7.05, h: 'Kundengruppen', hc: C.petrol2, items: [] }];
  var FTXT = 'Unsere Lieferanten liefern uns LED-Module, Aluminiumprofile, Glasschirme sowie Steuerungs- und Sensortechnik. In unserer Fertigung in Bonn montieren und prüfen wir daraus unsere Leuchten. Über unsere Showrooms, unseren Onlineshop und unseren Außendienst gelangen die Leuchten zu drei Kundengruppen: Büro- und Verwaltungsgebäude (46 % des Umsatzes), Hotellerie und Gastronomie (32 %) und Einzelhandel (22 %).';
  LS.s10 = function (o) {
    var a = chrome('04 | Partner und Kunden', 'Vom Bauteil zur fertigen Leuchte', null, false), n = o.cols === undefined ? 0 : o.cols;
    if (o.st === 'after') { return P.mocks.m6(); }
    if (o.text !== false && !n) { a.push(T(1.52, 4.32, 30.73, 5.33, FTXT, 18)); if (o.sel) { a = a.concat(sel(1.52, 4.32, 30.73, 5.33)); } }
    FLOW.forEach(function (c, i) {
      if (i >= n) { return; }
      var fresh = o.empty;
      a.push(R(c.x, 4.6, c.w, 10.4, { fill: c.dark ? C.petrol : C.grau, r: 0.35 }), R(c.x, 4.6, c.w, 1.7, { fill: c.hc, r: 0.35 }), R(c.x, 5.4, c.w, 0.9, { fill: c.hc }), T(c.x, 4.6, c.w, 1.7, c.h, 20, { b: 1, c: '#fff', va: 'm', al: 'c' }));
      if (!fresh) { c.items.forEach(function (it, k) { a.push(T(c.x + 0.3, 6.7 + k * 2.05, c.w - 0.6, 1.9, it, 17, { c: c.dark ? '#fff' : C.anth, va: 'm', al: c.dark ? 'c' : 'l' })); }); }
      if (i === 3 && !fresh) { [['Büro &amp; Verwaltung', '46 %'], ['Hotellerie &amp; Gastronomie', '32 %'], ['Einzelhandel', '22 %']].forEach(function (r, k) { a.push(T(25.5, 6.7 + k * 2.7, 4.55, 2.4, r[0], 16, { va: 'm' }), T(30.0, 6.7 + k * 2.7, 2.0, 2.4, r[1], 20, { b: 1, c: C.petrol2, va: 'm', al: 'r' })); }); }
      if (o.arr && i < 3) { a.push(arrowR(c.x + c.w + 0.2, 9.2, 1.4)); }
    });
    if (o.sel === 'box') { a = a.concat(sel(1.52, 4.6, 6.9, 10.4)); }
    if (o.sel === 'all') { a = a.concat(sel(1.4, 4.5, 31.0, 10.6)); }
    return S(a);
  };

  /* ---- Folie 11: Lieferanten */
  var LIEF = [['LedPoint Elektronik GmbH', 'Nürnberg', 'LED-Module und Treiber', '12', '2009'], ['Alu-Profil Berger KG', 'Lüdenscheid', 'Aluminiumprofile und Gehäuse', '8', '2011'], ['Glashütte Sommer GmbH', 'Passau', 'Glasschirme', '18', '2015'], ['SmartLight Controls AG', 'Hannover', 'Steuerungs- und Sensortechnik', '10', '2020']];
  LS.s11 = function (o) {
    var a, w = [8.5, 4.4, 8.4, 4.9, 4.5], xs = [1.52], i, k, y, hd = ['Lieferant', 'Standort', 'Liefert', 'Lieferzeit (Arbeitstage)', 'Partner seit'];
    if (o.st === 'after') { return P.mocks.m7(); }
    a = chrome('04 | Partner und Kunden', 'Unsere wichtigsten Lieferanten', null, false);
    if (o.st === 'text') {
      a.push(T(1.52, 4.45, 26.67, 11.94, LIEF.map(function (r) { return '<div style="font-weight:700;color:' + C.petrol + '">' + r[0] + ', ' + r[1] + '</div><div style="margin-bottom:.5em">liefert ' + r[2] + '; Lieferzeit ' + r[3] + ' Arbeitstage; Partner seit ' + r[4] + '</div>'; }).join(''), 18));
      if (o.sel) { a = a.concat(sel(1.52, 4.45, 26.67, 11.94)); }
      return S(a);
    }
    w.forEach(function (v, j) { xs.push(xs[j] + v); });
    var hdc = o.st === 'cd' ? C.petrol : C.bern, hdt = '#fff';
    a.push(R(1.52, 4.5, 30.7, 1.9, { fill: hdc }));
    hd.forEach(function (h, j) { a.push(T(xs[j] + 0.3, 4.5, w[j] - 0.6, 1.9, h, 16, { b: 1, c: hdt, va: 'm', al: j > 2 ? 'c' : 'l' })); });
    for (k = 0; k < 4; k++) {
      y = 6.4 + k * 2.2;
      a.push(R(1.52, y, 30.7, 2.2, { fill: k % 2 ? (o.st === 'cd' ? '#fff' : '#FDF0CC') : (o.st === 'cd' ? C.grau : '#FBE3A0') }));
      for (i = 0; i < 5; i++) { a.push(T(xs[i] + 0.3, y, w[i] - 0.6, 2.2, LIEF[k][i], 16, { va: 'm', al: (o.st === 'cd' && i > 2) ? 'c' : 'l' })); }
    }
    if (o.sel) { a = a.concat(sel(1.52, 4.5, 30.7, 10.7)); }
    if (o.note) { a.push(tag(1.52, 15.6, 30, o.note, RED)); }
    return S(a);
  };

  /* ---- Folie 13: Organisation */
  function org(ox, sc, neu) {
    var a = [], X = function (x) { return ox + (x - 1.52) * sc; }, Y = function (y) { return 4.3 + (y - 4.3) * sc; }, xs = [1.52, 9.46, 17.4, 25.34], fs = Math.max(8, Math.round(15 * sc)), j, k;
    a.push(R(X(13.6), Y(4.3), 6.9 * sc, 2.1 * sc, { fill: C.petrol, r: 0.2 }), T(X(13.6), Y(4.3), 6.9 * sc, 2.1 * sc, '<b>Geschäftsführung</b><br>Katrin Albers', fs + 1, { c: '#fff', va: 'm', al: 'c' }));
    a.push(L(X(17.05), Y(6.4), X(17.05), Y(7.3), C.acc4, 0.08), L(X(xs[0] + 3.45), Y(7.3), X(xs[3] + 3.45), Y(7.3), C.acc4, 0.08));
    [['Vertrieb', 'Ömer Kaya', ['Showrooms', 'Onlineshop']], ['Entwicklung', 'Dr. Felix Lang', ['Produktdesign', 'Elektrotechnik']], ['Produktion', 'Marta Nowak', ['Montage', 'Qualitätsprüfung'].concat(neu ? ['Nachhaltigkeits&shy;management'] : [])], ['Verwaltung', 'Jens Hoffmann', ['Personal', 'Rechnungswesen']]].forEach(function (d, i) {
      var x = xs[j = i];
      a.push(L(X(x + 3.45), Y(7.3), X(x + 3.45), Y(8.0), C.acc4, 0.08), R(X(x), Y(8.0), 6.9 * sc, 2.1 * sc, { fill: C.petrol2, r: 0.2 }), T(X(x), Y(8.0), 6.9 * sc, 2.1 * sc, '<b>' + d[0] + '</b><br>' + d[1], fs, { c: '#fff', va: 'm', al: 'c' }));
      d[2].forEach(function (c, q) {
        k = 10.95 + q * 1.5;
        var nw = c.indexOf('Nachhaltigkeits') === 0;
        a.push(L(X(x + 0.4), Y(k + 0.6), X(x + 0.75), Y(k + 0.6), C.acc4, 0.07), R(X(x + 0.75), Y(k), 6.15 * sc, 1.2 * sc, { fill: nw ? C.bern : C.grau, r: 0.12 }), T(X(x + 0.75), Y(k), 6.15 * sc, 1.2 * sc, c, nw ? fs - 2 : fs, { b: nw, c: C.petrol, va: 'm', al: 'c' }));
      });
      a.push(L(X(x + 0.4), Y(10.1), X(x + 0.4), Y(10.95 + (d[2].length - 1) * 1.5 + 0.6), C.acc4, 0.07));
    });
    return a;
  }
  var ORGL = [[0, 'Geschäftsführung: Katrin Albers'], [1, 'Vertrieb: Ömer Kaya'], [2, 'Showrooms'], [2, 'Onlineshop'], [1, 'Entwicklung: Dr. Felix Lang'], [2, 'Produktdesign'], [2, 'Elektrotechnik'], [1, 'Produktion: Marta Nowak'], [2, 'Montage'], [2, 'Qualitätsprüfung'], [1, 'Verwaltung: Jens Hoffmann'], [2, 'Personal'], [2, 'Rechnungswesen']];
  LS.s13 = function (o) {
    var a;
    if (o.st === 'after') { return P.mocks.m8(); }
    a = chrome('05 | Team und Organisation', 'Unsere Organisation', null, false);
    if (o.st === 'pane') {
      a.push(R(1.52, 4.2, 9.2, 12.4, { fill: '#fff', stroke: '#a19f9d', sw: 0.08 }), T(1.8, 4.3, 8.6, 1.0, 'Textbereich', 14, { b: 1, c: '#555', va: 'm' }));
      ORGL.slice(0, 10).concat([[2, 'Nachhaltigkeitsmanagement']]).forEach(function (r, k) { a.push(T(1.8 + r[0] * 0.8, 5.5 + k * 0.95, 8.9 - r[0] * 0.8, 0.9, '• ' + r[1], 10, { va: 'm', c: r[1] === 'Nachhaltigkeitsmanagement' ? OR : C.anth, b: r[1] === 'Nachhaltigkeitsmanagement' })); });
      a.push(R(11.5, 4.2, 21.2, 12.4, { stroke: '#a19f9d', sw: 0.06, dash: 1 })); a = a.concat(org(12.0, 0.62, true));
      return S(a);
    }
    a.push(T(1.52, 4.19, 17.78, 12.95, ORGL.map(function (r) { return '<div style="padding-left:' + (r[0] * 1.0 + 0.9) + 'em;text-indent:-0.9em">•&nbsp;&nbsp;' + r[1] + '</div>'; }).join(''), 15));
    a.push(R(21.34, 4.32, 11.0, 4.95, { fill: '#FDF0CC', r: 0.4 }), T(21.8, 4.8, 10.2, 4.2, '<b style="color:' + C.petrol + '">Hinweis der Geschäftsführung</b><br>Zum 01.01.2027 wird im Bereich Produktion die neue Abteilung Nachhaltigkeitsmanagement eingerichtet.', 15));
    if (o.sel) { a = a.concat(sel(1.52, 4.19, 17.78, 12.95)); }
    if (o.hl) { a.push(dash(21.0, 4.0, 11.7, 5.6), tag(21.34, 9.6, 11.4, '← neue Abteilung: unter Produktion!')); }
    return S(a);
  };

  /* ---- Folie 4: Unser Weg (fünf Stationen = je Jahr + Marke + Ereignis) */
  var WEG = [['2004', 'Gründung als Ingenieurbüro für Lichtplanung', 0.89, 0.76, 3.17], ['2009', 'Erste eigene LED-Leuchtenserie', 7.49, 7.37, 9.78], ['2015', 'Eröffnung des Showrooms in Berlin', 14.1, 13.97, 16.38], ['2020', 'Showroom Frankfurt und Onlineshop', 20.7, 20.57, 22.99], ['2025', 'Klimaneutrale Fertigung in Bonn', 27.3, 27.18, 29.59]];
  function wegBox(i) { var w = WEG[i]; return [w[3] - 0.15, 6.1, 5.84 + 0.3, 7.9]; }
  LS.s4 = function (o) {
    var a = chrome('01 | Über uns', 'Unser Weg', null, false);
    a.push(L(2.29, 9.14, 31.5, 9.14, C.petrol, 0.11));
    WEG.forEach(function (w, i) {
      var b = wegBox(i);
      if (o.ghost && o.ghost.indexOf(i) > -1) { a.push(R(b[0], b[1], b[2], b[3], { stroke: '#b9c7c6', sw: 0.1, dash: 1 }), T(b[0], 12.0, b[2], 1.0, 'noch nicht sichtbar', 12, { c: C.acc4, al: 'c', va: 'm', i: 1 })); return; }
      a.push(T(w[2], 6.22, 5.59, 1.78, w[0], 30, { b: 1, c: C.petrol, al: 'c', va: 'm' }), E(w[4], 8.64, 1.02, 1.02, { fill: C.bern, stroke: '#fff', sw: 0.13 }), T(w[3], 10.29, 5.84, 3.56, w[1], 15, { al: 'c' }));
      if (o.groups) { a.push(R(b[0], b[1], b[2], b[3], { stroke: BL, sw: 0.1, dash: 1 })); }
    });
    if (o.sel !== undefined && o.sel !== null) { var s = wegBox(o.sel); a = a.concat(sel(s[0], s[1], s[2], s[3])); }
    if (o.band !== undefined) { var q = wegBox(o.band); a.push(R(q[0] - 0.1, 5.9, q[2] + 0.2, 8.4, { fill: 'rgba(59,130,246,0.12)', stroke: BL, sw: 0.1, dash: 1 })); }
    (o.badge || []).forEach(function (n, i) { if (n) { var b = wegBox(i); a.push(R(b[0] - 0.05, 6.1, 0.85, 0.85, { fill: '#fff', stroke: OR, sw: 0.1 }), T(b[0] - 0.05, 6.1, 0.85, 0.85, String(n), 14, { b: 1, c: OR, al: 'c', va: 'm' })); } });
    if (o.show) { a.push(T(0, 16.4, 33.87, 1.2, '▶ Bildschirmpräsentation — ' + o.show, 20, { b: 1, c: OR, al: 'c', va: 'm' })); }
    return S(a);
  };

  /* ---- neue Folie „Unsere Standorte“ (Aufgabe B1) */
  var STAND = [['Bonn-Beuel', 'Hauptsitz'], ['Berlin', 'Showroom'], ['Frankfurt am Main', 'Showroom']];
  LS.sB1 = function (o) {
    var a = chrome('01 | Über uns', o.title || 'Unsere Standorte', null, false), X = [1.52, 12.04, 22.56], i, st = o.st || 'empty';
    if (st === 'copy') { a.push(T(1.52, 4.32, 19.3, 8.0, STECK, 16, { c: '#9a9a9a' }), IM('photo-firmensitz.jpg', 22.23, 4.32, 10.11, 10.95), dash(1.3, 4.1, 19.8, 12.6), tag(1.52, 17.0, 20, 'Steckbrief und Bild löschen', OR)); }
    if (st === 'stack') { for (i = 2; i >= 0; i--) { a = a.concat(svcCard(1.52 + i * 1.0, 6.22 + i * 0.7, 0)); } }
    if (st === 'filled' || st === 'dark') {
      for (i = 0; i < 3; i++) {
        a.push(R(X[i], 7.55, 9.78, 8.7, { fill: C.grau, r: 0.55 }), E(X[i] + 0.89, 8.55, 2.41, 2.41, { fill: C.petrol2 }), IM('icon-pin' + (st === 'dark' ? '' : '-white') + '.png', X[i] + 1.42, 9.08, 1.35, 1.35), T(X[i] + 0.89, 11.35, 8.1, 1.9, STAND[i][0], 19, { b: 1, c: C.petrol }), T(X[i] + 0.89, 13.2, 8.1, 2.8, STAND[i][1], 15));
      }
      if (o.sel === 'circle') { a = a.concat(sel(X[0] + 0.89, 8.55, 2.41, 2.41), sel(X[0] + 1.42, 9.08, 1.35, 1.35)); }
      if (o.sel === 'all') { for (i = 0; i < 3; i++) { a = a.concat(sel(X[i] - 0.15, 7.4, 10.08, 9.0)); } }
      if (o.guide) { a.push(L(0.4, 7.55, 33.5, 7.55, OR, 0.1, 1), tag(1.52, 6.4, 20, 'oben auf einer Höhe · gleiche Abstände')); }
    }
    return S(a);
  };

  /* ---- Folie 14: Ausbildung (Ebenen) */
  LS.s14 = function (o) {
    var fixed = o.st === 'fixed', a = chrome('05 | Team und Organisation', 'Ausbildung bei LUMIO', null, false), bw = fixed ? 17.6 : 14.99;
    a.push(IM('photo-ausbildung.jpg', 1.52, 4.06, 30.81, 13.25));
    if (fixed) { a.push(R(2.54, 5.0, bw, 11.5, { fill: '#fff', r: 0.2 })); } else { a.push(R(2.54, 5.21, bw, 10.16, { stroke: '#fff', sw: 0.12, dash: 1 })); }
    a.push(T(3.3, fixed ? 5.5 : 5.84, bw - 1.5, fixed ? 10.5 : 8.89, '<b style="font-size:' + (fixed ? 1.2 : 1.18) + 'em">Wir bilden aus:</b><br>• Kaufleute für Büromanagement<br>• Industriekaufleute<br>• Elektronikerinnen und Elektroniker für Geräte und Systeme<br>• Technische Produktdesignerinnen und -designer<br><br><b>10 Ausbildungsplätze pro Jahr | Übernahmequote 2025: 95 %</b>', fixed ? 20 : 17, { c: C.petrol }));
    if (o.sel === 'photo') { a = a.concat(sel(1.52, 4.06, 30.81, 13.25)); }
    if (o.note) { a.push(tag(14.0, 16.9, 18, o.note, fixed ? '#0f766e' : RED)); }
    return S(a);
  };

  /* ---- Folie 2: Agenda */
  var AGENDA = [['01', 'Über uns'], ['02', 'Werte und Ziele'], ['03', 'Produkte und Services'], ['04', 'Partner und Kunden'], ['05', 'Team und Organisation'], ['06', 'Kontakt']];
  LS.s2 = function (o) {
    var a = chrome('Überblick', 'Agenda', null, false), i, x, y;
    for (i = 0; i < 6; i++) {
      x = [1.52, 12.04, 22.56][i % 3]; y = i < 3 ? 4.45 : 10.29;
      a.push(R(x, y, 9.78, 4.95, { fill: C.grau, r: 0.55 }), T(x + 0.49, y, 9.0, 4.95, '<span style="font-size:1.58em;color:' + C.petrol2 + '">' + AGENDA[i][0] + '</span><br>' + AGENDA[i][1], 19, { b: 1, c: C.petrol, va: 'm' }));
      if (o.links && o.links > i) { a.push(T(x + 8.2, y + 0.3, 1.4, 1.2, '🔗', 18, { c: OR, al: 'c', va: 'm' })); }
    }
    if (o.sel !== undefined && o.sel !== null) { x = [1.52, 12.04, 22.56][o.sel % 3]; y = o.sel < 3 ? 4.45 : 10.29; a = a.concat(sel(x, y, 9.78, 4.95)); }
    if (o.hand !== undefined) { x = [1.52, 12.04, 22.56][o.hand % 3]; y = o.hand < 3 ? 4.45 : 10.29; a.push(T(x + 6.0, y + 3.0, 3.0, 2.4, '👆', 44, { al: 'c', va: 'm' }), tag(x - 0.5, y - 1.0, 12, 'Klick → springt zur Folie ' + o.to)); }
    if (o.show) { a.push(T(0, 16.4, 33.87, 1.2, '▶ Bildschirmpräsentation — Links funktionieren nur hier', 20, { b: 1, c: OR, al: 'c', va: 'm' })); }
    return S(a);
  };

  /* ---- Folie 12: Kontakt */
  LS.s12 = function (o) {
    var a = chrome('06 | Kontakt', 'Kontakt', null, false), D = [['pin', 'Lichtstraße 8, 53227 Bonn'], ['phone', '0228 45678-0'], ['mail', 'info@lumio-licht.de'], ['globe', 'www.lumio-licht.de']], Y = [4.7, 7.54, 10.39, 13.23], i, cc = o.ok ? C.petrol2 : '#4472C4';
    D.forEach(function (d, k) {
      a.push(E(1.52, Y[k], 1.91, 1.91, { fill: cc }), IM('icon-' + d[0] + '-white.png', 2.01, Y[k] + 0.49, 0.94, 0.94), T(4.06, Y[k], 14.22, 1.91, (o.under && (k === 2 || k === 3)) ? '<u style="color:#0563C1">' + d[1] + '</u>' : d[1], 18, { va: 'm' }));
    });
    a.push(R(20.07, 4.7, 12.27, 10.03, { fill: C.petrol, r: 0.5 }), T(20.9, 5.4, 10.8, 8.8, '<span style="color:' + C.acc5 + '">Ihr Ansprechpartner</span><br><b style="font-size:1.7em;color:#fff">Ömer Kaya</b><br><span style="color:#fff">Leitung Vertrieb<br><br>Telefon 0228 45678-120<br>o.kaya@lumio-licht.de</span>', 16));
    if (o.sel === 'circles') { for (i = 0; i < 4; i++) { a = a.concat(sel(1.52, Y[i], 1.91, 1.91)); } }
    if (o.sel === 'pin') { a = a.concat(sel(2.01, Y[0] + 0.49, 0.94, 0.94)); }
    if (o.sel === 'web') { a = a.concat(sel(4.06, Y[3], 14.22, 1.91)); }
    if (o.sel === 'mail') { a = a.concat(sel(4.06, Y[2], 14.22, 1.91)); }
    if (o.tipw) { a.push(tag(8.5, 15.4, 14, 'Cursor wird zur Hand ☝', OR)); }
    return S(a);
  };

  /* ---- Foliensortierung (16 Kacheln) */
  var SL = { 1: ['Gutes Licht für jeden Raum', ''], 2: ['Agenda', ''], 3: ['Über uns', '01'], 4: ['Unser Weg', '01'], 5: ['Unsere Werte', '02'], 6: ['Unsere Ziele bis 2030', '02'], 7: ['Unsere Leuchten', '03'], 8: ['Unsere Services', '03'],
    9: ['LUMIO in Zahlen', '01'], 10: ['Vom Bauteil zur fertigen Leuchte', '04'], 11: ['Unsere wichtigsten Lieferanten', '04'], 12: ['Kontakt', '06'], 13: ['Unsere Organisation', '05'], 14: ['Ausbildung bei LUMIO', '05'], 15: ['Vielen Dank für Ihren Besuch', ''], 16: ['Material für die Fertigstellung', 'Intern'] };
  LS.sorter = function (o) {
    var ord = o.order || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], a = [R(0, 0, 33.87, 19.05, { fill: '#e9edf1' })], pos = {};
    ord.forEach(function (id, i) {
      var cx = i % 6, cy = Math.floor(i / 6), x = 0.45 + cx * 5.62, y = 1.0 + cy * 5.7, dk = (id === 1 || id === 15), fl = o.flag && o.flag[id], d = SL[id];
      pos[id] = [x, y];
      a.push(R(x, y, 5.0, 2.81, { fill: dk ? C.petrol : (id === 16 ? '#d9dee2' : '#fff'), stroke: fl ? OR : '#9aa7b5', sw: fl ? 0.2 : 0.06 }), T(x + 0.25, y + 0.2, 4.5, 2.4, d[0], 11, { b: 1, c: dk ? '#fff' : C.petrol, va: 'm' }));
      if (d[1] && !dk) { a.push(E(x + 0.2, y + 2.05, 0.55, 0.55, { fill: C.bern }), T(x + 0.85, y + 2.0, 1.8, 0.65, d[1], 9, { b: 1, c: C.petrol2, va: 'm' })); }
      a.push(T(x, y + 2.9, 5.0, 0.9, '<b>' + (i + 1) + '</b>' + (o.stars ? ' &nbsp;<span style="color:' + OR + '">★</span>' : ''), 14, { al: 'c', va: 'm' }));
      if (fl) { a.push(T(x - 0.2, y + 3.75, 5.4, 0.9, fl, 11, { b: 1, c: OR, al: 'c', va: 'm' })); }
      if (o.del === id) { a.push(R(x, y, 5.0, 2.81, { fill: 'rgba(255,255,255,0.65)' }), T(x, y, 5.0, 2.81, '✕', 50, { b: 1, c: RED, al: 'c', va: 'm' })); }
    });
    (o.drag || []).forEach(function (d) {   // [von-id, nach-Kachelindex]
      var p = pos[d[0]], tx = 0.45 + (d[1] % 6) * 5.62 - 0.35, ty = 1.0 + Math.floor(d[1] / 6) * 5.7 + 1.4;
      a.push(L(p[0] + 2.5, p[1] + 1.4, tx, ty, OR, 0.18), { t: 'poly', fill: OR, pts: [[tx, ty - 0.45], [tx - 0.9, ty], [tx, ty + 0.45]] });
    });
    if (o.cap) { a.push(T(0.6, 17.3, 32.6, 1.5, o.cap, 18, { b: 1, c: OR, va: 'm' })); }
    return S(a);
  };

  /* ---- Folienmaster: Layout „LU Inhalt“ */
  LS.master = function (o) {
    var a = [R(0, 0, 33.87, 19.05, { fill: '#e6e6e6' }), R(0, 0, 6.8, 19.05, { fill: '#d4d4d4' })], X0 = 7.6, Y0 = 2.0, W = 24.6, H = 13.84, s = W / 33.87, ys = [3.3, 5.7, 8.1, 10.5], fills = [C.petrol, '#fff', C.petrol, '#fff'], i;
    a.push(R(0.7, 0.5, 4.2, 2.36, { fill: '#fff', stroke: '#a8a8a8', sw: 0.05 }));
    for (i = 0; i < 4; i++) { a.push(R(0.7, ys[i], 4.2, 2.0, { fill: fills[i], stroke: i === 1 ? OR : '#a8a8a8', sw: i === 1 ? 0.2 : 0.05 })); }
    a.push(T(5.0, 5.7, 1.7, 2.0, '◀', 22, { c: OR, b: 1, va: 'm', al: 'c' }), T(X0, 0.3, 25, 1.5, 'Layout „LU Inhalt“ (benutzt von den Folien 2–14 und 16)', 20, { b: 1, c: '#444' }));
    a.push(R(X0, Y0, W, H, { fill: '#fff', stroke: '#999', sw: 0.06 }), E(X0 + 1.52 * s, Y0 + 0.89 * s, 0.56 * s, 0.56 * s, { fill: C.bern }), R(X0 + 2.34 * s, Y0 + 0.76 * s, 14 * s, 0.81 * s, { stroke: '#9a9a9a', sw: 0.05, dash: 1 }),
      R(X0 + 1.52 * s, Y0 + 1.57 * s, 25.4 * s, 1.91 * s, { stroke: '#9a9a9a', sw: 0.05, dash: 1 }), T(X0 + 1.52 * s, Y0 + 1.57 * s, 25.4 * s, 1.91 * s, 'Mastertitelformat bearbeiten', 18, { b: 1, c: C.petrol, va: 'm' }),
      T(X0 + 1.52 * s, Y0 + 17.73 * s, 17 * s, 0.76 * s, 'LUMIO Licht &amp; Design GmbH | Unternehmenspräsentation 2026', 8, { c: C.acc4, va: 'm' }), R(X0 + 30.56 * s, Y0 + 17.6 * s, 1.78 * s, 0.89 * s, { stroke: '#9a9a9a', sw: 0.05, dash: 1 }));
    if (o.logo === 'paste') { a.push(IM('lumio-logo-dark.png', X0 + 1.52 * s, Y0 + 4.83 * s, 7.62 * s, 1.78 * s)); a = a.concat(sel(X0 + 1.52 * s, Y0 + 4.83 * s, 7.62 * s, 1.78 * s)); }
    if (o.logo === 'small') {
      a.push(IM('lumio-logo-dark.png', X0 + 27.55 * s, Y0 + 0.55 * s, 4.79 * s, 1.12 * s), dash(X0 + 27.3 * s, Y0 + 0.3 * s, 5.3 * s, 1.62 * s));
      a.push(L(X0 + 26.9 * s, Y0 + 0.2 * s, X0 + 26.9 * s, Y0 + 1.9 * s, RED, 0.08, 1), tag(X0 + 14 * s, Y0 + 2.9 * s, 14, 'Titel endet bei 26,9 cm — Logo berührt ihn nicht', OR));
    }
    return S(a);
  };

  /* ---- Tabellengröße wählen */
  LS.grid = function (o) {
    var a = [R(0, 0, 33.87, 19.05, { fill: '#fff' }), T(2, 0.4, 20, 1.8, 'Tabelle einfügen', 24, { b: 1 })], r, c, on, cs = o.c || 5, rs = o.r || 5;
    for (r = 0; r < 8; r++) { for (c = 0; c < 10; c++) { on = c < cs && r < rs; a.push(R(2 + c * 2.1, 3 + r * 2.0, 1.9, 1.8, { fill: on ? '#cfe3f7' : '#fff', stroke: on ? BL : '#9aa7b5', sw: 0.08 })); } }
    a.push(T(24.5, 5, 9, 4, cs + ' × ' + rs + '<br>Tabelle', 30, { b: 1, c: OR, va: 'm' }));
    return S(a);
  };

  P.luKit = {
    OR: OR,
    MENU_SHAPES: ['Rechteck', 'Rechteck: abgerundete Ecken', 'Oval', 'Pfeil: nach rechts', '…'],
    MENU_GRP: ['Gruppieren', 'Gruppierung aufheben', 'Erneut gruppieren'],
    MENU_ARR: ['Nach vorne bringen ▸', 'Nach hinten senden ▸', '-', 'Auswahlbereich', 'Ausrichten ▸', 'Gruppieren ▸', 'Drehen ▸'],
    MENU_CTX_PIC: ['Ausschneiden', 'Kopieren', 'Einfügeoptionen:', '-', 'Gruppieren ▸', 'In den Vordergrund ▸', 'In den Hintergrund ▸', '-', 'Link ▸', 'Größe und Position…', 'Grafik formatieren…']
  };
})(window.PPT);
