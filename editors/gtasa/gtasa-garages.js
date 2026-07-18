/* ============================================================
   gtasa-garages.js — GTA SA Save Editor · Garages & Vehicles
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Read/write helpers for the 20 storage garages x 4 car slots
   in Block 3. The storage order in the save is NOT sequential
   per garage — it's interleaved: Garage1/Car1, Garage2/Car1,
   ... Garage20/Car1, Garage1/Car2, Garage2/Car2, ... This is
   confirmed directly in the GTAMods wiki and verified against
   real save files (garage count, model IDs, and garage name
   strings all read back correctly with this ordering).
============================================================ */

'use strict';

/* Internal script names -> friendly location names. GTA SA's own
   mission script addresses many garages by an 8-character code
   (e.g. "cjsafe", "beacsv") — this table translates the ones
   confirmed against a real save file (see below). A code not
   listed here (rare, or an unmodded-game edge case) falls back to
   showing the raw code instead of guessing — see
   saeGarageDisplayName(). */
const ptSAE_GARAGE_NAMES = {
  CJSAFE:   'Ganton Garage (Johnson House)',
  CESAFE1:  'Mulholland Garage',
  MUL_LAN:  'Downtown Garage',
  DUF_LAS:  'El Corona Garage',
  MODGLAS:  "Cesar's Garage",
  CARLAS1:  'El Corona Garage',
  BEACSV:   'Santa Maria Beach Garage',
  FDORSFE:  "Wu Zi Mu's Garage",
  MICHDR:   "Michelle's Garage",
  SAV1SFE:  'San Fierro Safehouse Garage',
  SVGSFS1:  'Hashbury Garage',
  HBGDSFS:  'Doherty Garage',
  LCKSFSE:  'Doherty Garage',
  SAV1SFW:  'Paradiso Garage',
  VESVGRG:  'Rockshore West Garage',
  VGSHNGR:  'AT-400 Hangar',
  BLOB69:   'Prickle Pine Garage',
  BLOB7:    'Whitewood Estates Garage',
  BLOB6:    'Redsands Garage',
  CN2GAR1:  'Fort Carson Garage',
  CN2GAR2:  'Verdant Meadows Garage',
  DHANGAR:  'Verdant Meadows Hangar',
  BURBDO2:  'Dillimore Garage',
  BURBDOO:  'Palomino Creek Garage'
};

/* There's no reliable byte flag distinguishing storage garages
   from Pay 'n' Sprays / mod shops / bomb shops (tested against a
   real save — a byte that looked promising turned out to vary
   per-garage with no clean split). Instead, each storage garage
   index is identified live by cross-matching where its cars are
   actually parked (real world X/Y/Z, present in each car's own
   struct) against each of the ~50 SaveGarage entries' own
   position. Verified against a real save: 13 of 20 garages
   matched an entry within ~10 units, comfortably inside these
   tolerances, while genuinely ambiguous cases (a garage whose
   parked cars sit in visibly different real-world spots) landed
   far outside them and correctly fall back instead of guessing. */
const SAE_GARAGE_CLUSTER_TOLERANCE_SQ = 1600; // ~40 units — how tightly a garage's own cars must agree with each other
const SAE_GARAGE_MATCH_TOLERANCE_SQ = 1600;   // ~40 units — how close that average must land to a real SaveGarage entry

/* Cached per loaded save — cleared by saeGaragesResetNames() so a
   newly-loaded file never shows a previous save's garage names. */
let saeGarageNameCache = null;

function saeReadSaveGarageEntries() {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.GARAGES.index);
  if (!block) return [];
  const cfg = ptSAE_BLOCKS.GARAGES.saveGarage;
  const bytes = window.ptSAE.state.bytes;
  const view = window.ptSAE.state.view;
  const base = block.dataOffset;
  const count = view.getUint32(base + cfg.countOffset, true);
  const entries = [];

  for (let i = 0; i < count; i++) {
    const off = base + cfg.arrayOffset + i * cfg.entrySize;
    let code = '';
    for (let c = 0; c < cfg.nameLength; c++) {
      const b = bytes[off + cfg.nameOffset + c];
      if (b === 0) break;
      code += String.fromCharCode(b);
    }
    entries.push({
      code: code,
      x: view.getFloat32(off + cfg.posOffset, true),
      y: view.getFloat32(off + cfg.posOffset + 4, true),
      z: view.getFloat32(off + cfg.posOffset + 8, true)
    });
  }
  return entries;
}

function saeDistSq(ax, ay, az, bx, by, bz) {
  const dx = ax - bx, dy = ay - by, dz = az - bz;
  return dx * dx + dy * dy + dz * dz;
}

function saeBuildGarageNames() {
  const cfg = ptSAE_BLOCKS.GARAGES;
  const saveGarages = saeReadSaveGarageEntries();
  const names = [];

  for (let g = 0; g < cfg.garageCount; g++) {
    const pts = [];
    for (let s = 0; s < cfg.slotsPerGarage; s++) {
      const car = saeGetCar(g, s);
      if (!car || car.model === 0 || car.model === 0xFFFF) continue;
      const off = saeCarSlotOffset(g, s);
      const view = window.ptSAE.state.view;
      const pos = cfg.carFields.position;
      pts.push({
        x: view.getFloat32(off + pos.xOffset, true),
        y: view.getFloat32(off + pos.yOffset, true),
        z: view.getFloat32(off + pos.zOffset, true)
      });
    }

    if (pts.length === 0) { names.push(null); continue; } // empty garage — nothing to cross-match

    // Every populated slot must agree with every other, or this
    // garage's cars aren't all in the same real-world spot and any
    // name guess would be unreliable.
    let tightlyClustered = true;
    for (let a = 0; a < pts.length && tightlyClustered; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        if (saeDistSq(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z) > SAE_GARAGE_CLUSTER_TOLERANCE_SQ) {
          tightlyClustered = false;
          break;
        }
      }
    }
    if (!tightlyClustered) { names.push(null); continue; }

    const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;

    let best = null, bestDistSq = Infinity;
    saveGarages.forEach((sg) => {
      const d = saeDistSq(avgX, avgY, avgZ, sg.x, sg.y, sg.z);
      if (d < bestDistSq) { bestDistSq = d; best = sg; }
    });

    names.push(best && bestDistSq <= SAE_GARAGE_MATCH_TOLERANCE_SQ ? best.code : null);
  }
  return names;
}

/* Returns a friendly, human-readable label for a storage garage
   index (0-19), identified live from the loaded save rather than
   any hardcoded guess at index order. Falls back gracefully at
   every step so nothing is ever shown with unearned confidence:
     1. Confidently cross-matched + known code -> friendly name
     2. Confidently cross-matched, unknown code -> "Garage N (CODE)"
     3. Empty or ambiguous (no confident match)  -> "Garage N" */
function saeGarageDisplayName(index) {
  if (!saeGarageNameCache) saeGarageNameCache = saeBuildGarageNames();
  const code = saeGarageNameCache[index];
  if (!code) return 'Garage ' + (index + 1);
  const friendly = ptSAE_GARAGE_NAMES[code.toUpperCase()];
  return friendly ? friendly : 'Garage ' + (index + 1) + ' (' + code + ')';
}

function saeGaragesResetNames() {
  saeGarageNameCache = null;
}

function saeCarSlotOffset(garageIndex, carSlot) {
  const block = window.ptSAE.getBlock(ptSAE_BLOCKS.GARAGES.index);
  if (!block) return null;
  const cfg = ptSAE_BLOCKS.GARAGES;
  if (garageIndex < 0 || garageIndex >= cfg.garageCount) return null;
  if (carSlot < 0 || carSlot >= cfg.slotsPerGarage) return null;

  const arrayStart = block.dataOffset + cfg.storedCarArrayOffset;
  // Interleaved order: position = carSlot * garageCount + garageIndex
  const position = carSlot * cfg.garageCount + garageIndex;
  return arrayStart + position * cfg.carSize;
}

function saeGetCar(garageIndex, carSlot) {
  const off = saeCarSlotOffset(garageIndex, carSlot);
  if (off === null) return null;
  const view = window.ptSAE.state.view;
  const f = ptSAE_BLOCKS.GARAGES.carFields;
  return {
    model: view.getUint16(off + f.model.offset, true),
    colorPrimary: view.getUint8(off + f.colorPrimary.offset),
    colorSecondary: view.getUint8(off + f.colorSecondary.offset),
    radio: view.getUint8(off + f.radio.offset),
    bombType: view.getUint8(off + f.bombType.offset),
    nitrousCount: view.getUint8(off + f.nitrousCount.offset)
  };
}

function saeSetCarField(garageIndex, carSlot, fieldName, value) {
  const off = saeCarSlotOffset(garageIndex, carSlot);
  if (off === null) return;
  const field = ptSAE_BLOCKS.GARAGES.carFields[fieldName];
  if (!field) return;
  const view = window.ptSAE.state.view;

  if (fieldName === 'model') view.setUint16(off + field.offset, value, true);
  else view.setUint8(off + field.offset, value & 0xFF);
}

window.ptSAEGarages = {
  GARAGE_COUNT: ptSAE_BLOCKS.GARAGES.garageCount,
  SLOTS_PER_GARAGE: ptSAE_BLOCKS.GARAGES.slotsPerGarage,
  getCar: saeGetCar,
  setField: saeSetCarField,
  getDisplayName: saeGarageDisplayName,
  resetNames: saeGaragesResetNames
};
