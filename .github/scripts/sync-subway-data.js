/* ============================================================
   SUBWAY SURFERS SAVE GENERATOR — sync-subway-data.js
   Author  : Piererra
   Project : Piererra Tools

   Build-time-only script. Pulls the current character, hoverboard,
   and profile-cosmetic (frames/portraits/backgrounds) rosters from
   a data source, checks the live Play Store listing version, and
   regenerates editors/subway/subway-data.js as a static file.

   All source URLs are intentionally NOT hardcoded here — they're
   injected as repo secrets by the GitHub Action so the upstream
   source stays out of the public script. See
   .github/workflows/sync-subway-data.yml for how the secrets map
   to these env vars, and the Piererra Tools repo README/setup
   notes for which secret holds which URL.

   This is meant to run in CI (GitHub Actions), never in the
   browser — the source URLs are never shipped to visitors, only
   the regenerated static output is.

   Usage: node scripts/sync-subway-data.js
============================================================ */

const fs = require('fs');
const path = require('path');

// Required — the core rosters. Set as repo secrets, injected via the
// workflow's `env:` block. The script intentionally never falls back
// to a hardcoded default, so the source is never visible in this file.
const CHAR_URL = process.env.SSG_CHAR_SOURCE_URL;
const BOARD_URL = process.env.SSG_BOARD_SOURCE_URL;
const PROFILE_URL = process.env.SSG_PROFILE_SOURCE_URL;

// Optional — separate "links" files that carry a real display name
// and an "available" (actually released in-game yet) flag. If these
// aren't set, the script still works, just falls back to humanized
// ids and treats everything as available.
const CHAR_LINKS_URL = process.env.SSG_CHAR_LINKS_URL;
const BOARD_LINKS_URL = process.env.SSG_BOARD_LINKS_URL;

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'editors', 'subway', 'subway-data.js');

// Play Store version check — also injected as a secret rather than
// hardcoded, same reasoning as the rosters above.
const PLAY_STORE_API_URL = process.env.SSG_PLAYSTORE_API_URL;

if (!CHAR_URL || !BOARD_URL || !PROFILE_URL) {
  console.error('Missing SSG_CHAR_SOURCE_URL / SSG_BOARD_SOURCE_URL / SSG_PROFILE_SOURCE_URL env vars.');
  console.error('These are injected as repo secrets by the GitHub Action —');
  console.error('see .github/workflows/sync-subway-data.yml.');
  process.exit(1);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'piererra-tools-sync' } });
  if (!res.ok) throw new Error('Fetch failed (' + res.status + ') for ' + url);
  return res.json();
}

// Same as fetchJson but never throws — used for the optional links
// files so a failure there doesn't take down the whole sync.
async function fetchJsonSafe(url, label) {
  if (!url) return null;
  try {
    return await fetchJson(url);
  } catch (e) {
    console.warn('Optional fetch failed (' + label + '):', e.message);
    return null;
  }
}

// Fallback label when there's no links-file match: turn a camelCase /
// snake_case id into a readable guess, e.g. "superSneakersJake" -> "Super Sneakers Jake".
function humanize(id) {
  return String(id)
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

// Loose normalization for name matching: lowercase, strip everything
// that isn't a letter or digit.
function normalizeForMatch(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Best-effort id <-> real-name matcher. This is a simplified stand-in
// for the fuzzy-matching the upstream data pipeline does — it
// tries an exact normalized match first, then a loose "one contains
// the other" match. Good enough for most items; unmatched ids just
// keep their humanized fallback name and are assumed available.
function buildLinksLookup(linksArray) {
  var lookup = [];
  (linksArray || []).forEach(function (entry) {
    if (!entry || !entry.name) return;
    lookup.push({
      normalized: normalizeForMatch(entry.name),
      name: entry.name,
      available: entry.available !== false
    });
  });
  return lookup;
}

function matchLink(id, lookup) {
  if (!lookup || !lookup.length) return null;
  var normId = normalizeForMatch(id);

  for (var i = 0; i < lookup.length; i++) {
    if (lookup[i].normalized === normId) return lookup[i];
  }

  // Loose match: among all containment matches, prefer the longest
  // normalized name — avoids "jake" winning over "ninjajake" just
  // because it happened to be checked first.
  var best = null;
  for (var j = 0; j < lookup.length; j++) {
    var norm = lookup[j].normalized;
    if (!norm) continue;
    if (normId.indexOf(norm) !== -1 || norm.indexOf(normId) !== -1) {
      if (!best || norm.length > best.normalized.length) best = lookup[j];
    }
  }
  return best;
}

// Characters/hoverboards: each item may carry a sub-list (outfits or
// upgrades). Sub-items can be plain ids or { id, variation: { name } }
// objects — keep the real variation name when the source provides one.
function toItemRoster(items, subKey, linksLookup) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(function (it) { return it && it.id; })
    .map(function (it) {
      var subRaw = it[subKey];
      var subList;
      if (Array.isArray(subRaw) && subRaw.length) {
        subList = subRaw.map(function (sub) {
          if (sub && typeof sub === 'object' && sub.id) {
            var subName = (sub.variation && sub.variation.name) ? sub.variation.name : humanize(sub.id);
            return { id: sub.id, name: subName };
          }
          if (sub) return { id: sub, name: humanize(sub) };
          return null;
        }).filter(Boolean);
      } else {
        subList = [{ id: 'default', name: 'Default' }];
      }

      var link = matchLink(it.id, linksLookup);
      var entry = {
        id: it.id,
        name: link ? link.name : humanize(it.id),
        available: link ? link.available : true
      };
      entry[subKey] = subList;
      return entry;
    });
}

// Frames/portraits/backgrounds: a flat list of cosmetic ids, no sub-items.
function toCosmeticRoster(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter(Boolean).map(function (id) {
    return { id: id, name: humanize(id) };
  });
}

// Play Store version check via a JSON mirror API — returns clean
// JSON, so no fragile HTML/regex scraping needed. Wrapped so a
// failure here never blocks the character/board sync.
async function fetchPlayStoreVersion() {
  if (!PLAY_STORE_API_URL) return null;
  try {
    const res = await fetch(PLAY_STORE_API_URL, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json && json.version) ? String(json.version) : null;
  } catch (e) {
    console.warn('Play Store version check failed:', e.message);
    return null;
  }
}

// "Our" synced version = the release tag of the data mirror we just
// pulled from, when it exposes one via the GitHub Releases API.
async function fetchSourceVersion() {
  try {
    const apiUrl = CHAR_URL.replace(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/.*/, 'https://api.github.com/repos/$1/$2/releases/latest');
    if (apiUrl === CHAR_URL) return null; // pattern didn't match, skip
    const res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || !json.tag_name) return null;
    // Tags on the source repo look like "3-65-0" (hyphens, no leading "v"),
    // not "v3.65.0" — normalize to dotted form so it can be compared
    // directly against the Play Store version string.
    var tag = json.tag_name.replace(/^v/i, '');
    if (/^\d+-\d+-\d+$/.test(tag)) tag = tag.replace(/-/g, '.');
    return tag;
  } catch (e) {
    return null;
  }
}

function jsItemArrayLiteral(items, subKey) {
  return items.map(function (it) {
    var subLiteral = JSON.stringify(it[subKey] || [{ id: 'default', name: 'Default' }]);
    return '    { id: ' + JSON.stringify(it.id) + ', name: ' + JSON.stringify(it.name) +
      ', available: ' + JSON.stringify(it.available !== false) +
      ', ' + subKey + ': ' + subLiteral + ' }';
  }).join(',\n');
}

function jsCosmeticArrayLiteral(items) {
  return items.map(function (it) {
    return '    { id: ' + JSON.stringify(it.id) + ', name: ' + JSON.stringify(it.name) + ' }';
  }).join(',\n');
}

async function main() {
  console.log('Fetching character roster...');
  const rawChars = await fetchJson(CHAR_URL);
  console.log('Fetching hoverboard roster...');
  const rawBoards = await fetchJson(BOARD_URL);
  console.log('Fetching profile cosmetics (frames/portraits/backgrounds)...');
  const rawProfile = await fetchJson(PROFILE_URL);

  console.log('Fetching optional name/availability links...');
  const rawCharLinks = await fetchJsonSafe(CHAR_LINKS_URL, 'character links');
  const rawBoardLinks = await fetchJsonSafe(BOARD_LINKS_URL, 'board links');
  const charLinksLookup = buildLinksLookup(rawCharLinks);
  const boardLinksLookup = buildLinksLookup(rawBoardLinks);

  const characters = toItemRoster(rawChars, 'outfits', charLinksLookup);
  const hoverboards = toItemRoster(rawBoards, 'upgrades', boardLinksLookup);
  const frames = toCosmeticRoster(rawProfile && rawProfile.profileFrames);
  const portraits = toCosmeticRoster(rawProfile && rawProfile.profilePortraits);
  const backgrounds = toCosmeticRoster(rawProfile && rawProfile.profileBackgrounds);

  console.log(
    'Characters: ' + characters.length +
    ', Hoverboards: ' + hoverboards.length +
    ', Frames: ' + frames.length +
    ', Portraits: ' + portraits.length +
    ', Backgrounds: ' + backgrounds.length
  );

  console.log('Checking versions...');
  const playStoreVersion = await fetchPlayStoreVersion();
  const sourceVersion = await fetchSourceVersion();
  console.log('Our synced version: ' + (sourceVersion || 'unknown') + ', Play Store version: ' + (playStoreVersion || 'unknown'));

  const output = '/* ============================================================\n' +
'   SUBWAY SURFERS SAVE GENERATOR — subway-data.js\n' +
'   Author  : Piererra\n' +
'   Project : Piererra Tools\n' +
'\n' +
'   AUTO-GENERATED by scripts/sync-subway-data.js — do not hand-edit\n' +
'   the CHARACTERS / HOVERBOARDS / FRAMES / PORTRAITS / BACKGROUNDS\n' +
'   arrays or VERSION_INFO below; they\'re overwritten on every sync\n' +
'   run. BADGE_TIERS is static and safe to edit.\n' +
'\n' +
'   Each character/hoverboard entry has an "available" flag — false\n' +
'   means it was found in the datamined files but isn\'t actually\n' +
'   released in-game yet. The UI hides these by default.\n' +
'   Last synced: ' + new Date().toISOString() + '\n' +
'============================================================ */\n' +
'\n' +
'var ptSSGData = (function () {\n' +
'  \'use strict\';\n' +
'\n' +
'  var CHARACTERS = [\n' +
jsItemArrayLiteral(characters, 'outfits') + '\n' +
'  ];\n' +
'\n' +
'  var HOVERBOARDS = [\n' +
jsItemArrayLiteral(hoverboards, 'upgrades') + '\n' +
'  ];\n' +
'\n' +
'  var FRAMES = [\n' +
jsCosmeticArrayLiteral(frames) + '\n' +
'  ];\n' +
'\n' +
'  var PORTRAITS = [\n' +
jsCosmeticArrayLiteral(portraits) + '\n' +
'  ];\n' +
'\n' +
'  var BACKGROUNDS = [\n' +
jsCosmeticArrayLiteral(backgrounds) + '\n' +
'  ];\n' +
'\n' +
'  var BADGE_TIERS = [\n' +
'    { key: \'champ\',   statId: 102, name: \'Champion\', icon: \'editors/subway/img/badge-champ.png\' },\n' +
'    { key: \'diamond\', statId: 103, name: \'Diamond\',  icon: \'editors/subway/img/badge-diamond.png\' },\n' +
'    { key: \'gold\',    statId: 104, name: \'Gold\',     icon: \'editors/subway/img/badge-gold.png\' },\n' +
'    { key: \'silver\',  statId: 105, name: \'Silver\',   icon: \'editors/subway/img/badge-silver.png\' },\n' +
'    { key: \'bronze\',  statId: 106, name: \'Bronze\',   icon: \'editors/subway/img/badge-bronze.png\' }\n' +
'  ];\n' +
'\n' +
'  // Our synced version vs the live Play Store listing. Either can be\n' +
'  // null if a check failed — the UI shows "unknown" in that case\n' +
'  // rather than a misleading guess.\n' +
'  var VERSION_INFO = {\n' +
'    ourVersion: ' + JSON.stringify(sourceVersion) + ',\n' +
'    playStoreVersion: ' + JSON.stringify(playStoreVersion) + ',\n' +
'    lastChecked: ' + JSON.stringify(new Date().toISOString()) + '\n' +
'  };\n' +
'\n' +
'  return {\n' +
'    CHARACTERS: CHARACTERS,\n' +
'    HOVERBOARDS: HOVERBOARDS,\n' +
'    FRAMES: FRAMES,\n' +
'    PORTRAITS: PORTRAITS,\n' +
'    BACKGROUNDS: BACKGROUNDS,\n' +
'    BADGE_TIERS: BADGE_TIERS,\n' +
'    VERSION_INFO: VERSION_INFO\n' +
'  };\n' +
'})();\n';

  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
  console.log('Written ' + OUTPUT_PATH);
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
