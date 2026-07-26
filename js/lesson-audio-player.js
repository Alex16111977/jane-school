// Shared "listen to this lesson" audio player, used by all A2 grammar lesson
// pages. Each page loads its own audio/lesson-<slug>-cues.js first (assigns
// window.LESSON_AUDIO = {src, d, c:[{kind,units,t},...]}), then this script,
// then calls openLessonAudio()/closeLessonAudio() from its own button.
// Real <audio> element (not Web Speech) -> plays with the screen off / in the
// background, with Media Session lock-screen + headphone controls.
// Docked as a slim bottom bar (not a full-screen overlay), so the rest of the
// page stays scrollable/clickable while it plays; tapping the bar's text
// expands a panel above it with the full "now playing" text + settings.
(function () {
    var lsa = { el: null, cues: [], idx: 0, repeat: 1, plays: 0, rate: 1 };

    function fmt(sec) { sec = Math.max(0, Math.floor(sec || 0)); var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
    function cueIndex(time) { var cs = lsa.cues, idx = 0; for (var i = 0; i < cs.length; i++) { if (cs[i].t <= time + 0.02) idx = i; else break; } return idx; }
    function cardHtml(cue) {
        if (!cue) return '';
        if (cue.kind === 'title') return cue.units.map(function (u) { return '<div class="lsa-title">' + u + '</div>'; }).join('');
        if (cue.kind === 'tab') return '<div class="lsa-tab-badge">' + (cue.units[0] || '') + '</div>';
        return cue.units.map(function (u) { return '<div class="lsa-unit">' + u + '</div>'; }).join('');
    }
    function barText(cue) {
        if (!cue) return '';
        if (cue.kind === 'tab') return cue.units[0] || '';
        return cue.units[0] || '';
    }
    function update() {
        var el = lsa.el; if (!el) return;
        var cue = lsa.cues[lsa.idx];
        var now = document.getElementById('lsa-now');
        var barTextEl = document.getElementById('lsa-bar-text'), barProg = document.getElementById('lsa-bar-progress');
        var pb = document.getElementById('lsa-play');
        if (now) now.innerHTML = cardHtml(cue);
        if (barTextEl) barTextEl.textContent = barText(cue);
        var progressStr = (lsa.cues.length ? (lsa.idx + 1) : 0) + ' / ' + lsa.cues.length + '  ·  ' + fmt(el.currentTime) + ' / ' + fmt(el.duration) +
            (lsa.repeat !== Infinity && lsa.repeat > 1 ? ('  ·  🔁 ' + (Math.min(lsa.plays, lsa.repeat - 1) + 1) + '/' + lsa.repeat) : '');
        if (barProg) barProg.textContent = progressStr;
        if (pb) pb.innerHTML = (!el.paused) ? '&#9208;' : '&#9654;';
        var chips = document.querySelectorAll('#lsa-dock .lsa-c');
        for (var i = 0; i < chips.length; i++) {
            var c = chips[i], set = c.getAttribute('data-set'), val = c.getAttribute('data-val'), on = false;
            if (set === 'speed') on = parseFloat(val) === el.playbackRate;
            else if (set === 'repeat') { var rv = parseInt(val, 10); on = (rv === 0) ? (lsa.repeat === Infinity) : (lsa.repeat === rv); }
            c.classList.toggle('active', on);
        }
    }
    function media(title) {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({ title: title || document.title, artist: 'Deutsch A2 · Lektion', album: 'NeoStudy' });
            navigator.mediaSession.setActionHandler('play', function () { if (lsa.el) lsa.el.play(); });
            navigator.mediaSession.setActionHandler('pause', function () { if (lsa.el) lsa.el.pause(); });
            navigator.mediaSession.setActionHandler('previoustrack', function () { seek(-1); });
            navigator.mediaSession.setActionHandler('nexttrack', function () { seek(1); });
        } catch (e) {}
    }
    function seek(dir) {
        var el = lsa.el; if (!el || !lsa.cues.length) return;
        var ni = lsa.idx + dir; if (ni < 0) ni = 0; if (ni >= lsa.cues.length) ni = lsa.cues.length - 1;
        lsa.idx = ni; try { el.currentTime = lsa.cues[ni].t + 0.01; } catch (e) {}
        update(); media();
    }
    function togglePanel(force) {
        var panel = document.getElementById('lsa-panel'); if (!panel) return;
        var open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
        panel.classList.toggle('open', open);
    }
    window.openLessonAudio = function () {
        var dock = document.getElementById('lsa-dock');
        if (!dock) return;
        dock.classList.add('open');
        var data = window.LESSON_AUDIO;
        if (!data || !data.c || !data.c.length) {
            togglePanel(true);
            document.getElementById('lsa-now').innerHTML = '<div class="lsa-none">Audio wird noch vorbereitet &mdash; versuch es sp&auml;ter noch einmal.</div>';
            return;
        }
        if (lsa.el) { try { lsa.el.pause(); } catch (e) {} try { lsa.el.remove(); } catch (e) {} lsa.el = null; }
        lsa.cues = data.c; lsa.idx = 0; lsa.plays = 0;
        var el = document.createElement('audio');
        el.id = 'lsa-el'; el.src = data.src; el.preload = 'auto'; el.playbackRate = lsa.rate;
        dock.appendChild(el); lsa.el = el;
        el.ontimeupdate = function () { var ni = cueIndex(el.currentTime); if (ni !== lsa.idx) { lsa.idx = ni; media(); } update(); };
        el.onplay = update; el.onpause = update; el.onloadedmetadata = update;
        el.onended = function () { lsa.plays++; if (lsa.plays < lsa.repeat) { try { el.currentTime = 0; } catch (e) {} var p = el.play(); if (p && p.catch) p.catch(function () {}); } else { lsa.plays = 0; } update(); };
        document.getElementById('lsa-play').onclick = function () { if (el.paused) { var p = el.play(); if (p && p.catch) p.catch(function () {}); } else el.pause(); };
        document.getElementById('lsa-prev').onclick = function () { seek(-1); };
        document.getElementById('lsa-next').onclick = function () { seek(1); };
        document.getElementById('lsa-bar-info').onclick = function () { togglePanel(); };
        document.querySelector('#lsa-dock .lsa-settings').onclick = function (ev) {
            var chip = ev.target.closest ? ev.target.closest('.lsa-c') : null; if (!chip) return;
            var set = chip.getAttribute('data-set'), val = chip.getAttribute('data-val');
            if (set === 'speed') { el.playbackRate = parseFloat(val); lsa.rate = el.playbackRate; }
            else if (set === 'repeat') { var n = parseInt(val, 10); lsa.repeat = (n === 0) ? Infinity : n; lsa.plays = 0; }
            update();
        };
        togglePanel(true);
        update(); media();
        var p = el.play(); if (p && p.catch) p.catch(function () {});
    };
    window.closeLessonAudio = function () {
        var dock = document.getElementById('lsa-dock');
        if (dock) dock.classList.remove('open');
        togglePanel(false);
        if (lsa.el) { try { lsa.el.pause(); } catch (e) {} lsa.el.src = ''; lsa.el.remove(); lsa.el = null; }
        if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = null; } catch (e) {} }
    };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') togglePanel(false); });
})();
