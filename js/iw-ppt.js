/* PowerPoint-Klassenarbeit — Darstellung und Logik für die Karten pp1 / pp2 / pp3 in iw-egb.html.
   Daten: js/iw-ppt-data.js, iw-ppt-tasks.js, iw-ppt-quiz.js · Mini-Folien: iw-ppt-mocks.js · Stile: css/iw-ppt.css
   Gespeichert wird nur im Browser (localStorage, Schlüssel neostudy_pp_*). */
(function () {
  'use strict';
  var P = window.PPT;
  if (!P) { return; }

  /* ------------------------------------------------------------------ helpers */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(key) {
    return {
      get: function (d) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
      set: function (v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ } }
    };
  }
  function pathHtml(p) {
    return '<span class="pp-path">' + p.split(/\s*→\s*/).map(function (x) { return '<span class="pp-seg">' + x + '</span>'; }).join('<span class="pp-arr">→</span>') + '</span>';
  }
  function fmt(s) {
    return String(s)
      .replace(/\{\{([^}]+)\}\}/g, function (_, p) { return pathHtml(p); })
      .replace(/\[\[([^\]]+)\]\]/g, function (_, k) { return '<span class="pp-key">' + (k === 'Umschalt' ? '⇧ Umschalt' : k) + '</span>'; })
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  }
  function head(icon, title, sub) {
    return '<div class="lesson-header-block"><span class="lesson-header-icon">' + icon + '</span><div><h2>' + title + '</h2><p class="lesson-header-sub">' + sub + '</p></div></div>';
  }
  function noteFor(pct) {
    for (var i = 0; i < P.NOTEN.length; i++) { if (pct + 1e-9 >= P.NOTEN[i][0]) { return P.NOTEN[i][1]; } }
    return '6';
  }
  function noteLabel(n) { return n.replace('-', '−'); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function plain(s) { return String(s).replace(/<[^>]*>/g, '').replace(/\*\*/g, ''); }
  function kannById(id) { for (var i = 0; i < P.KANN.length; i++) { if (P.KANN[i].id === id) { return P.KANN[i]; } } return null; }
  function kLabel(k) { return typeof k.n === 'number' ? 'K' + k.n : k.n; }

  /* ------------------------------------------------------------------ Dateiname-Generator (alle Eingaben synchron) */
  var nameStore = store('neostudy_pp_name');
  function bindFileGen(root) {
    var st = nameStore.get({ klasse: '', nach: '', vor: '' });
    function out() {
      var s = 'PK_PPT_' + (st.klasse || 'Klasse') + '_' + (st.nach || 'Nachname') + '_' + (st.vor || 'Vorname');
      return s.replace(/\s+/g, '');
    }
    function sync() { $$('[data-fg-out]').forEach(function (o) { o.textContent = out(); }); }
    $$('[data-fg]', root).forEach(function (inp) {
      inp.value = st[inp.getAttribute('data-fg')] || '';
      inp.addEventListener('input', function () {
        st[inp.getAttribute('data-fg')] = inp.value.trim();
        nameStore.set(st);
        $$('[data-fg="' + inp.getAttribute('data-fg') + '"]').forEach(function (o) { if (o !== inp) { o.value = inp.value; } });
        sync();
      });
    });
    sync();
  }

  /* ------------------------------------------------------------------ Timer */
  function makeTimer(box, key, secs, opts) {
    opts = opts || {};
    var st = store(key), s = st.get({ end: null, left: secs });
    box.innerHTML = '<div class="pp-timer"><span class="pp-clock" aria-live="off">--:--</span><button class="pp-btn" data-a="go">▶ Start</button><button class="pp-btn ghost" data-a="pause">⏸ Pause</button><button class="pp-btn ghost" data-a="reset">↺ Zurücksetzen</button></div><div class="pp-small" data-hint></div>';
    var clock = $('.pp-clock', box), hint = $('[data-hint]', box);
    function left() { return s.end ? Math.max(0, Math.ceil((s.end - Date.now()) / 1000)) : s.left; }
    function render() {
      var l = left(), m = Math.floor(l / 60), sec = l % 60;
      clock.textContent = (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
      clock.className = 'pp-clock' + (l === 0 ? ' zero' : l <= 600 ? ' low' : '');
      if (opts.plan) {
        var el = (secs - l) / 60, acc = 0, idx = -1, i;
        for (i = 0; i < P.ORDER.length; i++) { acc += P.ORDER[i].m; if (el < acc) { idx = i; break; } }
        if (!s.end && l === secs) { hint.textContent = 'Der Plan läuft mit: Start drücken, dann zeigt dieser Hinweis, wo du laut Arbeitsreihenfolge sein solltest.'; }
        else if (l === 0) { hint.textContent = 'Zeit ist um — Datei speichern und mit der Selbstkontrolle unten weitermachen.'; }
        else if (idx >= 0) { hint.textContent = 'Laut Plan jetzt (bis Minute ' + Math.round(acc) + '): ' + plain(P.ORDER[idx].t); }
      } else if (!s.end && l === secs) { hint.textContent = 'Start drücken, dann läuft die Zeit — danach Selbstkontrolle.'; }
      else if (l === 0) { hint.textContent = 'Zeit ist um — speichern und kontrollieren.'; }
      else { hint.textContent = ''; }
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) { return; }
      var a = b.getAttribute('data-a');
      if (a === 'go' && !s.end && s.left > 0) { s.end = Date.now() + s.left * 1000; }
      else if (a === 'pause' && s.end) { s.left = left(); s.end = null; }
      else if (a === 'reset') { s.end = null; s.left = secs; }
      st.set(s); render();
    });
    setInterval(function () { if (s.end) { if (left() === 0) { s.left = 0; s.end = null; st.set(s); } render(); } }, 500);
    render();
  }

  /* ------------------------------------------------------------------ Erwartungshorizont (Checkboxen) — gemeinsam für A (pp2) und B (pp3) */
  function ehKey(set, ti, i) { return set + ti + '_' + i; }
  function ehBlock(set, task, ti, state) {
    return '<ul class="pp-eh">' + task.eh.map(function (e, i) {
      var k = ehKey(set, ti, i), on = !!state[k];
      return '<li class="' + (on ? 'on' : '') + '" data-k="' + k + '"><input type="checkbox"' + (on ? ' checked' : '') + ' aria-label="' + plain(e[0]).replace(/"/g, '') + '"><span class="t">' + e[0] + '</span><span class="p">' + e[1] + ' P</span></li>';
    }).join('') + '</ul>';
  }
  function scoreOf(set, tasks, state) {
    var got = 0, total = 0, per = [];
    tasks.forEach(function (t, ti) {
      var g = 0, tt = 0;
      t.eh.forEach(function (e, i) { tt += e[1]; if (state[ehKey(set, ti, i)]) { g += e[1]; } });
      got += g; total += tt; per.push([g, tt]);
    });
    return { got: got, total: total, per: per };
  }

  function taskBody(t, ti, opt) {
    var h = '';
    h += '<div class="pp-orig"><em>' + (opt.mine ? 'Aufgabentext (von mir, im Stil des Lehrers)' : 'Aufgabentext — Wortlaut des Lehrers') + '</em>' + t.orig + '</div>';
    if (t.state && t.state.length) {
      h += '<h5>Was in der Datei steht <span class="pp-mine">nachgeprüft</span></h5><ul>' + t.state.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ul>';
    }
    h += '<h5>So geht’s <span class="pp-mine">Lösungsweg</span></h5><ol class="pp-sol">' + t.steps.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ol>';
    if (t.show && P.SHOW && P.SHOW[t.show]) {   /* Kadры zuerst (wie «Начни здесь» in Karte 1); dieselben Schritte als Text nur zum Aufklappen */
      h = h.slice(0, h.lastIndexOf('<h5>So geht’s')) + '<h5>Покажу в PowerPoint <span class="pp-mine">моё · схема</span></h5>' + P.showHtml(t.show) +
        '<p class="pp-small">Кадры — схема ленты и окон по Microsoft 365 (немецкий) и справке Microsoft, не скриншот: в твоей версии расположение может чуть отличаться. ' + (P.SHOW[t.show].foot || 'Слайды на миниатюрах — твои (размеры из файла).') + '</p>' +
        '<details class="pp-txt"><summary>Те же шаги текстом</summary><ol class="pp-sol">' + t.steps.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ol></details>';
    }
    if (t.mock) {
      var figs = t.mock.map(function (id) {
        return '<figure class="pp-mock">' + P.mocks[id]() + '<figcaption>' + (P.mockCap[id] || '') + '</figcaption></figure>';
      });
      h += '<h5>Beispiel-Ergebnis <span class="pp-mine">моё</span></h5>' + (figs.length > 1 ? '<div class="pp-mock-row">' + figs.join('') + '</div>' : figs[0]);
      if (P.mockNotes && P.mockNotes[t.mock[0]]) {
        h += '<div class="pp-box info"><h4>📝 Notizen (Ansicht → Notizen)</h4><p class="pp-small" style="margin:0">' + P.mockNotes[t.mock[0]] + '</p></div>';
      }
    }
    if (t.steps2) {   // zweiter Lösungsweg unter dem Bild (z. B. „so entsteht der Look im Bild“)
      h += '<h5>' + t.steps2.t + ' <span class="pp-mine">моё</span></h5><ol class="pp-sol">' + t.steps2.s.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ol>' +
        (t.steps2.note ? '<p class="pp-small">' + fmt(t.steps2.note) + '</p>' : '');
    }
    if (t.html && P.extras[t.html]) { h += P.extras[t.html](); }
    if (t.traps && t.traps.length) {
      h += '<h5>Typische Fallen</h5><ul>' + t.traps.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ul>';
    }
    h += '<h5>Erwartungshorizont — Selbstkontrolle <span class="pp-mine">abgeleitet aus dem Aufgabentext</span></h5>' + ehBlock(opt.set, t, ti, opt.state) +
      '<p class="pp-small">Haken setzen, was in <b>deiner</b> Datei wirklich so ist (nicht „müsste“). ' + (opt.mine ? 'Punkte und Aufteilung sind meine Schätzung (kein Erwartungshorizont des Lehrers).' : 'Die Aufteilung der Punkte innerhalb der Aufgabe ist meine Schätzung — die Summe pro Aufgabe ist die des Lehrers.') + '</p>';
    if (t.kann && t.kann.length) {
      h += '<h5>Dazu in Karte 1</h5><div class="pp-kchips">' + t.kann.map(function (id) {
        var k = kannById(id); return k ? '<span class="pp-tag" title="' + plain(k.de).replace(/"/g, '') + '">' + kLabel(k) + ' · ' + plain(k.ru).split(/[.:—]/)[0].slice(0, 46) + '</span>' : '';
      }).join('') + '</div>';
    }
    return h;
  }

  /* gemeinsame Aufgaben-Liste mit Haken, Summen, Ergebnis — set 'a' (pp2) oder 'b' (pp3) */
  function mountTasks(box, setId, tasks, key, opt) {
    var st = store(key), state = st.get({});
    var o = { set: setId, state: state, mine: !!opt.mine };
    var scoreBar = document.createElement('div'); scoreBar.className = 'pp-score';
    scoreBar.innerHTML = '<span><span class="big" data-got>0</span> / <b data-total>0</b> Punkte</span><span><b data-pct>0</b> %</span><span>Note <span class="note" data-note>–</span></span><div class="pp-bar"><span data-fill></span></div>';
    var list = document.createElement('div');
    list.innerHTML = tasks.map(function (t, ti) {
      return '<div class="pp-task" data-ti="' + ti + '" id="pp-' + setId + '-' + t.n + '"><div class="pp-task-h"><span class="pp-tn">' + (typeof t.n === 'number' ? t.n : t.n.replace('B', '')) + '</span><div class="pp-tt">' + (typeof t.n === 'number' ? 'Aufgabe ' + t.n + ' · ' : '') + t.title + (t.slides ? '<small>' + t.slides + '</small>' : '') + '</div><span class="pp-tm">≈ ' + t.mins + ' Min</span><span class="pp-tp" data-tp>' + t.pts + ' P</span></div><div class="pp-task-b">' + taskBody(t, ti, o) + '</div></div>';
    }).join('');
    var res = document.createElement('div'); res.className = 'pp-res';
    box.appendChild(scoreBar); box.appendChild(list); box.appendChild(res);

    function update() {
      var sc = scoreOf(setId, tasks, state), pct = sc.total ? Math.round(sc.got / sc.total * 1000) / 10 : 0, note = noteFor(pct);
      $('[data-got]', scoreBar).textContent = sc.got; $('[data-total]', scoreBar).textContent = sc.total; $('[data-pct]', scoreBar).textContent = pct;
      $('[data-note]', scoreBar).textContent = noteLabel(note); $('[data-fill]', scoreBar).style.width = Math.min(100, pct) + '%';
      $$('.pp-task', list).forEach(function (el, i) {
        var g = sc.per[i][0], t = sc.per[i][1];
        $('[data-tp]', el).textContent = (g ? g + '/' : '') + t + ' P'; el.classList.toggle('full', g === t);
      });
      var gaps = [];
      tasks.forEach(function (t, ti) { t.eh.forEach(function (e, i) { if (!state[ehKey(setId, ti, i)]) { gaps.push({ p: e[1], t: t, txt: e[0] }); } }); });
      gaps.sort(function (a, b) { return b.p - a.p; });
      var top = gaps.slice(0, 6);
      res.innerHTML = '<h4 style="margin:0 0 .3rem;color:#fff;font-size:.98rem">Ergebnis der Selbstkontrolle</h4>' +
        '<p style="margin:.2rem 0;font-size:.92rem;color:rgba(240,240,245,.9)"><b>' + sc.got + ' von ' + sc.total + ' Punkten</b> = ' + pct + ' % → Note <b style="color:#86efac">' + noteLabel(note) + '</b> (Notenschlüssel CBF).</p>' +
        (gaps.length ? '<p class="pp-small" style="margin:.5rem 0 .2rem">Größte Lücken — das wiederholen:</p><ul>' + top.map(function (g) { return '<li><b>' + (typeof g.t.n === 'number' ? 'Aufg. ' + g.t.n : g.t.n) + '</b> (' + g.p + ' P): ' + g.txt + '</li>'; }).join('') + '</ul>' : '<p style="color:#86efac;font-weight:700;margin:.4rem 0 0">Alles abgehakt — wenn das stimmt: sehr gut! Mach als Nächstes die zweite Arbeit unter Zeit.</p>') +
        '<div style="text-align:right;margin-top:.6rem"><button class="pp-btn ghost danger" data-reset>Alle Haken löschen</button></div>';
    }
    list.addEventListener('click', function (e) {
      var head = e.target.closest('.pp-task-h');
      if (head) { head.parentNode.classList.toggle('open'); return; }
      var li = e.target.closest('.pp-eh li');
      if (li) {
        var k = li.getAttribute('data-k'), cb = $('input', li), on;
        if (e.target !== cb) { cb.checked = !cb.checked; }
        on = cb.checked; if (on) { state[k] = 1; } else { delete state[k]; }
        li.classList.toggle('on', on); st.set(state); update();
      }
    });
    res.addEventListener('click', function (e) {
      if (e.target.closest('[data-reset]') && window.confirm('Alle Haken in dieser Selbstkontrolle löschen?')) {
        Object.keys(state).forEach(function (k) { delete state[k]; });
        $$('.pp-eh li', list).forEach(function (li) { li.classList.remove('on'); $('input', li).checked = false; });
        st.set(state); update();
      }
    });
    update();
    return { open: function (n) { var el = $('#pp-' + setId + '-' + n, list); if (el) { el.classList.add('open'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } };
  }

  /* ------------------------------------------------------------------ Audio: ein Track + Cues, Dock unten (blockiert nichts) */
  var PPTAudio = (function () {
    var dock = null, el = null, track = null, idx = -1, open = false;
    function data() { return window.PPT_AUDIO && window.PPT_AUDIO[track]; }
    function build() {
      if (dock) { return; }
      dock = document.createElement('div'); dock.className = 'wka-dock'; dock.id = 'pptDock';
      dock.innerHTML = '<div class="wka-bar"><button class="wka-btn" data-a="prev" title="Zurück">⏮</button><button class="wka-btn wka-main" data-a="play" title="Play/Pause">▶</button><button class="wka-btn" data-a="next" title="Weiter">⏭</button><div class="wka-info"><div class="wka-word" data-w>—</div><div class="wka-sub" data-s></div></div><button class="wka-close" data-a="close" title="Schließen">×</button></div><div class="wka-track"><div class="wka-fill" data-f></div></div>';
      document.body.appendChild(dock);
      dock.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]'); if (!b) { return; }
        var a = b.getAttribute('data-a');
        if (a === 'prev') { seek(idx - 1); } else if (a === 'next') { seek(idx + 1); } else if (a === 'close') { close(); }
        else if (a === 'play' && el) { if (el.paused) { var p = el.play(); if (p && p.catch) { p.catch(function () {}); } btn('⏸'); } else { pause(); } }
      });
      setInterval(tick, 100);
      window.addEventListener('hashchange', function () { if (open && !/^#pp[123]$/.test(location.hash)) { close(); } });
    }
    function btn(t) { var b = $('[data-a=play]', dock); if (b) { b.textContent = t; } }
    function mark(i) {
      $$('.pp-ki.playing, .pp-vi.playing, .spk-btn.playing').forEach(function (x) { x.classList.remove('playing'); });
      var d = data(), c = d && d.w[i]; if (!c || i < 0) { return; }
      if (track === 'drill' && c.id) { var k = $('.pp-ki[data-id=' + c.id + ']'); if (k) { k.classList.add('playing'); var s = $('.pp-spk', k); if (s) { s.classList.add('playing'); } } }
      if (track === 'vocab') { var v = $('.pp-vi[data-vi="' + i + '"]'); if (v) { v.classList.add('playing'); var s2 = $('.spk-btn', v); if (s2) { s2.classList.add('playing'); } } }
    }
    function show(i) {
      var d = data(), c = d.w[i]; $('[data-w]', dock).textContent = c.de; $('[data-s]', dock).textContent = (i + 1) + ' / ' + d.w.length + ' · ' + d.title; mark(i);
    }
    function seek(i) {
      var d = data(); if (!d || !el) { return; }
      if (i < 0) { i = 0; } if (i >= d.w.length) { pause(); return; }
      idx = i; var c = d.w[i];
      var go = function () { try { el.currentTime = c.t; } catch (e) { /* not seekable yet */ } var p = el.play(); if (p && p.catch) { p.catch(function () { btn('▶'); }); } btn('⏸'); };
      if (el.readyState >= 1) { go(); } else { el.addEventListener('loadedmetadata', go, { once: true }); }
      show(i);
    }
    function pause() { if (el) { try { el.pause(); } catch (e) { /* ignore */ } } if (dock) { btn('▶'); } }
    function close() { pause(); if (dock) { dock.classList.remove('open'); } document.body.classList.remove('wka-on'); open = false; idx = -1; mark(-1); }
    function tick() {
      var d = data(); if (!el || !d || !open || idx < 0 || el.paused) { return; }
      var c = d.w[idx];
      if (el.currentTime >= c.e - 0.02) {
        if (idx + 1 >= d.w.length) { if (el.currentTime >= d.d - 0.05 || el.ended) { pause(); } return; }
        if (el.currentTime >= d.w[idx + 1].t) { idx++; show(idx); }
        return;
      }
      $('[data-f]', dock).style.width = Math.min(100, (idx + (el.currentTime - c.t) / Math.max(0.1, c.e - c.t)) / d.w.length * 100) + '%';
    }
    function withCues(cb) {
      if (window.PPT_AUDIO) { cb(true); return; }
      var s = document.createElement('script'); s.src = 'audio/iw-ppt-cues.js?v=1'; s.onload = function () { cb(!!window.PPT_AUDIO); }; s.onerror = function () { cb(false); };
      document.head.appendChild(s);
    }
    /* which: Track-Name; at: Cue-Index oder (bei „drill“) die Kann-ID */
    function play(which, at) {
      withCues(function (ok) {
        if (!ok || !window.PPT_AUDIO[which]) { window.alert('Das Audio ist noch nicht erzeugt (node tools/gen-ppt-audio.mjs).'); return; }
        build();
        if (track !== which || !el) { if (el) { try { el.pause(); } catch (e) { /* ignore */ } } track = which; el = new Audio(); el.preload = 'auto'; el.src = data().src; }
        var i = 0;
        if (typeof at === 'string') { var w = data().w; for (var k = 0; k < w.length; k++) { if (w[k].id === at) { i = k; break; } } } else if (typeof at === 'number') { i = at; }
        if (open && idx === i && el && !el.paused) { pause(); return; }
        dock.classList.add('open'); document.body.classList.add('wka-on'); open = true; seek(i);
      });
    }
    return { play: play };
  })();

  /* ================================================================== pp1 */
  function renderPP1() {
    var root = $('#pp1-root'); if (!root) { return; }
    var h = '<section class="note-section">' + head('🎯', 'PowerPoint-Klausur: Plan, Kann-Liste, Fallen', 'Что проверят · в каком порядке работать · 27 Kann-Punkte + 9 «скрытых» с путями по-немецки · 12 ловушек · план по дням');

    h += '<div class="note-card"><h3>📋 Was kommt dran</h3>' +
      '<p class="pp-lead">Это <b>практическая</b> контрольная по Informationswirtschaft: ты работаешь в PowerPoint с готовым файлом, а не пишешь тест. Всё отмеченное <span class="pp-teacher">учитель</span> — дословно из трёх документов учителя (Kann-Liste, Aufgabenblatt, Ausgangsdatei пробной контрольной «LUMIO»). Всё, что придумала я, помечено <span class="pp-mine">моё</span>.</p>' +
      '<div class="pp-stats">' + P.FACTS.map(function (f) { return '<div class="pp-stat ' + (f[2] || '') + '"><b>' + f[0] + '</b><span>' + f[1] + '</span></div>'; }).join('') + '</div>' +
      '<div class="pp-box info"><h4>«Bewertet wird, ob Ihre Präsentation die beschriebene Wirkung erreicht»</h4><p>Оценивается <b>результат</b>: достигает ли слайд описанного эффекта — читается с первого взгляда, логотип не конкурирует с заголовком, анимация не отвлекает. «Häufig sind mehrere Lösungswege möglich» — путь может быть любым. Поэтому в каждом задании сначала найди <b>слова про эффект</b> (список — в карточке 3, вкладка «Aufgabenwörter»).</p></div>' +
      '<div class="pp-box warn"><h4>Kann-Liste ≠ вся контрольная</h4><p>В Kann-Liste учителя <b>нет</b> нескольких вещей, которые в пробной контрольной были: <b>Notizen</b>, <b>Logo в Folienmaster / Layout</b>, <b>Foliennummer</b>, <b>Schriftarten ersetzen</b>, <b>Speichern unter / Dateiname</b>, <b>Ansichten и показ слайдов</b> (проверка анимации и ссылок). Они добавлены ниже как <b>X1–X9</b> — готовься и к ним.</p></div>' +
      '<div class="pp-box orange"><h4>Где тренироваться</h4><p>В настоящем <b>десктопном PowerPoint</b> с <b>немецким интерфейсом</b> — как в школе (все названия кнопок на этом сайте немецкие). Если дома Mac: <b>Strg → ⌘ (Cmd)</b>, <b>Alt → ⌥ (Option)</b>; вкладки те же, но часть кнопок стоит иначе. <b>PowerPoint в браузере</b> умеет не всё (например, «Schriftarten ersetzen» там нет по данным Microsoft) — для подготовки не подходит. Проверь язык интерфейса: Datei → Optionen → Sprache.</p></div>' +
      '<div class="pp-box"><h4>Честно о том, чего я не знаю</h4><p>Настоящего Erwartungshorizont учителя у меня нет. «EH» в карточке 2 я вывела из текста заданий; <b>сумма баллов за задание — его</b>, разбивка внутри задания — моя оценка. Настоящая Klassenarbeit, скорее всего, будет про другую фирму и с другими слайдами, но с <b>теми же типами задач</b> (Kann-Liste).</p><p>Названия кнопок зависят от версии PowerPoint: в Microsoft 365 это «<b>Formfüllung</b>», в старых версиях — «<b>Fülleffekt</b>» (одна и та же кнопка). На сайте я чаще пишу «Fülleffekt» — ищи у себя любое из двух.</p></div></div>';

    h += '<div class="note-card"><h3>🎓 Notenschlüssel (Aufgabenblatt, CBF)</h3><div class="pp-tablewrap"><table class="pp-nt" id="pp-nt"><tr><th>ab %</th>' + P.NOTEN.map(function (n) { return '<td>' + n[0] + '</td>'; }).join('') + '</tr><tr><th>Note</th>' + P.NOTEN.map(function (n) { return '<td>' + noteLabel(n[1]) + '</td>'; }).join('') + '</tr></table></div>' +
      '<div class="pp-calc"><label for="pp-calc-in">Punkte (von 100):</label><input type="number" id="pp-calc-in" min="0" max="100" step="0.5" placeholder="z. B. 78"><output id="pp-calc-out" for="pp-calc-in">—</output></div>' +
      '<p class="pp-small">При 100 баллах процент = баллы. Для второй работы B (50 баллов) процент = баллы × 2.</p></div>';

    h += '<div class="note-card"><h3>⏱️ Arbeitsreihenfolge für 90 Minuten <span class="pp-mine">моё</span></h3>' +
      '<p class="pp-lead">Порядок продиктован зависимостями: файл сохраняем сразу; логотип и пиктограммы берём с последнего слайда, поэтому он <b>удаляется самым последним</b>; задание 13 — только после 12 (требование учителя); проверку CD (задание 10) делаем <b>после</b> заданий 3–8, чтобы заодно проверить новые объекты.</p>' +
      '<div class="pp-time" id="pp-time"></div><ol class="pp-steps">' + P.ORDER.map(function (o) { return '<li><div>' + fmt(o.t) + '</div><span class="pp-min">' + o.m + ' Min</span></li>'; }).join('') + '</ol>' +
      '<div class="pp-box good" style="margin-top:.9rem"><h4>Золотые правила</h4><ul><li>Сначала <b>прочитай все 14 заданий</b> и пройди слайды в Foliensortierung — подпиши себе, какое задание к какому слайду.</li><li>Не застревай: на задание не больше <b>1,5 × плановое время</b>. Частичные баллы лучше нуля.</li><li>После каждого задания <span class="pp-key">Strg</span>+<span class="pp-key">S</span>.</li><li>Последние 5 минут — <b>показ слайдов с начала</b> (<span class="pp-key">F5</span>): анимации, ссылки, номера, логотипы.</li></ul></div></div>';

    h += '<div class="note-card"><h3>✅ Kann-Liste — 27 + 9 Punkte</h3>' +
      '<p class="pp-lead">Нажми на пункт — откроются <b>путь в меню по-немецки</b>, подсказки, <b>мини-упражнение на 2–3 минуты</b> (делай его в PowerPoint, на пустой презентации) и ловушка. Кружок слева — твоя оценка: ○ пока нет → ◐ неуверенно → ✓ умею (сделано руками в PowerPoint).</p>' +
      '<button class="wka-playall" data-audio="drill">▶︎ Kann-Liste hören — Aufgabe → Pause → Antwort · läuft im Hintergrund, du kannst weiterscrollen</button>' +
      '<div class="pp-prog"><b id="pp-kprog">0 / 27</b><div class="pp-bar"><span id="pp-kfill"></span></div><b id="pp-kx" class="pp-small"></b></div>' +
      '<div class="pp-filter" id="pp-kfilter"><button class="pp-chip on" data-f="all">Alle</button><button class="pp-chip" data-f="0">○ noch nicht</button><button class="pp-chip" data-f="1">◐ unsicher</button><button class="pp-chip" data-f="2">✓ kann ich</button></div><div id="pp-klist"></div></div>';

    h += '<div class="note-card"><h3>⚠️ 12 Fallen <span class="pp-mine">aus der Ausgangsdatei</span></h3><p class="pp-lead">Каждая из них реально заложена в файле пробной контрольной (проверено по содержимому файла). В настоящей работе будут другие слайды, но <b>такие же типы ловушек</b>: слои, цвета, порядок анимации, переходы, шрифты, фон.</p>' +
      P.TRAPS.map(function (t, i) { return '<div class="pp-trap-card"><b>' + (i + 1) + '</b><div><strong>' + t[0] + '</strong>' + fmt(t[1]) + '</div></div>'; }).join('') + '</div>';

    h += '<div class="note-card"><h3>📅 Plan nach Tagen <span class="pp-mine">моё</span></h3><p class="pp-lead">Введи дату контрольной — план разложится по календарю. Галочки сохраняются в браузере.</p>' +
      '<div class="pp-calc"><label for="pp-date">Datum der Klassenarbeit:</label><input type="date" id="pp-date" class="pp-in" style="width:auto"><span class="pp-count" id="pp-left"></span></div><div id="pp-planmsg"></div><div id="pp-plan"></div></div>';

    h += '<div class="note-card"><h3>💾 Dateiname (Aufgabe 14)</h3>' + P.fileGen('p1') +
      '<div class="pp-sl"><span class="t">🔗 Siehe auch</span><a href="study-tips.html">Как учиться</a> — приёмы запоминания: активное воспроизведение и интервальное повторение подходят и для «где кликнуть?»</div></div>';

    h += '</section>';
    root.innerHTML = h;

    /* Notenschlüssel-Rechner */
    var inp = $('#pp-calc-in', root), out = $('#pp-calc-out', root), cells = $$('#pp-nt td', root);
    inp.addEventListener('input', function () {
      var v = parseFloat(inp.value); cells.forEach(function (c) { c.classList.remove('hit'); });
      if (isNaN(v)) { out.textContent = '—'; return; }
      v = Math.max(0, Math.min(100, v)); var n = noteFor(v); out.textContent = v + ' % → Note ' + noteLabel(n);
      for (var i = 0; i < P.NOTEN.length; i++) { if (P.NOTEN[i][1] === n) { cells[i].classList.add('hit'); cells[i + P.NOTEN.length].classList.add('hit'); } }
    });
    /* Zeitleiste */
    $('#pp-time', root).innerHTML = P.ORDER.map(function (o) {
      var m = /^\*\*Aufgabe (\d+)\*\*/.exec(o.t), lab = o === P.ORDER[0] ? 'Start' : (m ? m[1] : 'F5');
      return '<i style="width:' + (o.m / 90 * 100) + '%;background:' + o.c + '" title="' + plain(o.t) + '">' + lab + '</i>';
    }).join('');
    $$('[data-audio]', root).forEach(function (b) { b.addEventListener('click', function () { PPTAudio.play(b.getAttribute('data-audio'), 0); }); });
    bindKann(root); bindPlan(root); bindFileGen(root);
    if (P.bindStart) { P.bindShow(root); P.bindStart(root); }   // js/iw-ppt-show.js: «Начни здесь» + кадры ленты + справочник сворачивается
  }

  /* ------------------------------------------------------------------ Kann-Liste */
  function bindKann(root) {
    var st = store('neostudy_pp_kann'), state = st.get({}), filter = 'all', list = $('#pp-klist', root);
    var out = '';
    P.KGROUPS.forEach(function (g) {
      out += '<div class="pp-kg" data-g="' + g.id + '"><h4>' + g.name + '</h4><small>' + (g.extra ? '9 Punkte — nicht in der Kann-Liste, aber im Aufgabenblatt' : g.n + ' Punkte') + '</small></div>';
      P.KANN.filter(function (k) { return k.g === g.id; }).forEach(function (k) {
        var s = state[k.id] || 0;
        out += '<div class="pp-ki s' + s + '" data-id="' + k.id + '"><div class="pp-ki-h"><button class="pp-st" data-s="' + s + '" title="Wie sicher bist du?" aria-label="Selbsteinschätzung">' + ['○', '◐', '✓'][s] + '</button><span class="pp-kn">' + kLabel(k) + '</span><div class="pp-kt">' + k.de + '<small>' + k.ru + '</small></div>' + (k.id === 'x9' ? '' : '<button class="spk-btn pp-spk" data-k="' + k.id + '" title="Anhören: Aufgabe → Pause → Antwort" aria-label="Anhören">🔊</button>') + '<span class="pp-kv">▸</span></div><div class="pp-ki-b">';
        if (k.viz && P.extras && P.extras[k.viz]) { out += P.extras[k.viz](); }
        if (k.how && k.how.length) { out += '<span class="pp-lab">Wo klicke ich?</span>' + k.how.map(pathHtml).join('<br>'); }
        if (k.steps && k.steps.length) {
          out += k.steps.map(function (g) { return '<span class="pp-lab">' + g.t + '</span><ol class="pp-kol">' + g.s.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ol>'; }).join('') +
            (k.steps_note ? '<p class="pp-small">' + fmt(k.steps_note) + '</p>' : '');
        }
        if (k.tips && k.tips.length) { out += '<span class="pp-lab">Wichtig</span>' + k.tips.map(function (x) { return '<p>' + fmt(x) + '</p>'; }).join(''); }
        if (k.drill) { out += '<span class="pp-lab">Mini-Übung (2–3 Min.) <span class="pp-mine">моё</span></span><p class="pp-drill">' + fmt(k.drill) + '</p>'; }
        if (k.trap) { out += '<span class="pp-lab">Falle</span><p class="pp-trap">' + fmt(k.trap) + '</p>'; }
        out += '<div class="pp-tags">' + (k.tasks && k.tasks.length ? 'Kam in der Probeklausur vor: ' + k.tasks.map(function (n) { return '<a class="pp-tag" href="#pp2" data-task="' + n + '">Aufgabe ' + n + '</a>'; }).join(' ') : '<span>In der Probeklausur nicht vorgekommen — trotzdem üben.</span>') + '</div></div></div>';
      });
    });
    list.innerHTML = out;
    function counts() {
      var off = 0, offTotal = 0, ex = 0, exTotal = 0;
      P.KANN.forEach(function (k) { var d = (state[k.id] || 0) === 2; if (k.extra) { exTotal++; if (d) { ex++; } } else { offTotal++; if (d) { off++; } } });
      $('#pp-kprog', root).textContent = off + ' / ' + offTotal; $('#pp-kfill', root).style.width = (off / offTotal * 100) + '%';
      $('#pp-kx', root).textContent = 'X-Punkte: ' + ex + ' / ' + exTotal;
    }
    function apply() {
      $$('.pp-ki', list).forEach(function (el) { var s = state[el.getAttribute('data-id')] || 0; el.style.display = (filter === 'all' || String(s) === filter) ? '' : 'none'; });
      $$('.pp-kg', list).forEach(function (g) {
        var n = g.nextElementSibling, any = false;
        while (n && !n.classList.contains('pp-kg')) { if (n.style.display !== 'none') { any = true; } n = n.nextElementSibling; }
        g.style.display = any ? '' : 'none';
      });
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.pp-st');
      if (b) {
        e.stopPropagation(); var el = b.closest('.pp-ki'), id = el.getAttribute('data-id'), s = ((state[id] || 0) + 1) % 3;
        if (s) { state[id] = s; } else { delete state[id]; }
        b.textContent = ['○', '◐', '✓'][s]; b.setAttribute('data-s', s); el.className = 'pp-ki s' + s + (el.classList.contains('open') ? ' open' : '');
        st.set(state); counts(); apply(); return;
      }
      var sp = e.target.closest('.pp-spk');
      if (sp) { e.stopPropagation(); PPTAudio.play('drill', sp.getAttribute('data-k')); return; }
      var t = e.target.closest('[data-task]');
      if (t) { e.preventDefault(); P.gotoTask(parseInt(t.getAttribute('data-task'), 10)); return; }
      var h = e.target.closest('.pp-ki-h'); if (h) { h.parentNode.classList.toggle('open'); }
    });
    $('#pp-kfilter', root).addEventListener('click', function (e) {
      var c = e.target.closest('.pp-chip'); if (!c) { return; }
      filter = c.getAttribute('data-f'); $$('.pp-chip', this).forEach(function (x) { x.classList.toggle('on', x === c); }); apply();
    });
    counts();
  }

  /* ------------------------------------------------------------------ Plan nach Tagen */
  function bindPlan(root) {
    var st = store('neostudy_pp_plan'), state = st.get({ date: '', done: {} }), inp = $('#pp-date', root), box = $('#pp-plan', root), msg = $('#pp-planmsg', root), left = $('#pp-left', root);
    function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
    function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function render() {
      var test = state.date ? dayStart(new Date(state.date + 'T00:00:00')) : null, today = dayStart(new Date()), late = [];
      var days = P.PLAN.map(function (d, i) {
        var date = test ? addDays(test, d.off) : null, isToday = date && date.getTime() === today.getTime(), all = d.items.every(function (_, j) { return state.done['d' + i + '_' + j]; });
        if (date && date < today && !all && d.off < 0) { late.push(d.t.split(' — ')[0]); }
        return '<div class="pp-day' + (isToday ? ' today' : '') + (all ? ' done' : '') + '"><h4>' + d.t + '<small>' + (date ? date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '') + (d.m ? ' · ' + d.m : '') + (isToday ? ' · <b style="color:#fdba74">heute</b>' : '') + '</small></h4>' +
          d.items.map(function (it, j) { var k = 'd' + i + '_' + j; return '<label><input type="checkbox" data-k="' + k + '"' + (state.done[k] ? ' checked' : '') + '><span>' + it + '</span></label>'; }).join('') + '</div>';
      });
      box.innerHTML = days.join('');
      if (test) {
        var n = Math.round((test - today) / 86400000);
        left.textContent = n > 1 ? 'noch ' + n + ' Tage' : n === 1 ? 'morgen!' : n === 0 ? 'heute!' : 'liegt in der Vergangenheit';
        msg.innerHTML = (n > 0 && n < 6) ? '<div class="pp-box warn"><p><b>Времени меньше, чем 6 дней.</b> Сожми план: сделай подряд пропущенные дни' + (late.length ? ' (<b>' + late.join(', ') + '</b>)' : '') + ' — главное не потерять <b>Tag 4</b> (вся Probeklausur на время) и «Fallen» + Quiz накануне.</p></div>' : '';
      } else { left.textContent = ''; msg.innerHTML = ''; }
    }
    inp.value = state.date || '';
    inp.addEventListener('change', function () { state.date = inp.value; st.set(state); render(); });
    box.addEventListener('change', function (e) { var c = e.target.closest('[data-k]'); if (!c) { return; } if (c.checked) { state.done[c.getAttribute('data-k')] = 1; } else { delete state.done[c.getAttribute('data-k')]; } st.set(state); render(); });
    render();
  }

  /* ================================================================== pp2 */
  var ppA = null;
  function renderPP2() {
    var root = $('#pp2-root'); if (!root) { return; }
    root.innerHTML = '<section class="note-section">' + head('🧪', 'Probeklausur LUMIO: 14 Aufgaben Schritt für Schritt', 'Оригинальные задания учителя · что реально лежит в файле · решение · Erwartungshorizont с галочками · таймер 90 минут') +
      '<div class="note-card"><h3>▶ So arbeitest du damit</h3><ol class="pp-steps" style="margin-top:.2rem">' +
      '<li><div>Открой <b>оригинал</b> <span class="pp-de">LUMIO_Probeklausur_PPT_Ausgangsdatei.pptx</span> и <b>сразу</b> сохрани через «Speichern unter» с именем из Aufgabe 14 (генератор ниже).</div></li>' +
      '<li><div>Запусти таймер и работай <b>в PowerPoint</b>, а не на сайте. Сюда заглядывай только когда застряла — лучше сначала попробуй сама.</div></li>' +
      '<li><div>Когда время вышло (или закончила раньше) — открой каждое задание и отметь галочками, что в <b>твоём</b> файле реально сделано. Сумма даст оценку по Notenschlüssel.</div></li>' +
      '<li><div>Внизу появятся <b>самые большие пробелы</b> — их повтори в карточке 1 (Kann-Liste → Mini-Übung) и сделай ещё раз.</div></li></ol>' +
      '<div class="pp-box"><p class="pp-small" style="margin:0">Текст заданий — дословно учителя (<span class="pp-teacher">учитель</span>). «Was in der Datei steht» — проверено по содержимому файла. Решения, примеры-картинки и EH — <span class="pp-mine">мои</span>.</p></div>' +
      P.fileGen('p2') + '</div>' +
      '<div class="note-card"><h3>⏱️ Timer: 90 Minuten</h3><div id="pp-timerA"></div></div>' +
      '<div class="note-card"><h3>📄 Hinweise und Ausgangssituation <span class="pp-teacher">Wortlaut des Lehrers</span></h3>' +
      '<div class="pp-orig"><em>Hinweise</em>' + P.TEXT.hinweise + '</div><div class="pp-orig pp-sit"><em>Ausgangssituation</em>' + P.TEXT.sit + '</div></div>' +
      '<div class="note-card"><h3>📝 Die 14 Aufgaben (100 Punkte)</h3><p class="pp-lead">Klick auf eine Aufgabe, um sie zu öffnen. Reihenfolge der Bearbeitung ist frei — Empfehlung steht in Karte 1.</p><div id="pp-tasksA"></div></div></section>';
    makeTimer($('#pp-timerA', root), 'neostudy_pp_timerA', 90 * 60, { plan: true });
    ppA = mountTasks($('#pp-tasksA', root), 'a', P.TASKS, 'neostudy_pp_eh_a', { mine: false });
    if (P.bindShow) { P.bindShow(root); }   // кадры ленты внутри заданий (js/iw-ppt-lu-a.js)
    bindFileGen(root);
  }
  P.gotoTask = function (n) {
    location.hash = 'pp2';
    setTimeout(function () { if (ppA) { ppA.open(n); } }, 120);
  };

  /* ================================================================== pp3 */
  function renderPP3() {
    var root = $('#pp3-root'); if (!root) { return; }
    var cats = P.QCATS;
    root.innerHTML = '<section class="note-section">' + head('🏋️', 'Trainer, Aufgabenwörter, zweite Arbeit', 'Квиз «Где кликнуть?» · слова из заданий учителя · вторая работа B (моя, 60 минут) · словарь PowerPoint') +
      '<div class="pp-tabs" id="pp3-tabs"><button class="pp-tab on" data-p="quiz">❓ Wo klicke ich?</button><button class="pp-tab" data-p="verbs">🗣️ Aufgabenwörter</button><button class="pp-tab" data-p="b">🏁 Zweite Arbeit B</button><button class="pp-tab" data-p="vocab">📚 Wortschatz</button></div>' +

      '<div class="pp-pane" data-p="quiz"><div class="note-card"><h3>❓ Wo klicke ich? — ' + P.QUIZ.length + ' Situationen</h3><p class="pp-lead">Ситуация по-русски — выбери <b>путь в немецком интерфейсе</b>. Неверный ответ ждёт: прочитай объяснение и нажми «Weiter» (или <span class="pp-key">Enter</span>); верный идёт дальше сам.</p>' +
      '<div class="pp-filter" id="pp-qfilter"></div><div class="tz-box"><div class="pp-qmeta"><span class="pp-qtopic" id="pp-qtopic"></span><span id="pp-qcount"></span></div><div class="tz-prompt" id="pp-qprompt"></div><div class="tz-opts" id="pp-qopts" style="margin-top:.9rem"></div><div class="pp-qfb" id="pp-qfb"></div><div class="tz-actions"><button class="tz-btn" id="pp-qnext" hidden>Weiter →</button><button class="tz-btn ghost" id="pp-qrestart">Neu mischen</button></div><div class="tz-stats" id="pp-qstats"></div></div></div></div>' +

      '<div class="pp-pane" data-p="verbs" hidden><div class="note-card"><h3>🗣️ Was die Aufgabenwörter des Lehrers bedeuten <span class="pp-mine">моё</span></h3><p class="pp-lead">Выделенные глаголы стоят во всех 14 заданиях. Они подсказывают, <b>что делать с объектом</b>.</p><div class="pp-tablewrap"><table class="pp-mini"><tr><th>Aufgabenwort</th><th>По-русски</th><th>Was tun in PowerPoint?</th><th>Beispiel</th></tr>' +
      P.VERBS.map(function (v) { return '<tr><td>' + v[0] + '</td><td>' + v[1] + '</td><td>' + v[2] + '</td><td>' + v[3] + '</td></tr>'; }).join('') + '</table></div></div>' +
      '<div class="note-card"><h3>🎯 „Wirkungswörter“ — das Ziel steckt im Aufgabentext <span class="pp-mine">моё</span></h3><p class="pp-lead">Потому что «bewertet wird die Wirkung», формулировка задания почти всегда описывает ожидаемый результат. Научись переводить её в действие:</p><div class="pp-tablewrap"><table class="pp-mini"><tr><th>Im Aufgabentext</th><th>По-русски</th><th>Heißt für die Folie</th><th>Aufg.</th></tr>' +
      P.WIRKUNG.map(function (v) { return '<tr><td>' + v[0] + '</td><td>' + v[1] + '</td><td>' + v[2] + '</td><td>' + v[3] + '</td></tr>'; }).join('') + '</table></div></div></div>' +

      '<div class="pp-pane" data-p="b" hidden><div class="note-card"><h3>🏁 Zweite Arbeit B <span class="pp-mine">все задания мои</span></h3><p class="pp-lead">' + fmt(P.B.intro) + '</p><div id="pp-timerB"></div></div><div class="note-card"><h3>📝 Sechs Aufgaben (50 Punkte)</h3><div id="pp-tasksB"></div></div></div>' +

      '<div class="pp-pane" data-p="vocab" hidden><div class="note-card"><h3>📚 Wortschatz PowerPoint — ' + P.VOCAB.reduce(function (a, c) { return a + c[1].length; }, 0) + ' Begriffe</h3><p class="pp-lead">Немецкие слова, которые стоят на кнопках и в заданиях. Оранжевым — где это в меню.</p><button class="wka-playall" data-audio="vocab">▶︎ Alle Wörter hören — DE → RU → DE · läuft im Hintergrund</button><input class="pp-in wide" id="pp-vq" placeholder="Suchen … z. B. zuschneiden, Ebene, Übergang" style="max-width:100%;margin-bottom:.4rem"><div id="pp-vlist"></div></div></div></section>';

    /* tabs */
    $('#pp3-tabs', root).addEventListener('click', function (e) {
      var b = e.target.closest('.pp-tab'); if (!b) { return; }
      $$('.pp-tab', this).forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('.pp-pane', root).forEach(function (p) { p.hidden = p.getAttribute('data-p') !== b.getAttribute('data-p'); });
    });
    /* B */
    makeTimer($('#pp-timerB', root), 'neostudy_pp_timerB', 60 * 60, {});
    mountTasks($('#pp-tasksB', root), 'b', P.B.tasks, 'neostudy_pp_eh_b', { mine: true });
    if (P.bindShow) { P.bindShow(root); }   // кадры ленты внутри заданий B (js/iw-ppt-lu-b.js)
    /* vocab (Cue-Index im Audio = laufende Nummer + 1, Cue 0 ist die Einführung) */
    var gi = 0; P.VOCAB.forEach(function (g) { g[1].forEach(function (v) { v.gi = gi++; }); });
    function vocab(q) {
      q = (q || '').toLowerCase();
      $('#pp-vlist', root).innerHTML = P.VOCAB.map(function (g) {
        var items = g[1].filter(function (v) { return !q || (v[0] + ' ' + v[1] + ' ' + v[2]).toLowerCase().indexOf(q) !== -1; });
        return items.length ? '<div class="pp-vcat">' + g[0] + '</div><div class="pp-vgrid">' + items.map(function (v) { return '<div class="pp-vi" data-vi="' + (v.gi + 1) + '"><div class="d">' + v[0] + '<button class="spk-btn" data-vi="' + (v.gi + 1) + '" title="Anhören: DE → RU → DE" aria-label="Anhören">🔊</button></div><div class="r">' + v[1] + '</div>' + (v[2] ? '<div class="w">' + v[2] + '</div>' : '') + '</div>'; }).join('') + '</div>' : '';
      }).join('') || '<p class="pp-small">Nichts gefunden.</p>';
    }
    $('#pp-vq', root).addEventListener('input', function () { vocab(this.value); }); vocab('');
    $('#pp-vlist', root).addEventListener('click', function (e) { var b = e.target.closest('.spk-btn[data-vi]'); if (b) { PPTAudio.play('vocab', parseInt(b.getAttribute('data-vi'), 10)); } });
    $$('[data-audio]', root).forEach(function (b) { b.addEventListener('click', function () { PPTAudio.play(b.getAttribute('data-audio'), 0); }); });
    bindQuiz(root, cats);
  }

  /* ------------------------------------------------------------------ Quiz */
  function bindQuiz(root, cats) {
    var qs = store('neostudy_pp_quiz'), mem = qs.get({ wrong: {}, seen: {} });
    var cat = 'Alle', pool = [], pos = 0, waiting = false, answered = false, sess = { n: 0, ok: 0, streak: 0, best: 0 };
    var el = function (id) { return $('#' + id, root); };
    var filter = el('pp-qfilter');
    function chips() {
      var nw = Object.keys(mem.wrong).length;
      filter.innerHTML = ['Alle'].concat(cats).concat(['Nur Fehler']).map(function (c) {
        var lab = c === 'Nur Fehler' ? 'Nur Fehler (' + nw + ')' : c;
        return '<button class="pp-chip' + (c === cat ? ' on' : '') + '" data-c="' + c + '">' + lab + '</button>';
      }).join('');
    }
    function build() {
      var ids = [];
      P.QUIZ.forEach(function (q, i) { if (cat === 'Alle' || (cat === 'Nur Fehler' ? mem.wrong[i] : q.c === cat)) { ids.push(i); } });
      pool = shuffle(ids); pos = 0; sess = { n: 0, ok: 0, streak: 0, best: 0 }; show();
    }
    function stats() {
      var mastered = 0; Object.keys(mem.seen).forEach(function (k) { if (mem.seen[k]) { mastered++; } });
      el('pp-qstats').innerHTML = '<span>im 1. Versuch richtig: <b>' + sess.ok + ' / ' + sess.n + '</b></span><span>Serie: <b>' + sess.streak + '</b> (Best ' + sess.best + ')</span><span>zuletzt richtig: <b>' + mastered + ' / ' + P.QUIZ.length + '</b></span>';
    }
    function show() {
      waiting = false; answered = false; el('pp-qnext').hidden = true; el('pp-qfb').innerHTML = '';
      if (!pool.length) { el('pp-qtopic').textContent = ''; el('pp-qcount').textContent = ''; el('pp-qprompt').innerHTML = cat === 'Nur Fehler' ? 'Keine Fehler gespeichert — stark! 🎉' : 'Keine Fragen.'; el('pp-qopts').innerHTML = ''; stats(); chips(); return; }
      if (pos >= pool.length) {
        var pct = sess.n ? Math.round(sess.ok / sess.n * 100) : 0;
        el('pp-qtopic').textContent = 'Fertig'; el('pp-qcount').textContent = '';
        el('pp-qprompt').innerHTML = 'Fertig: <b>' + sess.ok + ' von ' + sess.n + '</b> im ersten Versuch (' + pct + ' %).<br><span class="pp-small">' + (pct >= 90 ? 'Das reicht für die Klausur — mach morgen „Nur Fehler“.' : 'Unter 90 % → drück „Nur Fehler“ und wiederhole, bis es sitzt.') + '</span>';
        el('pp-qopts').innerHTML = ''; stats(); chips(); return;
      }
      var q = P.QUIZ[pool[pos]], opts = shuffle([{ t: q.a, ok: 1 }].concat(q.w.map(function (w) { return { t: w, ok: 0 }; })));
      el('pp-qtopic').textContent = q.c; el('pp-qcount').textContent = 'Frage ' + (pos + 1) + ' / ' + pool.length;
      el('pp-qprompt').innerHTML = q.q;
      el('pp-qopts').innerHTML = opts.map(function (o, i) { return '<button class="tz-opt pp-opt" data-ok="' + o.ok + '">' + fmt(o.t) + '</button>'; }).join('');
      stats(); chips();
    }
    function next() { pos++; show(); }
    el('pp-qopts').addEventListener('click', function (e) {
      var b = e.target.closest('.tz-opt'); if (!b || b.disabled || waiting && answered) { return; }
      var q = P.QUIZ[pool[pos]], ok = b.getAttribute('data-ok') === '1', first = !answered;
      if (first) { sess.n++; if (ok) { sess.ok++; sess.streak++; sess.best = Math.max(sess.best, sess.streak); delete mem.wrong[pool[pos]]; mem.seen[pool[pos]] = 1; } else { sess.streak = 0; mem.wrong[pool[pos]] = 1; mem.seen[pool[pos]] = 0; } qs.set(mem); }
      answered = true;
      if (ok) {
        b.classList.add('ok'); $$('.tz-opt', this).forEach(function (x) { x.disabled = true; });
        el('pp-qfb').innerHTML = '<b style="color:#86efac">✓ Richtig.</b><span class="why">' + fmt(q.why) + '</span>'; stats(); chips();
        waiting = false; setTimeout(function () { if (!waiting && answered) { next(); } }, first ? 1400 : 600);
      } else {
        b.classList.add('no'); b.disabled = true; waiting = true;
        $$('.tz-opt', this).forEach(function (x) { if (x.getAttribute('data-ok') === '1') { x.classList.add('ok'); } x.disabled = true; });
        el('pp-qfb').innerHTML = '<b style="color:#fca5a5">✗ Nicht ganz.</b> Richtig: <b>' + fmt(q.a) + '</b><span class="why">' + fmt(q.why) + '</span>'; el('pp-qnext').hidden = false; stats(); chips();
      }
    });
    el('pp-qnext').addEventListener('click', next);
    el('pp-qrestart').addEventListener('click', build);
    filter.addEventListener('click', function (e) { var c = e.target.closest('.pp-chip'); if (!c) { return; } cat = c.getAttribute('data-c'); build(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && waiting && !el('pp-qnext').hidden && el('pp-qnext').offsetParent !== null) { e.preventDefault(); next(); }
    });
    chips(); build();
  }

  /* ================================================================== pp5 — Übung an der eigenen Präsentation „Schulbeginn“ (Daten: js/iw-ppt-own.js) */
  var ppC = null;
  function renderPP5() {
    var root = $('#pp5-root'); if (!root || !P.OWN) { return; }
    var O = P.OWN;
    function go(id) { return '<span class="pp-go" data-goto="' + id + '" title="Aufgabe ' + id + ' öffnen">' + id + '</span>'; }
    root.innerHTML = '<section class="note-section">' + head('🛠️', 'Твоя презентация «Schulbeginn»: тренировка', 'Файл разобран по содержимому · ' + O.tasks.length + ' заданий на навыки с контрольной · улучшаем настоящую презентацию') +
      '<div class="note-card"><h3>▶ Как работать</h3><ol class="pp-steps" style="margin-top:.2rem">' +
      '<li><div>Открой свой файл <span class="pp-de">' + O.file + '</span> и <b>сразу</b> сохрани копию через «Speichern unter» (имя — генератор ниже). Оригинал не трогай.</div></li>' +
      '<li><div>Начни с пяти ★-заданий: ' + O.star.map(go).join(' ') + '. Это те же навыки, что дают больше всего баллов на контрольной: Ausrichten, Schrift, Farben, Gruppieren, Bilder. Остальные — по дням.</div></li>' +
      '<li><div>Задание открывается кликом: текст «как у учителя», что в файле, картинки/кадры, шаги. Делай <b>в PowerPoint</b>, а не здесь.</div></li>' +
      '<li><div>Потом отметь галочками только то, что реально есть в <b>твоём</b> файле. Внизу — баллы и оценка по Notenschlüssel.</div></li></ol>' +
      P.fileGen('c') + '</div>' +
      '<div class="note-card"><h3>🔍 Что найдено в твоём файле</h3><p class="pp-lead">Всё это <b>прочитано из самого файла</b>: позиции, шрифты, цвета, число объектов. Каждая строка — и «улучшение презентации», и задание.</p>' +
      '<div class="pp-tablewrap"><table class="pp-mini pp-find"><tr><th>Что в файле</th><th>Чем мешает</th><th>Задание</th></tr>' +
      O.find.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="go">' + r[2].map(go).join('') + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="pp-good">✅ <b>Уже хорошо:</b> заметки докладчика на всех 12 слайдах (58–819 знаков), ясная структура «4 шага», контрастный светлый фон, единая полоска. Это не трогаем.</div></div>' +
      '<div class="note-card"><h3>⏱️ Режим «★-задания за 50 минут»</h3><p class="pp-lead">Когда сделала все пять ★ по одному разу — повтори их на таймере с чистой копии файла.</p><div id="pp-timerC"></div></div>' +
      '<div class="note-card"><h3>📝 ' + O.tasks.length + ' заданий (' + O.tasks.reduce(function (a, t) { return a + t.pts; }, 0) + ' баллов)</h3><p class="pp-lead">Порядок свободный; ★ — самые важные. Клик по заданию открывает его.</p><div id="pp-tasksC"></div></div>' +
      '<div class="note-card"><h3>⚠️ Что здесь не проверено</h3><ul class="pp-small" style="margin:.2rem 0 0 1.1rem">' +
      '<li>PowerPoint на этом компьютере нет: названия кнопок взяты из справки Microsoft и по памяти, в твоей версии они могут слегка отличаться.</li>' +
      '<li>Как файл выглядит у тебя на экране, зависит от программы. Заголовки и слайд 11 проверь глазами.</li>' +
      '<li>Задания, баллы и картинки «Danach» — мои: образца учителя для этого файла нет. Настоящая контрольная будет на другом файле, с теми же типами задач.</li></ul></div></section>';
    makeTimer($('#pp-timerC', root), 'neostudy_pp_timerC', 50 * 60, {});
    ppC = mountTasks($('#pp-tasksC', root), 'c', O.tasks, 'neostudy_pp_eh_c', { mine: true });
    bindFileGen(root);
    if (P.bindShow) { P.bindShow(root); }
    root.addEventListener('click', function (e) { var g = e.target.closest('[data-goto]'); if (g && ppC) { ppC.open(g.getAttribute('data-goto')); } });
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    renderPP1(); renderPP2(); renderPP3(); renderPP5();
    var m = /^#(pp[1235])$/.exec(location.hash || '');       /* the page router ran before the content existed → set the tab title now */
    if (m) { var h2 = $('#ls-' + m[1] + ' h2'); if (h2) { document.title = h2.textContent.trim() + ' | NeoStudy'; } }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
