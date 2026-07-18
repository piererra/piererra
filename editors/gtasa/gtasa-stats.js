/* ============================================================
   gtasa-stats.js — GTA SA Save Editor · Stats & Skills
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Generic read/write for Block 16's two stat arrays:
     · Float stats — IDs 0-81
     · Int stats   — IDs 120-342
   Any stat ID can be read/written; gtasa-stats-data.js supplies
   the human-readable labels used by the UI.
============================================================ */

'use strict';

function saeStatsBlock() {
  return window.ptSAE.getBlock(ptSAE_BLOCKS.STATS.index);
}

function saeGetFloatStat(id) {
  const block = saeStatsBlock();
  if (!block) return null;
  const cfg = ptSAE_BLOCKS.STATS.floatStats;
  if (id < cfg.startId || id >= cfg.startId + cfg.count) return null;
  const off = block.dataOffset + cfg.offset + id * 4;
  return window.ptSAE.state.view.getFloat32(off, true);
}

function saeSetFloatStat(id, value) {
  const block = saeStatsBlock();
  if (!block) return;
  const cfg = ptSAE_BLOCKS.STATS.floatStats;
  if (id < cfg.startId || id >= cfg.startId + cfg.count) return;
  const off = block.dataOffset + cfg.offset + id * 4;
  window.ptSAE.state.view.setFloat32(off, value, true);
}

function saeGetIntStat(id) {
  const block = saeStatsBlock();
  if (!block) return null;
  const cfg = ptSAE_BLOCKS.STATS.intStats;
  if (id < cfg.startId || id >= cfg.startId + cfg.count) return null;
  const off = block.dataOffset + cfg.offset + (id - cfg.startId) * 4;
  return window.ptSAE.state.view.getInt32(off, true);
}

function saeSetIntStat(id, value) {
  const block = saeStatsBlock();
  if (!block) return;
  const cfg = ptSAE_BLOCKS.STATS.intStats;
  if (id < cfg.startId || id >= cfg.startId + cfg.count) return;
  const off = block.dataOffset + cfg.offset + (id - cfg.startId) * 4;
  window.ptSAE.state.view.setInt32(off, value | 0, true);
}

/* Unified helpers — figure out float vs int automatically from ID range */
function saeGetStat(id) {
  return id <= 81 ? saeGetFloatStat(id) : saeGetIntStat(id);
}

function saeSetStat(id, value) {
  if (id <= 81) saeSetFloatStat(id, value);
  else saeSetIntStat(id, value);
}

/* Builds a flat, labeled list of every stat this tool knows a name
   for — used by the searchable stat browser in the UI. */
function saeListKnownStats() {
  const list = [];
  window.ptSAE_FLOAT_STATS.forEach((label, id) => {
    if (label) list.push({ id, label, type: 'float' });
  });
  Object.keys(window.ptSAE_INT_STATS).forEach((idStr) => {
    const id = parseInt(idStr, 10);
    list.push({ id, label: window.ptSAE_INT_STATS[id], type: 'int' });
  });
  return list;
}

window.ptSAEStats = {
  getStat: saeGetStat,
  setStat: saeSetStat,
  getFloatStat: saeGetFloatStat,
  setFloatStat: saeSetFloatStat,
  getIntStat: saeGetIntStat,
  setIntStat: saeSetIntStat,
  listKnownStats: saeListKnownStats,
  SKILL_MAX: 1000,
  /* Int stats are stored as a real int32 (setInt32), so anything
     outside this range simply can't be written back correctly —
     this is a hard storage limit, not a gameplay guess. A few int
     stats (e.g. "Territories lost") can legitimately be 0, but
     none go negative in practice, so 0 is used as the practical
     floor while still allowing the full int32 ceiling. */
  STAT_INT_MIN: 0,
  STAT_INT_MAX: 2147483647,
  /* Float stats are stored as float32. A few (gambling losses,
     stunt jump-style values) can be negative, so the floor mirrors
     the ceiling. The ceiling itself is well under float32's real
     max — these are lifetime counters (money, distance, time), and
     a ceiling in the billions is already far beyond anything an
     actual playthrough could reach, while still catching fat-finger
     typos or accidental overflow. */
  STAT_FLOAT_MIN: -999999999,
  STAT_FLOAT_MAX: 999999999
};
