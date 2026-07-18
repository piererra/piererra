/* ============================================================
   gtasa-blocks.js — GTA SA Save Editor · Block Offset Map
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   STATUS: v0.2 — General/Cheats, Stats, Weapons, Garages,
   Gangs (Block 11) and Zones (Block 10) are mapped. Only
   Collectables (Tags/Snapshots/Horseshoes/Oysters/Jumps)
   remain. Each block gets its own entry here plus its own
   logic file, following the same pattern as the NFSMW tool
   (nfsmw-garage.js, nfsmw-tuning.js, etc).

   Offsets below are relative to the start of a block's DATA
   section (i.e. ptSAE.getBlock(15).dataOffset), not the file.
============================================================ */

'use strict';

/* Block 15 — General stats & cheat toggles.
   Offsets verified two ways: (1) cross-checked against the
   GTAMods community wiki's byte-level table for this block,
   and (2) confirmed empirically against real save files —
   both the money value and the cheat flags read back exactly
   as described in the save's own readme.
   All offsets below are relative to the block's true data
   start — i.e. immediately after its 5-byte "BLOCK" tag. */
const ptSAE_BLOCKS = {
  GENERAL: {
    index: 15,
    fields: {
      money:         { offset: 4,  type: 'int32' },
      countedMoney:  { offset: 16, type: 'int32' },
      infiniteRun:   { offset: 32, type: 'bool' },
      fastReload:    { offset: 33, type: 'bool' },
      fireproof:     { offset: 34, type: 'bool' },
      maxHealth:     { offset: 35, type: 'bool' },
      maxArmour:     { offset: 36, type: 'bool' },
      freeBusted:    { offset: 37, type: 'bool' },
      freeWasted:    { offset: 38, type: 'bool' },
      driveby:       { offset: 39, type: 'bool' }
    }
  },

  /* Block 16 — Stats & Skills.
     Verified against real save data using the last-mission-passed
     GXT key as a byte-alignment sanity check (read back "RIOT_4",
     a genuine end-game mission key, confirming exact alignment). */
  STATS: {
    index: 16,
    floatStats: { offset: 0x0000, count: 82, startId: 0 },     // ids 0-81
    intStats:   { offset: 0x0148, count: 223, startId: 120 },  // ids 120-342
    lastMissionPassed: { offset: 0x0544, length: 8 }
  },

  /* Block 2 — PlayerPed. Weapons array located empirically: a
     brute-force scan for 28-byte "weapon slot" structures found
     13 consecutive plausible slots at relative offset 0x28 — and
     every single value made sense (Fist, Knife x1, six guns all
     at 99999 ammo, then Dildo/Parachute/Detonator at count 1),
     giving high confidence in both the offset and the weapon ID
     list it was cross-checked against. */
  WEAPONS: {
    index: 2,
    arrayOffset: 0x28,
    slotSize: 28,
    slotCount: 13,
    fields: {
      type: { offset: 0 },
      ammo: { offset: 12 }
    }
  },

  /* Block 3 — Garages. Verified against real save data: reads
     back exactly 50 garages (matches wiki), plausible vehicle
     model IDs in the storage slots, and garage definition names
     read back as genuine internal codes ("cjsafe", "beacsv",
     etc.) — strong confirmation of the byte layout. Only the 20
     garages with vehicle storage (4 slots each) are exposed here.

     Storage-car order in the save is interleaved, NOT sequential
     per garage — verified against a real save by checking that
     stored-car world positions cluster correctly per garage only
     under the interleaved formula (carSlot * garageCount +
     garageIndex), not the naive sequential one.

     There's no reliable "is this a storage garage" flag in the
     SaveGarage array — a byte at 0x00 that looked promising turned
     out (tested against a real save) to vary per-garage with no
     clean storage/non-storage split. Instead, real garage names
     are identified live per save by cross-matching each stored
     car's world position (also verified present at 0x00/0x04/0x08
     in the car struct) against each SaveGarage entry's own
     position — see gtasa-garages.js. */
  GARAGES: {
    index: 3,
    storedCarArrayOffset: 0x27,
    carSize: 0x40,
    garageCount: 20,
    slotsPerGarage: 4,
    carFields: {
      model: { offset: 0x12 },       // word
      colorPrimary: { offset: 0x32 },   // byte
      colorSecondary: { offset: 0x33 }, // byte
      radio: { offset: 0x36 },          // byte
      bombType: { offset: 0x39 },       // byte
      nitrousCount: { offset: 0x3B },   // byte
      position: { xOffset: 0x00, yOffset: 0x04, zOffset: 0x08 } // float x3
    },
    saveGarage: {
      countOffset: 0x0000,       // dword, "Number of Garages" (50 on a real save)
      arrayOffset: 0x1427,       // right after the StoredCar[20][4] array
      entrySize: 0x50,
      posOffset: 0x04,           // float x3 (x, y, z) — garage's own position
      nameOffset: 0x44,          // char[8] internal script name
      nameLength: 8
    }
  },

  /* Block 11 — Gang Weapons. Verified byte-for-byte against a
     real save: block size read back as exactly 160 bytes, which
     is precisely 10 gangs x 16 bytes — an exact match with zero
     slack, confirming both the gang count and slot size with no
     guesswork. First 4 bytes of each 16-byte gang entry are
     unused/reserved; the three weapon IDs follow. */
  GANGS: {
    index: 11,
    gangCount: 10,
    gangSize: 16,
    fields: {
      weapon1: { offset: 4 },
      weapon2: { offset: 8 },
      weapon3: { offset: 12 }
    }
  },

  /* Block 10 — Zones. Verified against real save data: the header
     counts (379 ZoneInfo / 378 ZonePop / 7 map.zon entries) plus
     the fixed-size arrays and trailing 104-byte fog/sector tail
     add up to *exactly* the block's real size (18,892 bytes,
     zero-byte discrepancy). The very first ZoneInfo entry reads
     back as "SAN_AND" — the whole-map zone the wiki itself uses
     as its example — and real gang-density values line up with
     documented gang turf (e.g. San Fierro Rifa density in the
     Battery Point zone). Only the ZonePop array (gang density +
     dealer density per zone) is exposed here — the ZoneInfo
     bounding-box arrays are map geometry, not useful to edit. */
  ZONES: {
    index: 10,
    header: {
      townOffset: 0,
      zoneInfo1CountOffset: 4,  // word
      zonePopCountOffset: 6,    // word
      zoneInfo2CountOffset: 8,  // word
      arraysStart: 10
    },
    zoneInfoSize: 0x20,   // 32 bytes — name[8] + gxt[8] + bounds + id/type/island
    zonePopSize: 0x11,    // 17 bytes — 10 gang densities + dealer + color + popcycle + ped
    gangCount: 10,
    zoneInfoFields: {
      name: { offset: 0, length: 8 },
      gxt: { offset: 8, length: 8 },
      x1: { offset: 0x10 }, y1: { offset: 0x12 }, z1: { offset: 0x14 },
      x2: { offset: 0x16 }, y2: { offset: 0x18 }, z2: { offset: 0x1A },
      id: { offset: 0x1C }
    },
    zonePopFields: {
      gangDensity: { offset: 0 },   // 10 consecutive bytes, one per gang
      dealerDensity: { offset: 10 }
    }
  },

  /* Block 20 — Tags. dword count + byte[count] paint value.
     Verified exactly against a real save: count reads 100 (correct),
     block size is 104 bytes (4 + 100), and every value read back as
     0xFF (255) on a 100%-complete save — i.e. fully sprayed. */
  TAGS: {
    index: 20,
    countOffset: 0,
    listOffset: 4,
    tagCount: 100,
    sprayedThreshold: 1 // any value > 0 means sprayed; 0xFF observed on real completed tags
  },

  /* Block 24 — Unique Stunt Jumps. dword count + StuntJump[count],
     0x44 (68) bytes each. Verified exactly against a real save:
     count reads 70 (correct), block size is 4,764 bytes
     (4 + 70*68), and reward/done/found fields read back sane real
     values ($500 reward, found=1, done=1 on a 100%-complete save). */
  JUMPS: {
    index: 24,
    countOffset: 0,
    listOffset: 4,
    jumpCount: 70,
    entrySize: 0x44,
    fields: {
      startPoint1: { offset: 0x00 }, // float[3]
      startPoint2: { offset: 0x0C }, // float[3]
      landPoint1:  { offset: 0x18 }, // float[3]
      landPoint2:  { offset: 0x24 }, // float[3]
      camera:      { offset: 0x30 }, // float[3]
      reward:      { offset: 0x3C, type: 'int32' },
      done:        { offset: 0x40 }, // byte bool
      found:       { offset: 0x41 } // byte bool
    }
  },

  /* Block 6 — Pickups. Fixed pool of 620 x 0x20-byte Pickup
     structs. Horseshoes/Oysters/Snapshots are NOT their own
     block — they live here, created by dedicated script opcodes
     (0959/095A/0958) rather than the generic create-pickup call.

     Verified with a matched pair of real saves: a fresh save (0%
     collectables) has all 150 present at their exact known
     coordinates with these exact model/type values; the same 150
     slots are completely absent (150/150) in a 100%-complete
     save. So presence at the known coordinate = not collected,
     absence = collected — confirmed both directions, not assumed.
     The "index" field reads a constant 2 across all three
     categories in every sample checked (not a per-item counter),
     which is what makes writing a fresh entry back safe. */
  PICKUPS: {
    index: 6,
    slotCount: 620,
    entrySize: 0x20,
    fields: {
      assetValue: { offset: 0x00 }, // float
      pointer:    { offset: 0x04 }, // dword, always 0 when not spawned in-world
      ammo:       { offset: 0x08 }, // dword
      timer:      { offset: 0x0C }, // dword
      x: { offset: 0x10 }, y: { offset: 0x12 }, z: { offset: 0x14 }, // int16, x8 scale
      assetRate: { offset: 0x16 }, // word
      model:     { offset: 0x18 }, // word
      pickupIndex: { offset: 0x1A, constant: 2 }, // word, always 2 for these 3 categories
      type:  { offset: 0x1C }, // byte
      flags: { offset: 0x1D }, // byte
      align: { offset: 0x1E }  // 2 bytes padding
    },
    coordScale: 8,
    categories: {
      horseshoes: { model: 954, type: 3 },
      oysters:    { model: 953, type: 3 },
      snapshots:  { model: 1253, type: 20 }
    },
    matchTolerance: 3 // world units; real matches land at 0.0 exactly
  }
};

window.ptSAE_BLOCKS = ptSAE_BLOCKS;
