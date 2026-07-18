/* ============================================================
   gtasa-gangs.js — GTA SA Save Editor · Gang Weapons
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Read/write helpers for the 10 gangs' assigned weapon sets in
   Block 11. Each gang gets 3 weapon slots (used when a gang war
   spawns enemy members) plus 4 reserved/unused bytes. Verified
   against real save data — the block's real size matched the
   10 x 16-byte layout with zero bytes left over.
============================================================ */

'use strict';

function saeGangOffset(gangIndex) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.GANGS.index);
  if (!block) return null;
  const cfg = ptSAE_BLOCKS.GANGS;
  if (gangIndex < 0 || gangIndex >= cfg.gangCount) return null;
  return block.dataOffset + gangIndex * cfg.gangSize;
}

function saeGetGangWeapons(gangIndex) {
  const off = saeGangOffset(gangIndex);
  if (off === null) return null;
  const view = window.ptSAE.state.view;
  const f = ptSAE_BLOCKS.GANGS.fields;
  return {
    weapon1: view.getUint32(off + f.weapon1.offset, true),
    weapon2: view.getUint32(off + f.weapon2.offset, true),
    weapon3: view.getUint32(off + f.weapon3.offset, true)
  };
}

function saeSetGangWeapon(gangIndex, slotName, weaponId) {
  const off = saeGangOffset(gangIndex);
  if (off === null) return;
  const field = ptSAE_BLOCKS.GANGS.fields[slotName];
  if (!field) return;
  window.ptSAE.state.view.setUint32(off + field.offset, weaponId >>> 0, true);
}

window.ptSAEGangs = {
  GANG_COUNT: ptSAE_BLOCKS.GANGS.gangCount,
  getWeapons: saeGetGangWeapons,
  setWeapon: saeSetGangWeapon
};
