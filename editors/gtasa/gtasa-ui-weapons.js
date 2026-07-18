/* ============================================================
   gtasa-ui-weapons.js — GTA SA Save Editor · Weapons UI
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Renders 13 weapon slot rows: a dropdown of weapon names
   (grouped loosely by category via the option order) plus an
   ammo input. Kept in its own file alongside gtasa-ui-stats.js
   so no UI file grows too large.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function weaponOptionsHtml(selectedType) {
    return Object.keys(window.ptSAE_WEAPON_NAMES).map((idStr) => {
      const id = parseInt(idStr, 10);
      const selected = id === selectedType ? 'selected' : '';
      return '<option value="' + id + '" ' + selected + '>' + window.ptSAE_WEAPON_NAMES[id] + '</option>';
    }).join('');
  }

  function renderWeapons() {
    const container = $('sae-weapons-list');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < window.ptSAEWeapons.SLOT_COUNT; i++) {
      const slot = window.ptSAEWeapons.getSlot(i);
      const row = document.createElement('div');
      row.className = 'sae-weapon-row';
      row.innerHTML =
        '<label class="sae-weapon-row__label">' + window.ptSAE_WEAPON_SLOT_LABELS[i] + '</label>' +
        '<div class="sae-weapon-row__controls">' +
          '<select class="sae-input sae-weapon-row__select" data-slot="' + i + '">' +
            weaponOptionsHtml(slot.type) +
          '</select>' +
          '<input type="number" class="sae-input sae-weapon-row__ammo" data-slot-ammo="' + i + '" ' +
            'min="0" max="99999" value="' + slot.ammo + '" />' +
        '</div>';
      container.appendChild(row);
    }

    container.querySelectorAll('select[data-slot]').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const i = parseInt(e.target.dataset.slot, 10);
        window.ptSAEWeapons.setType(i, parseInt(e.target.value, 10));
      });
    });
    container.querySelectorAll('input[data-slot-ammo]').forEach((input) => {
      input.addEventListener('blur', (e) => {
        const i = parseInt(e.target.dataset.slotAmmo, 10);
        const val = Math.max(0, Math.min(window.ptSAEWeapons.MAX_AMMO, parseInt(e.target.value, 10) || 0));
        e.target.value = val;
        window.ptSAEWeapons.setAmmo(i, val);
      });
    });
  }

  function maxAllAmmo() {
    for (let i = 0; i < window.ptSAEWeapons.SLOT_COUNT; i++) {
      window.ptSAEWeapons.setAmmo(i, window.ptSAEWeapons.MAX_AMMO);
    }
    renderWeapons();
  }

  function wireWeaponsTab() {
    const btn = $('sae-weapons-max-ammo');
    if (btn) btn.addEventListener('click', maxAllAmmo);
  }

  window.ptSAEWeaponsUI = { render: renderWeapons };

  document.addEventListener('DOMContentLoaded', wireWeaponsTab);
})();
