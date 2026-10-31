// Lesson switcher for pages that combine several lessons: <section class="lesson-pane" id="pane-KEY" data-pane="KEY" data-title="…"> panes,
// buttons .lsw-btn[data-pane="KEY"]. URL hash: #KEY (lesson) · #KEY/tab (lesson + its inner tab) · legacy #tab-NAME or #element-id
// (the lesson that contains it is opened) so old deep links keep working.
// Lessons with audio call LessonSwitch.openAudio(slug): the cues file audio/lesson-<slug>-cues.js is loaded on demand, then the
// shared player (js/lesson-audio-player.js) opens.
(function () {
    var cfg = window.LESSON_SWITCH || {};
    var panes = Array.prototype.slice.call(document.querySelectorAll('.lesson-pane'));
    var btns = Array.prototype.slice.call(document.querySelectorAll('.lsw-btn'));
    if (!panes.length) { return; }

    function paneByKey(key) { return document.getElementById('pane-' + key); }
    function norm(s) { return String(s || '').replace(/^tab-/, ''); }

    function show(key, opts) {
        opts = opts || {};
        var target = paneByKey(key);
        if (!target) { return false; }
        panes.forEach(function (p) { p.hidden = (p !== target); });
        btns.forEach(function (b) {
            var on = b.getAttribute('data-pane') === key;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
            if (on && b.parentNode && b.parentNode.scrollWidth > b.parentNode.clientWidth) {      // phones: keep the active button visible in its scrolling row
                b.parentNode.scrollLeft = b.offsetLeft - (b.parentNode.clientWidth - b.offsetWidth) / 2;
            }
        });
        var t = target.getAttribute('data-title');
        if (t) { document.title = t + (cfg.suffix || ' | NeoStudy'); }
        if (!opts.keepHash) {
            try { history.replaceState(null, '', location.pathname + location.search + '#' + key); } catch (e) { /* file:// in some browsers */ }
        }
        if (!opts.noScroll) { window.scrollTo(0, 0); }
        return true;
    }

    function tabButton(pane, name) {               // inner tab by its short name ("use") or its data-tab value
        var key = pane.getAttribute('data-pane'), want = norm(name), found = null;
        Array.prototype.forEach.call(pane.querySelectorAll('.tab[data-tab]'), function (b) {
            var d = norm(b.getAttribute('data-tab'));
            if (!found && (d === want || d === key + '-' + want)) { found = b; }
        });
        return found;
    }

    function route(first) {
        var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
        var key = null, tab = null, anchor = null;
        if (h) {
            var parts = h.split('/');
            if (paneByKey(parts[0])) { key = parts[0]; tab = parts[1] || null; }
            else {
                var want = norm(h);
                for (var i = 0; i < panes.length && !key; i++) {          // legacy: #tab-NAME
                    if (tabButton(panes[i], want)) { key = panes[i].getAttribute('data-pane'); tab = want; }
                }
                if (!key) {                                               // legacy: #element-id
                    var el = document.getElementById(h);
                    var p = el && el.closest ? el.closest('.lesson-pane') : null;
                    if (p) { key = p.getAttribute('data-pane'); anchor = el; }
                }
            }
        }
        if (!key) { if (!first) { return; } key = cfg.default || panes[0].getAttribute('data-pane'); }
        show(key, { keepHash: true, noScroll: !!(tab || anchor) });
        var pane = paneByKey(key);
        if (tab) { var b = tabButton(pane, tab); if (b) { b.click(); window.scrollTo(0, 0); } }
        if (anchor) {
            var tc = anchor.closest('.tab-content');
            if (tc) { var tb = tabButton(pane, tc.id.replace(/^tab-/, '').replace(key + '-', '')); if (tb) { tb.click(); } }
            setTimeout(function () { anchor.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
        }
    }

    btns.forEach(function (b) {
        b.addEventListener('click', function () { show(b.getAttribute('data-pane')); });
    });
    window.addEventListener('hashchange', function () { route(false); });

    var loaded = null;
    window.LessonSwitch = {
        show: show,
        openAudio: function (slug) {
            if (typeof window.openLessonAudio !== 'function') { return; }
            if (loaded === slug && window.LESSON_AUDIO) { window.openLessonAudio(); return; }
            var s = document.createElement('script');
            s.src = 'audio/lesson-' + slug + '-cues.js';
            s.onload = function () { loaded = slug; window.openLessonAudio(); };
            s.onerror = function () { window.LESSON_AUDIO = null; window.openLessonAudio(); };
            document.head.appendChild(s);
        }
    };
    route(true);
})();
