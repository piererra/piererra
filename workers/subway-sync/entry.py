"""
SUBWAY SURFERS DATA SYNC — Cloudflare Python Worker
Project : Piererra Tools

Replaces the old sync-subway-data.yml + GitHub-secrets pipeline.

Three routes:
  POST /update  (auth required via PARSE_SECRET)
      ONE-SHOT ROUTE — this is the only step needed after a game update.
      POST the raw catalog.json body directly. Writes it to KV under
      "catalog:raw", parses it, writes "roster:latest", THEN
      automatically fetches the live subway-data.js from the site and
      diffs it against the freshly parsed roster. The response includes
      "new_items": any character/hoverboard/frame/portrait/background
      ids present in the datamine but not yet in subway-data.js — these
      still need to be added by hand with correct in-game casing, but
      no separate script run is required to find them anymore.

  POST /parse   (auth required via PARSE_SECRET)
      Re-parses whatever is currently stored at "catalog:raw" without
      requiring a re-upload. Useful after a regex/parser code fix.

  GET  /roster  (public, CORS-open to the site's own domain)
      Returns the current parsed roster as JSON. This is what the live
      site fetches instead of reading a bundled subway-data.js file.

catalog.json itself never passes through git or KV outside this
Worker's own bound namespace, and is never exposed by any route here.

Known limitation: portrait ids are extracted best-effort. Some portraits
are keyed per character (e.g. "akira") and some per character+outfit
combo (e.g. "alexandre_stanoutfit"), so the regex below may produce a
mix of both until this is refined against more catalog data.
"""

import json
import re
from urllib.parse import urlparse
from js import Response, fetch

SUBWAY_DATA_URL = "https://piererra.pages.dev/editors/subway/subway-data.js"

FRAME_SUFFIXES = ["_frame"]
PORTRAIT_SUFFIXES = ["_illustration_portrait", "_graffiti_portrait", "_portrait"]
BACKGROUND_SUFFIXES = ["_background"]

CHAR_RE = re.compile(
    r'characterpreviews-(?:builtin|remote)_assets_([a-z0-9]+)_([a-z0-9]+)_preview_big_'
)
BOARD_RE = re.compile(
    r'boardspreviews-(?:builtin|remote)_assets_([a-z0-9]+)_([a-z0-9]+)_preview_big_'
)
FRAME_RE = re.compile(
    r'playerprofile-(?:builtin|remote)_assets_([a-z0-9]+)_frame_config_'
)
PORTRAIT_RE = re.compile(
    r'playerprofile-(?:builtin|remote)_assets_([a-z0-9_]+?)_(?:illustration_portrait|graffiti_portrait|portrait)_'
)
BACKGROUND_RE = re.compile(
    r'playerprofile-(?:builtin|remote)_assets_([a-z0-9]+)_background'
)

CORS_ORIGIN = "https://piererra.pages.dev"


def humanize(id_str):
    """'nightrideroutfit' -> 'Nightrideroutfit' (best-effort; ids aren't
    camelCase so we can't split words automatically the way the old
    sync script did with real display names from the links files)."""
    return id_str.replace('_', ' ').replace('-', ' ').title()


def parse_catalog(raw_text):
    data = json.loads(raw_text)
    ids = data.get('m_InternalIds', [])

    chars = {}
    boards = {}
    frames = set()
    portraits = set()
    backgrounds = set()

    for s in ids:
        low = s.lower()

        m = CHAR_RE.search(low)
        if m:
            cid, outfit = m.groups()
            chars.setdefault(cid, set()).add(outfit)
            continue

        m = BOARD_RE.search(low)
        if m:
            bid, upgrade = m.groups()
            boards.setdefault(bid, set()).add(upgrade)
            continue

        m = FRAME_RE.search(low)
        if m:
            frames.add(m.group(1))
            continue

        m = PORTRAIT_RE.search(low)
        if m:
            portraits.add(m.group(1))
            continue

        m = BACKGROUND_RE.search(low)
        if m:
            backgrounds.add(m.group(1))
            continue

    characters = [
        {
            'id': cid,
            'name': humanize(cid),
            'outfits': [{'id': o, 'name': humanize(o)} for o in sorted(outfits)],
        }
        for cid, outfits in sorted(chars.items())
    ]
    hoverboards = [
        {
            'id': bid,
            'name': humanize(bid),
            'upgrades': [{'id': u, 'name': humanize(u)} for u in sorted(upgrades)],
        }
        for bid, upgrades in sorted(boards.items())
    ]

    return {
        'characters': characters,
        'hoverboards': hoverboards,
        'frames': [{'id': f, 'name': humanize(f)} for f in sorted(frames)],
        'portraits': [{'id': p, 'name': humanize(p)} for p in sorted(portraits)],
        'backgrounds': [{'id': b, 'name': humanize(b)} for b in sorted(backgrounds)],
        'counts': {
            'characters': len(characters),
            'hoverboards': len(hoverboards),
            'frames': len(frames),
            'portraits': len(portraits),
            'backgrounds': len(backgrounds),
        },
    }


def extract_known_ids(js_text, var_name, strip_suffixes=None):
    """Same logic as the standalone check-new-subway-content.py script:
    pull id: "..." values out of one array block in subway-data.js,
    stripping known local naming suffixes so ids line up with the
    suffix-free ids this Worker produces from the raw catalog."""
    m = re.search(r'var\s+' + var_name + r'\s*=\s*\[', js_text)
    if not m:
        return set()
    start = m.end() - 1
    depth = 0
    end = start
    for i in range(start, len(js_text)):
        if js_text[i] == '[':
            depth += 1
        elif js_text[i] == ']':
            depth -= 1
            if depth == 0:
                end = i
                break
    block = js_text[start:end]
    raw_ids = [mm.group(1).lower() for mm in re.finditer(r'id:\s*"([^"]+)"', block)]
    if strip_suffixes:
        cleaned = []
        for rid in raw_ids:
            for suf in strip_suffixes:
                if rid.endswith(suf):
                    rid = rid[: -len(suf)]
                    break
            cleaned.append(rid)
        raw_ids = cleaned
    return set(raw_ids)


async def get_known_ids():
    """Fetches the live subway-data.js from the site and extracts known
    ids per category. Raises on network/parse failure — caller decides
    whether that should block the response or just omit the diff."""
    resp = await fetch(SUBWAY_DATA_URL)
    text = await resp.text()
    return {
        'characters': extract_known_ids(text, 'CHARACTERS'),
        'hoverboards': extract_known_ids(text, 'HOVERBOARDS'),
        'frames': extract_known_ids(text, 'FRAMES', FRAME_SUFFIXES),
        'portraits': extract_known_ids(text, 'PORTRAITS', PORTRAIT_SUFFIXES),
        'backgrounds': extract_known_ids(text, 'BACKGROUNDS', BACKGROUND_SUFFIXES),
    }


def diff_new_items(roster, known):
    """Returns only categories that have new ids, each as a sorted list."""
    pairs = [
        ('characters', [c['id'] for c in roster['characters']]),
        ('hoverboards', [h['id'] for h in roster['hoverboards']]),
        ('frames', [f['id'] for f in roster['frames']]),
        ('portraits', [p['id'] for p in roster['portraits']]),
        ('backgrounds', [b['id'] for b in roster['backgrounds']]),
    ]
    result = {}
    for key, remote_ids in pairs:
        new_ids = sorted(set(i.lower() for i in remote_ids) - known.get(key, set()))
        if new_ids:
            result[key] = new_ids
    return result


def cors_headers():
    return {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }


def hdrs(d):
    """Pyodide can't auto-convert a Python dict into a JS HeadersInit;
    it needs a sequence of [key, value] pairs instead."""
    return list(d.items())


async def on_fetch(request, env):
    path = urlparse(request.url).path

    if request.method == 'OPTIONS':
        return Response.new('', headers=hdrs(cors_headers()))

    if path == '/roster' and request.method == 'GET':
        roster = await env.SUBWAY_ROSTER.get('roster:latest')
        if roster is None:
            return Response.new(
                json.dumps({'error': 'no roster generated yet — run /parse first'}),
                status=404,
                headers=hdrs({**cors_headers(), 'Content-Type': 'application/json'}),
            )
        return Response.new(
            roster, headers=hdrs({**cors_headers(), 'Content-Type': 'application/json'})
        )

    if path == '/update' and request.method == 'POST':
        auth = request.headers.get('Authorization') or ''
        if auth != f'Bearer {env.PARSE_SECRET}':
            return Response.new('Unauthorized', status=401)

        raw = await request.text()
        if not raw:
            return Response.new(
                json.dumps({'error': 'empty request body — POST the catalog.json contents'}),
                status=400,
                headers=hdrs({'Content-Type': 'application/json'}),
            )

        try:
            roster = parse_catalog(raw)
        except Exception as e:
            return Response.new(
                json.dumps({'error': f'catalog did not parse: {e}'}),
                status=400,
                headers=hdrs({'Content-Type': 'application/json'}),
            )

        # Only store the raw catalog once we know it parses cleanly.
        await env.SUBWAY_ROSTER.put('catalog:raw', raw)
        await env.SUBWAY_ROSTER.put('roster:latest', json.dumps(roster))

        new_items = {}
        diff_error = None
        try:
            known = await get_known_ids()
            new_items = diff_new_items(roster, known)
        except Exception as e:
            diff_error = f'diff unavailable (subway-data.js fetch/parse failed): {e}'

        result = {'ok': True, 'counts': roster['counts'], 'new_items': new_items}
        if diff_error:
            result['diff_error'] = diff_error

        return Response.new(
            json.dumps(result),
            headers=hdrs({'Content-Type': 'application/json'}),
        )

    if path == '/parse' and request.method == 'POST':
        auth = request.headers.get('Authorization') or ''
        if auth != f'Bearer {env.PARSE_SECRET}':
            return Response.new('Unauthorized', status=401)

        raw = await env.SUBWAY_ROSTER.get('catalog:raw')
        if raw is None:
            return Response.new(
                json.dumps({'error': 'no catalog uploaded yet — PUT it to KV key catalog:raw first'}),
                status=400,
                headers=hdrs({'Content-Type': 'application/json'}),
            )

        try:
            roster = parse_catalog(raw)
        except Exception as e:
            return Response.new(
                json.dumps({'error': str(e)}),
                status=500,
                headers=hdrs({'Content-Type': 'application/json'}),
            )

        await env.SUBWAY_ROSTER.put('roster:latest', json.dumps(roster))

        return Response.new(
            json.dumps({'ok': True, 'counts': roster['counts']}),
            headers=hdrs({'Content-Type': 'application/json'}),
        )

    return Response.new('Not found', status=404)
