# QI Catalog intro — replication spec

Rebuild of the scroll-driven intro at <https://qodeinteractive.com/catalog/>.
Private, unpublished learning sandbox — not linked from the app, not shipped,
not presented as original work. The 13 slide images are Qode Interactive's own
files, reused here only for this study.

**Scope of this build: the intro sequence, plus the catalog's hover behaviour.**
The project sub-pages and their horizontal-scroll parallax are *not* rebuilt
here (they are summarised at the bottom for whenever they are).

## 0. Running it

It lives in `public/`, so the app's own dev server serves it as static files —
no build step, no bundler, nothing imported into the React tree:

```
npm start                       ->  /                 the main horizontal site
                                    /qode-replica/    this sandbox
```

`.claude/launch.json` has a `hparallax-3001` entry that runs the dev server on
port 3001 (3000 is often already taken). Deliberately **not** linked from
anywhere in the app — you reach it by typing the URL.

---

## 1. How this was derived

Earlier passes at this inferred motion from screenshots, then from monkey-
patching TweenMax and sampling easing curves. Both were guesswork with error
bars. This pass didn't need either: **the site ships a readable build.**

```
curl -O https://qodeinteractive.com/catalog/js/bundle.js      # webpack, GSAP 2
curl -O https://qodeinteractive.com/catalog/css/bundle.css
terser bundle.js -f beautify=true,indent_level=2 -o bundle.pretty.js
```

Minified identifiers survive as readable structure — every class, method name,
duration, ease and tween value used below was read off `bundle.pretty.js`
(the `Intro` module) and `bundle.css`, not measured off a video. Live-page
probing was then used only to *check* the rebuild against the original, never
as the source of a number.

## 2. Architecture

Four moving parts:

| Part | What it is |
|---|---|
| `#q-scroll-vh` | A smooth-scrollbar container whose only content is a 600vh spacer. Nothing is drawn in it. Its scroll offset is the intro's clock. |
| `masterTl` | A **paused** GSAP timeline, 100 units long, holding three child timelines. Never played. |
| ticker | Every frame: `masterTl.progress(scrollbar.offset.y / scrollbar.limit.y)`. |
| `--skewX` / `--yVal` | Two CSS variables written every frame from the *velocity* of that same scroll offset. All the shear and ghosting is CSS reacting to them. |

So the intro is fully scrub-driven and reversible: there is no step, no lock,
no "advance one slide per N pixels". Scroll up and it plays backwards exactly.

Master timeline layout — `.add(titles)`, `.add(slider,'-=65')`, `.add(bg,'-=80')`:

```
0        20                65       70                            100
|--------|-----------------|--------|-----------------------------|
|=== titles (65) ==========|                                       four columns
|=== slider (100) =====================================...=========|  carousel strip
         |==== bg (50) =============|                              black panel wipe
```

`limit.y` is 500vh, so the whole sequence is exactly five screens of scrolling.

## 3. The scroll engine

idiotwu/smooth-scrollbar, `{ damping: 0.15, renderByPixels: false, delegateTo: '#q-intro' }`,
ported in `js/smooth-scroll.js`. The integrator is the part that matters:

```js
if (Math.abs(momentum) <= 0.1) return { momentum: 0, position: offset + momentum };
const next = momentum * (1 - damping);          // 0.85
return { momentum: next, position: offset + momentum - next };   // travel 15% of what's owed
```

Wheel deltas are scaled by `[1, 28, 500][deltaMode]` and folded into the
outstanding momentum, clamped to the distance actually remaining (the
`edgeEasing` plugin) so it can never overshoot an end.

`renderByPixels: false` matters: sub-pixel offsets are what keep the
velocity-driven skew smooth instead of steppy.

## 4. Velocity → skew

```js
d   = 10 * clamp(0.1 * (offset.y - lastOffset), -5, 5);   // this frame's travel, capped at ±50
val = round100(val * 0.9 + d * 0.1);                      // 10%/frame lerp
if (val >= -0.05 && val <= 0.05) val = 0;                 // deadzone, stops endless jitter
```

`val` is written straight into `--skewX` on `#q-intro`, and `0.25 * -val` into
`--yVal` on the catalog list. CSS does the rest:

| Element | Transform |
|---|---|
| `#q-intro-title .q-skew` | `skewX(--skewX * -.2deg) skewY(--skewY * -.05deg)` |
| `.q-shadow.q-front` (white 1px outline, opacity .25) | `translate3d(--skewX * 2px, --skewY * -2px, 0)` |
| `.q-shadow.q-back` (rgba(211,211,211,.05)) | `translate3d(--skewX * 1px, --skewY * -1px, 0)` |
| `#q-main-list .q-list-part` | `skewY(--yVal * .1deg)` |
| `.q-theme .q-shadow.q-front / .q-back` | `translate3d(0, --yVal * -4px / -2px, 0)` |

On timeline complete / reverse-complete, `--skewX` is tweened back to 0 over 0.4s.

## 5. Tween inventory

Everything below is verbatim from the source module. Durations in seconds.

**Entrance** (before scroll is armed), per column *n* = 0..3, `o = n % 2 ? -1 : 1`:

| Target | Tween |
|---|---|
| `.q-move` column | `to {x: 0}`, 1.2, `power4.inOut`, delay `0.2 * n` |
| `.q-skew` | `fromTo {skewX: 40*o} → {skewX: 0}`, 1.32 |
| `.q-shadow.q-front` | `fromTo {x: 200*o} → {x: 0}`, 1.5 |
| `.q-shadow.q-back` | `fromTo {x: 50*o} → {x: 0}`, 1.5 |

then `clearProps: 'all'` hands each element back to the CSS. On the 4th
column's completion: `showSlider()`, `showScroll()`, `.q-mark` fades in over 1s,
`initTimeline()`, pointer events re-enabled.

**Scrubbed timelines**

| Timeline | Tween |
|---|---|
| titles | `.q-1 → x:-110vh`, `.q-2 → x:120vh`, `.q-3 → x:-130vh`, `.q-4 → x:140vh`, all 65 units, all at position 0 |
| slider | `#q-intro-slider → x:-150vw` (`-150vh` in portrait), 100 units |
| bg | `#q-intro-bg → scaleX:0`, 50 units, `Linear.easeNone`, `transform-origin: 0 0` |

CSS start positions for the columns are `+120vh / -120vh / +140vh / -160vh`.

**Slide swap** — driven by `floor(sliderProgress * 13)`, not by scroll distance:

```js
if (!forwards && slide[i+1]) gsap.to(slide[i+1], {duration: .2, autoAlpha: 0, ease: 'expo.out'});
gsap.to(slide[i], {duration: .3, autoAlpha: 1, overwrite: true, ease: 'expo.out'});
```

Slides are **stacked and revealed, never cross-faded**. Going forwards each new
slide simply fades in on top; only when scrolling back does the covering slide
have to be faded out — which is why `forwards` (from a `wheel` listener on
`<body>`) exists at all.

**Affordances**

| Thing | Tween |
|---|---|
| scroll arrow in | `fromTo {strokeDashoffset: 430, x: -20} → {0, x: 0}`, 0.65, `repeat:-1, yoyo, repeatDelay: 1` |
| scroll arrow out | `to {strokeDashoffset: 430, x: -20}`, 0.65, `overwrite` |
| skip in | `fromTo {x:10, autoAlpha:0} → {x:0, autoAlpha:1}`, 0.4, delay 0.6, `power2.out` |
| skip out | reverse of the above, 0.4, `power2.out` |
| skip clicked | intro `to {x:'-100%'}`, 0.7, `power4.inOut`; its `<section>`s fade over 0.55 |

**Closing beat** — fires once when the bg timeline passes 95%:

```
--yVal → 0            0.4
.q-main y → '0%'      0.3
#q-header x,y → '0%'  0.2
#q-intro-bg scaleX→0  0.4  → finishTimeline(): destroy scrollbar, remove #q-intro
```

Slide order is the site's own authored order, not alphabetical:
`kenozoik, haar, blaze, smilte, manon, dieter, tetsuo, galatia, amedeo, monolab, ion, penumbra, koto`.

## 5b. Catalog hover

Bound as `mouseenter` on each `.q-theme > .q-inner` — the name's own box, not
the column — so the art only changes while the pointer is actually over a name.
The handler keeps a single `.q-hover` class on the list and does nothing if the
pointer re-enters the name that already owns it.

**There is no cursor tracking anywhere on this page.** The art does not follow
the mouse, tilt, or parallax; each project's frame is a fixed, hand-placed
rectangle and hovering just cuts to it. (Verified: window `mousemove` drives no
tween, and moving around inside a held hover doesn't shift the art.)

The swap is deliberately asymmetric — the outgoing image is killed instantly,
only the incoming one animates:

```js
if (active) gsap.set(active, {autoAlpha: 0, overwrite: true});         // instant cut
gsap.fromTo(next, {scaleX: 1.05, x: -20, autoAlpha: 0},
                  {duration: .45, scaleX: 1, x: 0, autoAlpha: 1, delay: .1, ease: 'power4.out'});
```

`fadeOutImage(dur = .5, delay = 0)` → `to {autoAlpha: 0, scaleX: 1.1, ease: 'expo.out'}`
exists but is only called when *opening* a project, which this build doesn't do.
So nothing clears the art when the pointer leaves the list — the last hovered
piece stays up. That is the original's behaviour, not an omission here.

**Frames.** Each project gets `width: Nvh` with a px cap equal to the image's
own natural width; height just follows the image's aspect ratio (there is no
`object-fit` — an earlier pass misread the computed `fill` default as
deliberate stretching). Positions are percentage-based, several via
`calc(50% - Nvh)`. Blaze's image is additionally mirrored, `scaleX(-1)`.
Sizes range from amedeo's 28vh to haar's 231vh — that spread is the art
direction, not a bug.

**Taglines.** Revealed by `.q-hover` (opacity 0→1, .2s). Two copies of the line
run the same `qMarquee` (`translateX(100%)` → `translateX(-100%)`) half a cycle
apart — `.q-lead` at `animation-delay: -3s`, `.q-follow` absolutely at 0,0 — so
one is always entering as the other leaves. The 1st, 2nd, 3rd and 12th projects
use an 8s cycle with a -4s offset instead.

**Stacking.** `#q-preview` is a body child with no z-index; `#q-main-list` has
`z-index: 100` and `mix-blend-mode: soft-light`, so the names blend into
whatever art is showing rather than sitting flatly on top of it.

## 6. Layout facts worth keeping

- `html { font-size: 20px }`, 17px ≤1440, 16px ≤1366. `--black: #101010`. Heebo.
- `#q-intro-title`: `rotate(-90deg)`, `left: 12.5%`, `bottom: 5rem`,
  `font-size: 18vmin`, `line-height: 1.07`. The rotation is why four stacked
  spans read as four vertical columns and why their local x runs up the screen.
- `#q-intro-slider`: `49vmax × 27.55vmax`, at `top: calc(50% - 13.8vmax)`,
  `left: calc(100% - 15vmax)` — i.e. mostly off the right edge at rest.
- `#q-main-list`: `width:100vh; height:100vw; rotate(-90deg) translateX(-100%)`,
  origin `0 0`, `mix-blend-mode: soft-light`. Same rotate-the-whole-thing trick.
- Scroll arrow polyline is 429.63 units long → `stroke-dasharray: 430`.

## 7. Deliberate deviations

1. **`TweenMax.defaultEase = Power2.easeOut` is not ported.** The source sets it
   at the top of `initTimeline`, but it is a dead assignment: GSAP 2 falls back
   to `TweenLite.defaultEase`, and on the live page `TweenMax.defaultEase !==
   TweenLite.defaultEase` while `TweenLite.defaultEase` is still `Power1.easeOut`.
   Copying the line would have made every scrubbed tween visibly wrong.
   Confirmed on the live page at scroll y=1700: title x `-845.83` vs `-845.8`
   predicted for power1.out (power2.out predicts `-973.0`); slider x `-1000.86`
   vs `-1000.9` (power2.out predicts `-1260.6`).
2. **GSAP 3.15 instead of GSAP 2 / TweenMax.** Mechanical API translation;
   the ease curves are the same maths.
3. **Touch is an approximation, not a port.** The real site swaps to a different
   intro on touch (8 slides, tap to skip) via a `Modernizr.touchevents` branch.
   The touch drag in `smooth-scroll.js` is this rebuild's own, and the desktop
   path is what was replicated.
4. **No `#q-list-overlay`, no `#q-themes-pseudo` ghost list, no loader, no
   barba page transitions** — all belong to navigation flows outside the intro.
   `List.reset()` here therefore skips the overlay wipe it would otherwise run.
5. **Preview images load eagerly** via `src` instead of the original's
   `data-src` + vanilla-lazyload pass. Behaviourally identical once warm.
6. **Projects don't open.** The source's hit layer is
   `<a class="q-home-to-single q-abs">` pointing at the project page; here it is
   a `<span>` with the same classes, so the hover area matches without a dead
   link. `List.readySingle()` is not ported.
7. `window.__qode` is exposed for console inspection. Sandbox convenience,
   not in the original.

**Ported quirks** (kept on purpose — these are the original's behaviour):

- `checkForActive()` seeds a hover when the intro ends by feeding a 0-based
  random index into `:nth-child(t)`, which is 1-based. So `t = 0` matches
  nothing (~1 hand-off in 13 lands on a blank catalog) and the 13th project can
  never be the one seeded.
- Nothing clears the preview art on mouse-out; the last hovered piece stays.

## 8. Verification

Rebuild and live site driven to the identical scroll offset, same 1170×987
viewport:

| Measurement | Live site | This rebuild |
|---|---|---|
| title `.q-1` x @ y=1700 | -845.83 | -845.83 |
| slider x @ y=1700 | -1000.86 | -1000.86 |
| bg scaleX @ y=1700 | 0.7110 | 0.7110 |
| `.q-front` transform @ `--skewX:26.15` | `matrix(1,0,0,1,52.3,0)` | `matrix(1,0,0,1,52.3,0)` |
| `.q-skew` transform @ same | `matrix(1,0,-0.0915351,1,0,0)` | `matrix(1,0,-0.0915351,1,0,0)` |
| scroll offset after 12× `deltaY:100` | -1200 | -1200 |
| `--skewX` peak over that burst | 25.91 | 26.00 |

Reverse scrubbing, the skip path, and the closing hand-off were exercised too:
slides fade back out in the right order, the skip affordance returns, the arrow
loop restarts on reverse-complete, and the intro removes itself with the header
and catalog in their final state.

## 9. Not built yet (for whenever the rest is wanted)

- **Opening a project** — `List.readySingle()`: the list overlay wipes in
  (`fromTo scaleX 0→1`, 1.25, `expo.inOut`, origin `100% 0`), non-active names
  cut out, the wrapper slides to the clicked name's position (1.25,
  `quint.inOut`), `--yVal` does a `yoyo` kick (0.6, `expo.inOut`), then the
  preview art fades out with `fadeOutImage(.35, .75)`.
- **Project sub-pages** — this is where the horizontal scrolling actually lives:
  a `horizontalScroll` smooth-scrollbar plugin maps wheel Y to X
  (`x: |dx| > |dy| ? dx : dy, y: 0`), plus five scroll-driven FX modules that
  all share the shape `buffer = f(offset.x, element); delta = lerp(delta, buffer, 0.1)`:
  layered (`translateY(-delta * max * speed %)`), text (`--xText`),
  rail (`translateX(delta * 25vh)`), vertical (`translateY(±delta * 50%)`),
  rotate (`--rotate`).
