/* PowerPoint-Klassenarbeit — «Начни здесь» (5 действий) + «Покажи в PowerPoint»: схематичные КАДРЫ ленты.
   ВАЖНО: это СХЕМА по знанию интерфейса Microsoft 365 (немецкий) и справке Microsoft, НЕ скриншоты и в самом PowerPoint не проверено.
   Подключается в iw-egb.html ПЕРЕД iw-ppt.js: renderPP1 вызывает P.startHtml(), затем P.bindShow(root) и P.bindStart(root).
   Разметка в текстах кадров:  **fett**   [[Taste]]. */
window.PPT = window.PPT || {};
(function (P) {
  'use strict';

  var TABS = ['Datei', 'Start', 'Einfügen', 'Entwurf', 'Übergänge', 'Animationen', '⋯', 'Ansicht'];   // gekürzt, damit die Formformat-/Bildformat-Tab in einer Zeile bleibt
  /* Designfarben der Ausgangsdatei LUMIO (theme1.xml): lt1, dk1, lt2, dk2, accent1…6 */
  var THEME = [['Hintergrund 1', '#FFFFFF'], ['Text 1', '#2B2D2F'], ['Hintergrund 2', '#EEF2F1'], ['Text 2', '#0F3D3E'], ['Akzent 1', '#F2A900'],
    ['Akzent 2', '#1E6B6C'], ['Akzent 3', '#5FA3A3'], ['Akzent 4', '#8A9696'], ['Akzent 5', '#F7CF66'], ['Akzent 6', '#C7D3D2']];
  var CDN = ['Weiß', 'Anthrazit', 'Hellgrau', 'Petrol', 'Bernstein', 'Petrol hell', '', '', '', ''];   // Namen aus dem Corporate Design der Datei
  var STD = ['#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0'];

  function store(key) {
    return {
      get: function (d) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
      set: function (v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ } }
    };
  }
  function fm(s) {
    return String(s).replace(/\[\[([^\]]+)\]\]/g, function (_, k) { return '<span class="pp-key">' + (k === 'Umschalt' ? '⇧ Umschalt' : k) + '</span>'; }).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  }
  function mix(hex, t) {   // t > 0 heller, t < 0 dunkler
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }

  /* ------------------------------------------------------------------ Ribbon-Bausteine */
  var HI = [], POP = null;
  function hiIdx(id) { return HI.indexOf(id); }
  function badge(i) { return HI.length > 1 && i >= 0 ? '<i class="rb-n">' + (i + 1) + '</i>' : ''; }
  function btn(id, label, ic, o) {
    o = o || {};
    var i = hiIdx(id), hi = i >= 0;
    return '<div class="rb-b' + (hi ? ' rb-hi' : '') + '" data-id="' + id + '">' + badge(i) +
      '<span class="ic' + (o.cls ? ' ' + o.cls : '') + (o.bar ? ' bar' : '') + '">' + ic + '</span>' +
      (label ? '<span class="lb">' + label + (o.dd ? ' <small>▾</small>' : '') + '</span>' : (o.dd ? '<small class="dd">▾</small>' : '')) +
      (hi && o.tip ? '<span class="rb-tip">' + o.tip + '</span>' : '') +
      (POP && POP.at === id ? pop(POP) : '') + '</div>';
  }
  function cbx(id, val, w) {
    var i = hiIdx(id);
    return '<div class="rb-cb' + (i >= 0 ? ' rb-hi' : '') + '" style="width:' + w + 'rem" data-id="' + id + '">' + badge(i) + '<span>' + val + '</span><small>▾</small></div>';
  }
  function fld(id, label, val) {
    var i = hiIdx(id);
    return '<div class="rb-fld"><span>' + label + '</span><b class="' + (i >= 0 ? 'rb-hi' : '') + '" data-id="' + id + '">' + badge(i) + val + '</b></div>';
  }
  function grp(name, body) { return '<div class="rb-g"><div class="rb-gb">' + body + '</div><div class="rb-gl">' + name + '</div></div>'; }
  function col() { return '<div class="rb-c">' + Array.prototype.join.call(arguments, '') + '</div>'; }
  function row() { return '<div class="rb-r">' + Array.prototype.join.call(arguments, '') + '</div>'; }
  function gal() { return '<div class="rb-gal"><i></i><i></i><i></i></div>'; }

  /* Nur die Gruppen, die die Kadры brauchen (Rest weggelassen — im Bild stehen dafür „⋯“) */
  var RB = {
    'Start': {
      'Zwischenablage': function () {
        return grp('Zwischenablage', btn('paste', 'Einfügen', '📋', { dd: 1 }) + col(btn('cut', 'Ausschneiden', '✂'), btn('copy', 'Kopieren', '⧉', { dd: 1 }), btn('fpaint', 'Format übertragen', '🖌')));
      },
      'Schriftart': function () {
        return grp('Schriftart', col(
          row(cbx('font', 'Calibri', 7.5), cbx('size', '18', 3.2), btn('grow', '', 'A⁺', { tip: 'Schriftgrad vergrößern' }), btn('shrink', '', 'A⁻', { tip: 'Schriftgrad verkleinern' }), btn('clear', '', '⌫', { tip: 'Alle Formatierungen löschen' })),
          row(btn('bold', '', 'F', { cls: 'fb', tip: 'Fett' }), btn('ital', '', 'K', { cls: 'fi', tip: 'Kursiv' }), btn('und', '', 'U', { cls: 'fu', tip: 'Unterstrichen' }), btn('shad', '', 'S', { cls: 'fs', tip: 'Textschatten' }), btn('case', '', 'Aa', { dd: 1, tip: 'Groß-/Kleinschreibung' }), btn('fcol', '', 'A', { dd: 1, bar: 1, tip: 'Schriftfarbe' }))));
      }
    },
    'Formformat': {
      'Formenarten': function () {
        return grp('Formenarten', gal() + col(btn('fill', 'Formfüllung', '◼', { dd: 1 }), btn('line', 'Formkontur', '▭', { dd: 1 }), btn('eff', 'Formeffekte', '✦', { dd: 1 })));
      },
      'Anordnen': function () {
        return grp('Anordnen', col(btn('front', 'Nach vorne bringen', '⬒', { dd: 1 }), btn('back', 'Nach hinten senden', '⬓', { dd: 1 }), btn('selp', 'Auswahlbereich', '☰')) +
          col(btn('align', 'Ausrichten', '⫼', { dd: 1 }), btn('group', 'Gruppieren', '⧉', { dd: 1 }), btn('rot', 'Drehen', '⟳', { dd: 1 })));
      },
      'Größe': function () { return grp('Größe', col(fld('h', 'Höhe:', '6,5 cm'), fld('w', 'Breite:', '9,8 cm'))); }
    },
    'Bildformat': {
      'Anordnen': function () { return RB['Formformat']['Anordnen'](); },
      'Größe': function () { return grp('Größe', btn('crop', 'Zuschneiden', '⌗', { dd: 1 }) + col(fld('h', 'Höhe:', '2,8 cm'), fld('w', 'Breite:', '12,0 cm'))); }
    }
  };

  /* Popups: Liste (menu) oder Farbpalette (palette) */
  function menu(p, cls) {
    return '<div class="rb-pop' + (p.right ? ' r' : '') + (cls ? ' ' + cls : '') + '">' + p.items.map(function (it) {
      if (it === '-') { return '<hr>'; }
      return '<div class="it' + (it === p.hi ? ' hi' : '') + '"><span class="ck">' + (it === p.chk ? '✓' : '') + '</span>' + it + '</div>';
    }).join('') + '</div>';
  }
  function pal(p) {
    var TH = p.theme || THEME, NM = p.theme ? (p.names || []) : CDN;   // p.theme: eigene Palette (z. B. das alte «Office»-Design der Schulbeginn-Datei)
    var top = TH.map(function (c, i) { return '<i class="sq' + (i === p.hi ? ' hi' : '') + '" style="background:' + c[1] + '" title="' + c[0] + '"></i>'; }).join('');
    var tints = [0.8, 0.6, 0.4, -0.25, -0.5].map(function (t) {
      return '<div class="rw">' + TH.map(function (c) { return '<i class="sq" style="background:' + mix(c[1], t) + '"></i>'; }).join('') + '</div>';
    }).join('');
    var std = STD.map(function (c) { return '<i class="sq" style="background:' + c + '"></i>'; }).join('');
    var items = p.items || (p.mode === 'font' ? ['Weitere Farben…', 'Pipette', 'Farbverlauf ▸'] : ['Keine Füllung', 'Weitere Füllfarben…', 'Pipette', 'Bild…', 'Farbverlauf ▸', 'Struktur ▸']);
    return '<div class="rb-pop pal' + (p.right ? ' r' : '') + '"><div class="ph">Designfarben</div><div class="rw">' + top + '</div>' +
      (p.hi >= 0 && p.hi != null ? '<div class="co">▲ ' + (p.hi + 1) + '-й квадрат слева: ' + (NM[p.hi] ? '<b>' + NM[p.hi] + '</b> · ' : '') + TH[p.hi][0] + '</div>' : '') +
      tints + '<div class="ph">Standardfarben</div><div class="rw">' + std + '</div>' +
      items.map(function (it) { return '<div class="it' + (it === p.hiItem ? ' hi' : '') + '"><span class="ck"></span>' + it + '</div>'; }).join('') + '</div>';
  }
  function pop(p) { return p.t === 'palette' ? pal(p) : menu(p); }
  function popH(p) { return p.t === 'palette' ? 19.5 : p.items.length * 1.45 + 0.8; }

  function ribbon(f) {
    HI = [].concat(f.hi || []);
    POP = f.pop ? { t: f.pop.t, items: f.pop.items, hi: f.pop.hi, chk: f.pop.chk, mode: f.pop.mode, hiItem: f.pop.hiItem, right: f.pop.right, theme: f.pop.theme, names: f.pop.names, at: f.pop.at || HI[0] } : null;
    var tabs = TABS.map(function (t) { return '<span class="rb-tab' + (f.tab === t ? ' on' : '') + (f.hiTab === t ? ' rb-hi' : '') + '">' + t + '</span>'; }).join('') +
      (f.ctx ? '<span class="rb-tab ctx' + (f.tab === f.ctx ? ' on' : '') + (f.hiTab === f.ctx ? ' rb-hi' : '') + '">' + f.ctx + '</span>' : '');
    var names = f.groups || Object.keys(RB[f.tab]);
    var body = names.map(function (g) { return RB[f.tab][g](); }).join('');
    var pad = POP ? Math.max(0, popH(POP) - 1.6) : 0;
    var html = '<div class="rb"><div class="rb-tabs">' + tabs + '</div><div class="rb-body" style="padding-bottom:' + (0.35 + pad).toFixed(2) + 'rem"><span class="rb-cut">⋯</span>' + body + '<span class="rb-cut">⋯</span></div>' +
      '<div class="rb-note">Схема ленты PowerPoint — не скриншот</div></div>';
    HI = []; POP = null;
    return html;
  }
  function ctxMenu(m) {
    return '<div class="rb"><div class="rb-ctx">' + menu(m, 'static') + '</div><div class="rb-note">Контекстное меню (правый клик по объекту) — список сокращён, схема, не скриншот</div></div>';
  }
  function dlg(o) {
    o = (o && typeof o === 'object') ? o : { r: 15, g: 61, b: 62, hex: '#0F3D3E' };   // ohne Angabe: Petrol der LUMIO-Datei
    return '<div class="rb"><div class="rb-dlg"><div class="dt"><span>Farben</span><span>✕</span></div><div class="dtabs"><span>Standard</span><span class="on">Benutzerdefiniert</span></div>' +
      '<div class="dbody"><div class="grad"></div><div class="dfld"><div><span>Farbmodell:</span> <span class="sel">RGB ▾</span></div>' +
      '<div class="rgbs"><span>Rot:</span><span class="num rb-hi"><i class="rb-n">1</i>' + o.r + '</span><span>Grün:</span><span class="num rb-hi"><i class="rb-n">2</i>' + o.g + '</span><span>Blau:</span><span class="num rb-hi"><i class="rb-n">3</i>' + o.b + '</span></div>' +
      '<div class="nc"><span><i style="background:' + o.hex + '"></i>Neu</span><span><i style="background:#4472C4"></i>Aktuell</span></div></div></div>' +
      '<div class="dbtn"><span class="rb-hi">OK<i class="rb-n">4</i></span><span>Abbrechen</span></div></div><div class="rb-note">Схема окна — не скриншот</div></div>';
  }

  /* allgemeines Fenster: {t: Titel, tabs: [..], on: Index, rows: [{k:'fld'|'chk'|'list'|'cols'|'txt', …, hi}], btns: [{l, hi}]} — Nummern nur, wenn mehr als ein Element markiert ist */
  function win(o) {
    var n = 0, cnt = 0;
    (o.rows || []).forEach(function (r) { if (r.hi === 1 || (r.k === 'list' && r.hi >= 0 && r.hi != null) || (r.k === 'cols' && (r.ha != null || r.hb != null))) { cnt += (r.k === 'cols') ? ((r.ha != null ? 1 : 0) + (r.hb != null ? 1 : 0)) : 1; } });
    (o.btns || []).forEach(function (b) { if (b.hi) { cnt++; } });
    function mk(on) { return on && cnt > 1 ? '<i class="rb-n">' + (++n) + '</i>' : ''; }
    function lst(items, h) {
      return '<div class="wl">' + items.map(function (it, i) { return '<div class="' + (i === h ? 'sel rb-hi' : '') + '">' + mk(i === h) + it + '</div>'; }).join('') + '</div>';
    }
    var tabs = o.tabs ? '<div class="dtabs">' + o.tabs.map(function (t, i) { return '<span' + (i === (o.on || 0) ? ' class="on"' : '') + '>' + t + '</span>'; }).join('') + '</div>' : '';
    var rows = (o.rows || []).map(function (r) {
      if (r.k === 'fld') { return '<div class="wr"><span class="l">' + r.l + '</span><span class="wv' + (r.hi ? ' rb-hi' : '') + '">' + mk(r.hi) + r.v + '</span></div>'; }
      if (r.k === 'chk') { return '<div class="wr"><span class="wc' + (r.hi ? ' rb-hi' : '') + '">' + mk(r.hi) + '<i class="bx">' + (r.on ? '✓' : '') + '</i>' + r.l + '</span></div>'; }
      if (r.k === 'list') { return '<div class="wr">' + (r.title ? '<span class="l">' + r.title + '</span>' : '') + lst(r.items, r.hi) + '</div>'; }
      if (r.k === 'cols') { return '<div class="wcols">' + lst(r.a, r.ha) + lst(r.b, r.hb) + '</div>'; }
      return '<div class="wr"><span>' + (r.v || '') + '</span></div>';
    }).join('');
    var btns = (o.btns || []).map(function (b) { return '<span' + (b.hi ? ' class="rb-hi"' : '') + '>' + mk(b.hi) + b.l + '</span>'; }).join('');
    return '<div class="rb"><div class="rb-win"><div class="dt"><span>' + o.t + '</span><span>✕</span></div>' + tabs + '<div class="wb">' + rows + '</div>' + (btns ? '<div class="wbtn">' + btns + '</div>' : '') + '</div><div class="rb-note">Схема окна — не скриншот</div></div>';
  }

  /* ------------------------------------------------------------------ Mini-Folien (SVG, 160 × 90) */
  function hnd(x, y) { return '<rect x="' + (x - 1.6) + '" y="' + (y - 1.6) + '" width="3.2" height="3.2" fill="#fff" stroke="#3b82f6" stroke-width=".7"/>'; }
  function sel(x, y, w, h) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="#3b82f6" stroke-width=".7"/>' +
      hnd(x, y) + hnd(x + w, y) + hnd(x, y + h) + hnd(x + w, y + h) + hnd(x + w / 2, y) + hnd(x + w / 2, y + h) + hnd(x, y + h / 2) + hnd(x + w, y + h / 2);
  }
  function card(x, y) {
    return '<rect x="' + x + '" y="' + y + '" width="40" height="50" rx="4" fill="#EEF2F1" stroke="#b9c7c6" stroke-width=".7"/><circle cx="' + (x + 20) + '" cy="' + (y + 13) + '" r="7" fill="#1E6B6C"/>' +
      '<rect x="' + (x + 7) + '" y="' + (y + 26) + '" width="26" height="3" rx="1.5" fill="#0F3D3E"/><rect x="' + (x + 7) + '" y="' + (y + 33) + '" width="20" height="2.4" rx="1.2" fill="#8A9696"/><rect x="' + (x + 7) + '" y="' + (y + 39) + '" width="23" height="2.4" rx="1.2" fill="#8A9696"/>';
  }
  function logo(x, y, s, c) {
    return '<circle cx="' + (x + s * 0.09) + '" cy="' + (y + s * 0.16) + '" r="' + (s * 0.09) + '" fill="#F2A900"/><text x="' + (x + s * 0.22) + '" y="' + (y + s * 0.27) + '" font-family="Arial, sans-serif" font-weight="700" font-size="' + (s * 0.3) + '" fill="' + c + '">LUMIO</text>';
  }
  function thumb(t) {
    var s = '', i;
    if (t.k === 'cards') {
      var X = t.s === 2 ? [12, 60, 108] : [12, 66, 108], Y = t.s === 0 ? [16, 27, 9] : [20, 20, 20];
      for (i = 0; i < 3; i++) { s += card(X[i], Y[i]); }
      if (t.guide) { s += '<line x1="4" x2="156" y1="45" y2="45" stroke="#fb923c" stroke-width=".9" stroke-dasharray="3 2"/>'; }
      if (t.gaps) { for (i = 0; i < 2; i++) { s += '<path d="M' + (X[i] + 40) + ' 78v4M' + X[i + 1] + ' 78v4M' + (X[i] + 40) + ' 80H' + X[i + 1] + '" stroke="#fb923c" stroke-width="1" fill="none"/>'; } }
      if (t.sel) { for (i = 0; i < 3; i++) { s += sel(X[i] - 1, Y[i] - 1, 42, 52); } }
    } else if (t.k === 'circle') {
      s = '<rect x="12" y="10" width="70" height="6" rx="2" fill="#0F3D3E"/><rect x="12" y="22" width="48" height="3" rx="1.5" fill="#8A9696"/><circle cx="100" cy="52" r="24" fill="' + (t.c === 'pet' ? '#0F3D3E' : '#4472C4') + '"/>' + (t.sel ? sel(76, 28, 48, 48) : '');
    } else if (t.k === 'text') {
      var ok = t.s === 1, ff = ok ? 'Calibri, Carlito, Arial, sans-serif' : 'Cambria, Georgia, serif';
      if (t.sel) { s += '<rect x="10" y="12" width="104" height="48" fill="#cfe0ff" opacity=".7"/>'; }
      s += '<text x="14" y="' + (ok ? 28 : 24) + '" font-family="' + ff + '" font-size="' + (ok ? 12 : 7.5) + '" font-weight="' + (ok ? 700 : 400) + '" fill="' + (ok ? '#1E6B6C' : '#000') + '">Gegründet</text>';
      ['2004 in Bonn', 'Hauptsitz Bonn-Beuel', '126 Mitarbeitende'].forEach(function (line, k) {
        s += '<text x="14" y="' + ((ok ? 42 : 33) + k * (ok ? 13 : 9)) + '" font-family="' + ff + '" font-size="' + (ok ? 10 : 7) + '" fill="' + (ok ? '#2B2D2F' : '#000') + '">' + line + '</text>';
      });
    } else if (t.k === 'logo') {
      if (t.s === 0) {
        s = '<text x="8" y="9" font-family="Arial" font-size="5.5" fill="#666">Folie 16 · Material für die Fertigstellung</text><rect x="6" y="14" width="68" height="60" rx="3" fill="#f6f6f6" stroke="#ccc" stroke-width=".6"/><rect x="86" y="14" width="68" height="60" rx="3" fill="#0F3D3E"/>' +
          logo(16, 34, 50, '#0F3D3E') + logo(96, 34, 50, '#fff') + sel(93, 33, 56, 17);
      } else if (t.s === 1) {
        s = '<rect width="160" height="90" fill="#0F3D3E"/><circle cx="132" cy="48" r="26" fill="#1E6B6C"/><circle cx="132" cy="48" r="13" fill="#F2A900"/><text x="9.6" y="52" font-family="Arial" font-weight="700" font-size="11" fill="#fff">Gutes Licht</text><text x="9.6" y="65" font-family="Arial" font-weight="700" font-size="11" fill="#fff">für jeden Raum</text>' + logo(51.6, 23.05, 36, '#fff') + sel(51.6, 23.05, 36, 8.4) + (t.corner ? '<circle cx="87.6" cy="31.45" r="4.4" fill="none" stroke="#fb923c" stroke-width="1.4"/><text x="64" y="42" font-family="Arial" font-size="6" font-weight="700" fill="#fb923c">за угол!</text>' : '');
      } else {
        s = '<rect width="160" height="90" fill="#0F3D3E"/>' + logo(8, 6, 30, '#fff') + '<text x="8" y="52" font-family="Arial" font-weight="700" font-size="12" fill="#fff">Gutes Licht</text><text x="8" y="66" font-family="Arial" font-weight="700" font-size="12" fill="#fff">für jeden Raum</text>' +
          '<circle cx="132" cy="48" r="26" fill="#1E6B6C"/><circle cx="132" cy="48" r="13" fill="#F2A900"/>';
      }
    } else if (t.k === 'group') {
      s = '<rect x="46" y="10" width="68" height="70" rx="5" fill="#EEF2F1" stroke="#b9c7c6" stroke-width=".7"/><circle cx="80" cy="29" r="10" fill="#1E6B6C"/><rect x="76" y="24" width="8" height="10" rx="1" fill="#fff"/>' +
        '<rect x="56" y="46" width="48" height="4" rx="2" fill="#0F3D3E"/><rect x="56" y="55" width="40" height="3" rx="1.5" fill="#8A9696"/><rect x="56" y="62" width="44" height="3" rx="1.5" fill="#8A9696"/>';
      if (t.s === 0) {
        s += '<g fill="none" stroke="#3b82f6" stroke-width=".7" stroke-dasharray="2 1.5"><rect x="45" y="9" width="70" height="72"/><rect x="69" y="18" width="22" height="22"/><rect x="75" y="23" width="10" height="12"/><rect x="55" y="44" width="50" height="8"/><rect x="55" y="53" width="42" height="14"/></g>';
      } else {
        s += sel(44, 8, 72, 74) + '<rect x="44" y="1" width="26" height="6.5" rx="1.5" fill="#3b82f6"/><text x="46.5" y="6" font-family="Arial" font-size="4.6" font-weight="700" fill="#fff">Gruppe</text>';
      }
    }
    return '<svg viewBox="0 0 160 90" role="img" aria-label="Мини-слайд (схема)"><rect width="160" height="90" fill="#fff"/>' + s + '</svg>';
  }

  /* ------------------------------------------------------------------ Szenarien (je ein Kann-Punkt) */
  var MENU_AL = ['Links ausrichten', 'Horizontal zentrieren', 'Rechts ausrichten', 'Oben ausrichten', 'Vertikal zentrieren', 'Unten ausrichten', '-', 'Horizontal verteilen', 'Vertikal verteilen', '-', 'An Folie ausrichten', 'Ausgewählte Objekte ausrichten'];
  var SC = {
    align: { de: 'Ausrichten und Verteilen', ru: 'карточки и значки — ровно и с одинаковыми промежутками', kann: 'k14', fr: [
      { th: { k: 'cards', s: 0, sel: 1 }, say: '**Было:** три карточки стоят криво — разная высота, разные промежутки. **Выдели все три:** кликни по первой, затем [[Umschalt]] + клик по двум другим (или обведи их рамкой, начав с пустого места).' },
      { tab: 'Formformat', ctx: 'Formformat', hiTab: 'Formformat', groups: ['Anordnen', 'Größe'], th: { k: 'cards', s: 0, sel: 1 }, say: '**1.** Как только выделены фигуры, справа в ленте появляется вкладка **Formformat** — открой её.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe'], th: { k: 'cards', s: 0, sel: 1 }, say: '**2.** Группа **Anordnen** → кнопка **Ausrichten ▾**. Стрелка ▾ значит: откроется список.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe'], pop: { t: 'menu', items: MENU_AL, hi: 'Ausgewählte Objekte ausrichten', chk: 'Ausgewählte Objekte ausrichten' }, th: { k: 'cards', s: 0, sel: 1 }, say: '**3.** В самом низу списка проверь: галочка стоит у **Ausgewählte Objekte ausrichten**, а не у «An Folie ausrichten». Иначе все три карточки уедут на середину слайда друг на друга.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe'], pop: { t: 'menu', items: MENU_AL, hi: 'Vertikal zentrieren', chk: 'Ausgewählte Objekte ausrichten' }, th: { k: 'cards', s: 1, sel: 1, guide: 1 }, say: '**4.** Выбери **Vertikal zentrieren** — центры всех трёх карточек встали на одну горизонталь (оранжевая линия).' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'align', groups: ['Anordnen', 'Größe'], pop: { t: 'menu', items: MENU_AL, hi: 'Horizontal verteilen', chk: 'Ausgewählte Objekte ausrichten' }, th: { k: 'cards', s: 2, sel: 1, gaps: 1 }, say: '**5.** Снова **Ausrichten ▾** → **Horizontal verteilen**: промежутки между карточками стали одинаковыми. Крайние карточки остаются на месте. Нужно минимум 3 объекта.' },
      { th: { k: 'cards', s: 2, gaps: 1 }, say: '**Проверка:** ✓ центры на одной линии ✓ промежутки равны ✓ ничего не наезжает друг на друга. Ausrichten ставит на одну линию, Verteilen выравнивает промежутки — обычно нужны оба.' }
    ] },
    color: { de: 'Designfarben / RGB', ru: 'цвета фирмы: из палитры или числами', kann: 'x6', fr: [
      { th: { k: 'circle', c: 'blue', sel: 1 }, say: 'В заданиях 3, 7, 10 нужны цвета фирмы (**Designfarben**), а не стандартный синий или зелёный Office. **Кликни по фигуре**, которую надо перекрасить.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'fill', groups: ['Formenarten'], th: { k: 'circle', c: 'blue', sel: 1 }, say: '**1.** Вкладка **Formformat** → группа **Formenarten** → стрелка **▾** у **Formfüllung** (в старых версиях кнопка называется **Fülleffekt**). Такая же есть на вкладке Start, группа Zeichnen.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'fill', groups: ['Formenarten'], pop: { t: 'palette', mode: 'fill', hi: 3 }, th: { k: 'circle', c: 'pet', sel: 1 }, say: '**2.** В блоке **Designfarben** смотри **только верхний ряд** (ниже стоят светлые и тёмные оттенки, они не нужны). **Petrol** — **4-й квадрат слева**: клик, и фигура покрашена.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'fill', groups: ['Formenarten'], pop: { t: 'palette', mode: 'fill', hiItem: 'Weitere Füllfarben…' }, th: { k: 'circle', c: 'blue', sel: 1 }, say: '**3.** Нужного цвета нет в верхнем ряду, но в задании даны числа? В самом низу списка — **Weitere Füllfarben…**' },
      { dlg: 1, say: '**4.** Вкладка **Benutzerdefiniert** → Farbmodell **RGB** → впиши **Rot 15 · Grün 61 · Blau 62** → **OK**. Это тот же Petrol: проверь, поставив рядом две фигуры, покрашенные разными способами.' }
    ] },
    font: { de: 'Schriftart, Schriftgrad, Schriftfarbe', ru: 'шрифт, размер, начертание, цвет', kann: 'k5', fr: [
      { th: { k: 'text', s: 0, sel: 1 }, say: '**Было:** шрифт Cambria, 12 pt, чёрный. **Нужно:** Calibri, 18 pt, Anthrazit. **Выдели текст:** кликни в блок → [[Strg]]+[[A]] (весь текст блока).' },
      { tab: 'Start', hi: ['font', 'size'], groups: ['Schriftart'], th: { k: 'text', s: 1 }, say: '**1.** Вкладка **Start** → группа **Schriftart**: в **первом** окошке выбери шрифт **Calibri**; **2.** во **втором** — размер **18**.' },
      { tab: 'Start', hi: ['bold', 'ital', 'und'], groups: ['Schriftart'], th: { k: 'text', s: 1 }, say: '**3.** Начертание — три маленькие кнопки: **F** (fett, жирный) · **K** (kursiv, курсив) · **U** (unterstrichen, подчёркнутый). Внимание: жирный здесь **F**, а не B. У кнопок без подписи название видно в подсказке при наведении мыши.' },
      { tab: 'Start', hi: 'fcol', groups: ['Schriftart'], pop: { t: 'palette', mode: 'font', hi: 1, right: 1 }, th: { k: 'text', s: 1 }, say: '**4.** Цвет: **Schriftfarbe ▾** (буква A с цветной полоской) → **Designfarben** → верхний ряд → **2-й квадрат** (Anthrazit, Text 1).' },
      { th: { k: 'text', s: 1 }, say: '**Проверка:** ✓ шрифт Calibri во всех блоках ✓ размер не меньше 18 ✓ цвет из верхнего ряда. Если один блок «живёт» в другом шрифте (Cambria): Start → Ersetzen ▾ → **Schriftarten ersetzen…**' }
    ] },
    pic: { de: 'Bilder kopieren, verkleinern, positionieren', ru: 'логотип и картинки: копия, размер, место', kann: 'k9', fr: [
      { th: { k: 'logo', s: 0 }, say: 'Логотипы и иконки лежат на **последнем** слайде («Material für die Fertigstellung»). Кликни по нужному (для тёмного фона — **белый**) → [[Strg]]+[[C]].' },
      { th: { k: 'logo', s: 1 }, say: 'Перейди на слайд 1 → [[Strg]]+[[V]]. Логотип встал на **то же место**, где лежал на слайде 16: посередине, ≈ 7,6 cm шириной, над заголовком. Это ещё не готово.' },
      { th: { k: 'logo', s: 1, corner: 1 }, say: '**1.** Уменьшай, **только за угловой** маркер (по диагонали): пропорции сохраняются. Боковой маркер искажает картинку; случайно потянул — [[Strg]]+[[Z]].' },
      { tab: 'Bildformat', ctx: 'Bildformat', hi: 'w', groups: ['Größe'], th: { k: 'logo', s: 2 }, say: '**2.** Точный размер: вкладка **Bildformat** → группа **Größe** → окошко **Breite** → **6,6 cm** → [[Enter]]. Höhe подстроится сама.' },
      { menu: { t: 'menu', items: ['Ausschneiden', 'Kopieren', '-', 'Gruppieren ▸', 'Nach vorne bringen ▸', 'Nach hinten senden ▸', '-', 'Größe und Position…', 'Grafik formatieren…'], hi: 'Größe und Position…' }, say: '**3.** Точное место: правый клик по логотипу → **Größe und Position…** → раздел **Position** → **Horizontal 2,0 cm** · **Vertikal 1,8 cm** (от верхнего левого угла).' },
      { th: { k: 'logo', s: 2 }, say: '**Проверка:** ✓ логотип заметно меньше заголовка ✓ не искажён ✓ в углу, по левому краю заголовка.' }
    ] },
    group: { de: 'Gruppieren', ru: 'несколько объектов — как один', kann: 'k16', fr: [
      { th: { k: 'group', s: 0 }, say: '**Карточка = 5 отдельных объектов** (подложка, кружок, иконка, заголовок, текст). Чтобы двигать, копировать и выравнивать их как один, нужна группа. **Выдели все 5**: рамкой или [[Umschalt]] + клики.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'group', groups: ['Anordnen'], th: { k: 'group', s: 0 }, say: '**1.** Вкладка **Formformat** → группа **Anordnen** → **Gruppieren ▾**. Запасной путь: правый клик по выделению → Gruppieren → Gruppieren.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'group', groups: ['Anordnen'], pop: { t: 'menu', items: ['Gruppieren', 'Gruppierung aufheben', 'Erneut gruppieren'], hi: 'Gruppieren' }, th: { k: 'group', s: 1 }, say: '**2.** Выбери **Gruppieren**. Теперь одна общая рамка: объекты двигаются, копируются и выравниваются как один.' },
      { tab: 'Formformat', ctx: 'Formformat', hi: 'group', groups: ['Anordnen'], pop: { t: 'menu', items: ['Gruppieren', 'Gruppierung aufheben', 'Erneut gruppieren'], hi: 'Gruppierung aufheben' }, th: { k: 'group', s: 0 }, say: '**3.** Нужно поменять иконку внутри? **Gruppierung aufheben** → правь → снова выдели части → **Erneut gruppieren** (вернёт прежнюю группу). Анимация висит на группе целиком: разгруппируешь — эффект пропадёт.' }
    ] }
  };
  P.SHOW = SC;
  /* Baukasten für weitere Kadры-Sätze (js/iw-ppt-own-show.js): Ribbon-Gruppen (RB), Szenarien (SC), Mini-Folien als SVG-Funktionen (sv) */
  P.showKit = { RB: RB, SC: SC, sv: {}, btn: btn, cbx: cbx, fld: fld, grp: grp, col: col, row: row, gal: gal, MENU_AL: MENU_AL };

  /* ------------------------------------------------------------------ Kadr + Viewer */
  function frameHtml(f) {
    var top = f.dlg ? dlg(f.dlg) : f.win ? win(f.win) : f.menu ? ctxMenu(f.menu) : f.tab ? ribbon(f) : '';
    var pic = f.sv && P.showKit.sv[f.sv[0]] ? '<figure class="pp-th">' + P.showKit.sv[f.sv[0]](f.sv[1] || {}) + '<figcaption>' + (f.cap || 'Слайд твоей презентации (схема)') + '</figcaption></figure>'
      : f.th ? '<figure class="pp-th">' + thumb(f.th) + '<figcaption>Слайд (схема)</figcaption></figure>' : '';
    return '<div class="pp-fr">' + top + '<div class="pp-fr-low">' + pic + '<div class="pp-say">' + fm(f.say) + '</div></div></div>';
  }
  function viewer(id, i) {
    var sc = SC[id], n = sc.fr.length, dots = '';
    for (var k = 0; k < n; k++) { dots += '<i data-go="' + k + '" class="' + (k === i ? 'on' : '') + '" title="Шаг ' + (k + 1) + '"></i>'; }
    return '<div class="pp-sh-top"><span>Шаг <b>' + (i + 1) + '</b> из ' + n + '</span><div class="pp-dots">' + dots + '</div></div>' + frameHtml(sc.fr[i]) +
      '<div class="pp-sh-nav"><button type="button" data-sh="-1"' + (i === 0 ? ' disabled' : '') + '>◀ Назад</button>' +
      (i === n - 1 ? '<button type="button" class="go" data-sh="reset">↺ Сначала</button>' : '<button type="button" class="go" data-sh="1">Дальше ▶</button>') + '</div>';
  }
  P.showHtml = function (id) { return SC[id] ? '<div class="pp-show" data-sc="' + id + '" data-i="0">' + viewer(id, 0) + '</div>' : ''; };
  P.bindShow = function (root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sh]'), d = e.target.closest('[data-go]');
      if (!b && !d) { return; }
      var box = (b || d).closest('.pp-show'); if (!box) { return; }
      var id = box.getAttribute('data-sc'), i = parseInt(box.getAttribute('data-i'), 10), n = SC[id].fr.length;
      if (b) { var v = b.getAttribute('data-sh'); i = v === 'reset' ? 0 : Math.max(0, Math.min(n - 1, i + parseInt(v, 10))); } else { i = parseInt(d.getAttribute('data-go'), 10); }
      box.setAttribute('data-i', i); box.innerHTML = viewer(id, i);
    });
  };

  /* ------------------------------------------------------------------ Karte «Начни здесь» */
  var CORE = [
    { sc: 'align', drill: 'Нарисуй 4 фигуры как попало → выдели все → **Ausrichten ▾ → Oben ausrichten** → **Horizontal verteilen**. Потом то же с кругами разного размера: **Vertikal zentrieren** + **Horizontal verteilen**.' },
    { sc: 'color', drill: 'Нарисуй фигуру и покрась её в **Petrol** из палитры (4-й квадрат). Вторую такую же покрась числами **15 / 61 / 62**. Поставь рядом: цвет должен совпасть.' },
    { sc: 'font', drill: 'Три строки в разных шрифтах и цветах → приведи всё к **Calibri 18 pt, Anthrazit**; заголовок сделай жирным (**F**) и **Petrol hell** (6-й квадрат).' },
    { sc: 'pic', drill: 'Скопируй логотип с Material-слайда на слайд 1 → уменьши **за угол** до 6,6 cm → поставь в левый верхний угол. Потом потяни боковой маркер, увидишь искажение, и отмени: [[Strg]]+[[Z]].' },
    { sc: 'group', drill: 'Круг + иконка + заголовок → **Gruppieren**, подвинь как одно целое. Потом **Gruppierung aufheben** и **Erneut gruppieren**.' }
  ];
  function cover(kid) {
    var n = 0, p = 0;
    (P.TASKS || []).forEach(function (t) { if ((t.kann || []).indexOf(kid) >= 0) { n++; p += t.pts; } });
    return [n, p];
  }
  function dotsOf(st, id) { return (st[id + ':a'] ? '●' : '○') + (st[id + ':b'] ? '●' : '○'); }

  P.startHtml = function () {
    var st = store('neostudy_pp_core').get({}), kids = CORE.map(function (c) { return SC[c.sc].kann; }), tot = 0, hit = 0, ptsHit = 0, done = 0;
    (P.TASKS || []).forEach(function (t) { tot += t.pts; if ((t.kann || []).some(function (k) { return kids.indexOf(k) >= 0; })) { hit++; ptsHit += t.pts; } });
    Object.keys(st).forEach(function (k) { if (st[k]) { done++; } });
    var items = CORE.map(function (c, n) {
      var s = SC[c.sc], cv = cover(s.kann);
      return '<div class="pp-core' + (n === 0 ? ' open' : '') + '" data-sc="' + c.sc + '"><button type="button" class="pp-core-h"><span class="pp-core-n">' + (n + 1) + '</span>' +
        '<span class="pp-core-t"><b>' + s.de + '</b><small>' + s.ru + ' · ' + cv[1] + ' баллов, ' + cv[0] + ' задания (Kann ' + s.kann.replace('k', '').toUpperCase() + ')</small></span><span class="pp-core-s" data-dots>' + dotsOf(st, c.sc) + '</span><span class="pp-kv">▸</span></button>' +
        '<div class="pp-core-b">' + P.showHtml(c.sc) + '<div class="pp-core-do"><span class="pp-lab">Сделай руками (5 минут, пустая презентация)</span><p>' + fm(c.drill) + '</p>' +
        '<label><input type="checkbox" data-k="' + c.sc + ':a"' + (st[c.sc + ':a'] ? ' checked' : '') + '> сделано руками в PowerPoint, глядя на кадры</label>' +
        '<label><input type="checkbox" data-k="' + c.sc + ':b"' + (st[c.sc + ':b'] ? ' checked' : '') + '> повторено по памяти, без кадров</label>' +
        '<a class="pp-core-l" href="#pp1" data-kann="' + s.kann + '">Полная карточка (все пути, ловушки) ↓</a></div></div></div>';
    }).join('');
    return '<div class="note-card pp-start"><h3>🚀 Начни здесь: 5 действий вместо всей страницы</h3>' +
      '<p class="pp-lead">Страница ниже очень большая, подряд её читать не нужно: это справочник. Для начала хватит <b>5 навыков</b>. Они участвуют в <b>' + hit + ' из ' + (P.TASKS || []).length + '</b> заданий пробной работы (<b>' + ptsHit + ' из ' + tot + '</b> баллов, задания размечены мной). Учим не чтением, а руками:</p>' +
      '<ol class="pp-loop"><li><b>Посмотри кадры</b>: 1–2 минуты.</li><li><b>Сделай то же в PowerPoint</b>: 5 минут, на пустой презентации.</li><li><b>Закрой страницу и повтори по памяти</b>. Только после этого вторая отметка.</li></ol>' +
      '<p class="pp-small">Есть свой файл? Тренируйся на нём: <a href="#pp5">карточка «Твоя презентация Schulbeginn»</a>.</p>' +
      '<div class="pp-box"><p><b>Кадры — схема ленты, не скриншот.</b> PowerPoint на этом компьютере нет, поэтому лента нарисована по Microsoft 365 на немецком и по справке Microsoft. Названия кнопок немецкие; расположение групп в твоей версии может чуть отличаться. Если пришлёшь скриншот своей ленты, заменю схему настоящей.</p></div>' +
      '<div class="pp-box"><p>' + fm('**Клавиши.** [[Umschalt]] — это клавиша **Shift**: широкая, со стрелкой вверх ⇧, слева внизу, над [[Strg]] (такая же есть справа). «[[Umschalt]] + клик» значит: **нажми и держи** [[Umschalt]], кликни мышкой, потом отпусти. [[Strg]] — это Ctrl (на Mac вместо неё ⌘).') + '</p></div>' +
      '<p class="pp-prog2">Отметки: <b id="pp-core-n">' + done + '</b> из ' + (CORE.length * 2) + '</p>' + items + '</div>';
  };

  function gotoKann(root, id) {
    var c = root.querySelector('.pp-ki[data-id="' + id + '"]'); if (!c) { return; }
    var f = c.closest('.pp-fold'); if (f) { f.classList.add('open'); }
    c.classList.add('open');
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  P.bindStart = function (root) {
    var first = root.querySelector('.note-card');   // «Начни здесь» встаёт самой первой картой
    if (!first || root.querySelector('.pp-start')) { return; }
    var tmp = document.createElement('div'); tmp.innerHTML = P.startHtml();
    first.parentNode.insertBefore(tmp.firstElementChild, first);
    var box = root.querySelector('.pp-start'); if (!box) { return; }
    var cs = store('neostudy_pp_core'), st = cs.get({});
    box.addEventListener('click', function (e) {
      var l = e.target.closest('[data-kann]');
      if (l) { e.preventDefault(); gotoKann(root, l.getAttribute('data-kann')); return; }
      var h = e.target.closest('.pp-core-h'); if (h) { h.parentNode.classList.toggle('open'); }
    });
    box.addEventListener('change', function (e) {
      var c = e.target.closest('input[data-k]'); if (!c) { return; }
      var k = c.getAttribute('data-k');
      if (c.checked) { st[k] = 1; } else { delete st[k]; }
      cs.set(st);
      var id = k.split(':')[0], it = box.querySelector('.pp-core[data-sc="' + id + '"] [data-dots]'); if (it) { it.textContent = dotsOf(st, id); }
      box.querySelector('#pp-core-n').textContent = Object.keys(st).length;
    });
    /* alles andere auf der Seite = Nachschlagewerk: einklappen (Zustand wird gemerkt) */
    var fs = store('neostudy_pp_fold'), fo = fs.get({});
    Array.prototype.forEach.call(root.querySelectorAll('.note-card'), function (c) {
      var h3 = c.firstElementChild;
      if (c === box || !h3 || h3.tagName !== 'H3') { return; }
      var key = h3.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), b = document.createElement('div');
      b.className = 'pp-fold-b';
      while (h3.nextSibling) { b.appendChild(h3.nextSibling); }
      c.appendChild(b); c.classList.add('pp-fold');
      if (fo[key]) { c.classList.add('open'); }
      h3.setAttribute('role', 'button'); h3.setAttribute('tabindex', '0'); h3.setAttribute('aria-expanded', fo[key] ? 'true' : 'false');
      function tg() {
        c.classList.toggle('open'); var on = c.classList.contains('open');
        fo[key] = on ? 1 : 0; fs.set(fo); h3.setAttribute('aria-expanded', on ? 'true' : 'false');
      }
      h3.addEventListener('click', tg);
      h3.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } });
    });
  };
})(window.PPT);
