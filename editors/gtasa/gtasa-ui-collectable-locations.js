/* ============================================================
   gtasa-ui-collectable-locations.js — GTA SA Save Editor
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Full per-item editor for Horseshoes / Oysters / Snapshots.
   Coordinates come from gtasa-collectable-locations-data.js
   (extracted from a real main.scm). Collected state and writes
   go through gtasa-collectables-pickups.js, verified against a
   real 0%-complete save and a real 100%-complete save (see the
   PICKUPS block notes in gtasa-blocks.js).

   Each entry is labelled with the zone it falls inside, computed
   from the currently loaded save's own Block 10 zone boundaries.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  let cachedZones = null;

  function buildZoneBoundsCache() {
    const block = window.ptSAE.getBlock(ptSAE_BLOCKS.ZONES.index);
    if (!block) return [];
    const cfg = ptSAE_BLOCKS.ZONES;
    const view = window.ptSAE.state.view;
    const bytes = window.ptSAE.state.bytes;
    const n1 = view.getUint16(block.dataOffset + cfg.header.zoneInfo1CountOffset, true);
    const arraysStart = block.dataOffset + cfg.header.arraysStart;
    const decode = (off, len) => {
      let s = '';
      for (let i = 0; i < len; i++) {
        const c = bytes[off + i];
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s;
    };
    const list = [];
    for (let i = 0; i < n1; i++) {
      const off = arraysStart + i * cfg.zoneInfoSize;
      const gxt = decode(off + cfg.zoneInfoFields.gxt.offset, cfg.zoneInfoFields.gxt.length);
      if (!gxt) continue;
      const x1 = view.getInt16(off + cfg.zoneInfoFields.x1.offset, true);
      const y1 = view.getInt16(off + cfg.zoneInfoFields.y1.offset, true);
      const x2 = view.getInt16(off + cfg.zoneInfoFields.x2.offset, true);
      const y2 = view.getInt16(off + cfg.zoneInfoFields.y2.offset, true);
      list.push({ gxt, minX: Math.min(x1, x2), maxX: Math.max(x1, x2), minY: Math.min(y1, y2), maxY: Math.max(y1, y2) });
    }
    return list;
  }

  function zoneForPoint(x, y) {
    if (!window.ptSAE || !window.ptSAE.getBlock) return '';
    if (!cachedZones) cachedZones = buildZoneBoundsCache();
    // smallest matching bounding box wins (nested zones -> most specific)
    let best = null, bestArea = Infinity;
    for (const z of cachedZones) {
      if (x >= z.minX && x <= z.maxX && y >= z.minY && y <= z.maxY) {
        const area = (z.maxX - z.minX) * (z.maxY - z.minY);
        if (area < bestArea) { bestArea = area; best = z; }
      }
    }
    return best ? best.gxt : '';
  }

  function rowHtml(item, category, catKey) {
    const zone = zoneForPoint(item.x, item.y);
    const collected = window.ptSAECollectablePickups.isCollected(catKey, item.x, item.y, item.z);
    return (
      '<label class="sae-loc-row' + (collected ? ' sae-loc-row--collected' : '') + '">' +
        '<input type="checkbox" class="sae-loc-row__check" data-cat="' + catKey + '" ' +
          'data-x="' + item.x + '" data-y="' + item.y + '" data-z="' + item.z + '" ' +
          (collected ? 'checked' : '') + ' />' +
        '<span class="sae-loc-row__index">' + category + ' #' + item.i + '</span>' +
        '<span class="sae-loc-row__coords">' + item.x + ', ' + item.y + ', ' + item.z + '</span>' +
        (zone ? '<span class="sae-loc-row__zone">' + zone + '</span>' : '') +
      '</label>'
    );
  }

  function renderGroup(containerId, list, label, catKey) {
    const container = $(containerId);
    if (!container) return;
    container.innerHTML = list.map((item) => rowHtml(item, label, catKey)).join('');
    container.querySelectorAll('input[data-cat]').forEach((input) => {
      input.addEventListener('change', () => {
        const cat = input.dataset.cat;
        const x = parseFloat(input.dataset.x);
        const y = parseFloat(input.dataset.y);
        const z = parseFloat(input.dataset.z);
        window.ptSAECollectablePickups.setCollected(cat, x, y, z, input.checked);
        input.closest('.sae-loc-row').classList.toggle('sae-loc-row--collected', input.checked);
        updateGroupCount(catKey);
      });
    });
  }

  function updateGroupCount(catKey) {
    const data = window.ptSAE_COLLECTABLE_LOCATIONS[catKey];
    const done = data.filter((item) => window.ptSAECollectablePickups.isCollected(catKey, item.x, item.y, item.z)).length;
    const el = $('sae-loc-count-' + catKey);
    if (el) el.textContent = done + ' / ' + data.length + ' collected';
  }

  function renderLocations() {
    const data = window.ptSAE_COLLECTABLE_LOCATIONS;
    if (!data || !window.ptSAECollectablePickups) return;
    cachedZones = null; // rebuild against whichever save is currently loaded
    renderGroup('sae-loc-horseshoes', data.horseshoes, 'Horseshoe', 'horseshoes');
    renderGroup('sae-loc-oysters', data.oysters, 'Oyster', 'oysters');
    renderGroup('sae-loc-snapshots', data.snapshots, 'Snapshot', 'snapshots');
    updateGroupCount('horseshoes');
    updateGroupCount('oysters');
    updateGroupCount('snapshots');
  }

  window.ptSAECollectableLocationsUI = {
    render: renderLocations
  };
})();
