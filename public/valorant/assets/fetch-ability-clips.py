#!/usr/bin/env python3
"""Fetch and transcode one ability-showcase clip per ability, for the dossier.

    python3 assets/fetch-ability-clips.py [outdir]        # default: assets/clips

Riot's own wiki publishes a `<Ability_Name>_Showcase.mp4` for every ability — real
in-game footage of the thing the dossier is describing. All 52 of the launch
roster's abilities have one. What it does NOT publish is anything small: the set
totals ~157 MB at source (1280x720 and 1920x1080, ~3 MB each), which is thirteen
times the weight of every other asset in this piece combined.

So this script does what `compose-splash.py` does for the key art: fetches once,
processes locally, and vendors the result. Nothing here runs at page load, and the
piece keeps the property SPEC section 2 makes a point of — it renders offline and
owes nothing to the network.

Output per ability, named for the slot so it lines up with abilityInfo's order:

    <outdir>/<agent>-<slot>.mp4     ~4s, silent, 640px wide, loops
    <outdir>/<agent>-<slot>.jpg     poster frame, from the wiki's own thumbnailer

Notes for whoever runs this next:

  * The API lives at /en-us/api.php, not at the bare host, and it returns 403
    without a User-Agent. Both are easy to lose an hour to.
  * Ability names are read out of js/agents.js so this file cannot drift from what
    the page actually renders. Matching is case-insensitive on purpose: agents.js
    spells two of Killjoy's in caps (ALARMBOT, TURRET) where the wiki has
    Alarmbot, Turret.
  * The clips are Riot's. The page carries the fan-project credit already.

Needs ffmpeg on PATH (`brew install ffmpeg`).
"""

import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
AGENTS_JS = os.path.join(HERE, '..', 'js', 'agents.js')
API = 'https://wiki.playvalorant.com/en-us/api.php'
UA = 'valorant-gallery-fan-project/1.0 (asset vendoring; contact: repo owner)'

# Slot names follow abilityInfo's order in agents.js, which is the order the
# dossier renders them in: two abilities, the signature, then the ultimate.
SLOTS = ['a1', 'a2', 'a3', 'ult']

# Tuned against the real files rather than guessed. Measured on Lockdown, the
# heaviest source in the set at 6.1 MB: 640px/crf30 lands at 187 KB, which times
# 52 would have blown the budget on its own; 560px/crf32 lands at 120 KB for that
# same worst case and ~90 KB typical, which is the whole set in about 5 MB. Four
# seconds is long enough to read an ability and short enough to loop without
# feeling like a video player. Dropping audio costs nothing — the element is
# muted regardless — and saves a track.
CLIP_SECONDS = 4
CLIP_WIDTH = 560
CLIP_FPS = 24
CLIP_CRF = 32
POSTER_WIDTH = 320
BUDGET_MB = 8


def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read() if binary else r.read().decode('utf-8')


def read_abilities():
    """[(agent_slug, slot, ability_name)] straight out of js/agents.js."""
    src = open(AGENTS_JS, encoding='utf-8').read()
    out = []
    for block in re.split(r'\n  \{\n', src):
        m = re.search(r'name:\s*"([A-Z]+)",\s*role:', block)
        if not m:
            continue
        agent = m.group(1).lower()
        names = re.findall(r'\{ name: "([^"]+)", desc:', block)
        for slot, name in zip(SLOTS, names):
            out.append((agent, slot, name))
    return out


def wiki_title(name):
    """agents.js spells two of Killjoy's abilities in caps (ALARMBOT, TURRET)
    where the wiki has Alarmbot, Turret. MediaWiki normalises only the *first*
    letter of a title, so the rest of the caps survive and the lookup misses —
    title-case an all-caps name before asking. Mixed-case names ("Run it Back",
    "Viper's Pit") are already exactly what the wiki calls them, and are left
    alone: title-casing those would break them instead."""
    if name.isupper():
        name = name.title()
    return 'File:%s_Showcase.mp4' % name.replace(' ', '_')


def resolve(names):
    """{lowercased ability name: (video url, thumb-able title)} via the API."""
    found = {}
    for i in range(0, len(names), 20):
        chunk = names[i:i + 20]
        titles = [wiki_title(n) for n in chunk]
        q = urllib.parse.urlencode({
            'action': 'query', 'format': 'json', 'prop': 'imageinfo',
            'iiprop': 'url|size', 'titles': '|'.join(titles),
        })
        pages = json.loads(get(API + '?' + q)).get('query', {}).get('pages', {})
        # The API normalises and title-cases, so match back case-insensitively.
        by_title = {p['title'].lower(): p for p in pages.values()}
        for name, title in zip(chunk, titles):
            p = by_title.get(title.replace('_', ' ').lower())
            if p and 'imageinfo' in p:
                found[name.lower()] = (p['imageinfo'][0]['url'], p['title'])
    return found


def poster_url(video_url):
    """MediaWiki generates video thumbnails on demand; use its 480px frame
    rather than pulling a frame out of the transcode, so the poster is a clean
    still even when the first frames of the clip are a fade-in."""
    base, _, _ = video_url.partition('?')
    directory, filename = base.rsplit('/', 1)
    return '%s/thumb/%s/%dpx--%s.jpg' % (directory, filename, POSTER_WIDTH, filename)


def transcode(src_bytes, dest):
    tmp = dest + '.src'
    with open(tmp, 'wb') as f:
        f.write(src_bytes)
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-i', tmp,
        '-t', str(CLIP_SECONDS),
        '-vf', 'scale=%d:-2,fps=%d' % (CLIP_WIDTH, CLIP_FPS),
        '-an',
        '-c:v', 'libx264', '-crf', str(CLIP_CRF), '-preset', 'slow',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        dest,
    ], check=True)
    os.remove(tmp)


def main():
    outdir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'clips')
    os.makedirs(outdir, exist_ok=True)

    abilities = read_abilities()
    print('%d abilities from agents.js' % len(abilities))
    urls = resolve([name for _, _, name in abilities])
    print('%d resolved on the wiki' % len(urls))

    missing, total = [], 0
    for agent, slot, name in abilities:
        dest = os.path.join(outdir, '%s-%s.mp4' % (agent, slot))
        jpg = os.path.join(outdir, '%s-%s.jpg' % (agent, slot))
        if os.path.exists(dest) and os.path.exists(jpg):
            total += os.path.getsize(dest) + os.path.getsize(jpg)
            continue

        hit = urls.get(name.lower())
        if not hit:
            missing.append((agent, name))
            continue
        video_url, _ = hit

        transcode(get(video_url, binary=True), dest)
        with open(jpg, 'wb') as f:
            f.write(get(poster_url(video_url), binary=True))

        size = os.path.getsize(dest) + os.path.getsize(jpg)
        total += size
        print('  %-10s %-4s %-22s %5d KB' % (agent, slot, name[:22], size / 1024))

    print('\ntotal %.1f MB (budget %d MB)' % (total / 1e6, BUDGET_MB))
    if missing:
        print('NO CLIP FOUND: %s' % missing)
    if total > BUDGET_MB * 1e6:
        print('OVER BUDGET — lower CLIP_WIDTH or raise CLIP_CRF and re-run')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
