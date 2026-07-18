/* ============================================================
   gtasa-zones.js — GTA SA Save Editor · Zone Gang Density
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Read/write helpers for Block 10 (Zones). Builds a list of
   named zones from the ZoneInfo array and maps each one to its
   ZonePop entry (gang density x10 + dealer density) using the
   zone's own stored `id` field — NOT its array position. This
   matters: verified against real save data that ~40 of 379
   ZoneInfo entries have an id that doesn't match their position
   in the array, and one zone name ("MONINT") appears twice,
   both correctly sharing the same id/ZonePop entry. Building
   the list positionally would silently edit the wrong zone.
============================================================ */

'use strict';

let saeZonesCache = null;

function saeZonesBuild() {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.ZONES.index);
  if (!block) return null;
  const view = window.ptSAE.state.view;
  const cfg = ptSAE_BLOCKS.ZONES;
  const base = block.dataOffset;

  const n1 = view.getUint16(base + cfg.header.zoneInfo1CountOffset, true);
  const nPop = view.getUint16(base + cfg.header.zonePopCountOffset, true);
  const arraysStart = base + cfg.header.arraysStart;

  const zoneInfoArrayOffset = arraysStart;
  const zonePopArrayOffset = arraysStart + n1 * cfg.zoneInfoSize;

  const bytes = window.ptSAE.state.bytes;
  const decode = (off, len) => {
    let s = '';
    for (let i = 0; i < len; i++) {
      const c = bytes[off + i];
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s;
  };

  const seenNames = new Set();
  const zones = [];
  for (let i = 0; i < n1; i++) {
    const off = zoneInfoArrayOffset + i * cfg.zoneInfoSize;
    const code = decode(off + cfg.zoneInfoFields.name.offset, cfg.zoneInfoFields.name.length);
    const id = view.getUint16(off + 0x1C, true);
    if (!code || seenNames.has(code) || id >= nPop) continue;
    seenNames.add(code);
    // Real display name where known (e.g. "GAN1" -> "Ganton"); a
    // code with no entry (rare — e.g. a top-level state marker)
    // falls back to showing the raw code rather than guessing.
    const name = (window.ptSAE_ZONE_NAMES_UPPER && window.ptSAE_ZONE_NAMES_UPPER[code.toUpperCase()]) || code;
    zones.push({ name, code, id });
  }
  zones.sort((a, b) => a.name.localeCompare(b.name));

  saeZonesCache = { zonePopArrayOffset, zones };
  return saeZonesCache;
}

function saeZonesList() {
  if (!saeZonesCache) saeZonesBuild();
  return saeZonesCache ? saeZonesCache.zones : [];
}

function saeZonePopOffset(zoneId) {
  if (!saeZonesCache) saeZonesBuild();
  if (!saeZonesCache) return null;
  return saeZonesCache.zonePopArrayOffset + zoneId * ptSAE_BLOCKS.ZONES.zonePopSize;
}

function saeGetZonePop(zoneId) {
  const off = saeZonePopOffset(zoneId);
  if (off === null) return null;
  const bytes = window.ptSAE.state.bytes;
  const density = [];
  for (let g = 0; g < ptSAE_BLOCKS.ZONES.gangCount; g++) {
    density.push(bytes[off + g]);
  }
  return {
    density,
    dealer: bytes[off + ptSAE_BLOCKS.ZONES.zonePopFields.dealerDensity.offset]
  };
}

function saeSetZoneGangDensity(zoneId, gangIndex, value) {
  const off = saeZonePopOffset(zoneId);
  if (off === null) return;
  window.ptSAE.state.bytes[off + gangIndex] = value & 0xFF;
}

function saeSetZoneDealerDensity(zoneId, value) {
  const off = saeZonePopOffset(zoneId);
  if (off === null) return;
  window.ptSAE.state.bytes[off + ptSAE_BLOCKS.ZONES.zonePopFields.dealerDensity.offset] = value & 0xFF;
}

function saeZonesReset() {
  saeZonesCache = null;
}

window.ptSAEZones = {
  GANG_COUNT: ptSAE_BLOCKS.ZONES.gangCount,
  list: saeZonesList,
  getPop: saeGetZonePop,
  setGangDensity: saeSetZoneGangDensity,
  setDealerDensity: saeSetZoneDealerDensity,
  reset: saeZonesReset
};
