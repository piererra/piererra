/* ============================================================
   gtasa-zones-names-data.js — GTA SA Save Editor · Zone Names
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Internal zone codes (as stored in the save, e.g. "GAN1") ->
   real in-game location names (e.g. "Ganton"). Sourced from
   Sanny Builder's public SCM documentation
   (docs.sannybuilder.com/scm-documentation/sa/zones) and cross-
   checked against codes decoded directly from a real save file
   (SUNMA, SUNNN, BATTP, PARA, CIVI, BAYV, CITYS, OCEAF1-3,
   SILLY3/4, HASH, JUNIHO, ESPN1-3, FINA, CALT all matched
   exactly). A code not in this table (rare — e.g. a top-level
   "whole state" marker entry) falls back to showing the raw
   code rather than guessing — see gtasa-zones.js.
============================================================ */

'use strict';

const ptSAE_ZONE_NAMES = {
  // Los Santos
  LA: 'Los Santos',
  RIH1a: 'Richman', RIH1b: 'Richman', RIH2: 'Richman', RIH3a: 'Richman', RIH3b: 'Richman',
  RIH4: 'Richman', RIH5a: 'Richman', RIH5b: 'Richman', RIH6a: 'Richman', RIH6b: 'Richman',
  MUL1a: 'Mulholland', MUL1b: 'Mulholland', MUL1c: 'Mulholland', MUL2a: 'Mulholland', MUL2b: 'Mulholland',
  MUL3: 'Mulholland', MUL4: 'Mulholland', MUL5a: 'Mulholland', MUL5b: 'Mulholland', MUL5c: 'Mulholland',
  MUL6: 'Mulholland', MUL7a: 'Mulholland', MUL7b: 'Mulholland',
  MULINT: 'Mulholland Intersection',
  SUN1: 'Temple', SUN2: 'Temple', SUN3a: 'Temple', SUN3b: 'Temple', SUN3c: 'Temple', SUN4: 'Temple',
  CHC1a: 'Las Colinas', CHC1b: 'Las Colinas', CHC2a: 'Las Colinas', CHC2b: 'Las Colinas',
  CHC3: 'Las Colinas', CHC4a: 'Las Colinas', CHC4b: 'Las Colinas',
  VIN1a: 'Vinewood', VIN1b: 'Vinewood', VIN2: 'Vinewood', VIN3: 'Vinewood',
  LDT1a: 'Downtown Los Santos', LDT1b: 'Downtown Los Santos', LDT1c: 'Downtown Los Santos',
  LDT3: 'Downtown Los Santos', LDT4: 'Downtown Los Santos', LDT5: 'Downtown Los Santos',
  LDT6: 'Downtown Los Santos', LDT7: 'Downtown Los Santos', LDT8: 'Downtown Los Santos',
  GLN1: 'Glen Park', GLN1b: 'Glen Park', GLN2a: 'Glen Park',
  LFL1a: 'Los Flores', LFL1b: 'Los Flores',
  MKT1: 'Market', MKT2: 'Market', MKT3: 'Market', MKT4: 'Market',
  MARKST: 'Market Station',
  JEF1a: 'Jefferson', JEF1b: 'Jefferson', JEF2: 'Jefferson', JEF3a: 'Jefferson', JEF3b: 'Jefferson', JEF3c: 'Jefferson',
  ROD1a: 'Rodeo', ROD1b: 'Rodeo', ROD1c: 'Rodeo', ROD2a: 'Rodeo', ROD2b: 'Rodeo',
  ROD3a: 'Rodeo', ROD3b: 'Rodeo', ROD4a: 'Rodeo', ROD4b: 'Rodeo', ROD4c: 'Rodeo', ROD5a: 'Rodeo', ROD5b: 'Rodeo',
  MAR1: 'Marina', MAR2: 'Marina', MAR3: 'Marina',
  THALL1: 'Commerce', COM1a: 'Commerce', COM1b: 'Commerce', COM2: 'Commerce', COM3: 'Commerce', COM4: 'Commerce',
  ELS1a: 'East Los Santos', ELS1b: 'East Los Santos', ELS2: 'East Los Santos',
  ELS3a: 'East Los Santos', ELS3b: 'East Los Santos', ELS3c: 'East Los Santos', ELS4: 'East Los Santos',
  EBE1: 'East Beach', EBE2a: 'East Beach', EBE2b: 'East Beach', EBE3c: 'East Beach',
  PER1: 'Pershing Square',
  IWD1: 'Idlewood', IWD2: 'Idlewood', IWD3a: 'Idlewood', IWD3b: 'Idlewood', IWD4: 'Idlewood', IWD5: 'Idlewood',
  GAN1: 'Ganton', GAN2: 'Ganton',
  CONF1a: 'Conference Center', CONF1b: 'Conference Center',
  CITYS: 'City Hall',
  LMEX1a: 'Little Mexico', LMEX1b: 'Little Mexico',
  UNITY: 'Unity Station',
  SMB1: 'Santa Maria Beach', SMB2: 'Santa Maria Beach',
  VERO1: 'Verona Beach', VERO2: 'Verona Beach', VERO3: 'Verona Beach', VERO4a: 'Verona Beach', VERO4b: 'Verona Beach',
  LIND1a: 'Willowfield', LIND1b: 'Willowfield', LIND2a: 'Willowfield', LIND2b: 'Willowfield',
  LIND3: 'Willowfield', LIND4a: 'Willowfield', LIND4c: 'Willowfield',
  ELCO1: 'El Corona', ELCO2: 'El Corona',
  PLS: 'Playa del Seville',
  BLUF1a: 'Verdant Bluffs', BLUF1b: 'Verdant Bluffs', BLUF2: 'Verdant Bluffs',
  LAIR1: 'Los Santos International', LAIR2a: 'Los Santos International', LAIR2b: 'Los Santos International',
  LBAG1: 'Los Santos International', LBAG2: 'Los Santos International', LBAG3: 'Los Santos International',
  LDOC1a: 'Ocean Docks', LDOC1b: 'Ocean Docks', LDOC2: 'Ocean Docks',
  LDOC3a: 'Ocean Docks', LDOC3b: 'Ocean Docks', LDOC3c: 'Ocean Docks', LDOC4: 'Ocean Docks',

  // Red County
  RED: 'Red County',
  MONT: 'Montgomery', MONT1: 'Montgomery',
  MONINT: 'Montgomery Intersection',
  HBARNS: 'Hampton Barns',
  HANKY: 'Hankypanky Point',
  BLUAC: 'Blueberry Acres',
  FERN: 'Fern Ridge',
  PANOP: 'The Panopticon',
  PALO: 'Palomino Creek',
  BLUEB: 'Blueberry', BLUEB1: 'Blueberry',
  TOPFA: 'Hilltop Farm',
  NROCK: 'North Rock',
  DILLI: 'Dillimore',

  // San Fierro
  SF: 'San Fierro',
  BATTP: 'Battery Point',
  ESPN1: 'Esplanade North', ESPN2: 'Esplanade North', ESPN3: 'Esplanade North',
  ESPE1: 'Esplanade East', ESPE2: 'Esplanade East', ESPE3: 'Esplanade East',
  JUNIHO: 'Juniper Hollow',
  SFDWT1: 'Downtown', SFDWT2: 'Downtown', SFDWT3: 'Downtown', SFDWT4: 'Downtown', SFDWT5: 'Downtown', SFDWT6: 'Downtown',
  PARA: 'Paradiso',
  CALT: 'Calton Heights',
  FINA: 'Financial',
  BAYV: 'Palisades',
  JUNIHI: 'Juniper Hill',
  CHINA: 'Chinatown',
  CIVI: 'Santa Flora',
  WESTP1: 'Queens', WESTP2: 'Queens', WESTP3: 'Queens',
  THEA1: "King's", THEA2: "King's", THEA3: "King's",
  EASB1: 'Easter Basin', EASB2: 'Easter Basin',
  GARC: 'Garcia', SFGLF3: 'Garcia',
  CRANB: 'Cranberry Station',
  OCEAF1: 'Ocean Flats', OCEAF2: 'Ocean Flats', OCEAF3: 'Ocean Flats',
  HASH: 'Hashbury',
  DOH1: 'Doherty', DOH2: 'Doherty',
  SFBAG1: 'Easter Bay Airport', SFBAG2: 'Easter Bay Airport', SFBAG3: 'Easter Bay Airport',
  SFAIR1: 'Easter Bay Airport', SFAIR2: 'Easter Bay Airport', SFAIR3: 'Easter Bay Airport',
  SFAIR4: 'Easter Bay Airport', SFAIR5: 'Easter Bay Airport',

  // Flint County
  FLINTC: 'Flint County',
  CUNTC1: 'Avispa Country Club', CUNTC2: 'Avispa Country Club', CUNTC3: 'Avispa Country Club',
  SFGLF1: 'Avispa Country Club', SFGLF2: 'Avispa Country Club', SFGLF4: 'Avispa Country Club',
  HAUL: 'Fallen Tree',
  HILLP: 'Missionary Hill',
  EBAY: 'Easter Bay Chemical', EBAY2: 'Easter Bay Chemical',
  ETUNN: 'Easter Tunnel',
  SILLY1: 'Foster Valley', SILLY2: 'Foster Valley', SILLY3: 'Foster Valley', SILLY4: 'Foster Valley',
  FARM: 'The Farm',
  BEACO: 'Beacon Hill',
  FLINTI: 'Flint Intersection',
  FLINTR: 'Flint Range',
  LEAFY: 'Leafy Hollow',
  BACKO: 'Back o Beyond',

  // Whetstone
  WHET: 'Whetstone',
  MTCHI1: 'Mount Chiliad', MTCHI2: 'Mount Chiliad', MTCHI3: 'Mount Chiliad', MTCHI4: 'Mount Chiliad',
  CREEK: 'Shady Creeks', CREEK1: 'Shady Creeks',
  SHACA: 'Shady Cabin',
  ANGPI: 'Angel Pine',

  // Las Venturas
  VE: 'Las Venturas',
  YBELL1: 'Yellow Bell Golf Course', YBELL2: 'Yellow Bell Golf Course',
  SPIN: 'Spinybed',
  KACC: 'K.A.C.C. Military Fuels',
  PRP1: 'Prickle Pine', PRP2: 'Prickle Pine', PRP3: 'Prickle Pine', PRP4: 'Prickle Pine',
  YELLOW: 'Yellow Bell Station',
  JTN1: 'Julius Thruway North', JTN2: 'Julius Thruway North', JTN3: 'Julius Thruway North', JTN4: 'Julius Thruway North',
  JTN5: 'Julius Thruway North', JTN6: 'Julius Thruway North', JTN7: 'Julius Thruway North', JTN8: 'Julius Thruway North',
  PINT: 'Pilson Intersection',
  ISLE: 'The Emerald Isle',
  ROCE1: 'Roca Escalante', ROCE2: 'Roca Escalante',
  WWE: 'Whitewood Estates', WWE1: 'Whitewood Estates',
  OVS: 'Old Venturas Strip',
  CREE: 'Creek',
  REDE1: 'Redsands East', REDE2: 'Redsands East', REDE3: 'Redsands East',
  REDW1: 'Redsands West', REDW2: 'Redsands West', REDW3: 'Redsands West', REDW4: 'Redsands West',
  HGP: 'Harry Gold Parkway',
  STRIP1: 'The Strip', STRIP2: 'The Strip', STRIP3: 'The Strip', STRIP4: 'The Strip',
  JTW1: 'Julius Thruway West', JTW2: 'Julius Thruway West',
  VISA1: 'The Visage', VISA2: 'The Visage',
  STAR1: 'Starfish Casino', STAR2: 'Starfish Casino', CONST1: 'Starfish Casino',
  RING: "The Clown's Pocket",
  SRY: 'Sobell Rail Yards',
  JTE1: 'Julius Thruway East', JTE2: 'Julius Thruway East', JTE3: 'Julius Thruway East', JTE4: 'Julius Thruway East',
  BFLD1: 'Blackfield', BFLD2: 'Blackfield',
  CALI1: "Caligula's Palace", CALI2: "Caligula's Palace",
  VAIR1: 'Las Venturas Airport', VAIR2: 'Las Venturas Airport', VAIR3: 'Las Venturas Airport', LVBAG: 'Las Venturas Airport',
  PIRA: "Pirates in Men's Pants",
  ROY: 'Royal Casino',
  PILL1: 'Pilgrim', PILL2: 'Pilgrim',
  LST: 'Linden Station', LINDEN: 'Linden Station',
  HIGH: 'The High Roller',
  PINK: 'The Pink Swan',
  CAM: "The Camel's Toe",
  GGC1: 'Greenglass College', GGC2: 'Greenglass College',
  LDS: 'Linden Side',
  LVA1: 'LVA Freight Depot', LVA2: 'LVA Freight Depot', LVA3: 'LVA Freight Depot', LVA4: 'LVA Freight Depot', LVA5: 'LVA Freight Depot',
  DRAG: 'The Four Dragons Casino',
  LOT: 'Come-A-Lot',
  BINT1: 'Blackfield Intersection', BINT2: 'Blackfield Intersection', BINT3: 'Blackfield Intersection', BINT4: 'Blackfield Intersection',
  JTS1: 'Julius Thruway South', JTS2: 'Julius Thruway South',
  BFC1: 'Blackfield Chapel', BFC2: 'Blackfield Chapel',
  RIE: 'Randolph Industrial Estate',
  LDM: 'Last Dime Motel',
  RSE: 'Rockshore East',
  RSW1: 'Rockshore West', RSW2: 'Rockshore West',

  // Tierra Robada
  ROBAD: 'Tierra Robada', ROBAD1: 'Tierra Robada',
  ELQUE: 'El Quebrados',
  SUNNN: 'Bayside',
  BYTUN: 'Bayside Tunnel',
  ALDEA: 'Aldea Malvada',
  SUNMA: 'Bayside Marina',
  BARRA: 'Las Barrancas',
  ROBINT: 'Robada Intersection',

  // Bone County
  BONE: 'Bone County',
  PAYAS: 'Las Payasadas',
  VALLE: 'Valle Ocultado',
  ELCA: 'El Castillo del Diablo', ELCA1: 'El Castillo del Diablo', ELCA2: 'El Castillo del Diablo',
  ARCO: 'Arco del Oeste',
  MEAD: 'Verdant Meadows',
  BRUJA: 'Las Brujas',
  TOM: 'Regular Tom',
  REST: 'Restricted Area',
  BIGE: "'The Big Ear'",
  PALMS: 'Green Palms',
  OCTAN: 'Octane Springs',
  PROBE: "Lil' Probe Inn",
  CARSO: 'Fort Carson',
  QUARY: 'Hunter Quarry',

  // Lakes
  LSINL: 'Los Santos Inlet',
  FLINW: 'Flint Water',
  FISH: "Fisher's Lagoon",
  SANB1: 'San Fierro Bay', SANB2: 'San Fierro Bay',
  SHERR: 'Sherman Reservoir',
  SASO: 'San Andreas Sound',

  // Bridges
  GANTB: 'Gant Bridge', GANTB1: 'Gant Bridge',
  DAM: 'The Sherman Dam',
  GARV: 'Garver Bridge', GARV1: 'Garver Bridge', GARV2: 'Garver Bridge',
  KINC: 'Kincaid Bridge', KINC1: 'Kincaid Bridge', KINC2: 'Kincaid Bridge',
  FALLO: 'Fallow Bridge',
  MART: 'Martin Bridge',
  MAKO: 'The Mako Span',
  FRED: 'Frederick Bridge'
};

window.ptSAE_ZONE_NAMES = ptSAE_ZONE_NAMES;

// The save always stores zone codes in uppercase, but a handful of
// codes in the source table use a lowercase suffix letter (e.g.
// "RIH1a") — normalize to an uppercase-keyed lookup so those still
// match instead of silently falling back to the raw code.
window.ptSAE_ZONE_NAMES_UPPER = Object.keys(ptSAE_ZONE_NAMES).reduce((map, key) => {
  map[key.toUpperCase()] = ptSAE_ZONE_NAMES[key];
  return map;
}, {});
