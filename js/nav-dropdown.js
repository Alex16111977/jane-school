/* Fächer/Vokabeln dropdowns: CSS :hover works for mouse, this adds a
   reliable tap-to-toggle for touch screens (mobile has no real :hover). */
(function () {
    function closeAll(except) {
        document.querySelectorAll('.nav-dd.open').forEach(function (dd) {
            if (dd !== except) { dd.classList.remove('open'); }
        });
    }
    document.querySelectorAll('.nav-dd > .nav-dd-btn').forEach(function (btn) {
        var dd = btn.parentElement;
        btn.addEventListener('click', function (e) {
            var willOpen = !dd.classList.contains('open');
            closeAll(willOpen ? dd : null);
            dd.classList.toggle('open', willOpen);
            e.stopPropagation();
        });
        btn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
            if (e.key === 'Escape') { dd.classList.remove('open'); btn.blur(); }
        });
    });
    document.querySelectorAll('.nav-dd-menu').forEach(function (menu) {
        menu.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    document.addEventListener('click', function () { closeAll(); });
})();
