/* ============================================================
   PIER — scripts/pier-nav.js
   Project : Pier (rebuild of Piererra portfolio + tools)
   Phase   : 2 — Portfolio shell

   Owns: mobile menu toggle, dark/light theme toggle (persisted to
   localStorage), and IntersectionObserver-based scroll reveal for
   .pier-reveal elements.
============================================================ */

(function () {
  'use strict';

  /* ---- Mobile menu ---- */
  var menuBtn = document.getElementById('pier-menu-btn');
  var mobileMenu = document.getElementById('pier-mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var isOpen = mobileMenu.getAttribute('data-open') === 'true';
      mobileMenu.setAttribute('data-open', String(!isOpen));
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.setAttribute('data-open', 'false');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Theme toggle ---- */
  var themeToggle = document.getElementById('pier-theme-toggle');
  var root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('pier-theme', next); } catch (e) {}
    });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.pier-reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.setAttribute('data-visible', 'true'); });
  }
})();
