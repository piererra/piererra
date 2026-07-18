/* ============================================================
   gtasa-collectables-pickups.js — GTA SA Save Editor
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Real per-item collected/uncollected editing for Horseshoes,
   Oysters and Snapshots. These live in Block 6's 620-slot
   Pickup pool rather than a dedicated block (see gtasa-blocks.js
   PICKUPS for the verification notes).

   Collected  = no live pickup remains at that coordinate.
   Uncollected = a live pickup with the right model/type sits at
                 (within a few units of) the known coordinate.

   To mark an item collected: zero out its matched slot.
   To mark an item uncollected: write a fresh entry into the
   first empty (model 0) slot using the known coordinate and the
   category's fixed model/type/index values.
============================================================ */

'use strict';

function saePickupsFindSlot(model, type, x, y, z) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.PICKUPS.index);
  if (!block) return -1;
  const cfg = ptSAE_BLOCKS.PICKUPS;
  const view = window.ptSAE.state.view;
  const scale = cfg.coordScale;
  const targetX = x * scale, targetY = y * scale, targetZ = z * scale;
  const tolerance = cfg.matchTolerance * scale;

  for (let i = 0; i < cfg.slotCount; i++) {
    const off = block.dataOffset + i * cfg.entrySize;
    const m = view.getUint16(off + cfg.fields.model.offset, true);
    if (m !== model) continue;
    const t = window.ptSAE.state.bytes[off + cfg.fields.type.offset];
    if (t !== type) continue;
    const px = view.getInt16(off + cfg.fields.x.offset, true);
    const py = view.getInt16(off + cfg.fields.y.offset, true);
    const pz = view.getInt16(off + cfg.fields.z.offset, true);
    const dist = Math.sqrt((px - targetX) ** 2 + (py - targetY) ** 2 + (pz - targetZ) ** 2);
    if (dist <= tolerance) return i;
  }
  return -1;
}

function saePickupsFindEmptySlot() {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.PICKUPS.index);
  if (!block) return -1;
  const cfg = ptSAE_BLOCKS.PICKUPS;
  const view = window.ptSAE.state.view;
  for (let i = 0; i < cfg.slotCount; i++) {
    const off = block.dataOffset + i * cfg.entrySize;
    if (view.getUint16(off + cfg.fields.model.offset, true) === 0) return i;
  }
  return -1;
}

function saeCollectableIsCollected(category, x, y, z) {
  const cat = ptSAE_BLOCKS.PICKUPS.categories[category];
  if (!cat) return null;
  const slot = saePickupsFindSlot(cat.model, cat.type, x, y, z);
  return slot === -1; // no live pickup there => already collected
}

function saeCollectableSet(category, x, y, z, collected) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.PICKUPS.index);
  if (!block) return false;
  const cfg = ptSAE_BLOCKS.PICKUPS;
  const cat = cfg.categories[category];
  if (!cat) return false;
  const view = window.ptSAE.state.view;
  const bytes = window.ptSAE.state.bytes;

  if (collected) {
    const slot = saePickupsFindSlot(cat.model, cat.type, x, y, z);
    if (slot === -1) return true; // already collected, nothing to do
    const off = block.dataOffset + slot * cfg.entrySize;
    bytes.fill(0, off, off + cfg.entrySize);
    return true;
  }

  // Uncollect: if a live one already exists, nothing to do.
  const existing = saePickupsFindSlot(cat.model, cat.type, x, y, z);
  if (existing !== -1) return true;

  const emptySlot = saePickupsFindEmptySlot();
  if (emptySlot === -1) return false; // pool full — extremely unlikely (620 slots)

  const off = block.dataOffset + emptySlot * cfg.entrySize;
  bytes.fill(0, off, off + cfg.entrySize);
  const scale = cfg.coordScale;
  view.setInt16(off + cfg.fields.x.offset, Math.round(x * scale), true);
  view.setInt16(off + cfg.fields.y.offset, Math.round(y * scale), true);
  view.setInt16(off + cfg.fields.z.offset, Math.round(z * scale), true);
  view.setUint16(off + cfg.fields.model.offset, cat.model, true);
  view.setUint16(off + cfg.fields.pickupIndex.offset, cfg.fields.pickupIndex.constant, true);
  bytes[off + cfg.fields.type.offset] = cat.type;
  return true;
}

window.ptSAECollectablePickups = {
  isCollected: saeCollectableIsCollected,
  setCollected: saeCollectableSet
};
