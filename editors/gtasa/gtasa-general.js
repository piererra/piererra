/* ============================================================
   gtasa-general.js — GTA SA Save Editor · General & Cheats
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Read/write helpers for Block 15 (money + cheat toggles).
   Mirrors the pattern of nfsmw-core.js's write helpers —
   small, single-purpose functions the UI layer calls directly.
============================================================ */

'use strict';

function saeReadField(field) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.GENERAL.index);
  if (!block) return null;
  const off = block.dataOffset + field.offset;
  const view = window.ptSAE.state.view;

  if (field.type === 'int32') return view.getInt32(off, true);
  if (field.type === 'bool')  return view.getUint8(off) !== 0;
  return null;
}

function saeWriteField(field, value) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.GENERAL.index);
  if (!block) return;
  const off = block.dataOffset + field.offset;
  const view = window.ptSAE.state.view;

  if (field.type === 'int32') view.setInt32(off, value | 0, true);
  else if (field.type === 'bool') view.setUint8(off, value ? 1 : 0);
}

/* Public helpers used by gtasa-ui.js */
const ptSAEGeneral = {
  getMoney:        () => saeReadField(ptSAE_BLOCKS.GENERAL.fields.money),
  setMoney:        (v) => saeWriteField(ptSAE_BLOCKS.GENERAL.fields.money, v),

  getCountedMoney: () => saeReadField(ptSAE_BLOCKS.GENERAL.fields.countedMoney),
  setCountedMoney: (v) => saeWriteField(ptSAE_BLOCKS.GENERAL.fields.countedMoney, v),

  getCheat: (key) => saeReadField(ptSAE_BLOCKS.GENERAL.fields[key]),
  setCheat: (key, on) => saeWriteField(ptSAE_BLOCKS.GENERAL.fields[key], on),

  CHEAT_KEYS: ['infiniteRun', 'fastReload', 'fireproof', 'maxHealth', 'maxArmour', 'freeBusted', 'freeWasted', 'driveby'],

  MAX_MONEY: 2147483647
};

window.ptSAEGeneral = ptSAEGeneral;
