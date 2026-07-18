/* ============================================================
   gtasa-weapons.js — GTA SA Save Editor · Weapons
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Read/write helpers for the 13 weapon slots in Block 2
   (PlayerPed). Each slot is 28 bytes; this tool only edits the
   weapon type and ammo count fields — the other fields (state,
   ammo in clip, shots fired, and 8 unknown bytes) are left
   untouched to avoid corrupting anything not yet understood.
============================================================ */

'use strict';

function saeWeaponSlotOffset(slotIndex) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.WEAPONS.index);
  if (!block) return null;
  const cfg = ptSAE_BLOCKS.WEAPONS;
  if (slotIndex < 0 || slotIndex >= cfg.slotCount) return null;
  return block.dataOffset + cfg.arrayOffset + slotIndex * cfg.slotSize;
}

function saeGetWeaponSlot(slotIndex) {
  const off = saeWeaponSlotOffset(slotIndex);
  if (off === null) return null;
  const view = window.ptSAE.state.view;
  return {
    type: view.getUint32(off + ptSAE_BLOCKS.WEAPONS.fields.type.offset, true),
    ammo: view.getUint32(off + ptSAE_BLOCKS.WEAPONS.fields.ammo.offset, true)
  };
}

function saeSetWeaponType(slotIndex, type) {
  const off = saeWeaponSlotOffset(slotIndex);
  if (off === null) return;
  window.ptSAE.state.view.setUint32(off + ptSAE_BLOCKS.WEAPONS.fields.type.offset, type, true);
}

function saeSetWeaponAmmo(slotIndex, ammo) {
  const off = saeWeaponSlotOffset(slotIndex);
  if (off === null) return;
  window.ptSAE.state.view.setUint32(off + ptSAE_BLOCKS.WEAPONS.fields.ammo.offset, ammo >>> 0, true);
}

window.ptSAEWeapons = {
  SLOT_COUNT: ptSAE_BLOCKS.WEAPONS.slotCount,
  MAX_AMMO: 99999,
  getSlot: saeGetWeaponSlot,
  setType: saeSetWeaponType,
  setAmmo: saeSetWeaponAmmo
};
