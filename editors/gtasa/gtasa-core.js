/* ============================================================
   gtasa-core.js — GTA San Andreas Save Editor · Binary Engine
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   STATUS: v0.1 — engine + General/Cheats block only.
   Handles:
     · Block scanner — locates the 28 "BLOCK"-tagged sections
       and self-calibrates the header layout instead of
       assuming one, since the exact convention isn't
       confirmed in public docs for this game specifically.
     · Checksum (uint32 sum of all preceding bytes)
     · Save file loading and re-download
   ──────────────────────────────────────────────────────────
   Save file specs (PC, single-player, .b files):
     Fixed size   : 0x31800 (202,752) bytes
     Blocks       : 28 sections, each preceded by the ASCII
                    tag "BLOCK" plus a 4-byte size field
                    (order self-detected, see scanBlocks)
     Checksum     : last 4 bytes = uint32 LE sum of every
                    byte before it
   Sources (community-documented, MIT/CC licensed):
     - gtamods.com/wiki/Saves_(GTA_SA)
     - gtasa-savegame-editor.github.io/docs
   Block 15 (General/Cheats) offsets confirmed against an
   independent open-source parser (jamiemansfield/gtasave).
============================================================ */

'use strict';

const ptSAE_FILE_SIZE = 0x31800; // 202,752 bytes — fixed PC save size
const ptSAE_TAG = [0x42, 0x4C, 0x4F, 0x43, 0x4B]; // ASCII "BLOCK"
const ptSAE_BLOCK_COUNT = 28;

const ptSAE = {
  bytes: null,      // Uint8Array of the loaded file
  view: null,       // DataView over the same buffer
  blocks: [],       // [{ index, tagOffset, dataOffset, size }]
  fileName: 'GTASAsf1.b'
};

/* ── BLOCK SCANNER ───────────────────────────────────────────
   Finds every literal "BLOCK" tag in file order. Each block's
   data starts immediately after its 5-byte tag — there is NO
   universal size field in between. (An earlier version of this
   scanner assumed one, based on how GTA4 saves work; verified
   against real GTA SA save files that this does NOT hold here —
   some blocks' own internal format happens to start with a
   self-declared size as their own first field, e.g. Block 15,
   but that's block-specific content, not a parser-level header.)

   A block's size is therefore derived as the gap to the next
   tag, not read from a stored field. Padding at the end of the
   file duplicates earlier bytes verbatim (including any real
   "BLOCK" tags they contained), which is why more than 28
   occurrences exist in a full file — taking only the first 28
   in file order reliably gets the real blocks.
─────────────────────────────────────────────────────────── */
function saeFindTagOffsets(bytes, maxCount) {
  const offsets = [];
  for (let i = 0; i < bytes.length - 5 && offsets.length < maxCount; i++) {
    if (bytes[i] === ptSAE_TAG[0] && bytes[i + 1] === ptSAE_TAG[1] &&
        bytes[i + 2] === ptSAE_TAG[2] && bytes[i + 3] === ptSAE_TAG[3] &&
        bytes[i + 4] === ptSAE_TAG[4]) {
      offsets.push(i);
    }
  }
  return offsets;
}

function saeScanBlocks(bytes) {
  // Search a bit past the expected count to stay robust — extras
  // (from padding re-using earlier bytes) are simply ignored below.
  const tagOffsets = saeFindTagOffsets(bytes, ptSAE_BLOCK_COUNT + 8);
  if (tagOffsets.length < ptSAE_BLOCK_COUNT) {
    throw new Error('sae.err.tags_not_found');
  }

  const blocks = [];
  for (let i = 0; i < ptSAE_BLOCK_COUNT; i++) {
    const tagOff = tagOffsets[i];
    const dataOffset = tagOff + 5;
    const nextTagOff = (i + 1 < ptSAE_BLOCK_COUNT) ? tagOffsets[i + 1] : null;
    const size = nextTagOff !== null ? (nextTagOff - dataOffset) : null;
    blocks.push({ index: i, tagOffset: tagOff, dataOffset, size });
  }

  return { blocks };
}

/* ── CHECKSUM ────────────────────────────────────────────────
   The last 4 bytes of the file are a uint32 (LE) sum of every
   byte before it. The game refuses to load a save if this
   doesn't match.
─────────────────────────────────────────────────────────── */
function saeCalcChecksum(bytes) {
  let sum = 0;
  const end = bytes.length - 4;
  for (let i = 0; i < end; i++) {
    sum = (sum + bytes[i]) >>> 0;
  }
  return sum >>> 0;
}

function saeRehash() {
  if (!ptSAE.bytes) return;
  const sum = saeCalcChecksum(ptSAE.bytes);
  ptSAE.view.setUint32(ptSAE.bytes.length - 4, sum, true);
}

/* ── LOAD / VALIDATE ─────────────────────────────────────────── */
function saeLoadFile(arrayBuffer, fileName) {
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.length !== ptSAE_FILE_SIZE) {
    throw new Error('sae.err.bad_size');
  }

  const { blocks } = saeScanBlocks(bytes);

  ptSAE.bytes = bytes;
  ptSAE.view = new DataView(bytes.buffer);
  ptSAE.blocks = blocks;
  ptSAE.fileName = fileName || 'GTASAsf1.b';

  return { blocks };
}

function saeGetBlock(index) {
  return ptSAE.blocks[index] || null;
}

function saeDownload() {
  if (!ptSAE.bytes) return;
  saeRehash();
  const blob = new Blob([ptSAE.bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ptSAE.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.ptSAE = {
  state: ptSAE,
  loadFile: saeLoadFile,
  getBlock: saeGetBlock,
  rehash: saeRehash,
  download: saeDownload,
  FILE_SIZE: ptSAE_FILE_SIZE,
  BLOCK_COUNT: ptSAE_BLOCK_COUNT
};
