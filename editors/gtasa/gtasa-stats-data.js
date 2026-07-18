/* ============================================================
   gtasa-stats-data.js — GTA SA Save Editor · Stat ID Reference
   Author  : Piererra
   Project : Piererra Tools
   ──────────────────────────────────────────────────────────
   Source: GTAMods Wiki, "List of statistics (SA)" (CC-BY 4.0).
   IDs 0–81 are FLOAT stats, IDs 120–342 are INT stats.
   IDs 82–119 are unused by the game and omitted here.
   Verified against real save files — territories, unique jumps,
   horseshoes/oysters/snapshots, and skill levels all matched a
   known-complete save's own documentation exactly.
============================================================ */

'use strict';

const ptSAE_FLOAT_STATS = [
  'Progress made', 'Total progress', 'Furthest Hoop', 'Distance travelled on foot',
  'Distance travelled by car', 'Distance travelled by motorbike', 'Distance travelled by boat',
  'Distance travelled by golf cart', 'Distance travelled by helicopter', 'Distance travelled by plane',
  'Longest Wheelie distance', 'Longest Stoppie distance', 'Longest 2 wheels distance',
  'Weapon Budget', 'Fashion Budget', 'Property Budget', 'Auto Repair and Painting Budget',
  'Longest Wheelie time', 'Longest Stoppie time', 'Longest 2 wheels time', 'Food Budget',
  'Fat', 'Stamina', 'Muscle', 'Max Health', 'Sex appeal', 'Distance travelled by swimming',
  'Distance travelled by bicycle', 'Distance travelled on treadmill', 'Distance travelled on exercise bike',
  'Tattoo budget', 'Hairdressing budget', 'Girlfriend budget', 'Prostitute budget', 'Furniture budget',
  'Money spent gambling', 'Money made from pimping', 'Money won gambling', 'Biggest gambling win',
  'Biggest gambling loss', 'Largest burglary swag', 'Money made from burglary',
  'Money spent building property', null, 'Longest treadmill time', 'Longest exercise bike time',
  'Heaviest weight on bench press', 'Heaviest weight on dumbbells', 'Best time in 8-Track',
  'BMX best time', 'Lightest weight', 'Longest chase time with 5+ stars', 'Last chase time with 5+ stars',
  'Wage bill', 'Strip club budget', 'Car modification budget', 'Time spent shopping',
  'Time spent gambling', 'Time spent on longest mission', 'Time spent on quickest mission',
  'Average mission time', 'Drugs budget', 'Total shopping budget', 'Time spent underwater',
  'Total respect', 'Girlfriend respect', 'Clothes respect', 'Fitness respect', 'Respect',
  'Pistol Skill', 'Silenced Pistol Skill', 'Desert Eagle Skill', 'Shotgun Skill',
  'Sawn-Off Shotgun Skill', 'Combat Shotgun Skill', 'Machine Pistol Skill', 'SMG Skill',
  'AK-47 Skill', 'M4 Skill', 'Rifle Skill', 'Appearance', 'Gambling'
];

/* Weapon + movement skills worth surfacing as sliders (float stat IDs) */
const ptSAE_SKILL_IDS = [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];

/* Int stats — keyed by ID (120-342), sparse map since many IDs are
   niche/internal. Only meaningful, user-facing ones are included;
   anything omitted here still exists in the save but isn't shown. */
const ptSAE_INT_STATS = {
  120: 'People wasted by others', 121: "People you've wasted", 122: 'Road vehicles destroyed',
  123: 'Boats destroyed', 124: 'Planes & helicopters destroyed', 125: 'Cost of property damaged',
  126: 'Bullets fired', 127: 'Kgs of explosives used', 128: 'Bullets that hit',
  129: 'Tires popped with gunfire', 130: 'Number of headshots',
  131: 'Total wanted stars attained', 132: 'Total wanted stars evaded', 133: 'Times busted',
  134: 'Days passed in game', 135: 'Hospital visits', 136: 'Safehouse visits',
  137: 'Times cheated', 138: 'Vehicle resprays',
  144: 'Unique Jumps found', 145: 'Unique Jumps done',
  146: 'Mission attempts', 147: 'Missions passed', 148: 'Total missions in game',
  157: 'Highest Vigilante Mission level', 158: 'Highest Paramedic Mission level',
  159: 'Highest Firefighter Mission level', 160: 'Driving skill',
  183: 'Number of cars stolen', 191: 'Houses burgled', 192: 'Safes cracked',
  210: 'Pimping level', 213: 'Vehicles exported', 214: 'Vehicles imported',
  223: 'Flying skill', 225: 'Lung capacity', 228: 'Respect Mission Total',
  229: 'Bike skill', 230: 'Cycling skill',
  231: 'Snapshots taken', 232: 'Total snapshots',
  233: 'Luck', 234: 'Territories taken over', 235: 'Territories lost', 236: 'Territories held',
  237: 'Highest territories held', 238: 'Gang members recruited',
  241: 'Horseshoes collected', 242: 'Total horseshoes',
  243: 'Oysters collected', 244: 'Total oysters',
  320: 'Playing time', 321: 'Hidden Packages found', 322: 'Tags sprayed'
};

window.ptSAE_FLOAT_STATS = ptSAE_FLOAT_STATS;
window.ptSAE_SKILL_IDS = ptSAE_SKILL_IDS;
window.ptSAE_INT_STATS = ptSAE_INT_STATS;
