/* ============================================================
   gtasa-ui-tags.js — GTA SA Save Editor · Tags UI
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Renders all 100 tags as a compact toggle grid (sprayed / not
   sprayed) plus a "spray all" / "clear all" shortcut, since tags
   have no individual names in the save data — only a sprayed
   value per index.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function tagCellHtml(tag) {
    return (
      '<button type="button" class="sae-tag-cell' + (tag.sprayed ? ' sae-tag-cell--on' : '') + '" ' +
        'data-tag-index="' + tag.index + '" title="Tag #' + (tag.index + 1) + (tag.sprayed ? ' — sprayed' : ' — not sprayed') + '">' +
        (tag.index + 1) +
      '</button>'
    );
  }

  function renderTags() {
    const container = $('sae-tags-grid');
    if (!container || !window.ptSAETags) return;

    const tags = window.ptSAETags.list();
    const sprayedCount = tags.filter((t) => t.sprayed).length;

    const countEl = $('sae-tags-count');
    if (countEl) countEl.textContent = sprayedCount + ' / ' + tags.length + ' sprayed';

    container.innerHTML = tags.map(tagCellHtml).join('');

    container.querySelectorAll('button[data-tag-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.tagIndex, 10);
        const current = window.ptSAETags.get(idx);
        window.ptSAETags.set(idx, !current.sprayed);
        renderTags();
      });
    });
  }

  function wireTagsTab() {
    const sprayAll = $('sae-tags-spray-all');
    const clearAll = $('sae-tags-clear-all');
    if (sprayAll) sprayAll.addEventListener('click', () => { window.ptSAETags.setAll(true); renderTags(); });
    if (clearAll) clearAll.addEventListener('click', () => { window.ptSAETags.setAll(false); renderTags(); });
  }

  window.ptSAETagsUI = {
    render: renderTags
  };

  document.addEventListener('DOMContentLoaded', wireTagsTab);
})();
