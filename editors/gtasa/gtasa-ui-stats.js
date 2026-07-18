/* ============================================================
   gtasa-ui-stats.js — GTA SA Save Editor · Stats & Skills UI
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Renders the Skills sliders (weapon + movement skills, 0-1000)
   and a searchable browser for every other known stat.
   Kept in its own file (separate from gtasa-ui.js) so no single
   UI file grows past a few hundred lines.
============================================================ */

(function () {
  'use strict';

  const SKILL_LABELS = {
    69: 'Pistol', 70: 'Silenced Pistol', 71: 'Desert Eagle', 72: 'Shotgun',
    73: 'Sawn-Off Shotgun', 74: 'Combat Shotgun', 75: 'Machine Pistol', 76: 'SMG',
    77: 'AK-47', 78: 'M4', 79: 'Rifle'
  };

  function $(id) { return document.getElementById(id); }

  function renderSkills() {
    const grid = $('sae-skills-grid');
    if (!grid) return;
    grid.innerHTML = window.ptSAE_SKILL_IDS.map((id) => {
      const val = Math.round(window.ptSAEStats.getStat(id));
      return (
        '<div class="sae-skill">' +
          '<label class="sae-skill__label">' + SKILL_LABELS[id] + '</label>' +
          '<div class="sae-skill__row">' +
            '<input type="range" min="0" max="1000" value="' + val + '" data-skill="' + id + '" />' +
            '<span class="sae-skill__val" data-skill-val="' + id + '">' + val + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    grid.querySelectorAll('input[data-skill]').forEach((input) => {
      input.addEventListener('input', (e) => {
        const id = parseInt(e.target.dataset.skill, 10);
        const val = parseInt(e.target.value, 10);
        window.ptSAEStats.setStat(id, val);
        const label = grid.querySelector('[data-skill-val="' + id + '"]');
        if (label) label.textContent = val;
      });
    });
  }

  function maxAllSkills() {
    window.ptSAE_SKILL_IDS.forEach((id) => window.ptSAEStats.setStat(id, window.ptSAEStats.SKILL_MAX));
    renderSkills();
  }

  /* ── STAT BROWSER — searchable list of every known stat ──── */
  let statCache = null;

  function renderStatBrowser(filter) {
    const container = $('sae-stat-browser');
    if (!container) return;
    if (!statCache) statCache = window.ptSAEStats.listKnownStats();

    const q = (filter || '').trim().toLowerCase();
    const rows = statCache.filter((s) => !q || s.label.toLowerCase().includes(q));

    container.innerHTML = rows.map((s) => {
      const val = window.ptSAEStats.getStat(s.id);
      const display = s.type === 'float' ? Math.round(val * 100) / 100 : val;
      const min = s.type === 'float' ? window.ptSAEStats.STAT_FLOAT_MIN : window.ptSAEStats.STAT_INT_MIN;
      const max = s.type === 'float' ? window.ptSAEStats.STAT_FLOAT_MAX : window.ptSAEStats.STAT_INT_MAX;
      return (
        '<div class="sae-stat-row">' +
          '<span class="sae-stat-row__label">' + s.label + '</span>' +
          '<input type="number" class="sae-stat-row__input" data-stat-id="' + s.id + '" data-stat-type="' + s.type + '" ' +
            'min="' + min + '" max="' + max + '" value="' + display + '" />' +
        '</div>'
      );
    }).join('') || '<p class="sae-stat-row__empty">No stats match your search.</p>';

    container.querySelectorAll('input[data-stat-id]').forEach((input) => {
      input.addEventListener('blur', (e) => {
        const id = parseInt(e.target.dataset.statId, 10);
        const type = e.target.dataset.statType;
        const min = type === 'float' ? window.ptSAEStats.STAT_FLOAT_MIN : window.ptSAEStats.STAT_INT_MIN;
        const max = type === 'float' ? window.ptSAEStats.STAT_FLOAT_MAX : window.ptSAEStats.STAT_INT_MAX;
        const raw = type === 'float' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value, 10) || 0;
        const val = Math.max(min, Math.min(max, raw));
        e.target.value = val;
        window.ptSAEStats.setStat(id, val);
      });
    });
  }

  function wireStatsTab() {
    const maxBtn = $('sae-skills-max-all');
    if (maxBtn) maxBtn.addEventListener('click', maxAllSkills);

    const search = $('sae-stat-search');
    if (search) search.addEventListener('input', (e) => renderStatBrowser(e.target.value));
  }

  /* Called by gtasa-ui.js once a file is loaded */
  window.ptSAEStatsUI = {
    render: function () {
      renderSkills();
      renderStatBrowser('');
    }
  };

  document.addEventListener('DOMContentLoaded', wireStatsTab);
})();
