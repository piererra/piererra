/* ============================================================
   gtasa-ui.js — GTA SA Save Editor · DOM Wiring
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   STATUS: v0.1 — wires the dropzone, info bar, General tab
   (Money / Counted Money / Cheat toggles), and download button.
   Additional tabs (Stats, Weapons, Garages, Gangs, Zones,
   Collectables) will get their own gtasa-ui-*.js files once
   their block logic exists — see gtasa-blocks.js roadmap.
============================================================ */

(function () {
  'use strict';

  const CHEAT_LABELS = {
    infiniteRun: 'Infinite Sprint',
    fastReload:  'Fast Reload',
    fireproof:   'Fireproof',
    maxHealth:   'Max Health Always',
    maxArmour:   'Max Armour Always',
    freeBusted:  'Free "Busted" Pass',
    freeWasted:  'Free "Wasted" Pass',
    driveby:     'Full Drive-by Aim'
  };

  function $(id) { return document.getElementById(id); }

  function toast(msg, kind) {
    const t = $('sae-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'sae-toast sae-toast--show sae-toast--' + (kind || 'info');
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => { t.className = 'sae-toast'; }, 2800);
  }

  function renderCheatGrid() {
    const grid = $('sae-cheat-grid');
    if (!grid) return;
    grid.innerHTML = window.ptSAEGeneral.CHEAT_KEYS.map((key) => {
      const on = window.ptSAEGeneral.getCheat(key);
      return (
        '<label class="sae-cheat">' +
          '<input type="checkbox" data-cheat="' + key + '" ' + (on ? 'checked' : '') + ' />' +
          '<span class="sae-cheat__mark"></span>' +
          '<span class="sae-cheat__label">' + CHEAT_LABELS[key] + '</span>' +
        '</label>'
      );
    }).join('');

    grid.querySelectorAll('input[data-cheat]').forEach((input) => {
      input.addEventListener('change', (e) => {
        window.ptSAEGeneral.setCheat(e.target.dataset.cheat, e.target.checked);
        toast(CHEAT_LABELS[e.target.dataset.cheat] + (e.target.checked ? ' enabled' : ' disabled'), 'ok');
      });
    });
  }

  function renderGeneral() {
    $('sae-money').value = window.ptSAEGeneral.getMoney();
    $('sae-counted-money').value = window.ptSAEGeneral.getCountedMoney();
    renderCheatGrid();
    if (window.ptSAEStatsUI) window.ptSAEStatsUI.render();
    if (window.ptSAEWeaponsUI) window.ptSAEWeaponsUI.render();
    if (window.ptSAEGaragesUI) window.ptSAEGaragesUI.render();
    if (window.ptSAEGangsUI) window.ptSAEGangsUI.render();
    if (window.ptSAEZonesUI) window.ptSAEZonesUI.render();
    if (window.ptSAETagsUI) window.ptSAETagsUI.render();
    if (window.ptSAEJumpsUI) window.ptSAEJumpsUI.render();
    if (window.ptSAECollectablesProgressUI) window.ptSAECollectablesProgressUI.render();
    if (window.ptSAECollectableLocationsUI) window.ptSAECollectableLocationsUI.render();
    $('sae-editor-body').hidden = false;
  }

  function setLoading(isLoading) {
    const zone = $('sae-dropzone');
    if (zone) zone.classList.toggle('sae-dropzone--loading', isLoading);
  }

  function showLoadedBar(filename) {
    const dropzone = $('sae-dropzone');
    const hint = $('sae-save-location-hint');
    const bar = $('sae-loaded-bar');
    if (dropzone) dropzone.hidden = true;
    if (hint) hint.hidden = true;
    if (bar) bar.hidden = false;
    if ($('sae-loaded-filename')) $('sae-loaded-filename').textContent = filename;
  }

  function wireChangeFile() {
    const btn = $('sae-btn-change-file');
    if (!btn) return;
    btn.addEventListener('click', () => {
      $('sae-dropzone').hidden = false;
      $('sae-save-location-hint').hidden = false;
      $('sae-loaded-bar').hidden = true;
      $('sae-file-input').value = '';
    });
  }

  function handleFile(file) {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        window.ptSAE.loadFile(e.target.result, file.name);
        if (window.ptSAEZones) window.ptSAEZones.reset();
        if (window.ptSAEGarages) window.ptSAEGarages.resetNames();
        renderGeneral();
        showLoadedBar(file.name);
        toast('Save loaded — ' + file.name, 'ok');
      } catch (err) {
        if (err.message === 'sae.err.bad_size') {
          toast('Not a valid PC GTA SA save (unexpected file size).', 'err');
        } else if (err.message === 'sae.err.tags_not_found') {
          toast('Could not find save blocks — file may be corrupted.', 'err');
        } else {
          toast('Could not read this file.', 'err');
        }
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = function () {
      setLoading(false);
      toast('Could not read this file.', 'err');
    };
    reader.readAsArrayBuffer(file);
  }

  function wireDropzone() {
    const zone = $('sae-dropzone');
    const input = $('sae-file-input');
    if (!zone || !input) return;

    zone.addEventListener('click', (e) => {
      if (e.target === input) return;
      input.click();
    });
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') input.click();
    });
    input.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    ['dragover', 'dragleave', 'drop'].forEach((evt) => {
      zone.addEventListener(evt, (e) => e.preventDefault());
    });
    zone.addEventListener('dragover', () => zone.classList.add('sae-dropzone--over'));
    zone.addEventListener('dragleave', () => zone.classList.remove('sae-dropzone--over'));
    zone.addEventListener('drop', (e) => {
      zone.classList.remove('sae-dropzone--over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
  }

  function wireFields() {
    $('sae-money').addEventListener('blur', (e) => {
      const v = Math.max(0, Math.min(window.ptSAEGeneral.MAX_MONEY, parseInt(e.target.value, 10) || 0));
      e.target.value = v;
      window.ptSAEGeneral.setMoney(v);
    });
    $('sae-counted-money').addEventListener('blur', (e) => {
      const v = Math.max(0, Math.min(window.ptSAEGeneral.MAX_MONEY, parseInt(e.target.value, 10) || 0));
      e.target.value = v;
      window.ptSAEGeneral.setCountedMoney(v);
    });
    $('sae-max-money').addEventListener('click', () => {
      $('sae-money').value = window.ptSAEGeneral.MAX_MONEY;
      window.ptSAEGeneral.setMoney(window.ptSAEGeneral.MAX_MONEY);
      toast('Money set to max', 'ok');
    });
  }

  function wireActions() {
    $('sae-btn-download').addEventListener('click', () => {
      window.ptSAE.download();
      toast('Save downloaded', 'ok');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireDropzone();
    wireChangeFile();
    wireFields();
    wireActions();
    if (window.ptI18n) window.ptI18n.init();
  });
})();
