/* ============================================================
   PIER — scripts/pier-sidebar-nav.js
   Project : Pier (rebuild of Piererra portfolio + tools)
   Phase   : 5 — Editor reskin (fix: true exclusive tabs)

   Markup (see editors/gtasa/index.html for the reference example):

     <nav class="pier-editor-nav" id="pier-editor-nav">
       <a class="pier-editor-nav__link" href="#money" data-section="money">Money</a>
       <a class="pier-editor-nav__link" href="#weapons" data-section="weapons">Weapons</a>
       ...
     </nav>

     <details class="pier-editor-panel" id="money"> ... </details>
     <details class="pier-editor-panel" id="weapons"> ... </details>

   Behavior:
     - Exactly one panel is visible at a time — every other panel gets
       the `hidden` attribute. This is a real tab switch, not a
       scroll-to-anchor: nothing below the selected panel sits in the
       page, so there's no long scrollable stack fighting the sidebar.
     - Clicking a nav link switches the visible panel, marks it active
       (.is-active / aria-selected), and scrolls the panel container
       back to the top of the viewport.
     - Respects prefers-reduced-motion for the scroll behavior.

   Usage (once a page has the markup above):
     PierSidebarNav.init('#pier-editor-nav', '.pier-editor-panel');
============================================================ */

(function () {
  function init(navSelector, panelSelector) {
    var nav = document.querySelector(navSelector);
    if (!nav) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('.pier-editor-nav__link'));
    var panels = Array.prototype.slice.call(document.querySelectorAll(panelSelector));
    if (!links.length || !panels.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var panelsWrap = document.querySelector('.pier-editor-panels');

    nav.setAttribute('role', 'tablist');
    links.forEach(function (link) { link.setAttribute('role', 'tab'); });
    panels.forEach(function (panel) { panel.setAttribute('role', 'tabpanel'); });

    function showPanel(id, opts) {
      var scroll = !opts || opts.scroll !== false;

      panels.forEach(function (panel) {
        var isMatch = panel.id === id;
        panel.hidden = !isMatch;
      });

      links.forEach(function (link) {
        var isMatch = link.getAttribute('data-section') === id;
        link.classList.toggle('is-active', isMatch);
        link.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        if (isMatch) {
          link.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });

      if (scroll && panelsWrap) {
        panelsWrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showPanel(link.getAttribute('data-section'));
      });
    });

    // Start on whichever panel isn't already hidden, else the first one
    var initial = panels.filter(function (p) { return !p.hidden; })[0] || panels[0];
    showPanel(initial.id, { scroll: false });
  }

  window.PierSidebarNav = { init: init };
})();
