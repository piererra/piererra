/* ── nfsmw-garage.js ────────────────────────────────────────
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Career garage: resolves real car names for career-linked
   vehicles, exposes a Pink Slip toggle, and a total-bounty stat.

   This reads the CAREER VEHICLE block (base 0x6219, 0x14 bytes/
   record) which is a *different* memory region from the one
   nfsmw-core.js already parses into ptMWE.cars (base 0xE2ED —
   that block holds per-slot bounty/infractions, not car identity).
   The two are linked here by career-slot index.

   "My Cars" (non-career garage vehicles) are intentionally
   skipped — this module only surfaces career-linked vehicles.

   PC only: these offsets come from the NFSMW PC v1.3 (MC02)
   layout.
─────────────────────────────────────────────────────────── */

/* ── Vehicle signature → display name lookup ──
   Keys are uppercase hex (no spaces) of the 8-byte car
   signature stored in each career vehicle record. */
const MWE_CAR_SIGNATURES = {
  'BBD92AE3BBD92AE3': 'Mercedes SLR McLaren',
  '9E5765019E576501': 'Corvette C6.R',
  '7B4BF6F8BF427E9B': 'Audi A4 Quattro',
  'EAA5C042EAA5C042': 'Ford GT',
  'AF2DC3C1C71A47A7': 'Dumptruck',
  '33C8098E33C8098E': 'Mazda RX-7',
  'BBB500A8BBB500A8': 'Mercedes SL 500',
  'CF82E522E48C1146': 'Corvette C6',
  '4E4ACC23F8E0DA39': 'BMW M3 GTR (slow version)',
  'AF2DC3C1AE75E628': 'Cop SUV',
  '929986C4D43D0667': 'Porsche Carrera GT',
  'DAA74D3CDAA74D3C': 'Porsche 911 Carrera S',
  'AF2DC3C195DC4969': 'Cop GTO',
  '36493D3136493D31': 'Lotus Elise',
  'AF2DC3C1D8E0EC71': 'Civilcar Van',
  'AF2DC3C1F11AF07A': 'Taxi',
  '7BC1727BE514C4D5': 'Audi A3 Quattro',
  'C88B3A19C88B3A19': 'Audi TT Quattro',
  '534B0579534B0579': 'VW Golf GTI',
  'BD0BD7A2BD0BD7A2': 'Mitsubishi Eclipse',
  'EB6718EBEB6718EB': 'Renault Clio V6',
  '9540785A9540785A': 'Chevrolet Cobalt SS',
  'EB77CDC1EB77CDC1': 'Lamborghini Murcielago',
  'AF2DC3C149393B74': 'Civilcar Pickup',
  '4E4ACC23B35F084E': 'BMW M3 GTR',
  '2FAF77822FAF7782': 'Mercedes CLK 500',
  '4DFD939B4DFD939B': 'Ford Mustang GT',
  'EB5B5541EB5B5541': 'Porsche Cayman S',
  '117AEEA6117AEEA6': 'Fiat Punto',
  'AF2DC3C1F57E6670': 'Cop',
  '206518DF206518DF': 'Cadillac CTS',
  'A1E1D3D8A1E1D3D8': 'Vauxhall Monaro VXR',
  'A1F94771A1F94771': 'Mercedes SL65 AMG',
  '6FF43E9B6FF43E9B': 'Porsche 911 GT2',
  '0BC42C7B0BC42C7B': 'Lamborghini Gallardo',
  '3434F1663434F166': 'Toyota Supra',
  '34898C190D563B5F': 'Subaru Impreza WRX STI',
  'B6FBEECCB6FBEECC': 'Mitsubishi Lancer EVO VIII',
  'AF2DC3C1FAFFD951': 'Cementtruck',
  'AF2DC3C1645FDCF9': 'Ford Mustang GT?',
  'C63D48AAC63D48AA': 'Pontiac GTO',
  '08D4BE6E08D4BE6E': 'Dodge Viper SRT10',
  '1945949019459490': 'Chevrolet Camaro SS',
  'AF2DC3C14BC7F2C5': 'Pizza',
  '6A1CB6A46A1CB6A4': 'Aston Martin DB9',
  '374433D6374433D6': 'Mazda RX-8',
  'A6FEC2813F0888CD': 'BMW M3 Street Version',
  'B02FFF5BB02FFF5B': 'Lexus IS300',
  '8D5B7DD28D5B7DD2': 'Porsche 911 Turbo S',
  'AF2DC3C10C076C8F': 'Cop Corvette',
};

function mweResolveCarName(sigHex) {
  return MWE_CAR_SIGNATURES[sigHex.toUpperCase()] || null;
}


/* ── Layout constants (PC only) ── */
const MWE_CVEH_BASE       = 0x6219;
const MWE_CVEH_SIZE       = 0x14;
const MWE_CVEH_SIG_OFF    = 0x04;
const MWE_CVEH_SIG_SIZE   = 0x08;
const MWE_CVEH_FLAGS_OFF  = 0x0C;
const MWE_CVEH_PARTS_SLOT_OFF = 0x10; /* links to the tuning parts block (nfsmw-tuning.js) */
const MWE_CVEH_SLOT_OFF   = 0x11;
const MWE_CVEH_CANARY_OFF = 0x12; /* two bytes, expected 0xCD 0xCD on every populated row */

const MWE_EMPTY_CAR_NUMBER  = 0xFFFFFFFF;
const MWE_EMPTY_CAREER_SLOT = 0xFF;
const MWE_CAREER_FLAG       = 0x02;
const MWE_MY_CARS_FLAG      = 0x04; /* used only to recognize/skip My Cars rows */
const MWE_PINK_SLIP_FLAG    = 0x40;


function mweGarageAvailable() {
  return !!ptMWE.buffer;
}

function mweHexSig(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s.toUpperCase();
}


/* ── Read every populated career-vehicle record ── */
function mweReadCareerVehicles() {
  if (!mweGarageAvailable()) return [];

  const records = [];
  let base = MWE_CVEH_BASE;
  const len = ptMWE.buffer.byteLength;

  while (base + MWE_CVEH_SIZE <= len) {
    const canaryA = mweGetU8(base + MWE_CVEH_CANARY_OFF);
    const canaryB = mweGetU8(base + MWE_CVEH_CANARY_OFF + 1);
    if (canaryA !== 0xCD || canaryB !== 0xCD) break;

    const carNumber = mweGetU32(base);
    const sigBytes = new Uint8Array(ptMWE.buffer, base + MWE_CVEH_SIG_OFF, MWE_CVEH_SIG_SIZE);
    const sigIsZero = sigBytes.every(b => b === 0);
    const careerSlot = mweGetU8(base + MWE_CVEH_SLOT_OFF);
    const partsSlot = mweGetU8(base + MWE_CVEH_PARTS_SLOT_OFF);
    const flags = mweGetU16(base + MWE_CVEH_FLAGS_OFF);

    if (carNumber !== MWE_EMPTY_CAR_NUMBER && !sigIsZero) {
      records.push({
        carNumber,
        sigHex: mweHexSig(sigBytes),
        careerSlot,
        partsSlot,
        flags,
        absOff: base,
      });
    }
    base += MWE_CVEH_SIZE;
  }
  return records;
}


/* ── Career-linked vehicles only (My Cars / unlinked rows skipped) ──
   Joins against ptMWE.cars (parsed in nfsmw-core.js) by slot index
   to pull each vehicle's bounty from the 0xE2ED block. ── */
function mweGetGarageSlots() {
  return mweReadCareerVehicles()
    .filter(r => r.careerSlot !== MWE_EMPTY_CAREER_SLOT)
    .map(r => {
      const linkedCar = (ptMWE.cars || []).find(c => c.index === r.careerSlot);
      let sourceKind = 'Unknown (0x' + r.flags.toString(16).toUpperCase() + ')';
      if (r.flags === MWE_CAREER_FLAG) sourceKind = 'Career';
      else if (r.flags === (MWE_CAREER_FLAG | MWE_PINK_SLIP_FLAG)) sourceKind = 'Pink Slip';

      return {
        careerSlot: r.careerSlot,
        partsSlot: r.partsSlot,
        displayName: mweResolveCarName(r.sigHex) || ('Unknown vehicle (sig ' + r.sigHex + ')'),
        sourceKind,
        bounty: linkedCar ? linkedCar.bounty : 0,
        flags: r.flags,
        absOff: r.absOff,
      };
    })
    .sort((a, b) => a.careerSlot - b.careerSlot);
}


/* ── Pink Slip toggle ──
   Only valid on rows whose current flags are exactly CAREER
   or CAREER|PINK_SLIP — anything else is left untouched. ── */
function mweSetPinkSlip(absOff, currentFlags, enabled) {
  if (currentFlags !== MWE_CAREER_FLAG && currentFlags !== (MWE_CAREER_FLAG | MWE_PINK_SLIP_FLAG)) {
    return false;
  }
  const newFlags = enabled
    ? (currentFlags | MWE_PINK_SLIP_FLAG)
    : (currentFlags & ~MWE_PINK_SLIP_FLAG);
  mweSetU16(absOff + MWE_CVEH_FLAGS_OFF, newFlags);
  mweRehash();
  return true;
}


/* ── Total bounty across all career-linked garage vehicles ── */
function mweGetTotalCareerBounty() {
  return mweGetGarageSlots().reduce((sum, s) => sum + s.bounty, 0);
}
