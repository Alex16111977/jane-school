// Auto-navigate to the right tab and scroll to an anchor when page loads with a #hash.
// Usage: link to page.html#tab-NAME  → activates that tab
//        link to page.html#anchor-id → finds element, activates its parent tab, scrolls to it
(function () {
    var hash = location.hash.replace('#', '');
    if (!hash) return;

    function activateTab(tabName) {
        var btn = document.querySelector('[data-tab="' + tabName + '"]');
        if (btn) { btn.click(); return true; }
        return false;
    }

    // Case 1: hash = "tab-XXX"
    var m = hash.match(/^tab-(.+)/);
    if (m) {
        activateTab(m[1]);
        window.scrollTo(0, 0);
        return;
    }

    // Case 2: hash is an element id — find parent tab, activate, scroll
    var el = document.getElementById(hash);
    if (!el) return;
    var tc = el.closest('.tab-content');
    if (tc) {
        var tabId = tc.id.replace('tab-', '');
        activateTab(tabId);
    }
    setTimeout(function () {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
})();
