/* ── nfsmw-crc32.js ─────────────────────────────────────────
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   EA-style CRC32 header integrity check + fix, for NFSMW
   PC (MC02) saves only.

   The PC save header carries 3 EA CRC32 checksums in addition
   to the MD5 tail hash that nfsmw-core.js already recomputes
   on every write (mweRehash). Those 3 blocks are NOT touched
   by mweRehash, so a save edited by this tool alone would have
   a valid MD5 tail but stale CRC32 header values.

   In practice NFSMW's PC loader appears tolerant of this (the
   editor has been writing MD5-only saves without issue), but
   fixing the CRC32 blocks too brings a save byte-for-byte in
   line with what the game itself would produce, matching what
   the reference desktop/web editors do.
─────────────────────────────────────────────────────────── */

/* ── EA CRC32 (ported 1:1 from the known-good reference implementation) ── */
const MWE_CRC32_TABLE = (function buildEaCrc32Table() {
  const poly = 0x04c11db7;
  const table = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = (i << 24) >>> 0;
    for (let b = 0; b < 8; b++) {
      c = (c & 0x80000000) ? ((c << 1) ^ poly) >>> 0 : (c << 1) >>> 0;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function mweEaCrc32(bytes) {
  if (bytes.length < 4) return 0;
  let crc = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  crc = (~crc) >>> 0;
  for (let i = 4; i < bytes.length; i++) {
    const idx = (crc >>> 24) & 0xFF;
    crc = ((((crc << 8) >>> 0) | bytes[i]) ^ MWE_CRC32_TABLE[idx]) >>> 0;
  }
  return (~crc) >>> 0;
}


/* ── Header layout (PC / MC02 only, all offsets absolute from file start) ── */
const MWE_CRC_FILE_SIZE_OFFSET = 0x04;
const MWE_CRC_BLOCK1_OFFSET    = 0x10;
const MWE_CRC_DATA_OFFSET      = 0x14;
const MWE_CRC_BLOCK2_OFFSET    = 0x18;
const MWE_CRC_BLOCK1_RANGE     = [0x1C, 0x24];
const MWE_CRC_DATA_START       = 0x24;
const MWE_CRC_BLOCK2_RANGE     = [0x00, 0x18];


/* ── helpers ── */
function mweCrcSlice(a, b) {
  return new Uint8Array(ptMWE.buffer, a, b - a);
}

function mweCrcAvailable() {
  return !!ptMWE.buffer;
}


/* ── VALIDATE ────────────────────────────────────────────────
   Read-only: compares stored vs. computed values.
   Returns { available, fileSizeOk, crcBlock1Ok, crcDataOk, crcBlock2Ok, allOk }
─────────────────────────────────────────────────────────── */
function mweCrcValidate() {
  if (!mweCrcAvailable()) return { available: false };

  const size = ptMWE.buffer.byteLength;

  const storedSize = mweGetU32(MWE_CRC_FILE_SIZE_OFFSET);
  const fileSizeOk = storedSize === size;

  const block1Computed = mweEaCrc32(mweCrcSlice(MWE_CRC_BLOCK1_RANGE[0], MWE_CRC_BLOCK1_RANGE[1]));
  const dataComputed   = mweEaCrc32(mweCrcSlice(MWE_CRC_DATA_START, size));
  const block2Computed = mweEaCrc32(mweCrcSlice(MWE_CRC_BLOCK2_RANGE[0], MWE_CRC_BLOCK2_RANGE[1]));

  const block1Stored = mweGetU32(MWE_CRC_BLOCK1_OFFSET);
  const dataStored   = mweGetU32(MWE_CRC_DATA_OFFSET);
  const block2Stored = mweGetU32(MWE_CRC_BLOCK2_OFFSET);

  const crcBlock1Ok = block1Stored === block1Computed;
  const crcDataOk   = dataStored === dataComputed;
  const crcBlock2Ok = block2Stored === block2Computed;

  return {
    available: true,
    fileSizeOk,
    crcBlock1Ok,
    crcDataOk,
    crcBlock2Ok,
    allOk: fileSizeOk && crcBlock1Ok && crcDataOk && crcBlock2Ok,
  };
}


/* ── FIX ─────────────────────────────────────────────────────
   Writes correct file size + all 3 CRC32 blocks, then calls
   the existing MD5 rehash so the whole header/tail is
   consistent in one pass. Returns the post-fix validate() result.
─────────────────────────────────────────────────────────── */
function mweCrcFix() {
  if (!mweCrcAvailable()) return { available: false };

  const size = ptMWE.buffer.byteLength;

  mweSetU32(MWE_CRC_FILE_SIZE_OFFSET, size);

  const block1 = mweEaCrc32(mweCrcSlice(MWE_CRC_BLOCK1_RANGE[0], MWE_CRC_BLOCK1_RANGE[1]));
  mweSetU32(MWE_CRC_BLOCK1_OFFSET, block1);

  const dataCrc = mweEaCrc32(mweCrcSlice(MWE_CRC_DATA_START, size));
  mweSetU32(MWE_CRC_DATA_OFFSET, dataCrc);

  const block2 = mweEaCrc32(mweCrcSlice(MWE_CRC_BLOCK2_RANGE[0], MWE_CRC_BLOCK2_RANGE[1]));
  mweSetU32(MWE_CRC_BLOCK2_OFFSET, block2);

  mweRehash(); /* MD5 tail, defined in nfsmw-core.js */

  return mweCrcValidate();
}
