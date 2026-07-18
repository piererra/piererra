/* ============================================================
   SUBWAY SURFERS SAVE GENERATOR — subway-editor.js
   Author  : Piererra
   Project : Piererra Tools

   Holds the in-memory profile state, default values, and the
   "load existing files" logic that pre-fills state from an
   uploaded profile bundle. subway-ui.js reads/writes this state
   through the functions exposed here.
============================================================ */

var ptSSGEditor = (function (core, data) {
  'use strict';

  var MAX_INT = 2147483647;

  var state = {
    coins: 999999,
    keys: 999,
    hoverboardCurrency: 999,
    headstarts: 99,
    scoreBoosters: 99,
    eventCoins: 999999,

    jetpack: 5,
    superSneakers: 5,
    magnet: 5,
    doubleScore: 5,
    doubleCoinsAmount: 2,
    doubleCoinsTime: 3600,
    tokenBoostAmount: 2,
    tokenBoostTime: 3600,

    ownedCharacters: ['jake'],
    selectedCharacter: 'jake',
    ownedBoards: ['default'],
    selectedBoard: 'default',
    ownedFrames: [],
    selectedFrame: null,
    ownedPortraits: [],
    selectedPortrait: null,
    ownedBackgrounds: [],
    selectedBackground: null,

    // Per-item chosen sub-variant, e.g. subSelections.ownedCharacters['jake'] = 'ninjaJakeOutfit'
    subSelections: {
      ownedCharacters: {},
      ownedBoards: {}
    },

    badgeChamp: 0,
    badgeDiamond: 0,
    badgeGold: 0,
    badgeSilver: 0,
    badgeBronze: 0
  };

  function getState() { return state; }
  function maxInt() { return MAX_INT; }

  function setField(key, value) {
    state[key] = value;
  }

  function toggleOwned(listKey, id) {
    var list = state[listKey];
    var idx = list.indexOf(id);
    if (idx === -1) list.push(id);
    else list.splice(idx, 1);
  }

  function ownAll(listKey, roster) {
    state[listKey] = roster.map(function (item) { return item.id; });
  }

  function ownNone(listKey, keepId) {
    state[listKey] = keepId ? [keepId] : [];
  }

  // Records which outfit/upgrade variants are owned for a specific
  // owned character/board id. subGroup is 'ownedCharacters' or 'ownedBoards'.
  // Value is always an ARRAY of variant ids (a character/board can now
  // own more than one skin/upgrade at once).
  function getSubSelections(subGroup, itemId) {
    var group = state.subSelections[subGroup] || (state.subSelections[subGroup] = {});
    if (!Array.isArray(group[itemId])) group[itemId] = group[itemId] ? [group[itemId]] : ['default'];
    return group[itemId];
  }

  function toggleSubSelection(subGroup, itemId, subId) {
    var list = getSubSelections(subGroup, itemId);
    var idx = list.indexOf(subId);
    if (idx === -1) {
      list.push(subId);
    } else if (list.length > 1) {
      // Always leave at least one variant selected so the item stays valid.
      list.splice(idx, 1);
    }
  }

  function setAllSubSelections(subGroup, itemId, allIds) {
    state.subSelections[subGroup][itemId] = allIds.slice();
  }

  /* ---------------------------------------------------------
     Load an existing profile bundle (from uploaded json files)
     and merge whatever fields we recognize into state.
     `files` = { 'wallet.json': text, 'upgrades.json': text, ... }
  --------------------------------------------------------- */
  function loadFromFiles(files) {
    var loaded = [];

    if (files['wallet.json']) {
      var w = core.parseProfileFile(files['wallet.json']);
      if (w && w.data && w.data.currencies) {
        var c = w.data.currencies;
        if (c['1']) state.coins = c['1'].value;
        if (c['2']) state.keys = c['2'].value;
        if (c['3']) state.hoverboardCurrency = c['3'].value;
        if (c['4']) state.headstarts = c['4'].value;
        if (c['5']) state.scoreBoosters = c['5'].value;
        if (c['6']) state.eventCoins = c['6'].value;
        loaded.push('wallet.json');
      }
    }

    if (files['upgrades.json']) {
      var u = core.parseProfileFile(files['upgrades.json']);
      if (u && u.data && u.data.powerupLevels) {
        state.jetpack = u.data.powerupLevels.jetpack;
        state.superSneakers = u.data.powerupLevels.superSneakers;
        state.magnet = u.data.powerupLevels.magnet;
        state.doubleScore = u.data.powerupLevels.doubleScore;
        loaded.push('upgrades.json');
      }
    }

    if (files['characters_inventory.json']) {
      var ch = core.parseProfileFile(files['characters_inventory.json']);
      if (ch && ch.data) {
        state.ownedCharacters = Object.keys(ch.data.owned || {});
        if (ch.data.selected) state.selectedCharacter = ch.data.selected.character;
        state.ownedCharacters.forEach(function (id) {
          var outfits = ((ch.data.owned[id] || {}).value || {}).ownedOutfits || [];
          var ids = outfits.map(function (o) { return o.value; }).filter(Boolean);
          state.subSelections.ownedCharacters[id] = ids.length ? ids : ['default'];
        });
        loaded.push('characters_inventory.json');
      }
    }

    if (files['boards_inventory.json']) {
      var b = core.parseProfileFile(files['boards_inventory.json']);
      if (b && b.data) {
        state.ownedBoards = Object.keys(b.data.owned || {});
        state.selectedBoard = b.data.selected;
        state.ownedBoards.forEach(function (id) {
          var upgrades = ((b.data.owned[id] || {}).value || {}).ownedUpgrades || {};
          var ids = Object.keys(upgrades);
          state.subSelections.ownedBoards[id] = ids.length ? ids : ['default'];
        });
        loaded.push('boards_inventory.json');
      }
    }

    if (files['profile_frame.json']) {
      var fr = core.parseProfileFile(files['profile_frame.json']);
      if (fr && fr.data) {
        state.ownedFrames = Object.keys(fr.data.owned || {});
        state.selectedFrame = fr.data.selected || null;
        loaded.push('profile_frame.json');
      }
    }

    if (files['profile_portrait.json']) {
      var pt = core.parseProfileFile(files['profile_portrait.json']);
      if (pt && pt.data) {
        state.ownedPortraits = Object.keys(pt.data.owned || {});
        state.selectedPortrait = pt.data.selected || null;
        loaded.push('profile_portrait.json');
      }
    }

    if (files['profile_background.json']) {
      var bg = core.parseProfileFile(files['profile_background.json']);
      if (bg && bg.data) {
        state.ownedBackgrounds = Object.keys(bg.data.owned || {});
        state.selectedBackground = bg.data.selected || null;
        loaded.push('profile_background.json');
      }
    }

    if (files['badges.json']) {
      var bd = core.parseProfileFile(files['badges.json']);
      if (bd && bd.data && bd.data.userStatCollection) {
        var s = bd.data.userStatCollection;
        state.badgeChamp = s['102'] || 0;
        state.badgeDiamond = s['103'] || 0;
        state.badgeGold = s['104'] || 0;
        state.badgeSilver = s['105'] || 0;
        state.badgeBronze = s['106'] || 0;
        loaded.push('badges.json');
      }
    }

    return loaded;
  }

  /* ---------------------------------------------------------
     Build every output file from current state.
  --------------------------------------------------------- */
  function generateAll() {
    return {
      'wallet.json': core.buildWallet(state),
      'upgrades.json': core.buildUpgrades(state),
      'characters_inventory.json': core.buildCharacters(state),
      'boards_inventory.json': core.buildBoards(state),
      'profile_frame.json': core.buildFrames(state),
      'profile_portrait.json': core.buildPortraits(state),
      'profile_background.json': core.buildBackgrounds(state),
      'badges.json': core.buildBadges(state)
    };
  }

  return {
    getState: getState,
    getSubSelections: getSubSelections,
    toggleSubSelection: toggleSubSelection,
    setAllSubSelections: setAllSubSelections,
    maxInt: maxInt,
    setField: setField,
    toggleOwned: toggleOwned,
    ownAll: ownAll,
    ownNone: ownNone,
    loadFromFiles: loadFromFiles,
    generateAll: generateAll
  };
})(ptSSGCore, ptSSGData);
