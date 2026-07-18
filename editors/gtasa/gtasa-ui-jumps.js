/* ============================================================
   gtasa-ui-jumps.js — GTA SA Save Editor · Unique Jumps UI
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Renders all 70 Unique Stunt Jumps as rows with Found / Done
   toggles and an editable cash reward. Jumps aren't named in the
   save data, so they're numbered 1-70 in stored order plus their
   in-game camera coordinates as a locating hint.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function jumpRowHtml(jump) {
    const cam = jump.camera.map((v) => v.toFixed(0)).join(', ');
    return (
      '<div class="sae-jump-row">' +
        '<span class="sae-jump-row__name">Jump #' + (jump.index + 1) + '</span>' +
        '<span class="sae-jump-row__coords" title="Camera coordinates">' + cam + '</span>' +
        '<label class="sae-jump-row__toggle">' +
          '<input type="checkbox" data-jump-index="' + jump.index + '" data-field="found" ' + (jump.found ? 'checked' : '') + ' /> Found' +
        '</label>' +
        '<label class="sae-jump-row__toggle">' +
          '<input type="checkbox" data-jump-index="' + jump.index + '" data-field="done" ' + (jump.done ? 'checked' : '') + ' /> Done' +
        '</label>' +
        '<div class="sae-jump-field">' +
          '<label class="sae-micro-label">Cash Reward</label>' +
          '<input type="number" class="sae-input sae-jump-row__reward" value="' + jump.reward + '" ' +
            'min="' + window.ptSAEJumps.REWARD_MIN + '" max="' + window.ptSAEJumps.REWARD_MAX + '" ' +
            'data-jump-index="' + jump.index + '" data-field="reward" title="Cash reward" />' +
        '</div>' +
      '</div>'
    );
  }

  function renderJumps() {
    const container = $('sae-jumps-list');
    if (!container || !window.ptSAEJumps) return;

    const jumps = window.ptSAEJumps.list();
    const doneCount = jumps.filter((j) => j.done).length;

    const countEl = $('sae-jumps-count');
    if (countEl) countEl.textContent = doneCount + ' / ' + jumps.length + ' done';

    container.innerHTML = jumps.map(jumpRowHtml).join('');

    container.querySelectorAll('input[data-jump-index]').forEach((input) => {
      const idx = parseInt(input.dataset.jumpIndex, 10);
      const field = input.dataset.field;
      const evt = input.type === 'checkbox' ? 'change' : 'blur';
      input.addEventListener(evt, () => {
        if (field === 'found') window.ptSAEJumps.setFound(idx, input.checked);
        else if (field === 'done') window.ptSAEJumps.setDone(idx, input.checked);
        else if (field === 'reward') {
          const raw = parseInt(input.value, 10) || 0;
          const val = Math.max(window.ptSAEJumps.REWARD_MIN, Math.min(window.ptSAEJumps.REWARD_MAX, raw));
          input.value = val;
          window.ptSAEJumps.setReward(idx, val);
        }
        if (field === 'done') renderJumps(); // done implies found — refresh checkbox state
        else {
          const countEl2 = $('sae-jumps-count');
          if (countEl2) countEl2.textContent = jumps.filter((j) => j.done).length + ' / ' + jumps.length + ' done';
        }
      });
    });
  }

  function wireJumpsTab() {
    const allFoundDone = $('sae-jumps-all-done');
    const clearAll = $('sae-jumps-clear-all');
    if (allFoundDone) allFoundDone.addEventListener('click', () => { window.ptSAEJumps.setAllFoundDone(true); renderJumps(); });
    if (clearAll) clearAll.addEventListener('click', () => { window.ptSAEJumps.setAllFoundDone(false); renderJumps(); });
  }

  window.ptSAEJumpsUI = {
    render: renderJumps
  };

  document.addEventListener('DOMContentLoaded', wireJumpsTab);
})();
