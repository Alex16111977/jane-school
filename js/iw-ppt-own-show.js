/* PowerPoint-Klassenarbeit — КАДРЫ к заданиям C1–C14 (карточка pp5 «Твоя презентация Schulbeginn»).
   Тот же движок, что «Начни здесь» на карточке Kann-Liste (js/iw-ppt-show.js): лента с подсвеченной кнопкой, выпадающий список, палитра, окно, миниатюра слайда.
   Отличия: миниатюры — ЕЁ слайды (размеры из файла, см), палитра — ЕЁ тема «Office» (theme1.xml), окна — Speichern unter, Ersetzen, Link … .
   ВАЖНО: это СХЕМА по знанию интерфейса Microsoft 365 (немецкий) и справке Microsoft, НЕ скриншоты; в самом PowerPoint не проверено.
   Подключается ПОСЛЕ iw-ppt-show.js и ДО iw-ppt-own.js. Разметка в текстах:  **fett**  [[Taste]]. */
window.PPT = window.PPT || {};
(function (P) {
  'use strict';
  var K = P.showKit; if (!K) { return; }
  var RB = K.RB, SC = K.SC, SV = K.sv, btn = K.btn, cbx = K.cbx, fld = K.fld, grp = K.grp, col = K.col, row = K.row, gal = K.gal, MENU_AL = K.MENU_AL;

  /* Designfarben der Datei (theme1.xml: altes «Office»-Design): lt1, dk1, lt2, dk2, accent1…6 */
  var OFFICE = [['Hintergrund 1', '#FFFFFF'], ['Text 1', '#000000'], ['Hintergrund 2', '#EEECE1'], ['Text 2', '#1F497D'], ['Akzent 1', '#4F81BD'], ['Akzent 2', '#C0504D'],
    ['Akzent 3', '#9BBB59'], ['Akzent 4', '#8064A2'], ['Akzent 5', '#4BACC6'], ['Akzent 6', '#F79646']];

  /* ------------------------------------------------------------------ zusätzliche Ribbon-Gruppen */
  RB['Start']['Folien'] = function () { return grp('Folien', btn('newslide', 'Neue Folie', '➕', { dd: 1 }) + col(btn('layout', 'Layout', '▦', { dd: 1 }), btn('resetsl', 'Zurücksetzen', '↺'))); };
  RB['Start']['Absatz'] = function () {
    return grp('Absatz', col(
      row(btn('bul', '', '☰', { dd: 1, tip: 'Aufzählungszeichen' }), btn('num', '', '1.', { dd: 1, tip: 'Nummerierung' }), btn('lvlm', '', '⇤', { tip: 'Listenebene verringern' }), btn('lvlp', '', '⇥', { tip: 'Listenebene erhöhen' })),
      row(btn('smart', 'In SmartArt-Grafik konvertieren', '▣', { dd: 1 }))));
  };
  RB['Start']['Bearbeiten'] = function () { return grp('Bearbeiten', col(btn('find', 'Suchen', '🔎'), btn('repl', 'Ersetzen', '⇄', { dd: 1 }), btn('selo', 'Auswählen', '▢', { dd: 1 }))); };
  RB['Start']['Schrift40'] = function () {
    return grp('Schriftart', col(row(cbx('font', 'Calibri', 7.5), cbx('size', '40', 3.2)),
      row(btn('bold', '', 'F', { cls: 'fb', tip: 'Fett' }), btn('ital', '', 'K', { cls: 'fi' }), btn('und', '', 'U', { cls: 'fu' }), btn('fcol', '', 'A', { dd: 1, bar: 1, tip: 'Schriftfarbe' }))));
  };
  RB['Formformat']['Größe18'] = function () { return grp('Größe', col(fld('h', 'Höhe:', '3,4 cm'), fld('w', 'Breite:', '18,0 cm'))); };
  RB['Formformat']['Größe30'] = function () { return grp('Größe', col(fld('h', 'Höhe:', '3,4 cm'), fld('w', 'Breite:', '30,0 cm'))); };
  RB['Formformat']['GrößeKarte'] = function () { return grp('Größe', col(fld('h', 'Höhe:', '6,2 cm'), fld('w', 'Breite:', '6,6 cm'))); };
  RB['Formformat']['GrößeKreis'] = function () { return grp('Größe', col(fld('h', 'Höhe:', '3,0 cm'), fld('w', 'Breite:', '3,0 cm'))); };
  RB['Bildformat']['Größe12'] = function () { return grp('Größe', btn('crop', 'Zuschneiden', '⌗', { dd: 1 }) + col(fld('h', 'Höhe:', '12,0 cm'), fld('w', 'Breite:', '12,0 cm'))); };
  RB['Bildformat']['Bildformatvorlagen'] = function () { return grp('Bildformatvorlagen', gal() + col(btn('bborder', 'Bildrahmen', '▭', { dd: 1 }), btn('beff', 'Bildeffekte', '✦', { dd: 1 }), btn('blay', 'Bildlayout', '▦', { dd: 1 }))); };
  RB['Grafikformat'] = {
    'Grafikformatvorlagen': function () { return grp('Grafikformatvorlagen', col(btn('gfill', 'Grafikfüllung', '◼', { dd: 1 }), btn('gline', 'Grafikkontur', '▭', { dd: 1 }), btn('geff', 'Grafikeffekte', '✦', { dd: 1 }))); },
    'Größe': function () { return grp('Größe', col(fld('h', 'Höhe:', '1,6 cm'), fld('w', 'Breite:', '1,6 cm'))); }
  };
  RB['Einfügen'] = {
    'Folien': function () { return grp('Folien', btn('newslide', 'Neue Folie', '➕', { dd: 1 })); },
    'Tabellen': function () { return grp('Tabellen', btn('table', 'Tabelle', '▦', { dd: 1 })); },
    'Bilder': function () { return grp('Bilder', btn('pics', 'Bilder', '🖼', { dd: 1 })); },
    'Illustrationen': function () { return grp('Illustrationen', btn('shapes', 'Formen', '△', { dd: 1 }) + btn('icons', 'Piktogramme', '☺') + btn('smartins', 'SmartArt', '▣')); },
    'Links': function () { return grp('Links', btn('link', 'Link', '🔗', { dd: 1 })); },
    'Text': function () { return grp('Text', btn('tbox', 'Textfeld', 'A') + col(btn('hf', 'Kopf- und Fußzeile', '▤'), btn('sldnum', 'Foliennummer', '#'))); }
  };
  RB['Ansicht'] = {
    'Präsentationsansichten': function () { return grp('Präsentationsansichten', btn('outl', 'Gliederung', '☰') + btn('sorter', 'Foliensortierung', '▦') + btn('notesp', 'Notizenseite', '🗒')); },
    'Masteransichten': function () { return grp('Masteransichten', btn('master', 'Folienmaster', '▤') + col(btn('hmaster', 'Handzettelmaster', '▫'), btn('nmaster', 'Notizenmaster', '▫'))); },
    'Anzeigen': function () { return grp('Anzeigen', col(btn('ruler', 'Lineal', '☐'), btn('gridl', 'Gitternetzlinien', '☐'), btn('guides', 'Führungslinien', '☐')) + btn('notes', 'Notizen', '🗒')); }
  };
  RB['Folienmaster'] = {
    'Hintergrund': function () { return grp('Hintergrund', col(btn('mcol', 'Farben', '🎨', { dd: 1 }), btn('mfont', 'Schriftarten', 'A', { dd: 1 })) + col(btn('mbg', 'Hintergrundformate', '▨', { dd: 1 }), btn('hidebg', 'Hintergrundgrafiken ausblenden', '☐'))); },
    'Schließen': function () { return grp('Schließen', btn('closemaster', 'Masteransicht schließen', '✕')); }
  };
  RB['Entwurf'] = {
    'Varianten': function () { return grp('Varianten', gal() + col(btn('vcol', 'Farben', '🎨', { dd: 1 }), btn('vfont', 'Schriftarten', 'A', { dd: 1 }), btn('veff', 'Effekte', '✦', { dd: 1 }))); }
  };
  RB['Übergänge'] = {
    'Übergang zu dieser Folie': function () { return grp('Übergang zu dieser Folie', btn('tnone', 'Keine', '▭') + btn('tfade', 'Verblassen', '◐') + btn('tpush', 'Schieben', '⇢') + btn('twipe', 'Wischen', '▤')); },
    'Anzeigedauer': function () { return grp('Anzeigedauer', col(fld('tdur', 'Dauer:', '00,70'), btn('tall', 'Für alle übernehmen', '⧉'))); }
  };
  RB['Animationen'] = {
    'Animation': function () { return grp('Animation', btn('anone', 'Keine', '▭') + btn('aappear', 'Erscheinen', '✦') + btn('afade', 'Verblassen', '◐') + btn('aopt', 'Effektoptionen', '▾', { dd: 1 })); },
    'Erweiterte Animation': function () { return grp('Erweiterte Animation', col(btn('apane', 'Animationsbereich', '☰'), btn('aadd', 'Animation hinzufügen', '➕', { dd: 1 }))); },
    'Anzeigedauer': function () { return grp('Anzeigedauer', col(btn('astart', 'Start: Beim Klicken', '▸', { dd: 1 }), fld('adur', 'Dauer:', '00,50'))); }
  };
  RB['Tabellenentwurf'] = {
    'Tabellenformatoptionen': function () { return grp('Tabellenformatoptionen', col(btn('hdr', 'Kopfzeile', '☑'), btn('tot', 'Ergebniszeile', '☐'), btn('band', 'Gebänderte Zeilen', '☑'))); },
    'Tabellenformatvorlagen': function () { return grp('Tabellenformatvorlagen', gal()); }
  };
  RB['Layout'] = {
    'Zellengröße': function () { return grp('Zellengröße', col(fld('ch', 'Höhe:', '1,5 cm'), fld('cw', 'Breite:', '13 cm'))); },
    'Ausrichtung': function () { return grp('Ausrichtung', btn('alt', '', '⫷') + btn('alc', '', '☰') + btn('alb', '', '⫸') + btn('vmid', '', '⬍', { tip: 'Vertikal zentrieren' })); }
  };
  RB['SmartArt-Entwurf'] = {
    'SmartArt-Formatvorlagen': function () { return grp('SmartArt-Formatvorlagen', btn('sacol', 'Farben ändern', '🎨', { dd: 1 }) + gal()); }
  };

  /* ------------------------------------------------------------------ Mini-Folien: DEINE Folien (SVG in cm wie in der Datei: 33,87 × 19,05) */
  var BG = '#F7F9FC', B1 = '#206493', B2 = '#183A57', B3 = '#325F7E', TX = '#2D3945', OR = '#FB923C', BL = '#3b82f6', GR = '#16a34a', RED = '#ef4444', VIO = '#a855f7';
  function ex(e, o) { var k; for (k in (o || {})) { e[k] = o[k]; } return e; }
  function R(x, y, w, h, o) { return ex({ t: 'rect', x: x, y: y, w: w, h: h }, o); }
  function E(x, y, w, h, o) { return ex({ t: 'ell', x: x, y: y, w: w, h: h }, o); }
  function L(x1, y1, x2, y2, c, sw, dash) { return { t: 'line', x1: x1, y1: y1, x2: x2, y2: y2, color: c, sw: sw || 0.1, dash: dash }; }
  function T(x, y, w, h, html, pt, o) { o = o || {}; return { t: 'txt', x: x, y: y, w: w, h: h, html: html, pt: pt, b: o.b, color: o.c || TX, al: o.al, va: o.va, pad: o.pad == null ? 0.25 : o.pad }; }
  function S(a) { return P.svg(a, 'Слайд твоей презентации (схема)'); }
  function sel(x, y, w, h) {
    var a = [R(x, y, w, h, { stroke: BL, sw: 0.1 })];
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h], [x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]].forEach(function (q) { a.push(R(q[0] - 0.28, q[1] - 0.28, 0.56, 0.56, { fill: '#fff', stroke: BL, sw: 0.08 })); });
    return a;
  }
  function guide(x, c) { return L(x, 0.3, x, 18.75, c, 0.1); }
  function chrome(title) {
    var a = [R(0, 0, 33.87, 19.05, { fill: BG }), R(0, 0, 0.46, 19.05, { fill: B1 })];
    if (title) { a.push(T(2.16, 1.65, 29.97, 3.43, title, 37, { b: 1, c: B2 })); }
    return a;
  }
  function bl(arr, typed) { return arr.map(function (s) { return '<div style="margin-bottom:.35em">' + (typed ? '•&nbsp;&nbsp;' : '') + s + '</div>'; }).join(''); }
  function blr(arr) { return arr.map(function (s) { return '<div style="margin-bottom:.35em;padding-left:1em;text-indent:-1em"><span style="color:' + B1 + '">•</span>&nbsp;' + s + '</div>'; }).join(''); }
  var BUL4 = ['Unterricht beginnt bei uns um 8:00 Uhr', 'Viele Schüler sind morgens müde', 'Frage: Sollte die Schule später beginnen?', 'Ziel: Vorteile und Probleme vergleichen'];

  SV.s2 = function (o) {
    var al = !!o.al, bx = al ? 2.16 : 2.67, nx = al ? 2.16 : 2.29, bw = al ? 29.97 : 28.7, a = chrome('1. Das Anliegen definieren'), s = o.sel || '';
    a.push(T(bx, 5.33, bw, 11.68, o.typed === 0 ? blr(BUL4) : bl(BUL4, true), 19));
    a.push(T(nx, 17.53, 25.4, 0.89, o.num || '2 / 12', 18));
    if (o.guides === 'bad') {
      a.push(guide(2.16, OR), guide(2.29, RED), guide(2.67, VIO), T(21.6, 6.2, 11.9, 5.6, '<span style="color:' + OR + '">▍Titel <b>2,16</b></span><br><span style="color:' + RED + '">▍Nummer <b>2,29</b></span><br><span style="color:' + VIO + '">▍Text <b>2,67</b> cm</span>', 22, { va: 'm' }));
    }
    if (o.guides === 'ok') { a.push(guide(2.16, GR), T(21.6, 7.0, 11.9, 3.6, '✅ alle Kanten bei <b>2,16 cm</b>', 22, { c: '#15803d', va: 'm' })); }
    if (s.indexOf('t') > -1) { a = a.concat(sel(2.16, 1.65, 29.97, 3.43)); }
    if (s.indexOf('b') > -1) { a = a.concat(sel(bx, 5.33, bw, 11.68)); }
    if (s.indexOf('n') > -1) { a = a.concat(sel(nx, 17.53, 25.4, 0.89)); }
    if (s.indexOf('s') > -1) { a = a.concat(sel(0, 0, 0.46, 19.05)); }
    if (o.lock) { a.push(T(1.0, 12.4, 15, 3.2, '🔒 Streifen kommt aus dem Master — hier nicht anklickbar', 20, { c: OR, b: 1 })); }
    return S(a);
  };

  function scene(x, y, w, h) {
    return [R(x, y, w, h, { fill: '#bfdcf5' }), E(x + w * 0.66, y + h * 0.1, h * 0.2, h * 0.2, { fill: '#F7CF66' }),
      { t: 'poly', fill: '#7fb069', pts: [[x, y + h], [x, y + h * 0.68], [x + w * 0.4, y + h * 0.52], [x + w, y + h * 0.7], [x + w, y + h]] },
      R(x + w * 0.3, y + h * 0.6, w * 0.42, h * 0.2, { fill: '#F2A900', r: 0.2 }), R(x + w * 0.34, y + h * 0.64, w * 0.1, h * 0.08, { fill: '#fff' }), R(x + w * 0.5, y + h * 0.64, w * 0.1, h * 0.08, { fill: '#fff' })];
  }
  function photoEls(st) {
    var a;
    if (st === 'wide') { return scene(20.2, 3.0, 12.4, 9.3); }
    if (st === 'crop') {
      a = scene(20.2, 3.0, 12.4, 9.3);
      a.push(R(20.2, 3.0, 1.55, 9.3, { fill: 'rgba(0,0,0,0.5)' }), R(31.05, 3.0, 1.55, 9.3, { fill: 'rgba(0,0,0,0.5)' }));
      [[21.75, 3.0], [31.05, 3.0], [21.75, 12.3], [31.05, 12.3]].forEach(function (q) { a.push(R(q[0] - 0.1, q[1] - 0.1, 0.9, 0.22, { fill: '#000' }), R(q[0] - 0.1, q[1] - 0.1, 0.22, 0.9, { fill: '#000' })); });
      return a;
    }
    a = scene(20.2, 3.0, 12, 12);
    if (st === 'border') { a.push(R(20.2, 3.0, 12, 12, { stroke: B1, sw: 0.24 })); }
    return a;
  }
  SV.s1 = function (o) {
    var sx = o.al ? 2.16 : 2.54, ys = o.dist ? [1.65, 7.0, 12.4] : [1.65, 7.11, 12.83], w1 = o.narrow ? 18 : 29.97, w2 = o.narrow ? 18 : 27.94, a = chrome(null);
    a.push(T(2.16, ys[0], w1, 3.43, 'Soll die Schule später beginnen?', 37, { b: 1, c: B2 }));
    a.push(T(sx, ys[1], w2, 2.0, 'Ein Projekt planen · Politisches Engagement im Alltag', 27, { c: B3 }));
    a.push(T(sx, ys[2], w2, 1.52, 'von Ariana und Yevheniia', 23, { b: 1, c: '#1E3553' }));
    a.push(T(o.numx || 2.29, 17.53, 4, 0.89, o.num === '' ? '' : (o.num || '1 / 12'), 18));
    if (o.sel) { a = a.concat(sel(2.16, ys[0], w1, 3.43), sel(sx, ys[1], w2, 2.0), sel(sx, ys[2], w2, 1.52)); }
    if (o.guides) { a.push(guide(2.16, GR)); }
    if (o.photo) { a = a.concat(photoEls(o.photo)); }
    if (o.bad) { a.push(R(o.numx - 0.5, 17.2, 2.8, 1.5, { stroke: OR, sw: 0.12, dash: 1 }), T(o.numx - 17, 16.8, 16.3, 1.8, 'номер ещё стоит ✗ → Entf', 20, { c: OR, b: 1, al: 'r' })); }
    return S(a);
  };

  SV.master = function (o) {
    var a = [R(0, 0, 33.87, 19.05, { fill: '#e6e6e6' }), R(0, 0, 6.8, 19.05, { fill: '#d4d4d4' })], i, y, X0 = 7.6, Y0 = 2.0, W = 24.6, H = 13.84, s = W / 33.87;
    for (i = 0; i < 9; i++) {
      y = 0.5 + i * 2.0;
      a.push(R(0.7, y, 4.2, 1.7, { fill: '#fff', stroke: i === 7 ? OR : '#a8a8a8', sw: i === 7 ? 0.16 : 0.05 }));
    }
    a.push(T(5.0, 14.5, 1.8, 1.7, '◀', 22, { c: OR, b: 1, va: 'm', pad: 0 }), T(X0, 0.3, 25, 1.5, 'Layout „Blank / Leer“ (benutzt von Folie 1–12)', 20, { b: 1, c: '#444', pad: 0 }));
    a.push(R(X0, Y0, W, H, { fill: '#fff', stroke: '#999', sw: 0.06 }));
    if (o.stripe) {
      a.push(R(X0, Y0, 0.46 * s * 2, H, { fill: B1 }));
      if (o.hl) { a.push(R(X0 - 0.3, Y0 - 0.3, 0.46 * s * 2 + 0.6, H + 0.6, { stroke: OR, sw: 0.14, dash: 1 })); }
      if (o.sel) { a = a.concat(sel(X0, Y0, 0.46 * s * 2, H)); }
    }
    if (o.num) {
      var px = X0 + 18.2 * s, py = Y0 + 17.66 * s, pw = 5.93 * s, ph = 1.01 * s, rx = X0 + (33.87 - 2 - 5.93) * s;
      a.push(R(px, py, pw, ph, { stroke: '#7a7a7a', sw: 0.07, dash: 1 }), T(px, py, pw, ph, '‹#›', 16, { al: 'r', va: 'm', c: '#555' }));
      if (o.num === 'arrow') {
        a.push(L(px + pw * 0.5, py + ph + 0.5, rx + pw * 0.5, py + ph + 0.5, OR, 0.14), { t: 'poly', fill: OR, pts: [[rx + pw * 0.5 - 0.5, py + ph + 0.1], [rx + pw * 0.5 + 0.5, py + ph + 0.5], [rx + pw * 0.5 - 0.5, py + ph + 0.9]] }, R(rx, py, pw, ph, { stroke: OR, sw: 0.14, dash: 1 }));
      }
    }
    return S(a);
  };

  SV.sorter = function (o) {
    var D = [['Soll die Schule später beginnen?', '1 / 12', 1], ['1. Das Anliegen definieren', '2 / 12', 2], ['Unsere Schritte', '3 / 12', 3]], order = o.moved ? [0, 2, 1] : [0, 1, 2], a = [R(0, 0, 33.87, 19.05, { fill: '#e9edf1' })], i, x, d, bad;
    for (i = 0; i < 3; i++) {
      d = D[order[i]]; x = 1.0 + i * 11.0; bad = o.moved && d[2] !== i + 1;
      a.push(T(x, 2.6, 10, 1.6, 'Position ' + (i + 1), 24, { c: '#555', al: 'c', pad: 0 }), R(x, 4.6, 10, 5.62, { fill: BG, stroke: bad ? OR : '#9aa7b5', sw: bad ? 0.14 : 0.06 }), R(x, 4.6, 0.2, 5.62, { fill: B1 }),
        T(x + 0.6, 5.0, 9, 3, d[0], 22, { b: 1, c: B2, pad: 0.05 }), T(x, 10.7, 10, 1.8, 'напечатано «' + d[1] + '»' + (bad ? ' ✗' : ''), 24, { al: 'c', b: bad, c: bad ? OR : TX, pad: 0 }));
    }
    if (o.drag) { a.push(L(23.0, 3.4, 13.0, 3.4, OR, 0.16), { t: 'poly', fill: OR, pts: [[13.0, 2.9], [12.2, 3.4], [13.0, 3.9]] }, T(2, 14.0, 30, 2, 'слайд 3 перетащить на место 2', 26, { c: OR, b: 1, al: 'c' })); }
    return S(a);
  };

  var CARDS = [['8:00 Uhr', 'Unsere Schule'], ['7:30–9:00', 'Uhr — NRW (Sek. I/II) möglich'], ['ab 8:30 Uhr', 'Kalifornien (Highschools)'], ['8–10 Std.', 'Schlaf für 13–18-Jährige']];
  function card(x, y, i, o) {
    var a = [R(x, y, 6.6, 6.2, { fill: '#fff', stroke: B1, sw: 0.1, r: 0.5 })];
    if (!o.empty) { a.push(T(x, y + 1.0, 6.6, 2.2, CARDS[i][0], 30, { b: 1, c: B1, al: 'c', va: 'm' }), T(x + 0.3, y + 3.3, 6.0, 2.4, CARDS[i][1], 17, { al: 'c' })); }
    if (o.tb) { a.push(R(x + 0.4, y + 0.7, 5.8, 4.8, { stroke: BL, sw: 0.08, dash: 1 })); }
    if (o.grp) { a.push(R(x - 0.2, y - 0.2, 7.0, 6.6, { stroke: BL, sw: 0.12, dash: 1 })); }
    return a;
  }
  SV.s4 = function (o) {
    var a = chrome('Aktuelle Situation'), st = o.st || 'text', i, XS, YS;
    if (st === 'text') {
      a.push(T(2.67, 5.33, 28.7, 11.68, bl(['Unsere Schule: Beginn um 8:00 Uhr', 'NRW (Sek. I/II): 7:30 bis 9:00 Uhr möglich', 'Kalifornien: Highschools meist ab 8:30 Uhr', 'Jugendliche (13–18): 8–10 Stunden Schlaf empfohlen', 'Beispiel: 23:00–6:30 Uhr = 7,5 Stunden'], true), 19));
    } else if (st === 'card1') {
      a = a.concat(card(2.16, 5.9, 0, o));
      if (o.sel) { a = a.concat(sel(2.16, 5.9, 6.6, 6.2)); }
    } else {
      XS = o.ok ? [2.16, 9.86, 17.56, 25.26] : [2.16, 10.4, 17.1, 25.8]; YS = o.ok ? [5.9, 5.9, 5.9, 5.9] : [5.9, 6.9, 5.3, 6.4];
      for (i = 0; i < 4; i++) { a = a.concat(card(XS[i], YS[i], i, { grp: o.grp })); }
      if (o.ok) {
        for (i = 0; i < 3; i++) { a.push(L(XS[i] + 6.6, 12.9, XS[i + 1], 12.9, OR, 0.14)); }
        a.push(T(2.16, 13.2, 29.5, 1.5, 'gleiche Abstände · oben auf einer Höhe', 22, { c: OR, b: 1 }));
        if (!o.grp) { a.push(T(2.16, 15.3, 29.5, 1.5, 'Beispiel: 23:00–6:30 Uhr = 7,5 Stunden Schlaf', 19)); }
      }
    }
    return S(a);
  };

  var GLY = ['☾', '◎', '◷', '☀'], TIT = ['Mehr Schlaf', 'Aufmerksamkeit', 'Weniger Stress', 'Hellerer Schulweg'];
  SV.s5 = function (o) {
    var a = chrome('Vorteile eines späteren Beginns'), st = o.st || 'text', i, x;
    if (st === 'text') {
      a.push(T(2.67, 5.33, 28.7, 11.68, bl(['Mehr Zeit zum Schlafen möglich', 'Bessere Aufmerksamkeit im Unterricht', 'Weniger Stress am Morgen', 'Schulweg im Winter möglicherweise heller', 'Schlafmedizin: Beginn nicht vor 8:30 Uhr empfohlen'], true), 19));
      if (o.sel) { a = a.concat(sel(2.67, 5.33, 28.7, 11.68)); }
    } else if (st === 'circle' || st === 'icon0' || st === 'icon') {
      a.push(E(2.67, 5.6, 3.6, 3.6, { fill: B1 }));
      if (st !== 'circle') { a.push(T(2.67, 5.6, 3.6, 3.6, GLY[0], 40, { c: st === 'icon' ? '#fff' : '#222', al: 'c', va: 'm', pad: 0 })); }
      if (o.sel) { a = a.concat(sel(2.67, 5.6, 3.6, 3.6)); }
      if (o.grp) { a.push(R(2.4, 5.3, 4.2, 4.2, { stroke: BL, sw: 0.12, dash: 1 })); }
    } else {
      for (i = 0; i < 4; i++) {
        x = 2.16 + i * 7.7;
        a.push(E(x + 1.5, 5.6, 3.6, 3.6, { fill: B1 }), T(x + 1.5, 5.6, 3.6, 3.6, GLY[i], 40, { c: '#fff', al: 'c', va: 'm', pad: 0 }), T(x, 9.6, 6.6, 3.5, TIT[i], 22, { b: 1, c: B2, al: 'c' }));
        if (o.grp) { a.push(R(x + 1.3, 5.4, 4.0, 4.0, { stroke: BL, sw: 0.12, dash: 1 })); }
      }
      a.push(L(2.16, 4.9, 31.86, 4.9, OR, 0.1, 1), T(2.16, 14.2, 29.5, 1.5, 'oben auf einer Höhe · gleichmäßig verteilt', 22, { c: OR, b: 1 }));
    }
    return S(a);
  };

  var STEPS = ['Vorschlag für 8:30 Uhr formulieren', 'Der Schüler&shy;vertretung vorstellen', 'Vorteile und Probleme besprechen', 'Beratung in der Schulkonferenz anregen'], FIFTH = 'Schulleitung und Schulträger stimmen sich ab';
  SV.s9 = function (o) {
    var a = chrome('Unsere mögliche Aktion'), st = o.st || 'typed', h, i, x, n5 = STEPS.concat([FIFTH]);
    function nl(sub) {
      return STEPS.map(function (s, k) { return '<div style="margin-bottom:.35em"><b style="color:' + B1 + '">' + (k + 1) + '.</b>&nbsp;&nbsp;' + s + '</div>'; }).join('') +
        (sub ? '<div style="margin:0 0 .35em 1.7em">–&nbsp;&nbsp;' + FIFTH + '</div>' : '<div style="margin-bottom:.35em">•&nbsp;&nbsp;' + FIFTH + '</div>');
    }
    if (st === 'typed') { a.push(T(2.67, 5.33, 28.7, 11.68, bl(STEPS.map(function (s, k) { return (k + 1) + '. ' + s; }).concat([FIFTH]), true), 19)); }
    else if (st === 'num' || st === 'sub') { a.push(T(2.67, 5.33, 28.7, 11.68, nl(st === 'sub'), 19)); if (o.sel) { a = a.concat(sel(2.67, 5.33, 28.7, 8.6)); } }
    else if (st === 'smartpane') {
      a.push(R(2.16, 5.4, 9.6, 10.6, { fill: '#fff', stroke: '#a19f9d', sw: 0.08 }), T(2.3, 5.5, 9.3, 1.4, 'Textbereich', 18, { b: 1, c: '#555' }));
      n5.forEach(function (s, k) { a.push(T(2.3, 7.2 + k * 1.7, 9.3, 1.6, '• ' + s.replace('&shy;', ''), 11, { pad: 0.05 })); });
      for (i = 0; i < 5; i++) { x = 12.9 + i * 4.2; a.push(R(x, 7.6, 3.5, 6.2, { fill: i === 4 ? B3 : B1, r: 0.3 }), T(x, 7.6, 3.5, 6.2, n5[i].split(' ').slice(0, 2).join(' ') + '…', 12, { c: '#fff', b: 1, al: 'c', va: 'm', pad: 0.1 })); if (i < 4) { a.push({ t: 'poly', fill: B2, pts: [[x + 3.55, 10.2], [x + 4.15, 10.7], [x + 3.55, 11.2]] }); } }
    } else {
      for (i = 0; i < 5; i++) {
        x = 2.16 + i * 6.1;
        a.push(R(x, 6.4, 5.0, 5.6, { fill: i === 4 ? B3 : B1, r: 0.4 }), T(x + 0.2, 6.4, 4.6, 5.6, n5[i], 16, { b: 1, c: '#fff', al: 'c', va: 'm' }));
        if (i < 4) { a.push({ t: 'poly', fill: B2, pts: [[x + 5.15, 8.6], [x + 5.95, 9.2], [x + 5.15, 9.8]] }); }
      }
      a.push(T(2.16, 13.0, 29.5, 1.5, 'SmartArt „Prozess“ · Farbe aus Blau · fünf Schritte', 20, { b: 1, c: OR }));
    }
    return S(a);
  };

  var TBL = [['Vorteile', 'Nachteile'], ['Mehr Zeit zum Schlafen', 'Späteres Unterrichtsende'], ['Bessere Aufmerksamkeit', 'Weniger Freizeit am Nachmittag'], ['Weniger Stress am Morgen', 'Frühe Arbeitszeiten der Eltern'], ['Schulweg im Winter heller', 'Busfahrpläne anpassen']];
  SV.table = function (o) {
    var a = chrome('Vorteile und Nachteile im Vergleich'), r, c, x, y;
    for (r = 0; r < 5; r++) {
      for (c = 0; c < 2; c++) {
        x = 2.16 + c * 15; y = 5.6 + r * 2.3;
        a.push(R(x, y, 15, 2.3, { fill: r === 0 ? '#4F81BD' : (o.band && r % 2 === 1 ? '#D0D8E8' : (o.band ? '#E9EDF4' : '#fff')), stroke: '#b8c4d4', sw: 0.05 }), T(x, y, 15, 2.3, TBL[r][c], 20, { b: r === 0, c: r === 0 ? '#fff' : TX, va: 'm' }));
      }
    }
    if (o.sel) { a = a.concat(sel(2.16, 5.6, 30, 11.5)); }
    return S(a);
  };
  SV.grid = function () {
    var a = [R(0, 0, 33.87, 19.05, { fill: '#fff' }), T(2, 0.4, 20, 1.8, 'Tabelle einfügen', 24, { b: 1 })], r, c, on;
    for (r = 0; r < 7; r++) { for (c = 0; c < 10; c++) { on = c < 2 && r < 5; a.push(R(2 + c * 2.1, 3 + r * 2.2, 1.9, 2.0, { fill: on ? '#cfe3f7' : '#fff', stroke: on ? BL : '#9aa7b5', sw: 0.08 })); } }
    a.push(T(24.5, 5, 9, 4, '2 × 5<br>Tabelle', 30, { b: 1, c: OR, va: 'm' }));
    return S(a);
  };

  var AG = ['1&nbsp;&nbsp;Das Anliegen definieren', '2&nbsp;&nbsp;Informationsquellen suchen', '3&nbsp;&nbsp;Möglichkeiten der Meinungsäußerung', '4&nbsp;&nbsp;Öffentlichkeit schaffen'];
  SV.agenda = function (o) {
    var a = chrome('Agenda'), i, x, y;
    for (i = 0; i < 4; i++) { x = 2.16 + (i % 2) * 15.3; y = 5.6 + Math.floor(i / 2) * 5.5; a.push(R(x, y, 14.2, 4.4, { fill: B1, r: 0.5 }), T(x + 0.4, y, 13.4, 4.4, AG[i], 24, { b: 1, c: '#fff', va: 'm' })); }
    if (o.sel) { a = a.concat(sel(2.16, 5.6, 14.2, 4.4)); }
    return S(a);
  };
  SV.step = function () {
    var a = chrome('1. Das Anliegen definieren');
    a.push(T(2.67, 5.33, 28.7, 8, bl(BUL4, true), 19), R(28.3, 16.9, 4.4, 1.3, { fill: '#fff', stroke: B1, sw: 0.1, r: 0.65 }), T(28.3, 16.9, 4.4, 1.3, '↩ Agenda', 16, { b: 1, c: B1, al: 'c', va: 'm', pad: 0 }), R(27.9, 16.5, 5.2, 2.1, { stroke: OR, sw: 0.12, dash: 1, r: 0.2 }));
    return S(a);
  };
  SV.pane = function () {
    var a = chrome(null), L5 = ['Mehr Zeit zum Schlafen möglich', 'Bessere Aufmerksamkeit im Unterricht', 'Weniger Stress am Morgen', 'Schulweg im Winter heller', 'Schlafmedizin: nicht vor 8:30 Uhr'], i;
    a.push(T(2.16, 1.65, 18, 3, 'Vorteile eines späteren Beginns', 26, { b: 1, c: B2 }), T(2.67, 5.33, 17, 10, bl(L5, true), 16));
    a.push(R(21.5, 0.6, 11.9, 17.8, { fill: '#f3f2f1', stroke: '#a19f9d', sw: 0.06 }), T(21.7, 0.8, 11.5, 1.5, 'Animationsbereich', 20, { b: 1 }));
    for (i = 0; i < 5; i++) { a.push(R(21.8, 2.6 + i * 2.2, 11.3, 1.9, { fill: i === 0 ? '#fff' : '#cde6f7', stroke: i === 0 ? '#a19f9d' : BL, sw: 0.06 }), T(21.9, 2.6 + i * 2.2, 11.1, 1.9, (i === 0 ? '▶ 1 ' : '◐ ' + (i + 1) + ' ') + L5[i], 13, { va: 'm', pad: 0.1 })); }
    a.push(T(21.8, 14.0, 11.3, 3.4, 'Start: 1 = Beim Klicken<br>2–5 = Nach Vorheriger', 18, { c: OR, b: 1 }));
    return S(a);
  };
  SV.show = function (o) {
    var a = [R(0, 0, 33.87, 19.05, { fill: '#111' }), R(4, 2, 25.87, 14.55, { fill: BG }), R(4, 2, 0.5, 14.55, { fill: B1 }), T(5.5, 3.4, 23, 3.4, o.title || 'Vorteile eines späteren Beginns', 30, { b: 1, c: B2 }), T(5.5, 8, 23, 6.5, o.body || '•&nbsp;&nbsp;Mehr Zeit zum Schlafen möglich', 22), T(0.6, 17.3, 32, 1.5, 'Bildschirmpräsentation · Esc = Ende', 20, { c: '#bbb', pad: 0 })];
    return S(a);
  };
  SV.bar = function () {
    var a = chrome(null);
    a.push(T(2.16, 7, 29.97, 3.4, 'Soll die Schule später beginnen?', 37, { b: 1, c: B2 }), R(0, 0, 33.87, 2.6, { fill: '#B7472A' }), T(0.5, 0, 33, 2.6, 'PK_PPT_Klasse_Nachname_Vorname.pptx – PowerPoint', 24, { c: '#fff', b: 1, va: 'm' }), R(0.3, 0.3, 33.3, 2.0, { stroke: OR, sw: 0.14, dash: 1 }));
    return S(a);
  };
  function sx(title, lines, o) {
    var a = chrome(title); o = o || {};
    a.push(T(2.67, 5.33, 28.7, 11.68, bl(lines, true), 19), T(2.29, 17.53, 25.4, 0.89, o.num, 18));
    if (o.sel) { a = a.concat(sel(2.16, 1.65, 29.97, 3.43)); }
    if (o.brush) { a.push(T(25, 0.4, 7, 3.4, '🖌', 44, { c: OR, pad: 0 })); }
    return S(a);
  }
  SV.s10 = function (o) { return sx('4. Öffentlichkeit schaffen', ['Betroffene: Schüler, Eltern, Lehrkräfte', 'Argumente verständlich erklären', 'Erfahrungen aus dem Schulalltag nutzen', 'Rückmeldungen in der Schule berücksichtigen'], { num: '10 / 12', sel: o.sel }); };
  SV.s11 = function (o) { return sx('Fazit und unsere Meinung', ['Späterer Beginn könnte Schlaf und Konzentration fördern', 'Herausforderung: Busse, Betreuung, späteres Ende', 'Unser gemeinsamer Vorschlag: Beginn um 8:30 Uhr', 'Unterrichtszeit bleibt gleich – Tagesablauf verschiebt sich'], { num: '11 / 12', sel: o.brush, brush: o.brush }); };
  SV.pair = function () {
    var a = [R(0, 0, 33.87, 19.05, { fill: '#e9edf1' })];
    [['Folie 10', '4. Öffentlichkeit schaffen', ['Betroffene: Schüler, Eltern', 'Argumente verständlich erklären', 'Erfahrungen aus dem Alltag']], ['Folie 11', 'Fazit und unsere Meinung', ['Späterer Beginn fördert Schlaf', 'Herausforderung: Busse, Betreuung', 'Vorschlag: Beginn um 8:30 Uhr']]].forEach(function (s, k) {
      var x = 0.8 + k * 16.6;
      a.push(R(x, 2.0, 15.6, 8.78, { fill: BG, stroke: '#9aa7b5', sw: 0.06 }), R(x, 2.0, 0.22, 8.78, { fill: B1 }), T(x + 0.5, 2.5, 14.8, 2.4, s[1], 22, { b: 1, c: B2, pad: 0.1 }), T(x + 0.6, 5.3, 14.5, 5, bl(s[2], true), 13, { pad: 0.1 }), T(x, 11.4, 15.6, 1.8, s[0] + ' · gleicher Stil ✓', 24, { al: 'c', c: GR, b: 1, pad: 0 }));
    });
    return S(a);
  };
  SV.wrap = function () {
    var a = chrome(null), t1 = 'Späterer Beginn könnte Schlaf und Konzentration fördern und die Aufmerksamkeit im Unterricht erhöhen', t2 = 'Herausforderung: Busse, Betreuung, späteres Ende';
    a.push(T(1.6, 0.6, 14.4, 1.8, '✗ Punkt getippt', 26, { b: 1, c: RED }), T(17.4, 0.6, 15.4, 1.8, '✓ echtes Aufzählungszeichen', 26, { b: 1, c: GR }));
    a.push(R(1.6, 2.8, 14.4, 9.2, { fill: '#fff', stroke: '#b8c4d4', sw: 0.06 }), R(17.4, 2.8, 14.4, 9.2, { fill: '#fff', stroke: '#b8c4d4', sw: 0.06 }));
    a.push(T(1.9, 3.0, 13.8, 8.8, '<div style="margin-bottom:.4em">•&nbsp;&nbsp;' + t1 + '</div><div>•&nbsp;&nbsp;' + t2 + '</div>', 20));
    a.push(T(17.7, 3.0, 13.8, 8.8, '<div style="margin-bottom:.4em;padding-left:1.1em;text-indent:-1.1em">•&nbsp;&nbsp;' + t1 + '</div><div style="padding-left:1.1em;text-indent:-1.1em">•&nbsp;&nbsp;' + t2 + '</div>', 20));
    a.push(T(1.6, 12.8, 30.4, 4.6, 'Getippt: Folgezeile rutscht <b>unter den Punkt</b>.<br>Echt: Folgezeile hängt <b>unter dem Text</b>.', 24, { c: TX }));
    return S(a);
  };

  /* ------------------------------------------------------------------ Szenarien C1–C14 */
  var MENU_SHAPES = ['Rechteck', 'Rechteck: abgerundete Ecken', 'Rechteck: eine Ecke abgerundet', 'Oval', 'Pfeil: nach rechts', '…'];
  var MENU_GRP = ['Gruppieren', 'Gruppierung aufheben', 'Erneut gruppieren'];
  var POP_FONT = { t: 'palette', mode: 'font', theme: OFFICE, right: 1 };

  SC.own_c1 = { fr: [
    { win: { t: 'Datei', rows: [{ k: 'list', title: 'Menü links', items: ['Informationen', 'Neu', 'Öffnen', 'Speichern', 'Speichern unter', 'Drucken', 'Teilen', 'Exportieren', 'Schließen'], hi: 4 }] }, say: '**1.** Вкладка **Datei** (самая левая в ленте) → слева в списке **Speichern unter**. Делай это **сразу**, до любых правок.' },
    { win: { t: 'Speichern unter', rows: [{ k: 'list', title: 'Ort', items: ['Zuletzt verwendet', 'OneDrive', 'Dieser PC', 'Durchsuchen'], hi: 3 }] }, say: '**2.** Место: **Durchsuchen** (откроется обычное окно сохранения). Можно и через **Dieser PC**.' },
    { win: { t: 'Speichern unter', rows: [{ k: 'fld', l: 'Dateiname:', v: 'PK_PPT_Klasse_Nachname_Vorname', hi: 1 }, { k: 'fld', l: 'Dateityp:', v: 'PowerPoint-Präsentation (*.pptx)' }], btns: [{ l: 'Speichern', hi: 1 }, { l: 'Abbrechen' }] }, say: '**3.** В поле **Dateiname** — имя из генератора выше (шаблон PK_PPT_Klasse_Nachname_Vorname). Тип остаётся **.pptx**. Потом **Speichern**.' },
    { sv: ['bar'], cap: 'Верх окна PowerPoint (схема)', say: '**Проверка:** в самом верху окна теперь **новое** имя, а не Schulbeginn_… Иначе правки идут в оригинал. Дальше после каждого задания [[Strg]]+[[S]].' }
  ] };

  SC.own_c2 = { fr: [
    { sv: ['s2', { sel: 's' }], say: '**Слайд 2:** кликни по синей полоске слева (это обычный прямоугольник) → [[Strg]]+[[X]] (вырезать).' },
    { tab: 'Ansicht', hiTab: 'Ansicht', hi: 'master', groups: ['Präsentationsansichten', 'Masteransichten', 'Anzeigen'], say: '**1.** Вкладка **Ansicht** → группа **Masteransichten** → **Folienmaster**.' },
    { tab: 'Folienmaster', ctx: 'Folienmaster', groups: ['Hintergrund', 'Schließen'], sv: ['master', {}], cap: 'Режим мастера (схема)', say: '**2.** Откроется режим мастера. Слева сверху сам мастер, ниже макеты. Кликни макет **Blank / Leer** (если навести мышь, подскажет: «используется слайдами 1–12»).' },
    { tab: 'Folienmaster', ctx: 'Folienmaster', groups: ['Hintergrund', 'Schließen'], sv: ['master', { stripe: 1, hl: 1 }], cap: 'Режим мастера (схема)', say: '**3.** [[Strg]]+[[V]] — полоска встала на то же место: слева, во всю высоту.' },
    { tab: 'Folienmaster', ctx: 'Folienmaster', hi: 'closemaster', groups: ['Hintergrund', 'Schließen'], say: '**4.** **Folienmaster → Masteransicht schließen** (кнопка справа в ленте).' },
    { sv: ['s2', { lock: 1 }], say: '**5.** Старые полоски на слайдах 1 и 3–12: кликнуть → [[Entf]]. **Полоску из мастера на слайде не выделить** — по этому и видно, что она в мастере.' },
    { tab: 'Start', hiTab: 'Start', hi: 'newslide', groups: ['Folien'], say: '**Проверка:** **Start → Neue Folie**. У нового слайда полоска есть сама, ничего копировать не надо. Потом слайд удали.' }
  ] };

  SC.own_c3 = { fr: [
    { tab: 'Ansicht', hiTab: 'Ansicht', hi: 'sorter', groups: ['Präsentationsansichten', 'Masteransichten'], sv: ['sorter', { drag: 1 }], cap: 'Foliensortierung (схема)', say: '**1.** **Ansicht → Foliensortierung**: слайды плитками. Перетащи слайд 3 «Unsere Schritte» на место 2.' },
    { sv: ['sorter', { moved: 1 }], cap: 'Foliensortierung (схема)', say: '**Вот проблема:** «Unsere Schritte» теперь второй, а на нём всё ещё напечатано «3 / 12». Напечатанная цифра сама не обновляется.' },
    { sv: ['s2', { sel: 'n' }], say: '**2.** Старые напечатанные номера: клик по рамке «n / 12» (за **край** рамки) → [[Entf]]. Так на каждом из 12 слайдов.' },
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'sldnum', groups: ['Illustrationen', 'Links', 'Text'], say: '**3.** **Einfügen** → группа **Text** → **Foliennummer**.' },
    { win: { t: 'Kopf- und Fußzeile', tabs: ['Folie', 'Notizen und Handzettel'], on: 0, rows: [{ k: 'chk', l: 'Datum und Uhrzeit' }, { k: 'chk', l: 'Fußzeile' }, { k: 'chk', l: 'Foliennummer', on: 1, hi: 1 }, { k: 'chk', l: 'Auf Titelfolie nicht anzeigen', on: 1, hi: 1 }], btns: [{ l: 'Übernehmen' }, { l: 'Für alle übernehmen', hi: 1 }, { l: 'Abbrechen' }] }, say: '**4.** Вкладка **Folie**: ☑ **Foliennummer** и ☑ **Auf Titelfolie nicht anzeigen** → **Für alle übernehmen**.' },
    { tab: 'Folienmaster', ctx: 'Folienmaster', groups: ['Hintergrund', 'Schließen'], sv: ['master', { num: 'arrow' }], cap: 'Режим мастера (схема)', say: '**5.** **Ansicht → Folienmaster** → верхний слайд (сам мастер): поле **‹#›** стоит посередине, потому что мастер сделан под 4:3. Перетащи его вправо вниз (правый край ≈ 2 cm от края слайда), потом **Masteransicht schließen**.' },
    { sv: ['s1', { num: '1', numx: 29.4, bad: 1 }], say: '**6.** Проверь слайд 1. Галочка «Auf Titelfolie nicht anzeigen» действует только на слайды с макетом «Titelfolie». У тебя все слайды на макете Blank, поэтому номер на слайде 1, скорее всего, остался: кликни по нему → [[Entf]].' }
  ] };

  SC.own_c4 = { fr: [
    { tab: 'Start', hiTab: 'Start', hi: 'repl', groups: ['Zwischenablage', 'Schriftart', 'Bearbeiten'], pop: { t: 'menu', items: ['Ersetzen…', 'Schriftarten ersetzen…'], hi: 'Schriftarten ersetzen…', right: 1 }, say: '**1.** **Start** → группа **Bearbeiten** (справа) → **Ersetzen ▾** → **Schriftarten ersetzen…**' },
    { win: { t: 'Schriftarten ersetzen', rows: [{ k: 'fld', l: 'Ersetzen:', v: 'Aptos ▾', hi: 1 }, { k: 'fld', l: 'Ersetzen durch:', v: 'Calibri ▾', hi: 1 }], btns: [{ l: 'Ersetzen', hi: 1 }, { l: 'Schließen' }] }, say: '**2.** **Ersetzen:** Aptos → **Ersetzen durch:** Calibri → **Ersetzen**. Один раз — на все 12 слайдов.' },
    { tab: 'Start', hiTab: 'Start', hi: ['size', 'bold'], groups: ['Schrift40'], sv: ['s10', { sel: 1 }], say: '**3.** Слайд 10: выдели текст заголовка ([[Strg]]+[[A]] внутри рамки) → в окошке размера **40**, затем кнопка **F** (Fett).' },
    { tab: 'Start', hiTab: 'Start', hi: 'fpaint', groups: ['Zwischenablage'], sv: ['s10', { sel: 1 }], say: '**4.** Заголовок слайда 10 выделен → **Start → Format übertragen** (кисточка). **Двойной клик** по ней: кисточка останется включённой для нескольких целей.' },
    { sv: ['s11', { brush: 1 }], say: '**5.** Слева в панели слайдов кликни слайд 11 → кликни **в текст** заголовка (не только на рамку). Потом слайды 12, 8, 7 … пока все заголовки не станут одинаковыми. [[Esc]] выключает кисточку. Список на слайде 11 — так же: абзац со слайда 10 → кисточка → абзацы слайда 11.' },
    { sv: ['pair'], cap: 'Foliensortierung (схема)', say: '**Проверка:** **Ansicht → Foliensortierung** — слайды 10 и 11 рядом: заголовок того же размера, шрифта и цвета, список выглядит так же.' }
  ] };

  SC.own_c5 = { fr: [
    { tab: 'Start', hiTab: 'Start', hi: 'fcol', groups: ['Zwischenablage', 'Schriftart'], pop: ex({ hiItem: 'Weitere Farben…' }, POP_FONT), sv: ['s2', { sel: 't' }], say: '**1.** Выдели заголовок → **Start → Schriftfarbe ▾** (буква A с полоской) → внизу **Weitere Farben…**. В палитре темы цвета твоей презентации нет.' },
    { dlg: { r: 24, g: 58, b: 87, hex: '#183A57' }, say: '**2.** Вкладка **Benutzerdefiniert** → Farbmodell **RGB** → **Rot 24 · Grün 58 · Blau 87** → **OK**.' },
    { tab: 'Start', hiTab: 'Start', hi: 'fpaint', groups: ['Zwischenablage'], say: '**3.** Остальные заголовки: **Format übertragen** (двойной клик), как в C4. Или те же три числа у каждого.' },
    { tab: 'Formformat', ctx: 'Formformat', hiTab: 'Formformat', hi: 'fill', groups: ['Formenarten'], pop: { t: 'palette', mode: 'fill', hiItem: 'Weitere Füllfarben…', theme: OFFICE }, sv: ['master', { stripe: 1, sel: 1 }], cap: 'Режим мастера (схема)', say: '**4.** Полоска: **Ansicht → Folienmaster** → кликни полоску → **Formformat → Formfüllung ▾ → Weitere Füllfarben…** (в старых версиях кнопка «Fülleffekt»).' },
    { dlg: { r: 32, g: 100, b: 147, hex: '#206493' }, say: '**5.** **Rot 32 · Grün 100 · Blau 147** → **OK**. Потом **Masteransicht schließen**.' },
    { tab: 'Start', hiTab: 'Start', hi: 'fcol', groups: ['Zwischenablage', 'Schriftart'], pop: ex({ hi: 1 }, POP_FONT), say: '**6.** Основной текст: **Schriftfarbe ▾** → **Designfarben** → верхний ряд, **2-й квадрат** слева (Text 1, чёрный).' },
    { tab: 'Entwurf', hiTab: 'Entwurf', hi: 'vcol', groups: ['Varianten'], pop: { t: 'menu', items: ['Office', 'Office 2007–2010', 'Graustufen', 'Blau', '-', 'Farben anpassen…'], hi: 'Farben anpassen…', right: 1 }, say: '**Бонус 1:** **Entwurf → Varianten → Farben ▾ → Farben anpassen…**' },
    { win: { t: 'Neue Designfarben erstellen', rows: [{ k: 'fld', l: 'Text/Hintergrund – Dunkel 2:', v: '24 · 58 · 87', hi: 1 }, { k: 'fld', l: 'Akzent 1:', v: '32 · 100 · 147', hi: 1 }, { k: 'fld', l: 'Name:', v: 'Schulbeginn' }], btns: [{ l: 'Speichern', hi: 1 }, { l: 'Abbrechen' }] }, say: '**Бонус 2:** впиши два синих тона (RGB в отдельном окне цвета) → **Speichern**. Теперь они стоят в верхнем ряду палитры, и один клик красит любое место одинаково.' }
  ] };

  SC.own_c6 = { fr: [
    { sv: ['wrap'], say: '**Что не так с напечатанной точкой:** вторая строка длинного пункта уезжает **под точку**. Настоящий список держит текст ровно: строка висит под текстом.' },
    { win: { t: 'Ersetzen', rows: [{ k: 'fld', l: 'Suchen nach:', v: '•␣␣  (скопировано, вставь [Strg]+[V])', hi: 1 }, { k: 'fld', l: 'Ersetzen durch:', v: '(пусто)', hi: 1 }], btns: [{ l: 'Weitersuchen' }, { l: 'Ersetzen' }, { l: 'Alle ersetzen', hi: 1 }, { l: 'Schließen' }] }, say: '**1.** Скопируй одну точку с двумя пробелами → [[Strg]]+[[H]] (или **Start → Ersetzen**). **Suchen nach:** вставь → **Ersetzen durch:** пусто → **Alle ersetzen**. Все 44 «•» исчезнут.' },
    { tab: 'Start', hiTab: 'Start', hi: 'bul', groups: ['Schriftart', 'Absatz'], sv: ['s2', { typed: 0, sel: 'b' }], say: '**2.** Кликни рамку с текстом (за край) → **Start → Absatz → Aufzählungszeichen**. Теперь перенесённая строка висит под **текстом**.' },
    { tab: 'Start', hiTab: 'Start', hi: 'num', groups: ['Schriftart', 'Absatz'], sv: ['s9', { st: 'num', sel: 1 }], say: '**3.** Слайд «Unsere mögliche Aktion»: сотри напечатанные «1. » … «4. » → выдели 4 строки → **Start → Nummerierung**.' },
    { tab: 'Start', hiTab: 'Start', hi: 'lvlp', groups: ['Schriftart', 'Absatz'], sv: ['s9', { st: 'sub' }], say: '**4.** Пятая строка: включи Aufzählungszeichen, курсор в начало → [[Tab]] (или кнопка **Listenebene erhöhen**): она вложится глубже. Назад — [[Umschalt]]+[[Tab]].' }
  ] };

  SC.own_c7 = { fr: [
    { sv: ['s2', { sel: 'tbn', guides: 'bad' }], say: '**Было:** левые края **2,16 / 2,29 / 2,67** см. **Выдели три объекта:** кликни заголовок, зажми [[Umschalt]], кликни текст и рамку номера.' },
    { tab: 'Formformat', ctx: 'Formformat', hiTab: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe30'], sv: ['s2', { sel: 'tbn', guides: 'bad' }], say: '**1.** Как только объекты выделены, справа появляется вкладка **Formformat** → группа **Anordnen** → **Ausrichten ▾**.' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe30'], pop: { t: 'menu', items: MENU_AL, hi: 'Ausgewählte Objekte ausrichten', chk: 'Ausgewählte Objekte ausrichten' }, say: '**2.** Внизу списка галочка должна стоять у **Ausgewählte Objekte ausrichten**, а не у «An Folie ausrichten».' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe30'], pop: { t: 'menu', items: MENU_AL, hi: 'Links ausrichten', chk: 'Ausgewählte Objekte ausrichten' }, sv: ['s2', { al: 1, sel: 'tbn', guides: 'ok' }], say: '**3.** **Links ausrichten** — все три встали на самую левую кромку (2,16).' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'w', groups: ['Anordnen', 'Größe30'], sv: ['s2', { al: 1, sel: 'tb' }], say: '**4.** Одинаковая ширина: выдели заголовок и текст → **Formformat → Größe → Breite 30 cm** (у обоих одно число).' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe30'], pop: { t: 'menu', items: MENU_AL, hi: 'Vertikal verteilen', chk: 'Ausgewählte Objekte ausrichten' }, sv: ['s1', { sel: 1, al: 1, dist: 1 }], say: '**5.** Титульный слайд: выдели три рамки → **Links ausrichten**, затем **Ausrichten ▾ → Vertikal verteilen** (одинаковые расстояния).' },
    { tab: 'Ansicht', hiTab: 'Ansicht', hi: 'guides', groups: ['Präsentationsansichten', 'Masteransichten', 'Anzeigen'], sv: ['s2', { al: 1, guides: 'ok' }], say: '**Проверка:** **Ansicht → Anzeigen → Führungslinien** — заголовок и текст начинаются на одной линии. У всех рамок одинаковый внутренний отступ, поэтому и сам текст стоит ровно.' }
  ] };

  SC.own_c8 = { fr: [
    { sv: ['s4', { st: 'text' }], say: '**Было:** 5 строк текста. Сделаем из них 4 карточки с большими цифрами.' },
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'shapes', groups: ['Tabellen', 'Bilder', 'Illustrationen', 'Links', 'Text'], pop: { t: 'menu', items: MENU_SHAPES, hi: 'Rechteck: abgerundete Ecken' }, sv: ['s4', { st: 'card1', empty: 1 }], say: '**1.** **Einfügen → Illustrationen → Formen** → **Rechteck: abgerundete Ecken** (в старых версиях — «Abgerundetes Rechteck»). Растяни на слайде.' },
    { tab: 'Formformat', ctx: 'Formformat', hiTab: 'Formformat', hi: ['h', 'w'], groups: ['Formenarten', 'GrößeKarte'], sv: ['s4', { st: 'card1', empty: 1, sel: 1 }], say: '**2.** **Formformat → Größe:** Höhe **6,2** · Breite **6,6** cm. **Formfüllung** — белая, **Formkontur** — синяя (RGB 32/100/147, 2 pt).' },
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'tbox', groups: ['Illustrationen', 'Links', 'Text'], sv: ['s4', { st: 'card1', tb: 1 }], say: '**3.** **Einfügen → Textfeld** → поверх карточки: «8:00 Uhr» (32 pt, **F**) · [[Enter]] · «Unsere Schule» (18 pt).' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'GrößeKarte'], pop: { t: 'menu', items: MENU_AL, hi: 'Horizontal zentrieren', chk: 'Ausgewählte Objekte ausrichten' }, sv: ['s4', { st: 'card1', tb: 1, sel: 1 }], say: '**4.** Выдели карточку и текстовое поле ([[Umschalt]]+клик) → **Ausrichten ▾ → Horizontal zentrieren**.' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'group', groups: ['Anordnen', 'GrößeKarte'], pop: { t: 'menu', items: MENU_GRP, hi: 'Gruppieren' }, sv: ['s4', { st: 'card1', grp: 1 }], say: '**5.** **Gruppieren ▾ → Gruppieren**. Проверка: один клик показывает **одну** рамку на всю карточку.' },
    { sv: ['s4', { st: 'cards', grp: 1 }], say: '**6.** Группу размножь: [[Strg]]+[[D]] три раза. Тексты поменяй (клик в группу, ещё клик в текст). Копии встают со сдвигом, это нормально.' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'GrößeKarte'], pop: { t: 'menu', items: MENU_AL, hi: 'Oben ausrichten', chk: 'Ausgewählte Objekte ausrichten' }, sv: ['s4', { st: 'cards', grp: 1 }], say: '**7.** Выдели все четыре группы → **Ausrichten ▾ → Oben ausrichten**.' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'GrößeKarte'], pop: { t: 'menu', items: MENU_AL, hi: 'Horizontal verteilen', chk: 'Ausgewählte Objekte ausrichten' }, sv: ['s4', { st: 'cards', ok: 1, grp: 1 }], say: '**8.** Снова **Ausrichten ▾ → Horizontal verteilen**: промежутки равны (оранжевые чёрточки). Нужно минимум 3 объекта; группа считается за один.' },
    { sv: ['s4', { st: 'cards', ok: 1 }], say: '**Проверка:** ✓ 4 равные карточки ✓ сверху на одной линии ✓ промежутки равны ✓ старый текст убран (строка про 23:00–6:30 остаётся подписью).' }
  ] };

  SC.own_c9 = { fr: [
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'shapes', groups: ['Tabellen', 'Bilder', 'Illustrationen', 'Links', 'Text'], pop: { t: 'menu', items: MENU_SHAPES, hi: 'Oval' }, sv: ['s5', { st: 'text' }], say: '**1.** **Einfügen → Formen → Oval**; при рисовании держи [[Umschalt]] — получится круг. Потом **Formformat → Größe 3 × 3 cm**, заливка синяя (32/100/147), контур — **Keine Kontur**.' },
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'icons', groups: ['Tabellen', 'Bilder', 'Illustrationen', 'Links', 'Text'], sv: ['s5', { st: 'icon0' }], say: '**2.** **Einfügen → Illustrationen → Piktogramme** → поиск (Bett, Zielscheibe, Uhr, Sonne) → **Einfügen**. Нужен интернет; на контрольной берут иконки из самого файла (копировать [[Strg]]+[[C]], [[Strg]]+[[V]]).' },
    { tab: 'Grafikformat', ctx: 'Grafikformat', hiTab: 'Grafikformat', hi: 'gfill', groups: ['Grafikformatvorlagen', 'Größe'], pop: { t: 'palette', mode: 'fill', hi: 0, theme: OFFICE }, sv: ['s5', { st: 'icon0', sel: 1 }], say: '**3.** Иконка выделена → **Grafikformat → Grafikfüllung ▾** → верхний ряд, **1-й квадрат** (Weiß). Белая иконка на синем круге.' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'GrößeKreis'], pop: { t: 'menu', items: MENU_AL, hi: 'Horizontal zentrieren', chk: 'Ausgewählte Objekte ausrichten' }, sv: ['s5', { st: 'icon', sel: 1 }], say: '**4.** Иконку — на круг. Выдели оба → **Ausrichten ▾ → Horizontal zentrieren**, потом тем же путём **Vertikal zentrieren**.' },
    { tab: 'Formformat', ctx: 'Formformat', hi: 'group', groups: ['Anordnen', 'GrößeKreis'], pop: { t: 'menu', items: MENU_GRP, hi: 'Gruppieren' }, sv: ['s5', { st: 'icon', grp: 1 }], say: '**5.** **Gruppieren ▾ → Gruppieren**: круг и иконка — один объект.' },
    { sv: ['s5', { st: 'cols' }], say: '**6.** Группу ×4 ([[Strg]]+[[D]]), иконки заменить. Под каждым кругом — текстовое поле с преимуществом, по центру. Все четыре группы: **Oben ausrichten** + **Horizontal verteilen**. Пятый пункт (Schlafmedizin) — мелкой строкой ниже.' }
  ] };

  SC.own_c10 = { fr: [
    { tab: 'Formformat', ctx: 'Formformat', hiTab: 'Formformat', hi: 'w', groups: ['Anordnen', 'Größe18'], sv: ['s1', { sel: 1 }], say: '**1.** Заголовок, подзаголовок и автор: выдели рамки → **Formformat → Größe → Breite 18 cm** (чтобы фото не лежало на рамке).' },
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'pics', groups: ['Tabellen', 'Bilder', 'Illustrationen'], pop: { t: 'menu', items: ['Dieses Gerät…', 'Archivbilder…', 'Onlinebilder…'], hi: 'Dieses Gerät…' }, sv: ['s1', { narrow: 1 }], say: '**2.** **Einfügen → Bilder ▾ → Dieses Gerät…** → выбери фото (можно снимок с телефона) → **Einfügen**.' },
    { tab: 'Bildformat', ctx: 'Bildformat', hiTab: 'Bildformat', hi: 'crop', groups: ['Bildformatvorlagen', 'Größe12'], pop: { t: 'menu', items: ['Zuschneiden', 'Auf Form zuschneiden ▸', 'Seitenverhältnis ▸', 'Ausfüllen', 'Einpassen'], hi: 'Seitenverhältnis ▸', right: 1 }, sv: ['s1', { narrow: 1, photo: 'wide' }], say: '**3.** Фото выделено → **Bildformat → Zuschneiden ▾ → Seitenverhältnis ▸** → **1:1**.' },
    { tab: 'Bildformat', ctx: 'Bildformat', hi: 'crop', groups: ['Bildformatvorlagen', 'Größe12'], pop: { t: 'menu', items: ['Quadrat', '1:1', '2:3', '3:2', '3:4', '4:3', '16:9'], hi: '1:1', right: 1 }, sv: ['s1', { narrow: 1, photo: 'crop' }], say: '**4.** Появилась квадратная рамка: двигай фото внутри, пока главное в центре. Потом клик в пустое место (или [[Esc]]).' },
    { tab: 'Bildformat', ctx: 'Bildformat', hi: 'h', groups: ['Bildformatvorlagen', 'Größe12'], sv: ['s1', { narrow: 1, photo: 'sq' }], say: '**5.** Размер: **Größe → Höhe 12 cm** (Breite подстроится) или тяни **за угол**. Боковой маркер искажает фото; случайно потянул — [[Strg]]+[[Z]].' },
    { tab: 'Bildformat', ctx: 'Bildformat', hi: 'bborder', groups: ['Bildformatvorlagen', 'Größe12'], pop: { t: 'palette', mode: 'border', items: ['Kein Umriss', 'Weitere Konturfarben…', 'Pipette', 'Stärke ▸', 'Linienart ▸'], hiItem: 'Weitere Konturfarben…', theme: OFFICE }, sv: ['s1', { narrow: 1, photo: 'sq' }], say: '**6.** **Bildformat → Bildrahmen ▾** → внизу пункт для других цветов (название зависит от версии) → **Benutzerdefiniert**.' },
    { dlg: { r: 32, g: 100, b: 147, hex: '#206493' }, say: '**7.** **Rot 32 · Grün 100 · Blau 147** → **OK**.' },
    { tab: 'Bildformat', ctx: 'Bildformat', hi: 'bborder', groups: ['Bildformatvorlagen', 'Größe12'], pop: { t: 'menu', items: ['¼ Pt', '½ Pt', '¾ Pt', '1 Pt', '1½ Pt', '2¼ Pt', '3 Pt'], hi: '2¼ Pt' }, sv: ['s1', { narrow: 1, photo: 'border' }], say: '**8.** **Bildrahmen ▾ → Stärke ▸ → 2¼ Pt**: рамка тонкая, синяя.' },
    { sv: ['s1', { narrow: 1, photo: 'border' }], say: '**Проверка:** ✓ фото квадратное ✓ рамка синяя и тонкая ✓ фото не лежит на заголовке и подзаголовке (рамки сужены до 18 cm). По желанию: **Zuschneiden ▾ → Auf Form zuschneiden → Oval** (после 1:1 получится круг).' }
  ] };

  SC.own_c11 = { fr: [
    { menu: { t: 'menu', items: ['Neue Folie', 'Folie duplizieren', 'Folie löschen', '-', 'Folie ausblenden', 'Foliendesign formatieren…'], hi: 'Folie duplizieren' }, say: '**1.** В левой панели правый клик по слайду «Nachteile und Probleme» → **Folie duplizieren**. На копии: заголовок «Vorteile und Nachteile im Vergleich», старое текстовое поле — удалить.' },
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'table', groups: ['Folien', 'Tabellen', 'Bilder'], sv: ['grid'], cap: 'Выбор размера таблицы (схема)', say: '**2.** **Einfügen → Tabellen → Tabelle ▾** → потяни сетку: **2 Spalten × 5 Zeilen**.' },
    { tab: 'Tabellenentwurf', ctx: 'Tabellenentwurf', hiTab: 'Tabellenentwurf', hi: ['hdr', 'band'], groups: ['Tabellenformatoptionen', 'Tabellenformatvorlagen'], sv: ['table', { sel: 1, band: 1 }], say: '**3.** Таблица выделена → **Tabellenentwurf → Tabellenformatoptionen**: ☑ **Kopfzeile**, ☑ **Gebänderte Zeilen** (в старых версиях «Optionen für Tabellenformat»). В **Tabellenformatvorlagen** выбери стиль с синей шапкой.' },
    { tab: 'Layout', ctx: 'Layout', hiTab: 'Layout', hi: ['cw', 'vmid'], groups: ['Zellengröße', 'Ausrichtung'], sv: ['table', { band: 1 }], say: '**4.** **Layout → Zellengröße → Breite**: у обоих столбцов одинаково (по 13 cm). **Ausrichtung**: слева, по центру по вертикали. Размер шрифта — 20 pt.' }
  ] };

  SC.own_c12 = { fr: [
    { tab: 'Start', hiTab: 'Start', hi: 'smart', groups: ['Schriftart', 'Absatz'], pop: { t: 'menu', items: ['Vertikale Aufzählungsliste', 'Vertikale Blockliste', 'Horizontale Bildliste', '-', 'Weitere SmartArt-Grafiken…'], hi: 'Weitere SmartArt-Grafiken…', right: 1 }, sv: ['s9', { st: 'num', sel: 1 }], say: '**1.** Выдели все пункты → **Start → In SmartArt-Grafik konvertieren ▾ → Weitere SmartArt-Grafiken…** (сначала убери напечатанные «•  1.», это C6).' },
    { win: { t: 'SmartArt-Grafik auswählen', rows: [{ k: 'cols', a: ['Alle', 'Liste', 'Prozess', 'Zyklus', 'Hierarchie', 'Beziehung', 'Matrix', 'Pyramide'], ha: 2, b: ['Einfacher Prozess  (Basic Process)', 'Fortlaufender Pfeilprozess', 'Akzentprozess'], hb: 0 }], btns: [{ l: 'OK', hi: 1 }, { l: 'Abbrechen' }] }, say: '**2.** Слева категория **Prozess** → справа первая схема («Einfacher Prozess» / «Basic Process», название зависит от версии) → **OK**.' },
    { sv: ['s9', { st: 'smartpane' }], say: '**3.** Слева **Textbereich** (стрелка у рамки): [[Enter]] — новый шаг, [[Tab]] — подпункт. Проверь, что в схеме **пять** шагов.' },
    { tab: 'SmartArt-Entwurf', ctx: 'SmartArt-Entwurf', hiTab: 'SmartArt-Entwurf', hi: 'sacol', groups: ['SmartArt-Formatvorlagen'], pop: { t: 'menu', items: ['Farbig', 'Akzent 1', 'Akzent 2', 'Akzent 3'], hi: 'Akzent 1' }, sv: ['s9', { st: 'smart' }], say: '**4.** **SmartArt-Entwurf → Farben ändern ▾** → вариант в синем (Akzent 1). Рамку поставь под заголовком, левая кромка как у заголовка (C7).' }
  ] };

  SC.own_c13 = { fr: [
    { tab: 'Übergänge', hiTab: 'Übergänge', hi: 'tfade', groups: ['Übergang zu dieser Folie', 'Anzeigedauer'], sv: ['s5', { st: 'text' }], say: '**1.** Вкладка **Übergänge** → **Verblassen** (один спокойный эффект).' },
    { tab: 'Übergänge', hiTab: 'Übergänge', hi: ['tdur', 'tall'], groups: ['Übergang zu dieser Folie', 'Anzeigedauer'], sv: ['s5', { st: 'text' }], say: '**2.** **Dauer** 00,70 → **Für alle übernehmen**. Под каждым слайдом в панели появится звёздочка.' },
    { tab: 'Animationen', hiTab: 'Animationen', hi: 'afade', groups: ['Animation', 'Erweiterte Animation', 'Anzeigedauer'], sv: ['s5', { st: 'text', sel: 1 }], say: '**3.** Слайд «Vorteile eines späteren Beginns»: клик по текстовому полю → **Animationen → Verblassen** (или Erscheinen).' },
    { tab: 'Animationen', hiTab: 'Animationen', hi: 'aopt', groups: ['Animation', 'Erweiterte Animation', 'Anzeigedauer'], pop: { t: 'menu', items: ['Als Objekt', 'Alle gleichzeitig', 'Nach Absatz'], hi: 'Nach Absatz', right: 1 }, say: '**4.** **Effektoptionen ▾ → Nach Absatz**: каждая строка появляется отдельно.' },
    { tab: 'Animationen', hiTab: 'Animationen', hi: ['apane', 'astart'], groups: ['Animation', 'Erweiterte Animation', 'Anzeigedauer'], pop: { t: 'menu', items: ['Beim Klicken', 'Mit Vorheriger', 'Nach Vorheriger'], hi: 'Nach Vorheriger', right: 1, at: 'astart' }, sv: ['pane'], cap: 'Animationsbereich (схема)', say: '**5.** **Animationsbereich** → выдели записи 2–5 → **Start: Nach Vorheriger**. Первая остаётся «Beim Klicken».' },
    { sv: ['show', {}], cap: 'Показ слайдов (схема)', say: '**6.** Проверь в показе: [[F5]] с первого слайда ([[Umschalt]]+[[F5]] — с текущего). [[Esc]] — выход. Переходы и анимации видны **только** в показе.' }
  ] };

  SC.own_c14 = { fr: [
    { tab: 'Einfügen', hiTab: 'Einfügen', hi: 'link', groups: ['Illustrationen', 'Links', 'Text'], sv: ['agenda', { sel: 1 }], say: '**1.** Кнопка-прямоугольник выделена → **Einfügen → Links → Link** ([[Strg]]+[[K]]).' },
    { win: { t: 'Link einfügen', rows: [{ k: 'cols', a: ['Datei oder Webseite', 'Aktuelles Dokument', 'Neues Dokument', 'E-Mail-Adresse'], ha: 1, b: ['Titelfolie', 'Agenda', '1. Das Anliegen definieren', 'Unsere Schritte', 'Aktuelle Situation'], hb: 2 }], btns: [{ l: 'OK', hi: 1 }, { l: 'Abbrechen' }] }, say: '**2.** Слева **Aktuelles Dokument** (в некоторых версиях «Dieses Dokument») → справа нужный слайд, **по названию** → **OK**.' },
    { sv: ['step'], say: '**3.** Кнопка **↩ Agenda** на слайде шага: маленький прямоугольник внизу справа со ссылкой на слайд «Agenda». Скопируй ([[Strg]]+[[C]]) и вставь на остальные три слайда шагов ([[Strg]]+[[V]] ставит на то же место).' },
    { sv: ['show', { title: 'Agenda', body: '1&nbsp;&nbsp;Das Anliegen definieren' }], cap: 'Показ слайдов (схема)', say: '**Проверка:** [[F5]] → кликай кнопки. В обычном режиме ссылка открывается через [[Strg]]+клик.' }
  ] };
})(window.PPT);
