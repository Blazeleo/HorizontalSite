# VALORANT // AGENT ROSTER

An original piece built on the scroll engine ported in `../qode-replica/`.
Lives at `/valorant/`, and is what the main site's **Gallery** section shows.

Riot Games owns the agent art and data used here. This is a fan project, not
affiliated with or endorsed by Riot Games, and the page carries that credit on
screen. Asset provenance is in §2.

---

## 1. What was reused, and what is new

The motion is not original work — it is the Qode Interactive catalog intro,
transcribed from that site's own bundle in `../qode-replica/` and re-pointed at
new content. `../qode-replica/SPEC.md` is the reference for where every number
came from; this file only records the delta.

**Carried over unchanged**

- `js/smooth-scroll.js` — the damped scroll engine: `damping 0.15`, the
  `momentum * (1 - damping)` integrator, edgeEasing clamping, wheel
  `deltaMode` scaling `[1, 28, 500]`.
- The master timeline: a **paused** 100-unit GSAP timeline whose playhead is
  set from scroll every frame, composed `titles (0–65)`, `slider (0–100)`,
  `bg (20–70)`.
- The velocity maths: `d = 10 * clamp(0.1 * Δoffset, -5, 5)`, `val` chasing it
  at 10%/frame with a ±0.05 deadzone, written into `--skewX`.
- The 1.2s/`power4.inOut` entrance with its ±40 skew and ±200/±50 ghost
  offsets, and the 95% closing beat.
- The dead `TweenMax.defaultEase` assignment is **not** ported, for the reason
  in `../qode-replica/SPEC.md` §7.1 — copying it makes every scrubbed tween wrong.
- The overlay-wipe / `--yVal`-yoyo open beat and the `horizontalScroll` plugin,
  catalogued but never built in that file's §9, are now built — see §7.

The 0.3s stacked-alpha slide reveal and the 0.45s `power4.out` hover swap that
shipped in the first pass are **no longer what's here** — both were replaced
by original effects (§6) once "more eye-catching" became the brief. Their
numbers stay on record only as what this piece started from.

**New here**

| | |
|---|---|
| Data-built DOM | 13 slides, 13 names and 13 art frames are generated from `js/agents.js`, so they cannot drift. Qode's markup was hand-written. |
| Live `--accent` | Hovering an agent drives a page-level colour variable — HUD corners and the wash behind the portrait retint on the source's own `.15s .4s` beat. |
| Chromatic ghosts | The skew ghosts are red and teal rather than two greys, so fast scrolling reads as channel separation. Same offsets, same maths. |
| Composed splashes | There is no official wide art for these 13 agents, so it is assembled from Riot's separately-shipped parts — see §2. |
| `difference` blend | Qode blends dark names into white paper with `soft-light`; on a gun-metal page that erases them, so the roster uses `difference` — bone on the plate, inverted across a lit portrait. |
| Scroll chaining | `_shouldPropagateMomentum` is implemented — see §4. |
| Fixed seeding bug | Qode's `checkForActive()` feeds a 0-based index into 1-based `:nth-child()`, so it sometimes seeds nothing. This one always lands on an agent. |
| Self-limiting type | The roster's font-size is tied to available width so 13 names cannot overflow — the original sits right on the edge of clipping. |
| Shard-reveal + parallax hover | Replaces the ported 0.45s slide-in entirely — see §6.1. |
| Canvas carousel wipe | Replaces the ported stacked-alpha slide reveal — see §6.2. |
| Ambient ticker + orbit marker | No source equivalent — see §6.3. |
| Agent dossier | Builds what `../qode-replica/SPEC.md` §9 catalogued but never shipped — see §7. |
| Ability rail | A scroll-snap + drag card strip in the dossier, one card per ability, that scrolls the dossier to it — see §8. It replaced a filmstrip that sat on the roster screen for evidence rather than for use. |
| Ability footage | Riot's own showcase clip for each of the 52 abilities, fetched and transcoded down to a vendored 5.4 MB — see §2. |
| Roster controls | Arrow keys / Enter, and the left rail's four roles turned into a live filter — see §9. |
| Phone layout | Below 640px the rotated roster stands upright rather than switching most of the piece off — see §10. |

Structural class names (`q-inner`, `q-move`, `q-skew`, `q-shadow`, `q-theme`)
are kept from the source on purpose: it keeps the port checkable line-for-line
against the replica. They are invisible to a viewer.

## 2. Art and data — `js/agents.js`

### The composed splashes

What the carousel shows, and what the roster hover art is built from, is a
**composed wide splash per agent**, built by `assets/compose-splash.py`:
agent-coloured haze, the face close-up, the painted figure, and the signature
ability motif, arranged the way Riot's own promotional agent art is.

This exists because **Riot publishes no wide agent art for these 13**. The
pieces all ship separately — `displayIcon` is a 1024² painted face crop,
`<Agent>_artwork.png` is the painted figure, `abilities[].displayIcon` is the
motif, `backgroundGradientColors` gives the palette — and the launch roster
predates the per-agent wallpapers and `homeScreenPromoTileImage` that later
agents got. (`United Together` comes closest, at 1920×812, but covers only 5 of
the 13.) So the parts are official; the arrangement is this project's.

Two decisions worth keeping:

- **The alpha is feathered to zero on every border**, per side rather than
  radially. A radial vignette tight enough to kill the bottom seam also eats
  the figure standing at the right edge. Per-side feathering dissolves the top
  and bottom — where a straight line betrays the art as a pasted rectangle —
  while the right side, which the layout bleeds off-viewport anyway, keeps
  nearly its full width.
- **The frames are enormous**, 62vw to 94vw. Qode's catalog art is enormous —
  their widest project frame is about 192vw — and restraint here reads as
  timid rather than tasteful. The vignette is what makes that survivable.

The script also now emits **four separately-masked layers** per agent
(`assets/splash-layers/<agent>-{haze,motif,face,figure}.webp`), sharing the
exact same alpha mask as the flattened WebP so that stacked at (0,0) they
reproduce it exactly — this is what §6.1's pointer parallax animates. Layers
add ~4.3 MB; the flattened set (still used for the carousel, painted through
the canvas wipe in §6.2) is ~3.0 MB.

Regenerate with `python3 assets/compose-splash.py <outdir>` (needs `numpy`,
`pillow`, and the source art alongside it).

### Source artwork, and why this set

Riot publishes several images per agent, and they are not interchangeable:

| asset | size | verdict |
|---|---|---|
| `fullPortrait` (valorant-api) | 2048×1860 | the flat **3D in-game render**. Sharp, but it is a screenshot of a model, not artwork. Used in the first version of this piece. |
| **`<Agent>_artwork.png`** (Riot wiki) | **587×900** | the official **painted key art** — illustrated, with the effects work: Omen's smoke tendrils, Raze's paint-splash boom bot, Viper's toxin. **This is what the piece uses.** |
| `VALORANT_<Agent>_Card_Large.png` | 268×640 | a *designed* composition — agent, name typography, angular frame. Aesthetically the closest thing to Qode's key visuals, but far too small to fill a frame. |
| `United Together <Agent>.png` | 1920×812 | gorgeous wide cinematics, but they exist for only 5 of the 13. |
| `killfeedPortrait` | 256×128 | tight bust crop, ~20 KB. |

The painted set won on art direction: all 13 in one consistent style, all
transparent, so they compose with the page's own typography instead of sitting
in a box. The trade is resolution — 587×900 shown at roughly 1:1, which
painterly work carries far better than a photographic asset would. The 2048px
renders remain a swap-in if sharpness ever beats art direction.

Sources: `wiki.playvalorant.com/en-us/images/<Agent>_artwork.png` for the key
art (found via the wiki's MediaWiki API, `list=search&srnamespace=6`), and one
fetch of `valorant-api.com/v1/agents?isPlayableCharacter=true` for text,
colours, and (as of §7) the agent bio and ability descriptions/icons used in
the dossier.

### Ability footage — `assets/fetch-ability-clips.py`

Each of the four ability sections in the dossier (§7) is fronted by Riot's own
showcase clip for that ability — real in-game footage of the thing the copy is
describing, in place of the 128px line icon that used to stand in for it. The
icon is still there, demoted to a badge on the ability's name.

The wiki publishes `File:<Ability_Name>_Showcase.mp4`, and **all 52 of the
launch roster's abilities have one**. What it does not publish is anything
small: the set is **156.7 MB at source** (1280×720 and 1920×1080, ~3 MB each),
thirteen times the weight of every other asset here combined. So the script
fetches once and transcodes locally, the same shape as `compose-splash.py`:
4s, 560px wide, 24fps, silent, `crf 32` → **5.4 MB for all 52 clips and their
poster frames**, which is comparable to the splash layers already vendored.

Two things worth knowing before running it again:

- The API is at `/en-us/api.php`, not the bare host, and returns **403 without
  a User-Agent**.
- MediaWiki normalises only the *first* letter of a title, so an all-caps
  ability name survives the round trip and misses. Two of Killjoy's are spelled
  `ALARMBOT` and `TURRET` in `agents.js` where the wiki has `Alarmbot` and
  `Turret`; the script title-cases all-caps names for the lookup and leaves
  mixed-case ones ("Run it Back", "Viper's Pit") exactly as they are, since
  title-casing those would break them instead.

Sizing was measured, not guessed. Lockdown is the heaviest source in the set at
6.1 MB: at 640px/crf30 it lands at 187 KB, which times 52 blows the budget on
its own; at 560px/crf32 it lands at 120 KB, and the typical clip at ~90 KB.

Poster frames come from MediaWiki's own video thumbnailer
(`images/thumb/<file>.mp4/320px--<file>.mp4.jpg`, ~23 KB) rather than from a
frame of the transcode, so the still is clean even when a clip fades in. With
`preload="none"`, nothing decodes until a section is actually in view.

### Vendored, not hotlinked

Everything lives in `assets/` — composed splashes and their layers, source
key art, name marks, ability icons. The first version pulled images from a CDN
at runtime; vendoring them means the piece owes nothing to the network and
renders offline.

| field | used for |
|---|---|
| `name`, `role`, `abilities` | roster name, marquee tagline |
| `bio`, `abilityInfo` | the dossier — see §7 |
| `accent`, `deep` | live accent, and the haze palette the splash is built from |
| `splash` | the carousel slide, painted through the canvas wipe (§6.2) |
| `art` | the source painted figure (also kept as a swap-in for a cut-out look) |
| `mark` | Riot's white-alpha name artwork |
| `width`, `pos` | hand-set per-agent frame, the one idea lifted from Qode's catalog |

The roster hover art no longer reads `splash` as one flat image — see §6.1: it
reads the four layers instead, same compose script, same visual result at rest.

## 3. Layout notes

- Palette `--val-red #FF4655`, `--val-dark #0F1923`, `--val-bone #ECE8E1`,
  `--val-teal #18E5B7`, plus the live per-agent accent.
- Type: `Big Shoulders Display` (the closest free Tungsten analogue) with
  `Oswald` as fallback; `Barlow` for UI.
- The mobile cut-off is **640px**, not Qode's 1024px. The piece renders inside
  an iframe on the main site where the viewport is routinely under 1024, and at
  that breakpoint the hover art would silently disappear exactly where it
  matters most. Below 640 the layout changes shape rather than switching most
  of itself off — see §10. Only the ambient set (ticker, orbit, HUD corners)
  drops out at that width now.

## 4. Scroll chaining — why this copy differs from the replica

The replica skips `_shouldPropagateMomentum` because it is a standalone page
with nothing behind it. Embedded in the Gallery, that omission traps the
reader: the frame swallows every wheel event, so you cannot scroll back up past
it, and you are held for five screens.

The library's own answer evaluates the *plugin-transformed* delta, which
edgeEasing has already zeroed, so it reduces to "am I at an edge" in either
direction — which leaks, letting the first downward wheel at offset 0 scroll
both the frame and the page. This copy asks the direction-aware question
instead: is there room left the way you are actually scrolling?

Measured at the three positions:

| surface at | wheel down | wheel up |
|---|---|---|
| top | consumed | passes to page |
| middle | consumed | consumed |
| bottom | passes to page | consumed |

`destroy()` also unbinds the wheel listener now, so nothing keeps
`preventDefault`-ing after the intro hands off.

**On the desktop Gallery this path is no longer the one in use.** That section
pins the frame and writes page-scroll position straight into `config.scrollbar`
via `setPosition`, with the iframe held at `pointer-events: none` for the
duration — so the briefing never sees a wheel event at all and there is nothing
to chain. See `src/gallery/Gallery.js`. The chaining above still carries the
full-screen build, the phone layout, and the Gallery's own reduced-motion and
sub-720px fallback, all of which do own their wheel.

`smooth-scroll.js` also now supports `options.horizontal` — the ported
`horizontalScroll` plugin, redirecting wheel-Y into X momentum
(`x: |dx| > |dy| ? dx : dy`). The replica and this piece's own intro don't use
it (vertical scroll drives them by design); the agent dossier (§7) does.

## 5. Engine verification

Checked against the replica's own numbers, since the engine should be
arithmetically identical. At scroll progress `p = 0.53`:

| | predicted | measured |
|---|---|---|
| title column 1 `x` | `-110vh × power1.out(0.815)` = -481.3 | -481.3 |
| slider `x` | `-150vw × power1.out(0.53)` = -837.9 | -837.7 |
| bg `scaleX` | linear, `1 - 0.66` = 0.34 | 0.340 |

Re-checked after §9/§10 with the timeline driven from the scrollbar rather than
scrubbed directly (setting `masterTl.progress()` by hand is pointless — the
ticker overwrites it from scroll position on the very next frame). Read in the
tweens' own units, since `gsap.getProperty` reports the stored value and these
tweens are authored in `vh`/`vw`, not px: `-110 × power1.out(0.815) = -106.24`
measured -106.3; `-150 × power1.out(0.53) = -116.87` measured -116.9; bg
`scaleX` 0.340. The px figures in the table above are the same three numbers at
the viewport they were first measured on.

Also exercised (still holds after §6/§7's changes, re-checked): reverse
scrubbing, the skip path, the hand-off (intro removes itself, rail slides in,
a random agent is seeded), the roster fitting one screen both full-window and
inside the Gallery frame, and a clean console on both routes.

## 6. `js/effects.js` — original effects on the roster and carousel

Everything in this file is this project's own, not a port. It exists because
"more eye-catching" was the direct brief for the hover transition, and because
showing the range of techniques the wider showcase covers meant reaching for
canvas and SVG, not just GSAP tweens.

### 6.1 ShardReveal + LayerParallax (roster hover)

Replaces the ported 0.45s `power4.out` slide-in. Two effects run in sequence
on every hover:

1. **ShardReveal** — the flattened splash is sliced into 8 angled clip-path
   bands (contiguous, no gaps: 8 stacked `<img>` clones of the same source,
   each showing only its own `clip-path` window, so they always line up
   regardless of render size). They fly in converging from left/right of
   centre with an alternating vertical jitter, staggered 0.032s apart,
   0.55s `expo.out`, with a brief accent-coloured screen-blend flash — a HUD
   "scan assemble" beat rather than a generic cross-fade. Verified by reading
   `gsap.getProperty` on each shard frame-by-frame rather than by screenshot
   timing (screenshots can't be timed precisely enough against a sub-second
   tween): shard 0 starts moving at t=16ms, shard 1 doesn't begin until
   t≈32ms (its stagger delay), exactly as specified.
2. **LayerParallax** — once the shards settle, the flattened image is swapped
   for its four source planes (`assets/splash-layers/`: haze / motif / face /
   figure — same compose script as the flattened splash, alpha-masked
   identically, so stacked at rest they reproduce it exactly) and a single
   shared pointer-driven rAF loop drifts them at different rates (haze 10px,
   face 16px, motif 26px + 2.2° rotation, figure 30px + -1.4°) so the
   composition has depth instead of being a flat image. One loop total, not
   one per item — it just points at whichever item is currently hovered.

Outgoing is deliberately near-instant (0.12s fade), not a mirrored
disassembly — echoes the asymmetry the ported swap had, for the same reason:
a slow goodbye reads as lag when the point of hovering is to see the next one.

Rapid hovering across many agents in sequence leaves no leaked shard elements
and exactly one active/hovered item — verified by hovering 7 agents in
40ms bursts and checking every other item's shard-host child count is 0.

### 6.2 CanvasWipe (carousel)

Replaces the ported stacked-alpha slide reveal. The slide-to-slide transition
now paints through a `<canvas>`: an angular clip sweeps across the frame
(direction tied to scroll direction, `config.forwards`), with two thin
red/teal strokes along the moving edge — the same chromatic language as the
title's velocity ghosts, bent into the picture instead of the type. Each
`.q-intro-slide` div is now an invisible image holder only (`opacity:0`, kept
on-screen so `loading="lazy"` still fires) — the canvas is what's actually
seen.

Verified by instrumenting the wipe's own `edge` value directly rather than by
sampling rendered pixels (an earlier pixel-sampling pass gave a misleading
result — it had jumped two carousel indices in one test call, catching two
overlapping transitions at once): a single isolated transition produces one
clean monotonic sweep, `edge: 489 → 397 → 331 → ... → 0`, matching `dir=-1`
exactly, no double-transitions.

### 6.3 Ambient set

- **Ticker** — a thin HUD band riding across the *middle* of the screen, over
  the agent art and under the roster names (`mix-blend-mode: overlay`,
  `z-index: 40`), rather than tucked into an unused corner — real agent-select
  screens run their HUD text across the character art, not around it.
- **OrbitMarker** — a marker tracing the HUD frame's rectangle forever, via
  plain SVG `getPointAtLength` (no MotionPathPlugin — the vendored GSAP build
  doesn't include it). The path's `viewBox` is 0–100 with
  `preserveAspectRatio="none"`, so converting a viewBox point to screen space
  by simple proportion (`pt.x/100 × renderedWidth`) is exact under that
  stretch, not an approximation: an axis-aligned rectangle stays exactly
  rectangular under independent x/y scaling.

## 7. Agent dossier — `js/dossier.js`

Clicking an agent (not hovering — clicking) opens a horizontally-scrolling
dossier: a bio panel plus one section per active ability (4 of them; passives
are excluded, and not every agent has one). This is what
`../qode-replica/SPEC.md` §9 catalogued as "not built yet" — Qode's own
"opening a project" transition and its 5 scroll-driven FX modules — now built,
against original content rather than the source's real per-client project
pages (there is nothing specific there to reproduce, only the mechanism).

**Ported** (traced to the source, same standard as everywhere else here):

- the overlay wipe: `fromTo {scaleX:0} → {scaleX:1}`, 1.25s, `expo.inOut`,
  `transform-origin: 100% 0`
- the `--yVal` yoyo kick: 0.6s, `expo.inOut`, yoyo, repeat 1
- `fadeOutImage(.35, .75)` on the hover art — already existed, reused as-is
- the `horizontalScroll` plugin (wheel-Y redirected to X,
  `x: |dx|>|dy| ? dx : dy`) — implemented in `smooth-scroll.js` (§4),
  deliberately skipped in the `qode-replica` copy because it's a no-op on the
  catalog page
- all 5 FX modules' formulas, generalised into one driver (`DossierFX`)
  instead of 5 near-identical per-module classes:

  | module | formula | applied to |
  |---|---|---|
  | layered | `translateY(-delta·max·speed%)` | the bio section's background figure |
  | text | `--xText` custom property | ability 1's clip |
  | rail | `translateX((delta-1)·14vh)` | ability 2's clip |
  | parallax | `translate(±delta·18%)` along the scroll axis | ability 3's clip |
  | rotate | `--rotate` custom property | ability 4's clip |

  Ability 3 was the source's `vertical` module (`translateY(±delta·50%)`). On a
  surface that scrolls sideways it was the only element moving across the
  grain, which read as a glitch rather than as an effect, so it is a plain
  horizontal parallax now — same axis as everything else, drifting slower than
  the panel that carries it. Stacked on a phone it follows the axis that is
  actually scrolling, so it never pushes the clip out of a 390px column.

  **Ability 2's rail is measured either side of rest, not from the section's
  entry** — `(delta-1)`, where the source has a bare `delta`. This family's
  delta is 1 exactly when a section is parked at the reading position, so the
  ported formula put the module's *maximum* displacement precisely where the
  reader stops. Measured at 1440×900, with the four clips otherwise identically
  placed: ability 02's clip rested at 1010–1550 — **110px off the right edge of
  the screen**, and 225px further right than the clip in every other ability.
  Referencing the drift to rest puts it at 785–1325, the same place as ability
  03's, and the movement still reads as movement. The range came down 25 → 14
  with it, because a symmetric swing spends half its travel moving the clip
  toward the copy column and 25 would have run it into the text: the closest
  approach is now 139px, against 202px at rest.

  All share the ported shape `buffer = f(offset.x, element); delta =
  lerp(delta, buffer, 0.1)` — each item computes its own in-range/delta state
  every frame from the shared scrollbar offset, so several can animate
  concurrently as their sections pass through view, same as the source.

**Deliberately not attempted:** the wrapper-slide-to-clicked-position beat
documented alongside the wipe. It depends on measuring position inside the
rotated (-90deg) list coordinate system, and getting that subtly wrong is easy
to ship and hard to notice on review — the yoyo kick alone reads as
substantial feedback without it.

**Verification.** Every FX module was checked against its own formula
numerically, not just eyeballed: at `delta=0.5`, the `rotate` module's
`--rotate × 10deg` should compute a transform matrix of
`cos(5°)=0.99619, sin(5°)=0.08716` — measured `matrix(0.996195, 0.087156, ...)`,
exact. At `delta=0.588`, predicted `cos(5.88°)=0.99473, sin(5.88°)=0.10244` —
measured `matrix(0.994739, 0.102445, ...)`, exact. The other three modules were
confirmed live-updating and freezing once their section scrolls out of range
(matching the source's own inRange-gated behaviour) by sampling
`el.style.transform` / the custom property across 5 scroll positions.

Also exercised: full wheel-driven traversal from one end of the dossier to the
other via vertical `deltaY` alone (confirming the horizontalScroll port),
close via both the close button and Escape, reopening a different agent
immediately after closing, and the whole flow again inside the Gallery iframe
on the main site — clean console throughout, cleanup verified (`sb`/`fx`
nulled, content emptied, all roster names restored to visible) after close.

### 7.1 Three things §7 got wrong, found by using it

**Closing a dossier left a coloured void.** `show()` calls
`fadeOutImage(.35, .75)` on the hover art — the ported beat — and nothing ever
brought it back, so closing dropped you on a bare accent wash. Worse than it
looks: `.q-hover` stayed on that agent, and the ported `onEnter` guard ignores
a hover on whichever agent it thinks is already current, so re-hovering *the
same name* did nothing. The agent you had just been reading about was the one
agent that could no longer restore the art; you had to hover someone else.

Fixed at the cause rather than at the symptom: `fadeOutImage` now drops
`.q-hover` and the wash whenever it tears the art down, so any later hover
re-arms whatever caused the teardown. `close()` then re-fires `mouseenter` on
the agent it opened, which runs the whole normal path — shard reveal, parallax
planes, `--accent`, tagline — with no dossier-specific restore code.

**The bio figure was mis-configured three ways at once.** It sourced
`splash-layers/<agent>-figure.webp`, a 1400×788 full-frame layer built for the
roster's wide composition and therefore mostly transparent; the base
`img { max-width: 100% }` then clamped it to the viewport while `height: 140%`
drove it past that, so it rendered **squashed to 64% of its true width**
(measured: 1440×1260 for a 1.78 aspect source); and it was centred with
`translateY(-50%)`, a transform `DossierFX` ('layered') overwrites outright
every frame, so it slid off the panel the moment you scrolled. Now: the tight
587×900 key art, `max-width: none`, and anchored on `bottom` so the FX drift is
additive to a resting position instead of fighting for the same property.
Verified by asserting rendered aspect equals natural aspect — 0.6522 both.

**The ability sections were half-empty.** A 69px icon at the top-left and the
copy at the bottom-left, with the middle of a 1440px panel blank between them.
They are two columns now, copy left and footage right (`row-reverse`, so the
markup can keep the clip first — it is the element `data-fx` is on), stacking
back to one column on a phone.

## 8. Ability rail — `js/ability-rail.js` (was: the filmstrip)

A horizontal, scroll-snapped, drag-flickable strip of the open agent's four
abilities, inside the dossier's bio panel. Clicking a card scrolls the dossier
to that ability's section; the card the dossier is parked on stays lit.

It carries the two techniques a filmstrip on the *roster screen* used to carry
— native `scroll-snap-type: x mandatory` and a pointer-drag velocity flick —
and it exists here rather than there because of what that strip cost:

- It duplicated a selection the roster names already owned, and chased them:
  hovering a name auto-scrolled the strip, so the two surfaces spent their time
  disagreeing about which agent was selected while its own cards were
  hover-dead and the names were hover-live.
- Its actual reason for existing was evidence — the piece needed those two
  techniques on show somewhere. Moving them into the ability rail did that job
  properly: there they pick an ability and scroll the dossier to it, so they
  earn their place by being used rather than by being displayed.

Here the same two techniques answer a real question (which ability, and take me
to it) and nothing else on screen competes for it.

**Both bugs the filmstrip taught us are carried over deliberately**, because
both are invisible on inspection and only appear under a real mouse:

1. **Pointer capture is taken on the first movement past a 4px threshold, never
   on `pointerdown`.** While an element has the pointer captured the browser
   retargets the following `click` to the capturing element — so `e.target` is
   the rail, `closest('.q-rail-card')` is null, and every card is silently
   unclickable. The filmstrip shipped that way and passed its checks, because
   the checks dispatched `click` straight at the card, which skips exactly the
   retargeting the bug depends on.
2. **The flick velocity is cleared the moment a glide is handed its starting
   value**, not at the start of the next drag. Otherwise the "suppress the click
   that ends a flick" guard keeps reading a stale velocity forever and eats
   ordinary clicks made long afterwards.

A vertical wheel over the rail steps it one card and is released at both ends,
so the dossier's own horizontal scroll picks it back up — the same
direction-aware handover as §4. It steps between snap points rather than adding
the raw delta, because `mandatory` snapping re-snaps after any imperative
scroll and a small delta gets pulled straight back to where it started.

**One thing the filmstrip's removal fixed for free.** That strip sat at
`z-index: 30`, under `#q-main-list` at 100 — and the roster is a rotated list,
so its 13 `.q-theme` columns tile the whole viewport including the band the
strip occupied, where none of them paints anything. Every wheel, drag and click
over the strip landed on an invisible name; `elementFromPoint` at the strip's
own centre returned `.q-theme`. It was raised above the list before it was
retired, and the rail has no such problem: it lives inside the dossier, which
is the top layer while it is open.

## 9. Roster controls — `js/controls.js`

Two gaps on the roster screen, once the intro had handed off: it answered to
nothing but a mouse, and the four roles in the left rail were paint. Neither
this file owns any preview logic — a selection change
dispatches `mouseenter` on the agent's `.q-theme .q-inner` and an open
dispatches `click` on its `.q-home-to-single`, so the shard reveal, the
parallax planes, the live `--accent`, the tagline and the dossier all run
through the one pipeline in §6.1/§7. This file only decides *which* agent.

**Keys.** `←`/`→` (and `↑`/`↓`) step, wrapping at both ends; `Home`/`End` jump;
`Enter`/`Space` open the dossier; `Escape` closes it, and a second `Escape`
clears an active role filter. Stepping walks the *selectable* agents, so a
filter's dimmed agents are skipped rather than landed on. A legend under the
status line says all of this — before it, a click opened a dossier and nothing
on screen suggested a click would do anything at all.

The keydown listener is bound in the **capture** phase, deliberately.
`dossier.js` binds `Escape` on the document in the bubble phase and clears its
own `isOpen` there; on the same phase this handler runs second, sees a dossier
that has just closed, and one `Escape` both closes the dossier and drops the
filter. Capturing puts it first, while `isOpen` is still true. (Measured: it
did exactly that before the change.)

**Role filter.** Clicking a role dims the agents that don't match (on `.q-col`,
not on the name's colour — that carries the hover beat's `.15s .4s` delay and
would make filtering feel half a second late, and `.q-inner`'s opacity is
GSAP's), retitles the status line, and moves the selection to a kept agent if
the filter just dimmed the one on screen. Clicking the same role again clears
it.

Verified: stepping stays inside a 3-agent filter and wraps; the roster name,
the art and `--accent` agree after every path (hover, key, filter); one `Escape` closes only the dossier and the next clears only
the filter; and §6.1's invariants still hold after a 7-agent hover sweep — one
active card, one `.q-hover`, one `.q-preview-active`, zero leaked shards.

## 10. Phone layout (<= 640px)

What used to happen below 640px was not a degraded layout, it was an empty
screen: the art, the wash, the HUD and the whole dossier were
switched off, and the rotated roster collapsed into an unreadable band of
13 names jammed against the bottom edge, tagline overlapping name. Tapping a
name then made it worse — the dossier's open path hid the other twelve names
and revealed a dossier that was `display: none`.

The roster stands upright at this width instead: an ordinary scrolling list of
tappable rows, the selected agent's art behind it at 42%, the same tagline
behaviour (selected agent only, truncated with an ellipsis rather than
marquee'd), and the role filter lifted out of the 3rem rail — narrower than the
words, so in place they were sliced off at the screen edge — into a row across
the top. The rotation, the `difference` blend and the `--yVal` skew are unwound
rather than left running: all three are desktop ideas with nothing to drive
them here.

**The dossier works here too**, stacked vertically — ability clips, rail and
all; the rail was already phone-shaped and only needed to stop being clipped by
the bio column's width. The FX modules are unchanged; `DossierFX` takes an axis, reading `offset.y` against each
section's `offsetTop`/`clientHeight` instead of `offsetLeft`/`clientWidth`, and
the scrollbar drops the `horizontalScroll` plugin so a wheel or a touch drag
scrolls it down. The formulas were always written in terms of distance along
the scroll axis; only which axis that is changes. The one number that had to
move with it is `rail`'s `25vh` — on a stacked phone layout `vh` is the long
axis and the icon railed clean off a 390px screen, where `vw` is the same
"quarter of the short side" the module means.

Verified at 390x780: 13 rows fit one screen without scrolling; a tap opens the
dossier; its five sections stack (`limit.y` 2262, `limit.x` 0) and a wheel
drives it end to end; all four FX modules report live values on the vertical
axis; close leaves `sb`/`fx` nulled and all 13 names restored. Clean console.

## 11. Removed: the technique X-ray

For a while `T` overlaid the live page with callouts naming which of the site's
eleven techniques was running on which element, each linking back to its
chapter. It worked — nine of the eleven were covered, three visible at a time,
with an index listing the rest — but it never looked like it belonged. The
callout cards were a second design language laid over a screen that already has
a HUD, and dimming the piece to explain the piece undercut the thing being
explained.

It is gone: `js/xray.js`, the `#q-xray` layer and its toggle, the `T` binding in
`js/controls.js`, and the key's mention in the Gallery's legend. What it was
covering for is still worth saying plainly — the Gallery's own copy in
`src/gallery/Gallery.js` now says nine of the eleven chapters run inside the
frame, and the chapters themselves are one scroll away.

Two things it taught, kept here because they will bite anything that tries to
label a live page again:

- **`offsetParent` is null for every `position: fixed` element**, so using it as
  an on-screen test silently hides exactly the ambient pieces — ticker, orbit
  marker, HUD — that such an overlay exists to point at. Test the bounding box
  plus computed `visibility`/`opacity` instead.
- **`display: flex` outranks the UA's `[hidden] { display: none }`.** Without an
  explicit `[hidden]` rule, an element whose anchor left the screen stays
  painted wherever it last sat.

## 12. Testing note: backgrounded tabs stall GSAP and rAF entirely

Not a piece behaviour — a note for whoever next tests this headlessly. A
backgrounded/off-screen browser tab (`document.hidden === true`) can fully
stall `requestAnimationFrame` in some automation setups, which stops **both**
GSAP's own ticker and every rAF-driven loop in this codebase
(`SmoothScroll._render`, `LayerParallax`, `OrbitMarker`, `CanvasWipe`) —
`gsap.ticker.frame` stays at exactly 0 indefinitely, not just throttled.
Fronting the tab doesn't always clear it. The fix used throughout this file's
own verification: shim `requestAnimationFrame` to `setTimeout(cb, 16)` for the
duration of the test —

```js
window.requestAnimationFrame = function (cb) {
  return setTimeout(function () { cb(performance.now()); }, 16);
};
```

— which unblocks everything at once (GSAP's internal ticker included, since it
also schedules through `requestAnimationFrame`). Real users are never affected;
their tab is the visible one.
