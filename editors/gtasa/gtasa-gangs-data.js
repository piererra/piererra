/* ============================================================
   gtasa-gangs-data.js — GTA SA Save Editor · Gang Reference
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Gang index order (0-9), verified against Sanny Builder's SCM
   documentation for opcode 0237 (set_gang weapons) — the same
   index order used for gang density in Block 10 (Zones). Cross-
   checked against a real save: index 3 (San Fierro Rifa) had
   the only non-zero density in the "Battery Point" zone, which
   matches the gang's documented turf exactly.
   Indices 8-9 are unused by the retail game but still present
   in the save structure, so they're included for completeness.
============================================================ */

'use strict';

const ptSAE_GANG_NAMES = {
  0: 'Ballas',
  1: 'Grove Street Families',
  2: 'Los Santos Vagos',
  3: 'San Fierro Rifa',
  4: 'Da Nang Boys',
  5: 'Mafia',
  6: 'Mountain Cloud Triad',
  7: 'Varrio Los Aztecas',
  8: 'Gang 9 (unused)',
  9: 'Gang 10 (unused)'
};

window.ptSAE_GANG_NAMES = ptSAE_GANG_NAMES;
