/* ============================================================
   PIER — scripts/pier-marquee.js
   Project : Pier (rebuild of Piererra portfolio + tools)
   Phase   : 4 — Editor reskin (shared component)
   ------------------------------------------------------------
   Wrap any single-line label that might overflow its box in:

     <span class="pier-marquee"><span class="pier-marquee__track">
       TEXT
     </span></span>

   Then call pierMarquee.init() (optionally scoped to a container)
   after the markup exists in the DOM. Only labels that actually
   overflow their box get the scrolling animation — short text
   is left alone.

   Re-call pierMarquee.init(container) any time the labels inside
   `container` are re-rendered, so newly-added/removed text gets
   measured again.
============================================================ */

(function () {
  'use strict';

  function apply(root) {
    var scope = (root && root.querySelectorAll) ? root : document;
    var els = scope.querySelectorAll('.pier-marquee');

    els.forEach(function (el) {
      var track = el.querySelector('.pier-marquee__track');
      if (!track) return;

      el.classList.remove('pier-marquee--active');
      track.style.removeProperty('--pier-marquee-distance');
      track.style.removeProperty('--pier-marquee-duration');

      var overflow = track.scrollWidth - el.clientWidth;
      if (overflow > 4) {
        var distance = overflow + 10;
        var duration = Math.max(3, distance / 26);
        track.style.setProperty('--pier-marquee-distance', '-' + distance + 'px');
        track.style.setProperty('--pier-marquee-duration', duration + 's');
        el.classList.add('pier-marquee--active');
      }
    });
  }

  window.pierMarquee = { init: apply };
})();
