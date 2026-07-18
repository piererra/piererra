/* ============================================================
   SUBWAY SURFERS SAVE GENERATOR — subway-ui.js
   Author  : Piererra
   Project : Piererra Tools

   Renders the wallet/upgrades fields, the character & hoverboard
   pick-grids, the badge row, and wires up the download button.
   Reads/writes state through ptSSGEditor.
============================================================ */

var ptSSGUI = (function (editor, core, data) {
  'use strict';

  var els = {};

  var WALLET_FIELDS = [
    { key: 'coins', label: 'Coins', hint: 'max 2,147,483,647' },
    { key: 'keys', label: 'Keys' },
    { key: 'hoverboardCurrency', label: 'Hoverboard Currency' },
    { key: 'headstarts', label: 'Head Starts' },
    { key: 'scoreBoosters', label: 'Score Boosters' },
    { key: 'eventCoins', label: 'Event Coins' }
  ];

  var UPGRADE_LEVEL_FIELDS = [
    { key: 'jetpack', label: 'Jetpack Level', max: 5 },
    { key: 'superSneakers', label: 'Super Sneakers Level', max: 5 },
    { key: 'magnet', label: 'Coin Magnet Level', max: 5 },
    { key: 'doubleScore', label: '2x Score Level', max: 5 }
  ];

  var UPGRADE_BOOST_FIELDS = [
    { key: 'doubleCoinsAmount', label: '2x Coins Multiplier' },
    { key: 'doubleCoinsTime', label: '2x Coins Time (sec)' },
    { key: 'tokenBoostAmount', label: 'Token Boost Multiplier' },
    { key: 'tokenBoostTime', label: 'Token Boost Time (sec)' }
  ];

  function $(id) { return document.getElementById(id); }

  function toast(msg, kind) {
    var t = els.toast;
    if (!t) return;
    t.textContent = msg;
    t.className = 'ssg-toast ssg-toast--show ssg-toast--' + (kind || 'info');
    clearTimeout(toast._tm);
    toast._tm = setTimeout(function () {
      t.className = 'ssg-toast';
    }, 2600);
  }

  /* ---------------------------------------------------------
     WALLET + UPGRADES field rendering
  --------------------------------------------------------- */
  function renderWalletGrid() {
    var st = editor.getState();
    var html = WALLET_FIELDS.map(function (f) {
      return (
        '<div class="ssg-field">' +
          '<label class="ssg-field__label" for="ssg-w-' + f.key + '">' + f.label +
            (f.hint ? ' <span class="ssg-field__hint">' + f.hint + '</span>' : '') +
          '</label>' +
          '<div class="ssg-field-row">' +
            '<input type="number" class="ssg-input ssg-input--gold" id="ssg-w-' + f.key + '" ' +
              'min="0" max="2147483647" value="' + st[f.key] + '" data-key="' + f.key + '" data-group="wallet" />' +
            '<button type="button" class="ssg-mini-btn" data-max="' + f.key + '" data-group="wallet">MAX</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    els.walletGrid.innerHTML = html;
  }

  function renderUpgradesGrid() {
    var st = editor.getState();
    var levelsHtml = UPGRADE_LEVEL_FIELDS.map(function (f) {
      return (
        '<div class="ssg-field">' +
          '<label class="ssg-field__label" for="ssg-u-' + f.key + '">' + f.label + '</label>' +
          '<input type="number" class="ssg-input" id="ssg-u-' + f.key + '" ' +
            'min="0" max="' + f.max + '" value="' + st[f.key] + '" data-key="' + f.key + '" data-group="upgrades" />' +
        '</div>'
      );
    }).join('');
    var boostHtml = UPGRADE_BOOST_FIELDS.map(function (f) {
      return (
        '<div class="ssg-field">' +
          '<label class="ssg-field__label" for="ssg-u-' + f.key + '">' + f.label + '</label>' +
          '<input type="number" class="ssg-input" id="ssg-u-' + f.key + '" ' +
            'min="0" value="' + st[f.key] + '" data-key="' + f.key + '" data-group="upgrades" />' +
        '</div>'
      );
    }).join('');
    els.upgradesGrid.innerHTML = levelsHtml + boostHtml;
  }

  function bindGridInputs(container, groupKey) {
    container.querySelectorAll('input[data-group="' + groupKey + '"]').forEach(function (input) {
      input.addEventListener('input', function () {
        var val = input.type === 'number' ? Number(input.value || 0) : input.value;
        editor.setField(input.getAttribute('data-key'), val);
      });
    });
    container.querySelectorAll('button[data-max]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-max');
        editor.setField(key, editor.maxInt());
        var input = container.querySelector('input[data-key="' + key + '"]');
        if (input) input.value = editor.maxInt();
      });
    });
  }

  /* ---------------------------------------------------------
     CHARACTER / HOVERBOARD pick grids
     subKey: 'outfits' | 'upgrades' | null — when an item has more
     than one sub-variant, a row of toggle pills lets you own any
     number of them at once (tap a pill to add/remove it, or hit
     "All" to own every variant for that item).
  --------------------------------------------------------- */
  function renderPickGrid(container, roster, listKey, selectedKey, subKey, hiddenNoteEl) {
    var st = editor.getState();
    var visible = roster.filter(function (item) { return item.available !== false; });
    var hiddenCount = roster.length - visible.length;

    var html = visible.map(function (item) {
      var owned = st[listKey].indexOf(item.id) !== -1;
      var isSelected = st[selectedKey] === item.id;
      var hasVariants = subKey && Array.isArray(item[subKey]) && item[subKey].length > 1;
      var variantsHtml = '';

      if (hasVariants) {
        var current = editor.getSubSelections(listKey, item.id);
        var pills = item[subKey].map(function (sub) {
          var active = current.indexOf(sub.id) !== -1;
          return '<span class="ssg-variant-pill' + (active ? ' ssg-variant-pill--active' : '') +
            '" data-variant-for="' + item.id + '" data-variant-id="' + sub.id + '">' + sub.name + '</span>';
        }).join('');
        variantsHtml =
          '<div class="ssg-chip__variants" onclick="event.stopPropagation()">' +
            pills +
            '<span class="ssg-variant-pill ssg-variant-pill--all" data-variant-all-for="' + item.id + '">All</span>' +
          '</div>';
      }

      return (
        '<div class="ssg-chip' + (owned ? ' ssg-chip--owned' : '') + (hasVariants ? ' ssg-chip--has-variants' : '') +
          '" data-id="' + item.id + '" data-name="' + item.name.toLowerCase() + '">' +
          '<div class="ssg-chip__row">' +
            '<span class="ssg-chip__name pier-marquee"><span class="pier-marquee__track">' + item.name + '</span></span>' +
            '<span class="ssg-chip__star' + (isSelected ? ' ssg-chip__star--active' : '') + '" data-star="' + item.id + '">&#9733;</span>' +
          '</div>' +
          variantsHtml +
        '</div>'
      );
    }).join('');
    container.innerHTML = html;
    if (window.pierMarquee) pierMarquee.init(container);

    if (hiddenNoteEl) {
      hiddenNoteEl.textContent = hiddenCount > 0
        ? hiddenCount + ' item(s) hidden — datamined but not released in-game yet'
        : '';
    }
  }

  function wirePickGrid(container, roster, listKey, selectedKey, searchInput, allBtn, noneBtn, defaultId, label, subKey) {
    container.addEventListener('click', function (e) {
      var star = e.target.closest('[data-star]');
      var chip = e.target.closest('.ssg-chip');
      if (!chip) return;
      var id = chip.getAttribute('data-id');

      if (star) {
        // Selecting as "current" also guarantees ownership
        editor.setField(selectedKey, id);
        var st = editor.getState();
        if (st[listKey].indexOf(id) === -1) st[listKey].push(id);
        renderPickGrid(container, roster, listKey, selectedKey, subKey);
        return;
      }

      editor.toggleOwned(listKey, id);
      chip.classList.toggle('ssg-chip--owned');
    });

    if (subKey) {
      container.addEventListener('click', function (e) {
        var allPill = e.target.closest('[data-variant-all-for]');
        if (allPill) {
          var allId = allPill.getAttribute('data-variant-all-for');
          var item = roster.filter(function (it) { return it.id === allId; })[0];
          if (item) {
            editor.setAllSubSelections(listKey, allId, item[subKey].map(function (s) { return s.id; }));
            renderPickGrid(container, roster, listKey, selectedKey, subKey);
          }
          return;
        }
        var pill = e.target.closest('[data-variant-for]');
        if (!pill) return;
        editor.toggleSubSelection(listKey, pill.getAttribute('data-variant-for'), pill.getAttribute('data-variant-id'));
        renderPickGrid(container, roster, listKey, selectedKey, subKey);
      });
    }

    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim().toLowerCase();
      container.querySelectorAll('.ssg-chip').forEach(function (chip) {
        var match = chip.getAttribute('data-name').indexOf(q) !== -1;
        chip.classList.toggle('ssg-chip__hidden', !match);
      });
    });

    allBtn.addEventListener('click', function () {
      editor.ownAll(listKey, roster);
      renderPickGrid(container, roster, listKey, selectedKey, subKey);
      toast('All ' + (label || 'items') + ' owned', 'ok');
    });

    noneBtn.addEventListener('click', function () {
      editor.ownNone(listKey, defaultId);
      renderPickGrid(container, roster, listKey, selectedKey, subKey);
    });
  }

  /* ---------------------------------------------------------
     VERSION WIDGET
     Shows the game version our data is synced to vs. the live
     Play Store listing, filled in by .github/scripts/sync-subway-data.js.
     Matching is done on major.minor only (e.g. "3.65" from "3.65.1"),
     same granularity the upstream data source itself uses — a patch
     release doesn't usually add new syncable content.
  --------------------------------------------------------- */
  function majorMinor(v) {
    var parts = String(v).split('.');
    return parts.slice(0, 2).join('.');
  }

  function renderVersionWidget() {
    if (!els.versionOurs || !els.versionPlaystore) return;
    var info = data.VERSION_INFO || {};
    var ours = info.ourVersion || 'unknown';
    var store = info.playStoreVersion || 'unknown';

    els.versionOurs.textContent = ours;
    els.versionPlaystore.textContent = store;

    if (!els.versionStatus) return;
    if (ours === 'unknown' || store === 'unknown') {
      els.versionStatus.textContent = '';
      els.versionStatus.className = 'ssg-version-widget__status';
    } else if (majorMinor(ours) === majorMinor(store)) {
      els.versionStatus.textContent = 'Up to date';
      els.versionStatus.className = 'ssg-version-widget__status ssg-version-widget__status--ok';
    } else {
      els.versionStatus.textContent = 'Update pending';
      els.versionStatus.className = 'ssg-version-widget__status ssg-version-widget__status--stale';
    }
  }

  /* ---------------------------------------------------------
     BADGES
  --------------------------------------------------------- */
  var BADGE_STATE_KEYS = {
    champ: 'badgeChamp', diamond: 'badgeDiamond', gold: 'badgeGold',
    silver: 'badgeSilver', bronze: 'badgeBronze'
  };

  function renderBadgeRow() {
    var st = editor.getState();
    var html = data.BADGE_TIERS.map(function (tier) {
      var key = BADGE_STATE_KEYS[tier.key];
      return (
        '<div class="ssg-badge">' +
          '<img src="' + tier.icon + '" alt="' + tier.name + ' badge" loading="lazy" />' +
          '<span class="ssg-badge__name">' + tier.name + '</span>' +
          '<input type="number" min="0" value="' + st[key] + '" data-badge-key="' + key + '" />' +
        '</div>'
      );
    }).join('');
    els.badgeRow.innerHTML = html;
    els.badgeRow.querySelectorAll('input[data-badge-key]').forEach(function (input) {
      input.addEventListener('input', function () {
        editor.setField(input.getAttribute('data-badge-key'), Number(input.value || 0));
      });
    });
  }

  /* ---------------------------------------------------------
     DOWNLOAD
  --------------------------------------------------------- */
  function wireDownload() {
    els.downloadBtn.addEventListener('click', function () {
      var files = editor.generateAll();
      core.downloadZip(files, core.buildZipName());
      toast('Profile generated — check your downloads', 'ok');
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  function renderAll() {
    renderWalletGrid();
    renderUpgradesGrid();
    renderPickGrid(els.charGrid, data.CHARACTERS, 'ownedCharacters', 'selectedCharacter', 'outfits', els.charHidden);
    renderPickGrid(els.boardGrid, data.HOVERBOARDS, 'ownedBoards', 'selectedBoard', 'upgrades', els.boardHidden);
    renderPickGrid(els.frameGrid, data.FRAMES, 'ownedFrames', 'selectedFrame');
    renderPickGrid(els.portraitGrid, data.PORTRAITS, 'ownedPortraits', 'selectedPortrait');
    renderPickGrid(els.backgroundGrid, data.BACKGROUNDS, 'ownedBackgrounds', 'selectedBackground');
    renderBadgeRow();
    renderVersionWidget();
    bindGridInputs(els.walletGrid, 'wallet');
    bindGridInputs(els.upgradesGrid, 'upgrades');
  }

  function init() {
    els = {
      toast: $('ssg-toast'),
      walletGrid: $('ssg-wallet-grid'),
      upgradesGrid: $('ssg-upgrades-grid'),
      charGrid: $('ssg-char-grid'),
      boardGrid: $('ssg-board-grid'),
      frameGrid: $('ssg-frame-grid'),
      portraitGrid: $('ssg-portrait-grid'),
      backgroundGrid: $('ssg-background-grid'),
      badgeRow: $('ssg-badge-row'),
      downloadBtn: $('ssg-btn-download'),
      charSearch: $('ssg-char-search'),
      boardSearch: $('ssg-board-search'),
      frameSearch: $('ssg-frame-search'),
      portraitSearch: $('ssg-portrait-search'),
      backgroundSearch: $('ssg-background-search'),
      charAll: $('ssg-char-all'),
      charNone: $('ssg-char-none'),
      boardAll: $('ssg-board-all'),
      boardNone: $('ssg-board-none'),
      frameAll: $('ssg-frame-all'),
      frameNone: $('ssg-frame-none'),
      portraitAll: $('ssg-portrait-all'),
      portraitNone: $('ssg-portrait-none'),
      backgroundAll: $('ssg-background-all'),
      backgroundNone: $('ssg-background-none'),
      charHidden: $('ssg-char-hidden-note'),
      boardHidden: $('ssg-board-hidden-note'),
      versionOurs: $('ssg-version-ours'),
      versionPlaystore: $('ssg-version-playstore'),
      versionStatus: $('ssg-version-status')
    };

    renderAll();

    // The chip names above were measured for marquee overflow using
    // fallback-font metrics, because Sora/Inter (loaded via @import in
    // portal.css) may not have finished downloading yet. Once the real
    // font swaps in, text width can change enough to make previously-fine
    // labels overflow (or vice versa), so re-measure every grid once
    // fonts are actually ready.
    if (window.pierMarquee && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        [els.charGrid, els.boardGrid, els.frameGrid, els.portraitGrid, els.backgroundGrid]
          .forEach(function (grid) { if (grid) pierMarquee.init(grid); });
      });
    }

    wirePickGrid(els.charGrid, data.CHARACTERS, 'ownedCharacters', 'selectedCharacter',
      els.charSearch, els.charAll, els.charNone, 'jake', 'characters', 'outfits');
    wirePickGrid(els.boardGrid, data.HOVERBOARDS, 'ownedBoards', 'selectedBoard',
      els.boardSearch, els.boardAll, els.boardNone, 'default', 'hoverboards', 'upgrades');
    wirePickGrid(els.frameGrid, data.FRAMES, 'ownedFrames', 'selectedFrame',
      els.frameSearch, els.frameAll, els.frameNone, null, 'frames');
    wirePickGrid(els.portraitGrid, data.PORTRAITS, 'ownedPortraits', 'selectedPortrait',
      els.portraitSearch, els.portraitAll, els.portraitNone, null, 'portraits');
    wirePickGrid(els.backgroundGrid, data.BACKGROUNDS, 'ownedBackgrounds', 'selectedBackground',
      els.backgroundSearch, els.backgroundAll, els.backgroundNone, null, 'backgrounds');
    wireDownload();
  }

  return { init: init };
})(ptSSGEditor, ptSSGCore, ptSSGData);
