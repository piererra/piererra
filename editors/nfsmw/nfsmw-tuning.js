/* ── nfsmw-tuning.js ────────────────────────────────────────
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Career car tuning: edit the 7 part levels (Tires, Brakes,
   Suspension, Transmission, Engine, Turbo, NOS) on cars you
   already own. Does NOT support changing which car model
   occupies a slot — that requires the much larger "add car"
   template/sidecar/visual system that this port intentionally
   leaves out.

   Each career vehicle (nfsmw-garage.js) links to its own parts
   block via a parts_slot byte. This file reads/writes that
   block directly; nfsmw-garage.js is updated separately to
   expose partsSlot on each garage entry.

   PC only — same reasoning as the CRC32 and Garage modules.
─────────────────────────────────────────────────────────── */

/* ── Parts block layout ── */
const MWE_PARTS_BLOCK_BASE       = 0x9CCD;
const MWE_PARTS_BLOCK_SLOT_BASE  = 31;   /* parts_slot numbering starts here */
const MWE_PARTS_BLOCK_SIZE       = 0x198;
const MWE_PARTS_MARKER_OFFSET    = 0x194;

const MWE_PART_LEVEL_OFFSETS = {
  Tires:        0x118,
  Brakes:       0x11C,
  Suspension:   0x120,
  Transmission: 0x124,
  Engine:       0x128,
  Turbo:        0x12C,
  NOS:          0x130,
};

const MWE_PART_NAMES = ['Tires', 'Brakes', 'Suspension', 'Transmission', 'Engine', 'Turbo', 'NOS'];


/* ── Confirmed per-model level caps ──
   Ported from the desktop editor's tuning_limits.py. Only
   models listed here can have their levels edited — anything
   else (cop cars, traffic, unresolved signatures) is left
   untouched rather than guessed at. ── */
const MWE_EARLY_TIER  = { Tires: 3, Brakes: 4, Suspension: 3, Transmission: 4, Engine: 4, Turbo: 3, NOS: 3 };
const MWE_MID_TIER    = { Tires: 2, Brakes: 3, Suspension: 2, Transmission: 3, Engine: 3, Turbo: 2, NOS: 3 };
const MWE_HIGH_TIER   = { Tires: 2, Brakes: 2, Suspension: 1, Transmission: 2, Engine: 2, Turbo: 1, NOS: 3 };
const MWE_EXOTIC_TIER = { Tires: 1, Brakes: 1, Suspension: 1, Transmission: 1, Engine: 1, Turbo: 1, NOS: 3 };

const MWE_MODEL_TUNING_LIMITS = {
  'Audi A3 Quattro':            MWE_EARLY_TIER,
  'Audi A4 Quattro':             MWE_EARLY_TIER,
  'Audi TT Quattro':             MWE_EARLY_TIER,
  'Cadillac CTS':                MWE_EARLY_TIER,
  'Chevrolet Cobalt SS':         MWE_EARLY_TIER,
  'Fiat Punto':                  MWE_EARLY_TIER,
  'Lexus IS300':                 MWE_EARLY_TIER,
  'Mazda RX-8':                  MWE_EARLY_TIER,
  'Mercedes SL 500':             MWE_EARLY_TIER,
  'Mitsubishi Eclipse':          MWE_EARLY_TIER,
  'Renault Clio V6':             MWE_EARLY_TIER,
  'Toyota Supra':                MWE_EARLY_TIER,
  'VW Golf GTI':                 MWE_EARLY_TIER,
  'Ford Mustang GT':             MWE_MID_TIER,
  'Lotus Elise':                 MWE_MID_TIER,
  'Mercedes CLK 500':            MWE_MID_TIER,
  'Mazda RX-7':                  MWE_MID_TIER,
  'Mitsubishi Lancer EVO VIII':  MWE_MID_TIER,
  'Pontiac GTO':                 MWE_MID_TIER,
  'Porsche 911 Carrera S':       MWE_MID_TIER,
  'Porsche Cayman S':            MWE_MID_TIER,
  'Subaru Impreza WRX STI':      MWE_MID_TIER,
  'Vauxhall Monaro VXR':         MWE_MID_TIER,
  'Aston Martin DB9':            MWE_MID_TIER,
  'Corvette C6':                 MWE_HIGH_TIER,
  'Dodge Viper SRT10':           MWE_HIGH_TIER,
  'Lamborghini Gallardo':        MWE_HIGH_TIER,
  'Porsche 911 Turbo S':         MWE_HIGH_TIER,
  'Ford GT':                     MWE_EXOTIC_TIER,
  'Lamborghini Murcielago':      MWE_EXOTIC_TIER,
  'Mercedes SLR McLaren':        MWE_EXOTIC_TIER,
  'Porsche Carrera GT':          MWE_EXOTIC_TIER,
};

function mweGetTuningLimits(modelName) {
  return MWE_MODEL_TUNING_LIMITS[modelName] || null;
}


/* ── Availability / block resolution ── */
function mweTuningAvailable() {
  return !!ptMWE.buffer;
}

function mwePartsBlockAbsOff(partsSlot) {
  const slot = partsSlot | 0;
  if (slot < MWE_PARTS_BLOCK_SLOT_BASE) return null;
  const absOff = MWE_PARTS_BLOCK_BASE + (slot - MWE_PARTS_BLOCK_SLOT_BASE) * MWE_PARTS_BLOCK_SIZE;
  if (absOff + MWE_PARTS_BLOCK_SIZE > ptMWE.buffer.byteLength) return null;
  return absOff;
}

/* Confirms the block's own marker agrees this slot is really
   occupied by parts_slot's data, guarding against a stale or
   mismatched parts_slot byte pointing at the wrong block. */
function mwePartsBlockMarkerValid(partsSlot, absOff) {
  const slot = partsSlot & 0xFF;
  const m0 = mweGetU8(absOff + MWE_PARTS_MARKER_OFFSET);
  const m1 = mweGetU8(absOff + MWE_PARTS_MARKER_OFFSET + 1);
  const m2 = mweGetU8(absOff + MWE_PARTS_MARKER_OFFSET + 2);
  const m3 = mweGetU8(absOff + MWE_PARTS_MARKER_OFFSET + 3);
  return m0 === slot && m1 === 0xCD && m2 === 0xCD && m3 === 0xCD;
}


/* ── Read all 7 part levels for a parts_slot ──
   Returns null if the slot is out of range or its marker
   doesn't check out (i.e. nothing safe to show/edit). ── */
function mweGetPartLevels(partsSlot) {
  if (!mweTuningAvailable()) return null;
  const absOff = mwePartsBlockAbsOff(partsSlot);
  if (absOff === null || !mwePartsBlockMarkerValid(partsSlot, absOff)) return null;

  const levels = {};
  MWE_PART_NAMES.forEach(function (name) {
    levels[name] = mweGetU32(absOff + MWE_PART_LEVEL_OFFSETS[name]);
  });
  return levels;
}


/* ── Write one part's level, clamped to the model's confirmed cap ──
   Returns { ok, value } on success, or { ok: false, error } if the
   slot/model/part isn't in a state we trust enough to write. ── */
function mweSetPartLevel(partsSlot, partName, level, modelName) {
  if (!mweTuningAvailable()) return { ok: false, error: 'Tuning is available for PC saves only.' };

  const absOff = mwePartsBlockAbsOff(partsSlot);
  if (absOff === null || !mwePartsBlockMarkerValid(partsSlot, absOff)) {
    return { ok: false, error: 'Parts block for this car could not be verified.' };
  }

  const offset = MWE_PART_LEVEL_OFFSETS[partName];
  if (offset === undefined) return { ok: false, error: 'Unsupported part: ' + partName };

  const limits = mweGetTuningLimits(modelName);
  if (!limits) return { ok: false, error: 'No confirmed tuning caps for ' + modelName + '.' };

  const cap = limits[partName] !== undefined ? limits[partName] : 0;
  let wanted = level | 0;
  if (wanted < 0) wanted = 0;
  if (wanted > cap) wanted = cap;

  mweSetU32(absOff + offset, wanted);
  mweRehash();
  return { ok: true, value: wanted };
}
