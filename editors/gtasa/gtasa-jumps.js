/* ============================================================
   gtasa-jumps.js — GTA SA Save Editor · Unique Stunt Jumps
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Read/write helpers for Block 24 (Unique Stunt Jumps). Fixed
   array of 70 x 0x44-byte StuntJump structs behind a dword
   count. Verified exactly against a real save: count reads 70
   (correct), block is 4,764 bytes (4 + 70*68) to the byte, and
   reward/done/found fields read back sane real values ($500
   reward, found=1, done=1 on a 100%-complete save).
   Jumps have no names in the save data itself — they're
   numbered 1-70 in stored order, matching the order players
   naturally encounter them and the order most location guides
   use.
============================================================ */

'use strict';

function saeJumpsGet(index) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.JUMPS.index);
  if (!block) return null;
  const cfg = ptSAE_BLOCKS.JUMPS;
  if (index < 0 || index >= cfg.jumpCount) return null;
  const view = window.ptSAE.state.view;
  const base = block.dataOffset + cfg.listOffset + index * cfg.entrySize;
  const bytes = window.ptSAE.state.bytes;
  return {
    index,
    reward: view.getInt32(base + cfg.fields.reward.offset, true),
    done: !!bytes[base + cfg.fields.done.offset],
    found: !!bytes[base + cfg.fields.found.offset],
    camera: [
      view.getFloat32(base + cfg.fields.camera.offset + 0, true),
      view.getFloat32(base + cfg.fields.camera.offset + 4, true),
      view.getFloat32(base + cfg.fields.camera.offset + 8, true)
    ]
  };
}

function saeJumpsList() {
  const list = [];
  for (let i = 0; i < ptSAE_BLOCKS.JUMPS.jumpCount; i++) list.push(saeJumpsGet(i));
  return list;
}

function saeJumpsSetFound(index, found) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.JUMPS.index);
  if (!block) return;
  const cfg = ptSAE_BLOCKS.JUMPS;
  if (index < 0 || index >= cfg.jumpCount) return;
  const base = block.dataOffset + cfg.listOffset + index * cfg.entrySize;
  window.ptSAE.state.bytes[base + cfg.fields.found.offset] = found ? 1 : 0;
}

function saeJumpsSetDone(index, done) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.JUMPS.index);
  if (!block) return;
  const cfg = ptSAE_BLOCKS.JUMPS;
  if (index < 0 || index >= cfg.jumpCount) return;
  const base = block.dataOffset + cfg.listOffset + index * cfg.entrySize;
  window.ptSAE.state.bytes[base + cfg.fields.done.offset] = done ? 1 : 0;
  // Completing a jump implies it was found
  if (done) window.ptSAE.state.bytes[base + cfg.fields.found.offset] = 1;
}

function saeJumpsSetReward(index, reward) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.JUMPS.index);
  if (!block) return;
  const cfg = ptSAE_BLOCKS.JUMPS;
  if (index < 0 || index >= cfg.jumpCount) return;
  const base = block.dataOffset + cfg.listOffset + index * cfg.entrySize;
  window.ptSAE.state.view.setInt32(base + cfg.fields.reward.offset, reward | 0, true);
}

function saeJumpsSetAllFoundDone(foundDone) {
  for (let i = 0; i < ptSAE_BLOCKS.JUMPS.jumpCount; i++) {
    saeJumpsSetFound(i, foundDone);
    saeJumpsSetDone(i, foundDone);
  }
}

window.ptSAEJumps = {
  JUMP_COUNT: ptSAE_BLOCKS.JUMPS.jumpCount,
  list: saeJumpsList,
  get: saeJumpsGet,
  setFound: saeJumpsSetFound,
  setDone: saeJumpsSetDone,
  setReward: saeJumpsSetReward,
  setAllFoundDone: saeJumpsSetAllFoundDone,
  // Reward is stored as a real int32 (setInt32) — this is that
  // storage ceiling, same reasoning as ptSAEGeneral.MAX_MONEY.
  REWARD_MIN: 0,
  REWARD_MAX: 2147483647
};
