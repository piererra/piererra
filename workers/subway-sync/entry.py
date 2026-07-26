"""
SUBWAY SURFERS DATA SYNC — Cloudflare Python Worker
Project : Piererra Tools

Replaces the old sync-subway-data.yml + GitHub-secrets pipeline.

Two routes:
  POST /parse   (auth required via PARSE_SECRET)
      Reads the raw Addressables catalog.json (uploaded separately into
      the same KV namespace under the key "catalog:raw"), extracts the
      character / hoverboard / frame / portrait / background roster via
      regex over the bundle filenames, and writes the result to KV under
      "roster:latest".

  GET  /roster  (public, CORS-open to the site's own domain)
      Returns the current parsed roster as JSON. This is what the live
      site fetches instead of reading a bundled subway-data.js file.

catalog.json itself is uploaded directly into KV via Cloudflare's REST
API (curl from Termux) — it never passes through git or this Worker's
source, and is never exposed by any route here.

Known limitation: portrait ids are extracted best-effort. Some portraits
are keyed per character (e.g. "akira") and some per character+outfit
combo (e.g. "alexandre_stanoutfit"), so the regex below may produce a
mix of both until this is refined against more catalog data.
"""

import json
import re
from urllib.parse import urlparse
from js import Response

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

CORS_ORIGIN = "https://piererra.pages.dev"  # TODO: confirm/replace with the real site domain


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


def cors_headers():
    return {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }


async def on_fetch(request, env):
    path = urlparse(request.url).path

    if request.method == 'OPTIONS':
        return Response.new('', headers=cors_headers())

    if path == '/roster' and request.method == 'GET':
        roster = await env.SUBWAY_ROSTER.get('roster:latest')
        if roster is None:
            return Response.new(
                json.dumps({'error': 'no roster generated yet — run /parse first'}),
                status=404,
                headers={**cors_headers(), 'Content-Type': 'application/json'},
            )
        return Response.new(
            roster, headers={**cors_headers(), 'Content-Type': 'application/json'}
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
                headers={'Content-Type': 'application/json'},
            )

        try:
            roster = parse_catalog(raw)
        except Exception as e:
            return Response.new(
                json.dumps({'error': str(e)}),
                status=500,
                headers={'Content-Type': 'application/json'},
            )

        await env.SUBWAY_ROSTER.put('roster:latest', json.dumps(roster))

        return Response.new(
            json.dumps({'ok': True, 'counts': roster['counts']}),
            headers={'Content-Type': 'application/json'},
        )

    return Response.new('Not found', status=404)
