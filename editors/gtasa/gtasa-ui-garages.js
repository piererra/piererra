/* ============================================================
   gtasa-ui-garages.js — GTA SA Save Editor · Garages UI
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Renders 20 collapsible garages, each with 4 car slots (model
   dropdown + primary/secondary color inputs). Kept in its own
   file, same pattern as gtasa-ui-stats.js / gtasa-ui-weapons.js.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  let vehicleOptionsCache = null;
  function vehicleOptionsHtml(selectedModel) {
    if (!vehicleOptionsCache) {
      const ids = Object.keys(window.ptSAE_VEHICLE_NAMES).map(Number).sort((a, b) =>
        window.ptSAE_VEHICLE_NAMES[a].localeCompare(window.ptSAE_VEHICLE_NAMES[b]));
      vehicleOptionsCache = ids;
    }
    let html = '<option value="0">— Empty —</option>';
    html += vehicleOptionsCache.map((id) => {
      const sel = id === selectedModel ? 'selected' : '';
      return '<option value="' + id + '" ' + sel + '>' + window.ptSAE_VEHICLE_NAMES[id] + '</option>';
    }).join('');
    return html;
  }

  function carRowHtml(garageIdx, slot, car) {
    return (
      '<div class="sae-car-row">' +
        '<div class="sae-car-field sae-car-field--model">' +
          '<label class="sae-micro-label">Vehicle</label>' +
          '<select class="sae-input sae-car-row__model" data-garage="' + garageIdx + '" data-slot="' + slot + '">' +
            vehicleOptionsHtml(car.model) +
          '</select>' +
        '</div>' +
        '<div class="sae-car-field">' +
          '<label class="sae-micro-label">Primary Color</label>' +
          '<input type="number" class="sae-input sae-car-row__color" min="0" max="255" value="' + car.colorPrimary + '" ' +
            'data-garage="' + garageIdx + '" data-slot="' + slot + '" data-field="colorPrimary" title="Primary color (0-255)" />' +
        '</div>' +
        '<div class="sae-car-field">' +
          '<label class="sae-micro-label">Secondary Color</label>' +
          '<input type="number" class="sae-input sae-car-row__color" min="0" max="255" value="' + car.colorSecondary + '" ' +
            'data-garage="' + garageIdx + '" data-slot="' + slot + '" data-field="colorSecondary" title="Secondary color (0-255)" />' +
        '</div>' +
      '</div>'
    );
  }

  function renderGarages() {
    const container = $('sae-garages-list');
    if (!container) return;
    container.innerHTML = '';

    for (let g = 0; g < window.ptSAEGarages.GARAGE_COUNT; g++) {
      const details = document.createElement('details');
      details.className = 'sae-garage';
      const summary = document.createElement('summary');
      summary.className = 'sae-garage__summary';
      summary.textContent = window.ptSAEGarages.getDisplayName(g);
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'sae-garage__body';
      for (let s = 0; s < window.ptSAEGarages.SLOTS_PER_GARAGE; s++) {
        const car = window.ptSAEGarages.getCar(g, s);
        body.insertAdjacentHTML('beforeend', carRowHtml(g, s, car));
      }
      details.appendChild(body);
      container.appendChild(details);
    }

    container.querySelectorAll('select[data-garage]').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const g = parseInt(e.target.dataset.garage, 10);
        const s = parseInt(e.target.dataset.slot, 10);
        window.ptSAEGarages.setField(g, s, 'model', parseInt(e.target.value, 10));
      });
    });
    container.querySelectorAll('input[data-field]').forEach((input) => {
      input.addEventListener('blur', (e) => {
        const g = parseInt(e.target.dataset.garage, 10);
        const s = parseInt(e.target.dataset.slot, 10);
        const field = e.target.dataset.field;
        const val = Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0));
        e.target.value = val;
        window.ptSAEGarages.setField(g, s, field, val);
      });
    });
  }

  window.ptSAEGaragesUI = { render: renderGarages };
})();
