/* ============================================================
   SUBWAY SURFERS SAVE GENERATOR — subway-core.js
   Author  : Piererra
   Project : Piererra Tools

   Builds the four profile files the game reads from its local
   save folder (wallet.json, upgrades.json, characters_inventory.json,
   boards_inventory.json) plus an optional badges.json, and packages
   them into a downloadable zip via JSZip.

   File formats reverse-engineered from community save-editor
   references (subway_gen / SubwayBooster) — each file is a thin
   {version, data} wrapper where "data" is itself a JSON string.
============================================================ */

var ptSSGCore = (function () {
  'use strict';

  /* ---------------------------------------------------------
     wallet.json  (version 2)
     currencies: 1=coins 2=keys 3=hoverboardCurrency 4=headstarts
                 5=scoreBoosters 6=eventCoins
  --------------------------------------------------------- */
  function buildWallet(state) {
    var inner = {
      lastSaved: '',
      patchVersion: 0,
      currencies: {
        '1': { value: state.coins },
        '2': { value: state.keys },
        '3': { value: state.hoverboardCurrency },
        '4': { value: state.headstarts },
        '5': { value: state.scoreBoosters },
        '6': { value: state.eventCoins, expirationValue: 99999999999999, expirationType: 1 }
      },
      lootboxQueue: { unopenedLootboxes: { '0': [], '2': [] } },
      currencyAllowedInRun: { '5': true, '4': true },
      lootBoxesOpened: { mini_mystery_box: 0, mystery_box: 0, token_box: 0, super_mystery_box: 0 },
      ownedOnlyBuyOnceProducts: []
    };
    return JSON.stringify({ version: 2, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     upgrades.json  (version 3)
  --------------------------------------------------------- */
  function buildUpgrades(state) {
    var inner = {
      lastSaved: '',
      patchVersion: 1,
      currencyPickupModifiers: {
        doubleCoins: {
          value: { id: 'doubleCoins', type: 0, subType: 0, value: state.doubleCoinsAmount }
        },
        permanent_score_multiplier: {
          value: { id: 'permanent_score_multiplier', type: 2, subType: 3, value: 5 },
          expirationValue: state.doubleCoinsTime,
          expirationType: 1
        },
        token_multiplier_low: {
          value: { id: 'token_multiplier_low', type: 0, subType: 2, value: state.tokenBoostAmount },
          expirationValue: state.tokenBoostTime,
          expirationType: 1
        }
      },
      powerupLevels: {
        jetpack: state.jetpack,
        superSneakers: state.superSneakers,
        magnet: state.magnet,
        doubleScore: state.doubleScore
      }
    };
    return JSON.stringify({ version: 3, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     characters_inventory.json  (version 3)
     owned[id] = { value: { id, ownedOutfits: [{ value: outfitId }] } }
  --------------------------------------------------------- */
  function buildCharacters(state) {
    var owned = {};
    var subs = (state.subSelections && state.subSelections.ownedCharacters) || {};
    state.ownedCharacters.forEach(function (id) {
      // subs[id] may hold one or several owned outfit variants.
      var outfits = subs[id] || ['default'];
      if (!Array.isArray(outfits)) outfits = [outfits];
      owned[id] = { value: { id: id, ownedOutfits: outfits.map(function (o) { return { value: o }; }) } };
    });
    var selectedChar = state.selectedCharacter || 'jake';
    var selectedOutfits = subs[selectedChar] || ['default'];
    var inner = {
      selected: { character: selectedChar, outfit: (Array.isArray(selectedOutfits) ? selectedOutfits[0] : selectedOutfits) || 'default' },
      owned: owned
    };
    return JSON.stringify({ version: 3, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     boards_inventory.json  (version 3)
     owned[id] = { value: { id, ownedUpgrades: { upgradeId: { value: true } } } }
  --------------------------------------------------------- */
  function buildBoards(state) {
    var owned = {};
    var subs = (state.subSelections && state.subSelections.ownedBoards) || {};
    state.ownedBoards.forEach(function (id) {
      // subs[id] may hold one or several owned upgrade variants.
      var upgrades = subs[id] || ['default'];
      if (!Array.isArray(upgrades)) upgrades = [upgrades];
      var upgradesObj = {};
      upgrades.forEach(function (u) { upgradesObj[u] = { value: true }; });
      owned[id] = { value: { id: id, ownedUpgrades: upgradesObj } };
    });
    var inner = {
      selected: state.selectedBoard || 'default',
      owned: owned
    };
    return JSON.stringify({ version: 3, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     profile_frame.json  (version 1)
     owned[id] = { id, isSeen: true }
  --------------------------------------------------------- */
  function buildFrames(state) {
    var owned = {};
    (state.ownedFrames || []).forEach(function (id) {
      owned[id] = { id: id, isSeen: true };
    });
    var inner = {
      selected: state.selectedFrame || null,
      owned: owned
    };
    return JSON.stringify({ version: 1, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     profile_portrait.json  (version 1)
     owned[id] = { id, isSeen: true }
  --------------------------------------------------------- */
  function buildPortraits(state) {
    var owned = {};
    (state.ownedPortraits || []).forEach(function (id) {
      owned[id] = { id: id, isSeen: true };
    });
    var inner = {
      selected: state.selectedPortrait || null,
      owned: owned
    };
    return JSON.stringify({ version: 1, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     profile_background.json  (version 1)
     owned[id] = { id, isSeen: true }
  --------------------------------------------------------- */
  function buildBackgrounds(state) {
    var owned = {};
    (state.ownedBackgrounds || []).forEach(function (id) {
      owned[id] = { id: id, isSeen: true };
    });
    var inner = {
      selected: state.selectedBackground || null,
      owned: owned
    };
    return JSON.stringify({ version: 1, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     badges.json  (version 2) — trophy / high-score counters
  --------------------------------------------------------- */
  function buildBadges(state) {
    var inner = {
      lastSaved: '0001-01-01T00:00:00Z',
      lastIAPDate: '0001-01-01T00:00:00Z',
      highScoreCollection: { 'default': 2147383647 },
      userStatCollection: {
        '102': state.badgeChamp,
        '103': state.badgeDiamond,
        '104': state.badgeGold,
        '105': state.badgeSilver,
        '106': state.badgeBronze
      }
    };
    return JSON.stringify({ version: 2, data: JSON.stringify(inner) });
  }

  /* ---------------------------------------------------------
     Parse an uploaded {version, data} profile file back into
     a plain object, for the optional "load existing save" flow.
  --------------------------------------------------------- */
  function parseProfileFile(text) {
    try {
      var outer = JSON.parse(text);
      if (!outer || typeof outer.data !== 'string') return null;
      return { version: outer.version, data: JSON.parse(outer.data) };
    } catch (e) {
      return null;
    }
  }

  /* ---------------------------------------------------------
     Build a zip filename stamped with the current real-time
     date/time, e.g. subway-surfers-profile-04072026-1437.zip
     (DDMMYYYY-HHMM, 24-hour clock, local time)
  --------------------------------------------------------- */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function buildZipName() {
    var d = new Date();
    var datePart = pad2(d.getDate()) + pad2(d.getMonth() + 1) + d.getFullYear();
    var timePart = pad2(d.getHours()) + pad2(d.getMinutes());
    return 'subway-surfers-profile-' + datePart + '-' + timePart + '.zip';
  }

  /* ---------------------------------------------------------
     Package the generated files into a zip (profile/ folder)
     and trigger a download. Requires JSZip to be loaded.
     A blank credit marker file is always included alongside
     the profile files. If zipName is omitted, a timestamped
     name is generated automatically via buildZipName().
  --------------------------------------------------------- */
  function downloadZip(files, zipName) {
    if (typeof JSZip === 'undefined') {
      alert('JSZip failed to load — check your connection and try again.');
      return;
    }
    var zip = new JSZip();
    var folder = zip.folder('profile');
    Object.keys(files).forEach(function (name) {
      folder.file(name, files[name]);
    });
    folder.file('Generated by Piererra Tools', '');
    zip.generateAsync({ type: 'blob' }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = zipName || buildZipName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    });
  }

  /* ---------------------------------------------------------
     Trigger a single-file text download (for per-file buttons)
  --------------------------------------------------------- */
  function downloadText(filename, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  return {
    buildWallet: buildWallet,
    buildUpgrades: buildUpgrades,
    buildCharacters: buildCharacters,
    buildBoards: buildBoards,
    buildFrames: buildFrames,
    buildPortraits: buildPortraits,
    buildBackgrounds: buildBackgrounds,
    buildBadges: buildBadges,
    parseProfileFile: parseProfileFile,
    buildZipName: buildZipName,
    downloadZip: downloadZip,
    downloadText: downloadText
  };
})();
