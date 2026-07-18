/* ============================================================
   gtasa-ui-collectables-progress.js — GTA SA Save Editor
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Progress panel for the 5 collectable categories. Tags and
   Unique Jumps use their own verified blocks (20 and 24). For
   Snapshots, Horseshoes and Oysters there's no safe per-location
   edit here — see note below — so this panel exposes their
   collected/total counts via Block 16's stat IDs instead
   (231/232, 241/242, 243/244), which is the same data the game's
   own stats menu reads and is confirmed safe to edit.

   Why no per-location toggles for these three: unlike Tags/Jumps,
   they aren't stored as a clean fixed-format block. Real-save
   analysis found their world pickups live in Block 6's generic
   Pickup pool, but on a completed save those pickup slots get
   silently reused for ordinary ammo/health drops once collected
   — so a location list built from live pickup data goes stale
   and can't be trusted. The actual "collected" flag per item
   almost certainly lives as an individual bit inside Block 1's
   raw SCM global-variable memory (confirmed by the save format
   docs — Block 1 is literally the script's live variable space),
   which has no public documented offset table and is genuinely
   riskier to hand-edit since running mission threads read it
   directly. Editing the wrong word there risks breaking the
   save's script state, not just a stat. Rather than guess, this
   ships only the verified-safe total/count editing.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  const CATEGORIES = [
    { key: 'tags', label: 'Tags', source: 'block' },
    // maxTotal: the real in-game total for these three categories
    // is always 50 (verified against a 100%-complete real save) —
    // "total" is only editable at all in case a modded/edited save
    // has drifted from that, so it's capped just above the real
    // value rather than left open-ended.
    { key: 'snapshots', label: 'Snapshots', doneId: 231, totalId: 232, maxTotal: 50 },
    { key: 'horseshoes', label: 'Horseshoes', doneId: 241, totalId: 242, maxTotal: 50 },
    { key: 'oysters', label: 'Oysters', doneId: 243, totalId: 244, maxTotal: 50 },
    { key: 'jumps', label: 'Unique Jumps', source: 'block' }
  ];

  function rowHtml(cat, done, total) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const editable = cat.source !== 'block';
    return (
      '<div class="sae-progress-row">' +
        '<div class="sae-progress-row__head">' +
          '<span class="sae-progress-row__label">' + cat.label + '</span>' +
          '<span class="sae-progress-row__count">' +
            (editable
              ? '<span class="sae-progress-field"><label class="sae-micro-label">Collected</label>' +
                  '<input type="number" class="sae-input sae-progress-row__input" min="0" max="' + total + '" value="' + done + '" data-cat="' + cat.key + '" data-field="done" /></span>' +
                ' / ' +
                '<span class="sae-progress-field"><label class="sae-micro-label">Total</label>' +
                  '<input type="number" class="sae-input sae-progress-row__input" min="0" max="' + cat.maxTotal + '" value="' + total + '" data-cat="' + cat.key + '" data-field="total" /></span>'
              : done + ' / ' + total) +
          '</span>' +
        '</div>' +
        '<div class="sae-progress-bar"><div class="sae-progress-bar__fill" style="width:' + pct + '%"></div></div>' +
      '</div>'
    );
  }

  function renderProgress() {
    const container = $('sae-collectables-progress');
    if (!container) return;

    const tags = window.ptSAETags ? window.ptSAETags.list() : [];
    const jumps = window.ptSAEJumps ? window.ptSAEJumps.list() : [];

    let html = '';
    CATEGORIES.forEach((cat) => {
      let done, total;
      if (cat.key === 'tags') { done = tags.filter((t) => t.sprayed).length; total = tags.length || 100; }
      else if (cat.key === 'jumps') { done = jumps.filter((j) => j.done).length; total = jumps.length || 70; }
      else {
        done = (window.ptSAEStats && window.ptSAEStats.getStat(cat.doneId)) || 0;
        total = (window.ptSAEStats && window.ptSAEStats.getStat(cat.totalId)) || 50;
      }
      html += rowHtml(cat, done, total);
    });
    container.innerHTML = html;

    container.querySelectorAll('input[data-cat]').forEach((input) => {
      input.addEventListener('blur', (e) => {
        const cat = CATEGORIES.find((c) => c.key === e.target.dataset.cat);
        if (!cat || cat.source === 'block') return;
        const field = e.target.dataset.field;
        const currentTotal = (window.ptSAEStats && window.ptSAEStats.getStat(cat.totalId)) || cat.maxTotal;
        const max = field === 'total' ? cat.maxTotal : currentTotal;
        const id = field === 'done' ? cat.doneId : cat.totalId;
        const val = Math.max(0, Math.min(max, parseInt(e.target.value, 10) || 0));
        window.ptSAEStats.setStat(id, val);
        renderProgress();
      });
    });
  }

  window.ptSAECollectablesProgressUI = {
    render: renderProgress
  };
})();
