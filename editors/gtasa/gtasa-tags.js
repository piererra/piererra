/* ============================================================
   gtasa-tags.js — GTA SA Save Editor · Tags
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Read/write helpers for Block 20 (Tags). Simple fixed-size
   list: a dword count followed by one byte per tag. Verified
   exactly against a real save: count reads 100 (correct), the
   block is 104 bytes (4 + 100) to the byte, and every byte read
   back as 0xFF on a 100%-complete save (i.e. sprayed).
============================================================ */

'use strict';

function saeTagsCount() {
  return ptSAE_BLOCKS.TAGS.tagCount;
}

function saeTagsList() {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.TAGS.index);
  if (!block) return [];
  const cfg = ptSAE_BLOCKS.TAGS;
  const bytes = window.ptSAE.state.bytes;
  const base = block.dataOffset + cfg.listOffset;
  const list = [];
  for (let i = 0; i < cfg.tagCount; i++) {
    const value = bytes[base + i];
    list.push({ index: i, value, sprayed: value >= cfg.sprayedThreshold });
  }
  return list;
}

function saeTagsGet(index) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.TAGS.index);
  if (!block) return null;
  const cfg = ptSAE_BLOCKS.TAGS;
  if (index < 0 || index >= cfg.tagCount) return null;
  const value = window.ptSAE.state.bytes[block.dataOffset + cfg.listOffset + index];
  return { index, value, sprayed: value >= cfg.sprayedThreshold };
}

function saeTagsSet(index, sprayed) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.TAGS.index);
  if (!block) return;
  const cfg = ptSAE_BLOCKS.TAGS;
  if (index < 0 || index >= cfg.tagCount) return;
  window.ptSAE.state.bytes[block.dataOffset + cfg.listOffset + index] = sprayed ? 0xFF : 0x00;
}

function saeTagsSetAll(sprayed) {
  for (let i = 0; i < ptSAE_BLOCKS.TAGS.tagCount; i++) saeTagsSet(i, sprayed);
}

window.ptSAETags = {
  TAG_COUNT: ptSAE_BLOCKS.TAGS.tagCount,
  list: saeTagsList,
  get: saeTagsGet,
  set: saeTagsSet,
  setAll: saeTagsSetAll
};
