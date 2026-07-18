/* ============================================================
   gtasa-weapons-data.js — GTA SA Save Editor · Weapon ID Reference
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Standard GTA SA weapon type IDs (0-46). IDs 19-21 are unused
   by the game (vehicle missile / Hydra flare / jetpack — not
   real inventory items) and omitted from the picker.
============================================================ */

'use strict';

const ptSAE_WEAPON_NAMES = {
  0: 'Fist', 1: 'Brass Knuckles', 2: 'Golf Club', 3: 'Nightstick', 4: 'Knife',
  5: 'Baseball Bat', 6: 'Shovel', 7: 'Pool Cue', 8: 'Katana', 9: 'Chainsaw',
  10: 'Purple Dildo', 11: 'Short Vibrator', 12: 'Long Vibrator', 13: 'White Dildo',
  14: 'Flowers', 15: 'Cane',
  16: 'Grenades', 17: 'Tear Gas', 18: 'Molotov Cocktail',
  22: '9mm Pistol', 23: 'Silenced Pistol', 24: 'Desert Eagle',
  25: 'Shotgun', 26: 'Sawn-off Shotgun', 27: 'Combat Shotgun',
  28: 'Micro Uzi (Mac 10)', 29: 'MP5', 32: 'Tec-9',
  30: 'AK-47', 31: 'M4',
  33: 'Country Rifle', 34: 'Sniper Rifle',
  35: 'RPG', 36: 'Heat-Seeking Rocket Launcher', 37: 'Flamethrower', 38: 'Minigun',
  39: 'Satchel Charges', 40: 'Detonator',
  41: 'Spray Can', 42: 'Fire Extinguisher', 43: 'Camera',
  44: 'Night Vision Goggles', 45: 'Thermal Goggles', 46: 'Parachute'
};

/* Slot order matches the 13 slots as stored in the save. */
const ptSAE_WEAPON_SLOT_LABELS = [
  'Slot 1 — Hand', 'Slot 2 — Melee', 'Slot 3 — Handguns', 'Slot 4 — Shotguns',
  'Slot 5 — Sub-machine Guns', 'Slot 6 — Assault Rifles', 'Slot 7 — Rifles',
  'Slot 8 — Heavy Weapons', 'Slot 9 — Projectiles', 'Slot 10 — Special 1',
  'Slot 11 — Gifts', 'Slot 12 — Special 2', 'Slot 13 — Satchel Detonator'
];

window.ptSAE_WEAPON_NAMES = ptSAE_WEAPON_NAMES;
window.ptSAE_WEAPON_SLOT_LABELS = ptSAE_WEAPON_SLOT_LABELS;
