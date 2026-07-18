/* ============================================================
   gtasa-ui-zones.js — GTA SA Save Editor · Zone Gang Density UI
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Renders a searchable, scrollable list of all named map zones
   with per-gang density sliders + dealer density. Real in-game
   names (e.g. "Ganton") are shown instead of raw save codes
   (e.g. "GAN1") — see gtasa-zones-names-data.js. Every zone is
   listed by default so a visitor can just scroll and browse
   without needing to already know GTA SA place names; the
   search box is there for anyone who does know the map and
   wants to jump straight to a zone.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function zoneRowHtml(zone, pop) {
    const gangInputs = pop.density.map((val, g) => (
      '<div class="sae-zone-gang">' +
        '<label>' + (window.ptSAE_GANG_NAMES[g] || ('Gang ' + (g + 1))) + '</label>' +
        '<input type="number" class="sae-input sae-zone-gang__input" min="0" max="255" value="' + val + '" ' +
          'data-zone-id="' + zone.id + '" data-gang="' + g + '" />' +
      '</div>'
    )).join('');

    return (
      '<details class="sae-zone">' +
        '<summary class="sae-zone__summary">' +
          '<span>' + zone.name + ' <span class="sae-zone__code">' + zone.code + '</span></span>' +
          '<span class="sae-zone__hint">' + (pop.dealer ? 'dealer' : '') + '</span>' +
        '</summary>' +
        '<div class="sae-zone__body">' +
          '<div class="sae-zone-gang">' +
            '<label>Drug Dealer Density</label>' +
            '<input type="number" class="sae-input sae-zone-gang__input" min="0" max="255" value="' + pop.dealer + '" ' +
              'data-zone-id="' + zone.id + '" data-dealer="1" />' +
          '</div>' +
          gangInputs +
        '</div>' +
      '</details>'
    );
  }

  function renderZones(filter) {
    const container = $('sae-zones-list');
    if (!container) return;
    if (!window.ptSAEZones) return;

    const zones = window.ptSAEZones.list();
    const q = (filter || '').trim().toLowerCase();

    // Every zone shows by default — scrolling is the main way to
    // browse; search (by real name) is a shortcut for anyone who
    // already knows where they're looking for.
    const rows = q ? zones.filter((z) => z.name.toLowerCase().includes(q)) : zones;

    if (!rows.length) {
      container.innerHTML = '<p class="sae-stat-row__empty">No zones match your search.</p>';
      return;
    }

    container.innerHTML = rows.map((z) => zoneRowHtml(z, window.ptSAEZones.getPop(z.id))).join('');

    container.querySelectorAll('input[data-zone-id]').forEach((input) => {
      input.addEventListener('blur', (e) => {
        const zoneId = parseInt(e.target.dataset.zoneId, 10);
        const val = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
        e.target.value = val;
        if (e.target.dataset.dealer) {
          window.ptSAEZones.setDealerDensity(zoneId, val);
        } else {
          const gangIdx = parseInt(e.target.dataset.gang, 10);
          window.ptSAEZones.setGangDensity(zoneId, gangIdx, val);
        }
      });
    });
  }

  function wireZonesTab() {
    const search = $('sae-zone-search');
    if (search) search.addEventListener('input', (e) => renderZones(e.target.value));
  }

  window.ptSAEZonesUI = {
    render: function () { renderZones(''); }
  };

  document.addEventListener('DOMContentLoaded', wireZonesTab);
})();
