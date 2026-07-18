/* ============================================================
   gtasa-ui-gangs.js — GTA SA Save Editor · Gang Weapons UI
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Renders the 10 gangs, each with 3 weapon dropdowns (reuses
   the same weapon ID list as the player Weapons tab).
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  let weaponOptionsCache = null;
  function weaponOptionsHtml(selected) {
    if (!weaponOptionsCache) {
      weaponOptionsCache = Object.keys(window.ptSAE_WEAPON_NAMES).map(Number).sort((a, b) => a - b);
    }
    return weaponOptionsCache.map((id) => {
      const sel = id === selected ? 'selected' : '';
      return '<option value="' + id + '" ' + sel + '>' + window.ptSAE_WEAPON_NAMES[id] + '</option>';
    }).join('');
  }

  function gangRowHtml(gangIdx, weapons) {
    const name = window.ptSAE_GANG_NAMES[gangIdx] || ('Gang ' + (gangIdx + 1));
    return (
      '<div class="sae-gang-row">' +
        '<span class="sae-gang-row__name">' + name + '</span>' +
        '<div class="sae-gang-row__weapons">' +
          ['weapon1', 'weapon2', 'weapon3'].map((slot) => (
            '<select class="sae-input sae-gang-row__weapon" data-gang="' + gangIdx + '" data-slot="' + slot + '">' +
              weaponOptionsHtml(weapons[slot]) +
            '</select>'
          )).join('') +
        '</div>' +
      '</div>'
    );
  }

  function renderGangs() {
    const container = $('sae-gangs-list');
    if (!container) return;
    if (!window.ptSAEGangs) return;

    let html = '';
    for (let g = 0; g < window.ptSAEGangs.GANG_COUNT; g++) {
      const weapons = window.ptSAEGangs.getWeapons(g);
      html += gangRowHtml(g, weapons);
    }
    container.innerHTML = html;

    container.querySelectorAll('select[data-gang]').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const g = parseInt(e.target.dataset.gang, 10);
        const slot = e.target.dataset.slot;
        window.ptSAEGangs.setWeapon(g, slot, parseInt(e.target.value, 10));
      });
    });
  }

  window.ptSAEGangsUI = { render: renderGangs };
})();
