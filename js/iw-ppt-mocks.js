/* PowerPoint-Klassenarbeit — Beispiel-Ergebnisse als Mini-Folien (SVG, Maße in cm wie in der Datei: Folie 33,87 × 19,05) + kleine HTML-Hilfen.
   Alles hier sind MEINE Musterlösungen (nicht vom Lehrer). */
window.PPT = window.PPT || {};
(function (P) {
  var S = 100, PT = 3.5278, IMG = 'img/iw-ppt/', uid = 0;
  var C = { petrol: '#0F3D3E', petrol2: '#1E6B6C', anth: '#2B2D2F', bern: '#F2A900', grau: '#EEF2F1', acc3: '#5FA3A3', acc4: '#8A9696', acc5: '#F7CF66', acc6: '#C7D3D2', white: '#FFFFFF', hint: '#FB923C' };
  P.C = C;
  function u(v) { return Math.round(v * S * 100) / 100; }

  function render(e) {
    var s, id;
    switch (e.t) {
      case 'rect':
        return '<rect x="' + u(e.x) + '" y="' + u(e.y) + '" width="' + u(e.w) + '" height="' + u(e.h) + '"' + (e.r ? ' rx="' + u(e.r) + '"' : '') +
          ' fill="' + (e.fill || 'none') + '"' + (e.stroke ? ' stroke="' + e.stroke + '" stroke-width="' + u(e.sw || 0.06) + '"' : '') + (e.dash ? ' stroke-dasharray="' + u(0.28) + ' ' + u(0.18) + '"' : '') + '/>';
      case 'ell':
        return '<ellipse cx="' + u(e.x + e.w / 2) + '" cy="' + u(e.y + e.h / 2) + '" rx="' + u(e.w / 2) + '" ry="' + u(e.h / 2) + '" fill="' + (e.fill || 'none') + '"' + (e.stroke ? ' stroke="' + e.stroke + '" stroke-width="' + u(e.sw || 0.06) + '"' : '') + '/>';
      case 'line':
        return '<line x1="' + u(e.x1) + '" y1="' + u(e.y1) + '" x2="' + u(e.x2) + '" y2="' + u(e.y2) + '" stroke="' + (e.color || C.acc4) + '" stroke-width="' + u(e.sw || 0.06) + '"' + (e.dash ? ' stroke-dasharray="' + u(0.28) + ' ' + u(0.18) + '"' : '') + '/>';
      case 'poly':
        return '<polygon points="' + e.pts.map(function (p) { return u(p[0]) + ',' + u(p[1]); }).join(' ') + '" fill="' + (e.fill || C.bern) + '"/>';
      case 'txt':
        s = (e.pt || 16) * PT;
        return '<foreignObject x="' + u(e.x) + '" y="' + u(e.y) + '" width="' + u(e.w) + '" height="' + u(e.h) + '"><div class="pp-mt" style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:' +
          (e.va === 'm' ? 'center' : e.va === 'b' ? 'flex-end' : 'flex-start') + ';text-align:' + (e.al === 'c' ? 'center' : e.al === 'r' ? 'right' : 'left') + ';font-size:' + s.toFixed(2) + 'px;color:' + (e.color || C.anth) + ';' +
          (e.b ? 'font-weight:700;' : '') + (e.i ? 'font-style:italic;' : '') + (e.pad ? 'padding:' + u(e.pad) + 'px;' : '') + '"><div>' + e.html + '</div></div></foreignObject>';
      case 'img':
        if (!e.crop) {
          return '<image href="' + IMG + e.src + '" x="' + u(e.x) + '" y="' + u(e.y) + '" width="' + u(e.w) + '" height="' + u(e.h) + '" preserveAspectRatio="none"/>';
        }
        id = 'ppc' + (++uid);
        var cr = e.crop, wf = cr.s, hf = cr.s * e.iw * (e.h / e.w) / e.ih, Wc = e.w / wf, Hc = e.h / hf;
        var x = e.x - (cr.cx - wf / 2) * Wc, y = e.y - (cr.cy - hf / 2) * Hc;
        return '<clipPath id="' + id + '"><rect x="' + u(e.x) + '" y="' + u(e.y) + '" width="' + u(e.w) + '" height="' + u(e.h) + '"/></clipPath><g clip-path="url(#' + id + ')"><image href="' + IMG + e.src + '" x="' + u(x) + '" y="' + u(y) + '" width="' + u(Wc) + '" height="' + u(Hc) + '" preserveAspectRatio="none"/></g>';
    }
    return '';
  }

  /* svg(elements, alt) -> <svg> */
  P.svg = function (els, alt) {
    return '<svg viewBox="0 0 3387 1905" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (alt || '').replace(/"/g, '&quot;') + '"><rect width="3387" height="1905" fill="#fff"/>' + els.map(render).join('') + '</svg>';
  };

  /* Inhaltsfolie wie im Layout „LU Inhalt“ */
  function chrome(chapter, title, o) {
    o = o || {};
    var a = [
      { t: 'ell', x: 1.52, y: 0.89, w: 0.56, h: 0.56, fill: C.bern },
      { t: 'txt', x: 2.34, y: 0.76, w: 20.32, h: 0.81, html: chapter, pt: 13, b: 1, color: C.petrol2, va: 'm' },
      { t: 'txt', x: 1.52, y: 1.57, w: 25.4, h: 1.91, html: title, pt: 30, b: 1, color: C.petrol, va: 'm' },
      { t: 'txt', x: 1.52, y: 17.73, w: 17.78, h: 0.76, html: 'LUMIO Licht &amp; Design GmbH &nbsp;|&nbsp; Unternehmenspräsentation 2026', pt: 10, color: C.acc4, va: 'm' }
    ];
    if (o.num) { a.push({ t: 'txt', x: 30.56, y: 17.6, w: 1.78, h: 0.89, html: String(o.num), pt: 10, color: C.acc4, al: 'r', va: 'm' }); }
    if (o.logo) { a.push({ t: 'img', src: 'lumio-logo-dark.png', x: 27.55, y: 0.55, w: 4.79, h: 1.12 }); }
    return a;
  }
  function note(x, y, w, h, label, lx, ly, lw) {   // orange dashed marker + label
    return [{ t: 'rect', x: x, y: y, w: w, h: h, stroke: C.hint, sw: 0.1, dash: true, r: 0.15 },
            { t: 'txt', x: lx, y: ly, w: lw || 9, h: 0.9, html: label, pt: 13, b: 1, color: C.hint, va: 'm' }];
  }

  P.mocks = {
    m1: function () {
      var a = [
        { t: 'rect', x: 0, y: 0, w: 33.87, h: 19.05, fill: C.petrol },
        { t: 'ell', x: 21.34, y: 2.29, w: 16.76, h: 16.76, fill: C.petrol2 },
        { t: 'ell', x: 25.15, y: 5.84, w: 9.65, h: 9.65, fill: C.bern },
        { t: 'img', src: 'lumio-logo-white.png', x: 2.03, y: 1.78, w: 6.6, h: 1.54 },
        { t: 'txt', x: 2.03, y: 6.48, w: 18.8, h: 4.06, html: 'Gutes Licht für jeden Raum', pt: 40, b: 1, color: '#fff', va: 'b' },
        { t: 'txt', x: 2.03, y: 10.92, w: 18.8, h: 2.54, html: 'Unternehmenspräsentation der LUMIO Licht &amp; Design GmbH<br>Hausmesse 2026, Bonn', pt: 18, color: C.acc5 }
      ];
      return P.svg(a.concat(note(1.6, 1.4, 7.4, 2.3, 'weißes Logo · ≈ 6,6 cm · oben links', 9.3, 2.0, 11)), 'Titelfolie mit kleinem weißen Logo oben links');
    },
    m2: function () {
      var rows = [['Gegründet', '<b>2004</b> in Bonn · Elena Marković, Tobias Reuter'], ['Standorte', 'Hauptsitz Bonn-Beuel · Showrooms Berlin, Frankfurt a. M.'], ['Mitarbeitende', '<b>126</b> — davon <b>31</b> Auszubildende'], ['Umsatz 2025', '<b>21,8 Mio. €</b>'], ['Kunden', 'in <b>11</b> Ländern Europas'], ['Geschäftsführung', 'Katrin Albers (seit 2021)']];
      var a = chrome('01 | Über uns', 'Über uns', { logo: 1, num: 3 });
      rows.forEach(function (r, i) {
        var y = 4.45 + i * 2.05;
        a.push({ t: 'txt', x: 1.52, y: y, w: 6.5, h: 1.9, html: r[0], pt: 16, b: 1, color: C.petrol2, va: 'm' });
        a.push({ t: 'txt', x: 8.2, y: y, w: 13.6, h: 1.9, html: r[1], pt: 18, color: C.anth, va: 'm' });
        a.push({ t: 'line', x1: 1.52, y1: y + 1.98, x2: 21.8, y2: y + 1.98, color: C.acc6, sw: 0.05 });
      });
      a.push({ t: 'img', src: 'photo-firmensitz.jpg', x: 22.8, y: 4.45, w: 9.5, h: 10.29 });
      a.push({ t: 'txt', x: 22.8, y: 14.9, w: 9.5, h: 0.9, html: 'Hauptsitz Bonn-Beuel', pt: 12, i: 1, color: C.acc4, va: 'm', al: 'c' });
      return P.svg(a, 'Folie Über uns als Kennzahlen-Liste');
    },
    m3: function () {
      var a = chrome('02 | Werte und Ziele', 'Unsere Werte', { logo: 1, num: 6 });
      a.push({ t: 'txt', x: 1.52, y: 4.15, w: 30.73, h: 2.7, html: '„Wir bringen gutes Licht in jeden Raum – energieeffizient, langlebig und schön gestaltet.“', pt: 22, i: 1, color: C.petrol, va: 'm' });
      var cards = [['bulb', 'Ideen, die leuchten', 'Wir entwickeln Leuchten, die Gestaltung und Technik auf neue Weise verbinden.'], ['leaf', 'Verantwortung für die Umwelt', 'Wir fertigen klimaneutral und achten auf langlebige, reparierbare Produkte.'], ['handshake', 'Nah am Kunden', 'Wir planen gemeinsam mit unseren Kunden und bleiben auch nach dem Kauf erreichbar.']];
      cards.forEach(function (c, i) {
        var x = [1.52, 12.04, 22.56][i];
        a.push({ t: 'rect', x: x, y: 7.55, w: 9.78, h: 8.7, fill: C.grau, r: 0.55 });
        a.push({ t: 'ell', x: x + 0.89, y: 8.55, w: 2.41, h: 2.41, fill: C.petrol2 });
        a.push({ t: 'img', src: 'icon-' + c[0] + '-white.png', x: x + 1.42, y: 9.08, w: 1.35, h: 1.35 });
        a.push({ t: 'txt', x: x + 0.89, y: 11.35, w: 8.1, h: 1.9, html: c[1], pt: 19, b: 1, color: C.petrol });
        a.push({ t: 'txt', x: x + 0.89, y: 13.2, w: 8.1, h: 2.8, html: c[2], pt: 15, color: C.anth });
      });
      return P.svg(a, 'Folie Unsere Werte mit drei Karten und weißen Piktogrammen');
    },
    m5: function () {
      var a = chrome('03 | Produkte und Services', 'Unsere Leuchten', { logo: 1, num: 8 });
      var items = [
        ['prod-stehleuchte.jpg', 600, 450, { cx: 0.5, cy: 0.5, s: 0.75 }, 'Nova Floor', 'Stehleuchte für Lounge und Empfang'],
        ['prod-pendelleuchte.jpg', 800, 450, { cx: 0.7185, cy: 0.5, s: 0.5625 }, 'Arc Pendant', 'Pendelleuchte für Besprechungstische'],
        ['prod-tischleuchte.jpg', 450, 600, { cx: 0.5, cy: 0.533, s: 1 }, 'Desk One', 'Schreibtischleuchte mit Dimmfunktion'],
        ['prod-wandleuchte.jpg', 500, 500, { cx: 0.5, cy: 0.5, s: 1 }, 'Wall Line', 'Wandleuchte für Flure und Hotelzimmer']];
      items.forEach(function (it, i) {
        var x = 1.52 + i * (6.9 + 1.043);
        a.push({ t: 'img', src: it[0], iw: it[1], ih: it[2], crop: it[3], x: x, y: 4.7, w: 6.9, h: 6.9 });
        a.push({ t: 'rect', x: x, y: 4.7, w: 6.9, h: 6.9, stroke: C.acc6, sw: 0.07 });
        a.push({ t: 'txt', x: x, y: 11.9, w: 6.9, h: 2.8, html: '<b style="font-size:1.12em;color:' + C.petrol + '">' + it[4] + '</b><br>' + it[5], pt: 14, color: C.anth });
      });
      return P.svg(a, 'Folie Unsere Leuchten: vier gleich große quadratische Fotos in einer Reihe mit Namen darunter');
    },
    m6: function () {
      var a = chrome('04 | Partner und Kunden', 'Vom Bauteil zur fertigen Leuchte', { logo: 1, num: 10 });
      var cols = [
        { x: 1.52, w: 6.9, h: 'Lieferanten', hc: C.petrol2, items: ['LED-Module', 'Aluminiumprofile', 'Glasschirme', 'Steuerungs- &amp; Sensortechnik'] },
        { x: 10.2, w: 5.7, h: 'LUMIO', hc: C.petrol, dark: 1, items: ['<b style="font-size:1.25em">Fertigung in Bonn</b>', 'montieren', 'prüfen'] },
        { x: 17.7, w: 5.7, h: 'Vertrieb', hc: C.petrol2, items: ['Showrooms', 'Onlineshop', 'Außendienst'] },
        { x: 25.2, w: 7.05, h: 'Kundengruppen', hc: C.petrol2, items: [] }
      ];
      cols.forEach(function (c, i) {
        a.push({ t: 'rect', x: c.x, y: 4.6, w: c.w, h: 10.4, fill: c.dark ? C.petrol : C.grau, r: 0.35 });
        a.push({ t: 'rect', x: c.x, y: 4.6, w: c.w, h: 1.7, fill: c.hc, r: 0.35 });
        a.push({ t: 'rect', x: c.x, y: 5.4, w: c.w, h: 0.9, fill: c.hc });
        a.push({ t: 'txt', x: c.x, y: 4.6, w: c.w, h: 1.7, html: c.h, pt: 20, b: 1, color: '#fff', va: 'm', al: 'c' });
        c.items.forEach(function (it, k) {
          a.push({ t: 'txt', x: c.x + 0.3, y: 6.7 + k * 2.05, w: c.w - 0.6, h: 1.9, html: it, pt: 17, color: c.dark ? '#fff' : C.anth, va: 'm', al: c.dark ? 'c' : 'l' });
        });
        if (i < 3) {
          var ax = c.x + c.w + 0.2, ay = 9.2;
          a.push({ t: 'poly', pts: [[ax, ay + 0.55], [ax + 0.8, ay + 0.55], [ax + 0.8, ay], [ax + 1.4, ay + 0.9], [ax + 0.8, ay + 1.8], [ax + 0.8, ay + 1.25], [ax, ay + 1.25]], fill: C.bern });
        }
      });
      [['Büro &amp; Verwaltung', '46 %'], ['Hotellerie &amp; Gastronomie', '32 %'], ['Einzelhandel', '22 %']].forEach(function (r, k) {
        a.push({ t: 'txt', x: 25.5, y: 6.7 + k * 2.7, w: 4.55, h: 2.4, html: r[0], pt: 16, color: C.anth, va: 'm' });
        a.push({ t: 'txt', x: 30.0, y: 6.7 + k * 2.7, w: 2.0, h: 2.4, html: r[1], pt: 20, b: 1, color: C.petrol2, va: 'm', al: 'r' });
      });
      return P.svg(a, 'Folie Vom Bauteil zur fertigen Leuchte: vier Spalten mit Pfeilen');
    },
    m7: function () {
      var a = chrome('04 | Partner und Kunden', 'Unsere wichtigsten Lieferanten', { logo: 1, num: 11 });
      var w = [8.5, 4.4, 8.4, 4.9, 4.5], x0 = 1.52, y0 = 4.5;
      var head = ['Lieferant', 'Standort', 'Liefert', 'Lieferzeit (Arbeitstage)', 'Partner seit'];
      var rows = [['LedPoint Elektronik GmbH', 'Nürnberg', 'LED-Module und Treiber', '12', '2009'], ['Alu-Profil Berger KG', 'Lüdenscheid', 'Aluminiumprofile und Gehäuse', '8', '2011'], ['Glashütte Sommer GmbH', 'Passau', 'Glasschirme', '18', '2015'], ['SmartLight Controls AG', 'Hannover', 'Steuerungs- und Sensortechnik', '10', '2020']];
      var xs = [x0]; w.forEach(function (v, i) { xs.push(xs[i] + v); });
      a.push({ t: 'rect', x: x0, y: y0, w: 30.7, h: 1.9, fill: C.petrol });
      head.forEach(function (h, i) { a.push({ t: 'txt', x: xs[i] + 0.3, y: y0, w: w[i] - 0.6, h: 1.9, html: h, pt: 16, b: 1, color: '#fff', va: 'm', al: i > 2 ? 'c' : 'l' }); });
      rows.forEach(function (r, k) {
        var y = y0 + 1.9 + k * 2.2;
        a.push({ t: 'rect', x: x0, y: y, w: 30.7, h: 2.2, fill: k % 2 ? '#fff' : C.grau });
        r.forEach(function (v, i) { a.push({ t: 'txt', x: xs[i] + 0.3, y: y, w: w[i] - 0.6, h: 2.2, html: (i === 3 && v === '8') ? '<b style="color:' + C.petrol2 + '">' + v + '</b>' : v, pt: 16, color: C.anth, va: 'm', al: i > 2 ? 'c' : 'l' }); });
      });
      a.push({ t: 'line', x1: x0, y1: y0 + 1.9 + 4 * 2.2, x2: x0 + 30.7, y2: y0 + 1.9 + 4 * 2.2, color: C.petrol, sw: 0.1 });
      return P.svg(a, 'Folie Lieferanten als Tabelle mit Petrol-Kopfzeile');
    },
    m8: function () {
      var a = chrome('05 | Team und Organisation', 'Unsere Organisation', { logo: 1, num: 12 });
      a.push({ t: 'rect', x: 13.6, y: 4.3, w: 6.9, h: 2.1, fill: C.petrol, r: 0.2 });
      a.push({ t: 'txt', x: 13.6, y: 4.3, w: 6.9, h: 2.1, html: '<b>Geschäftsführung</b><br>Katrin Albers', pt: 17, color: '#fff', va: 'm', al: 'c' });
      var xs = [1.52, 9.46, 17.4, 25.34];
      a.push({ t: 'line', x1: 17.05, y1: 6.4, x2: 17.05, y2: 7.3, color: C.acc4, sw: 0.08 });
      a.push({ t: 'line', x1: xs[0] + 3.45, y1: 7.3, x2: xs[3] + 3.45, y2: 7.3, color: C.acc4, sw: 0.08 });
      var L2 = [['Vertrieb', 'Ömer Kaya', ['Showrooms', 'Onlineshop']], ['Entwicklung', 'Dr. Felix Lang', ['Produktdesign', 'Elektrotechnik']], ['Produktion', 'Marta Nowak', ['Montage', 'Qualitätsprüfung', 'Nachhaltigkeits&shy;management']], ['Verwaltung', 'Jens Hoffmann', ['Personal', 'Rechnungswesen']]];
      L2.forEach(function (d, i) {
        var x = xs[i];
        a.push({ t: 'line', x1: x + 3.45, y1: 7.3, x2: x + 3.45, y2: 8.0, color: C.acc4, sw: 0.08 });
        a.push({ t: 'rect', x: x, y: 8.0, w: 6.9, h: 2.1, fill: C.petrol2, r: 0.2 });
        a.push({ t: 'txt', x: x, y: 8.0, w: 6.9, h: 2.1, html: '<b>' + d[0] + '</b><br>' + d[1], pt: 16, color: '#fff', va: 'm', al: 'c' });
        var n = d[2].length, last = 10.95 + (n - 1) * 1.5 + 0.6;
        a.push({ t: 'line', x1: x + 0.4, y1: 10.1, x2: x + 0.4, y2: last, color: C.acc4, sw: 0.07 });
        d[2].forEach(function (c, k) {
          var y = 10.95 + k * 1.5, neu = c.indexOf('Nachhaltigkeits') === 0;
          a.push({ t: 'line', x1: x + 0.4, y1: y + 0.6, x2: x + 0.75, y2: y + 0.6, color: C.acc4, sw: 0.07 });
          a.push({ t: 'rect', x: x + 0.75, y: y, w: 6.15, h: 1.2, fill: neu ? C.bern : C.grau, r: 0.12 });
          a.push({ t: 'txt', x: x + 0.75, y: y, w: 6.15, h: 1.2, html: c, pt: neu ? 13 : 15, b: neu, color: C.petrol, va: 'm', al: 'c' });
        });
      });
      a.push({ t: 'txt', x: 17.4, y: 15.4, w: 8, h: 0.9, html: '▲ neu ab 01.01.2027 — unter Produktion', pt: 12, b: 1, color: C.hint, va: 'm' });
      return P.svg(a, 'Organigramm mit drei Ebenen, neue Abteilung unter Produktion');
    },
    m9a: function () { return ausbildung(false); },
    m9b: function () { return ausbildung(true); }
  };
  function ausbildung(fixed) {
    var a = chrome('05 | Team und Organisation', 'Ausbildung bei LUMIO', { num: 13 });
    a.push({ t: 'img', src: 'photo-ausbildung.jpg', x: 1.52, y: 4.06, w: 30.81, h: 13.25 });
    var bw = fixed ? 17.6 : 14.99, tc = fixed ? C.petrol : C.petrol;
    if (fixed) { a.push({ t: 'rect', x: 2.54, y: 5.0, w: bw, h: 11.5, fill: '#fff', r: 0.2 }); }
    else { a.push({ t: 'rect', x: 2.54, y: 5.21, w: bw, h: 10.16, stroke: '#fff', sw: 0.1, dash: true }); }
    var big = fixed ? 24 : 20, li = fixed ? 20 : 17;
    a.push({ t: 'txt', x: 3.3, y: fixed ? 5.5 : 5.84, w: bw - 1.5, h: fixed ? 10.5 : 8.89, pt: li, color: tc,
      html: '<b style="font-size:' + (big / li).toFixed(2) + 'em">Wir bilden aus:</b><br>• Kaufleute für Büromanagement<br>• Industriekaufleute<br>• Elektronikerinnen und Elektroniker für Geräte und Systeme<br>• Technische Produktdesignerinnen und -designer<br><br><b>10 Ausbildungsplätze pro Jahr | Übernahmequote 2025: 95 %</b>' });
    return P.svg(a, fixed ? 'Ausbildungsfolie nach der Korrektur: weiße Fläche vor dem Foto' : 'Ausbildungsfolie vorher: Foto liegt vor der weißen Fläche');
  }

  /* ----------------------------------------------------------- HTML-Hilfen pro Aufgabe */
  P.extras = {
    icons: function () {
      var L = [['truck', 'Lieferwagen'], ['bulb', 'Glühbirne', 1], ['euro', 'Euro'], ['medal', 'Medaille'], ['handshake', 'Handschlag', 1], ['clock', 'Uhr'], ['heart', 'Herz mit Puls'], ['leaf', 'Blatt', 1]];
      return '<h5>Das Material (Folie 16) — nur drei Piktogramme passen</h5><div class="pp-icons">' + L.map(function (x) {
        return '<figure class="' + (x[2] ? 'use' : '') + '"><img src="img/iw-ppt/icon-' + x[0] + '.png" alt="' + x[1] + '"><figcaption>' + x[1] + (x[2] ? ' ✓' : '') + '</figcaption></figure>';
      }).join('') + '</div><p class="pp-small">Zuordnung: <b>Ideen, die leuchten</b> → Glühbirne · <b>Verantwortung für die Umwelt</b> → Blatt · <b>Nah am Kunden</b> → Handschlag. Die Piktogramme sind im Material <b>dunkelgrau</b> — auf dem Petrol-Kreis erst nach dem Weiß-Einfärben sichtbar.</p>';
    },
    animpane: function () {
      return '<h5>So sieht der Animationsbereich aus (Folie 6)</h5><div class="pp-mock-row"><div><div class="pp-small" style="margin-bottom:.25rem">❌ direkt nach dem Hinzufügen (neue Effekte stehen hinten)</div><div class="pp-anim bad"><div class="hd">Animationsbereich</div><div><i>1</i>Zielkarte Nachhaltigkeit<u>Verblassen · Beim Klicken</u></div><div><i>2</i>Zielkarte Wachstum<u>Verblassen · Beim Klicken</u></div><div><i>3</i>Zielkarte Mitarbeitende<u>Verblassen · Beim Klicken</u></div></div></div>' +
        '<div><div class="pp-small" style="margin-bottom:.25rem">✅ nach „Früher“ — wie im Vortrag gesprochen</div><div class="pp-anim"><div class="hd">Animationsbereich</div><div><i>1</i>Zielkarte Wachstum<u>Verblassen · Beim Klicken</u></div><div><i>2</i>Zielkarte Nachhaltigkeit<u>Verblassen · Beim Klicken</u></div><div><i>3</i>Zielkarte Mitarbeitende<u>Verblassen · Beim Klicken</u></div></div></div></div>';
    },
    cdtable: function () {
      var R = [['4 „Unser Weg“', 'Titel und alle Texte in <b>Cambria</b>', 'Start → Ersetzen → Schriftarten ersetzen: Cambria → Calibri'],
        ['9 „LUMIO in Zahlen“', '<b>cremefarbener Hintergrund</b> (nicht Weiß)', 'Entwurf → Hintergrund formatieren → Hintergrund zurücksetzen'],
        ['9 Diagramm', 'Balken in <b>Standardgrün</b>; Zahlen der Werteachse in <b>Arial</b>, schwarz', 'Balken: Format → Fülleffekt → Designfarbe · Achse: Schriftart Calibri'],
        ['12 „Kontakt“', 'vier Kreise in <b>Standardblau</b> (auf „Services“ sind sie Petrol hell)', 'Kreise markieren → Formformat → Fülleffekt → Akzent 2'],
        ['13 „Unsere Organisation“', 'Hinweis-Kasten in fremdem Hellgelb · Übergang <b>Kreis</b>', 'nach Aufgabe 8 löschen oder Designfarbe · Übergang → s. u.'],
        ['5 „Unsere Werte“', 'Übergang <b>Rad</b>', 'Übergänge → Verblassen → Für alle übernehmen'],
        ['alle anderen', 'kein Übergang', '… derselbe Effekt wie überall']];
      return '<h5>Abweichungen in der Ausgangsdatei <span class="pp-mine">nachgeprüft</span></h5><div class="pp-tablewrap"><table class="pp-mini"><tr><th>Folie</th><th>Abweichung</th><th>Korrektur</th></tr>' +
        R.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</table></div>' +
        '<div class="pp-swatches">' + [['#FFFFFF', 'Weiß<br>Hintergrund 1'], ['#2B2D2F', 'Anthrazit<br>Text 1'], ['#EEF2F1', 'Hellgrau<br>Hintergrund 2'], ['#0F3D3E', 'Petrol<br>Text 2'], ['#F2A900', 'Bernstein<br>Akzent 1'], ['#1E6B6C', 'Petrol hell<br>Akzent 2'], ['#5FA3A3', 'Akzent 3'], ['#8A9696', 'Akzent 4'], ['#F7CF66', 'Akzent 5'], ['#C7D3D2', 'Akzent 6']].map(function (c) { return '<div class="pp-sw"><i style="background:' + c[0] + '"></i>' + c[1] + '</div>'; }).join('') + '</div>' +
        '<p class="pp-small">So liegen die <b>Designfarben</b> der Datei im Farbmenü (oberste Reihe, von links nach rechts). Mit diesen Farben ist man automatisch im Corporate Design.</p>';
    },
    layoutinfo: function () {
      return '<h5>Welches Layout benutzt welche Folie?</h5><div class="pp-tablewrap"><table class="pp-mini"><tr><th>Layout</th><th>Benutzt von</th><th>Logo?</th></tr>' +
        '<tr><td>LU Titel</td><td>Folie 1</td><td>nein — kommt in Aufgabe 1 direkt auf die Folie</td></tr>' +
        '<tr><td><b>LU Inhalt</b></td><td>Folien 2–14 und 16</td><td><b>hier das dunkle Logo einfügen</b></td></tr>' +
        '<tr><td>LU Abschluss</td><td>Folie 15</td><td>hat das weiße Logo schon — nicht anfassen</td></tr>' +
        '<tr><td>Leer</td><td>—</td><td>nicht anfassen</td></tr></table></div>';
    },
    order: function () {
      var cur = [['Titel'], ['Agenda'], ['Über uns'], ['Unser Weg'], ['Unsere Werte'], ['Unsere Ziele bis 2030'], ['Unsere Leuchten'], ['Unsere Services'], ['LUMIO in Zahlen', 'mv'], ['Vom Bauteil zur fertigen Leuchte'], ['Unsere wichtigsten Lieferanten'], ['Kontakt', 'mv'], ['Unsere Organisation'], ['Ausbildung bei LUMIO'], ['Abschluss'], ['Material für die Fertigstellung', 'del']];
      var tgt = [['Titel'], ['Agenda'], ['Über uns', '', '01'], ['Unser Weg', '', '01'], ['LUMIO in Zahlen', 'mv', '01'], ['Unsere Werte', '', '02'], ['Unsere Ziele bis 2030', '', '02'], ['Unsere Leuchten', '', '03'], ['Unsere Services', '', '03'], ['Vom Bauteil zur fertigen Leuchte', '', '04'], ['Unsere wichtigsten Lieferanten', '', '04'], ['Unsere Organisation', '', '05'], ['Ausbildung bei LUMIO', '', '05'], ['Kontakt', 'mv', '06'], ['Abschluss']];
      function ol(L) { return '<ol class="pp-order">' + L.map(function (x) { return '<li class="' + (x[1] || '') + '">' + x[0] + (x[2] ? ' <span class="pp-small">(' + x[2] + ')</span>' : '') + '</li>'; }).join('') + '</ol>'; }
      return '<h5>Reihenfolge vorher → nachher</h5><div class="pp-mock-row"><div><div class="pp-small">❌ Ausgangsdatei (16 Folien)</div>' + ol(cur) + '</div><div><div class="pp-small">✅ Soll (15 Folien) — in Klammern das Kapitel</div>' + ol(tgt) + '</div></div>';
    },
    linktable: function () {
      var R = [['01 Über uns', 'Folie 3', 'Über uns'], ['02 Werte und Ziele', 'Folie 6', 'Unsere Werte'], ['03 Produkte und Services', 'Folie 8', 'Unsere Leuchten'], ['04 Partner und Kunden', 'Folie 10', 'Vom Bauteil zur fertigen Leuchte'], ['05 Team und Organisation', 'Folie 12', 'Unsere Organisation'], ['06 Kontakt', 'Folie 14', 'Kontakt']];
      return '<h5>Agenda-Karte → Ziel (in der endgültigen Reihenfolge)</h5><div class="pp-tablewrap"><table class="pp-mini"><tr><th>Karte auf der Agenda</th><th>Ziel</th><th>Folientitel im Dialog</th></tr>' +
        R.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</table></div>';
    },
    filename: function () { return P.fileGen('t14'); }
  };

  /* Dateiname-Generator (wird in Karte 1 und bei Aufgabe 14 benutzt; Eingaben sind synchronisiert) */
  P.fileGen = function (id) {
    return '<div class="pp-box orange"><h4>Dateiname nach dem Muster <span class="pp-mine">Generator</span></h4><div class="pp-calc"><input class="pp-in" data-fg="klasse" placeholder="Klasse, z. B. 11b" aria-label="Klasse"><input class="pp-in" data-fg="nach" placeholder="Nachname" aria-label="Nachname"><input class="pp-in" data-fg="vor" placeholder="Vorname" aria-label="Vorname"></div><p style="margin:.5rem 0 0"><span class="pp-de" data-fg-out>PK_PPT_Klasse_Nachname_Vorname</span><span class="pp-small"> .pptx</span></p></div>';
  };
  P.mockCap = {
    m1: 'Beispiel-Ergebnis: das weiße Logo klein oben links (Maße wie auf der Abschlussfolie), Titel bleibt der Hauptakteur.',
    m2: 'Beispiel-Ergebnis: Zeilen mit Label, Zahlen fett — auf einen Blick erfassbar. Der volle Text liegt unten in den Notizen.',
    m3: 'Beispiel-Ergebnis: drei Karten wie bei „Unsere Services“, die Piktogramme weiß auf Petrol-Kreisen.',
    m5: 'Beispiel-Ergebnis: vier Quadrate (1:1), Lampe jeweils mittig, einheitlicher dünner Rahmen, Name direkt unter dem Foto.',
    m6: 'Beispiel-Ergebnis: vier Spalten mit Block-Pfeilen — kein Fließtext mehr; die Prozentwerte bleiben sichtbar.',
    m7: 'Beispiel-Ergebnis: Kopfzeile Petrol, Zeilen abwechselnd Hellgrau/Weiß, Zahlen zentriert, kürzeste Lieferzeit hervorgehoben.',
    m8: 'Beispiel-Ergebnis: Organigramm in drei Ebenen („Links hängend“ für die dritte); die neue Abteilung steht unter Produktion (Bernstein).',
    m9a: '❌ Vorher: das Foto liegt vor der weißen Fläche (gestrichelt) — der Text steht dunkel auf dem dunklen Foto.',
    m9b: '✅ Nachher: Foto in den Hintergrund, weiße Fläche vorn, Schrift größer — das Foto rechts bleibt Blickfang.'
  };
  P.mockNotes = {
    m2: 'Die LUMIO Licht &amp; Design GmbH wurde 2004 von Elena Marković und Tobias Reuter in Bonn als kleines Ingenieurbüro für Lichtplanung gegründet. Inzwischen entwickeln und fertigen wir an unserem Hauptsitz in Bonn-Beuel hochwertige LED-Leuchten für Büros, Hotels und Geschäfte. Zusätzlich präsentieren wir unsere Produkte in zwei Showrooms in Berlin und Frankfurt am Main. Insgesamt arbeiten 126 Mitarbeiterinnen und Mitarbeiter für LUMIO, darunter 31 Auszubildende. Im Geschäftsjahr 2025 haben wir einen Umsatz von 21,8 Millionen Euro erwirtschaftet. Unsere Leuchten werden heute an Kunden in 11 Ländern Europas geliefert. Seit 2021 wird das Unternehmen von Katrin Albers als Geschäftsführerin geleitet; die beiden Gründer sind weiterhin als Gesellschafter beteiligt.'
  };
})(window.PPT);
