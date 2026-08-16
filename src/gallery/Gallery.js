import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ScrollGuard from "../components/ScrollGuard";
import "./gallery.css";

const PIECE_URL = `${process.env.PUBLIC_URL}/valorant/`;

// Where each beat of the briefing falls along the scrub. The piece's master
// timeline is 100 units — titles 0-65, slider 0-100, bg 20-70 (SPEC §1) — and
// the hand-off fires when the bg wipe passes 95%, i.e. at 20 + 0.95 * 50 = 67.5.
// The runway is mapped 1:1 onto that timeline, so these are runway positions
// too: everything past HANDOFF_AT is roster, not briefing.
const BEATS = [
  { at: 0.0, label: "Titles" },
  { at: 0.22, label: "Carousel" },
  { at: 0.675, label: "Hand-off" },
];
const HANDOFF_AT = 0.675;

// How much page scroll the briefing is worth, on top of the 100vh the pinned
// stage occupies. Six screens of scrubbed type at roughly a screen apiece, with
// the tail past the hand-off (32.5% of it, ~85vh) left over as the stretch where
// the roster is live and the reader still has runway to play in before the
// section lets go.
const RUNWAY_SCREENS = 2.6;

// The piece damps its own wheel input at 0.15 (SPEC §1). Driving setPosition
// straight from scroll would bypass that and hand the velocity maths a step
// function; chasing the target at the same rate keeps the engine's feel and,
// more to the point, keeps the --skewX ghosts reading the reader's real speed.
const DAMPING = 0.15;

// How long the hand-off prompt is guaranteed on screen before the gesture it
// asks for can dismiss it. Without a floor, a reader whose hand is still on the
// mouse from scrolling twitches it once and the prompt is gone before they have
// read it — which is the one failure mode a prompt cannot survive.
const PROMPT_MIN_MS = 3000;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Pinning is for a landscape pointer surface with motion allowed. Below 720px
// there is no wheel to choreograph — and the piece drops its briefing entirely
// under 640px (SPEC §10) — so the phone gets the framed, click-to-engage build
// that shipped before, unchanged.
function canPin() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia("(min-width: 721px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// The Gallery used to be six photo cards demonstrating techniques from the
// chapters above. It now shows one finished piece instead: an agent roster
// built on the scroll engine ported in public/qode-replica/ — a scrubbed
// GSAP master timeline, a damped smooth-scroll, velocity-driven type skew and
// a hover-swap art system, all running against real Valorant data.
//
// It lives at /valorant/ as a standalone document rather than as React
// components, for two reasons: it owns its own wheel handling and full-viewport
// layout, which would fight the parent page; and keeping one copy means the
// framed version here and the full-screen version are never out of sync.
//
// How it is *shown* is the thing this file decides, and it is the site's one
// section where that decision matters most: this is the finale of eleven
// chapters about scrolling, and for a while it was the one place on the page
// where the reader's scroll did nothing. The piece sat behind a veil at
// progress 0 — a still image of a scroll-driven work — until you clicked it,
// which is the one input the chapters above never asked for.
//
// So the reader scrolls *through* it now, in three acts:
//
//   1. approach — the frame rises inset and letterboxed like every demo above,
//      then opens to full-bleed as it centres. The frame becoming the viewport
//      is what says this one is different; the kicker no longer has to.
//   2. briefing — the stage pins and page-scroll position is written straight
//      into the piece's own scrollbar, so the reader's wheel is the playhead.
//      The chromatic ghosts and the --skewX shear are reading their actual
//      scroll velocity, which is the entire point and was previously behind an
//      opt-in click.
//   3. live — the moment the piece's intro hands off to the roster, the page
//      stops driving and the piece takes pointer and keyboard instead. That is
//      when the key legend appears, because that is when it becomes true.
//
// The wheel is never captured. During acts 1 and 2 the iframe is
// pointer-events: none, so every wheel event belongs to the document the whole
// way down and the trap the old ScrollGuard existed to prevent cannot form.
export default function Gallery() {
  const runwayRef = useRef(null);
  const pinRef = useRef(null);
  const frameRef = useRef(null);
  const skewRef = useRef(null);
  const phaseRef = useRef("approach");
  // Whether this copy of the piece has already spent its briefing. Tracked on
  // its own rather than read back off the phase: the phase is also parked at
  // "approach" when the runway drops below the viewport, which is the exact
  // moment the rearm below needs to know the briefing was spent.
  const spentRef = useRef(false);
  // The damped position the driver is chasing the scroll with. It lives out
  // here because the rearm has to be able to zero it: a reload hands us a piece
  // parked at 0 while this was still carrying the last one's offset, and the
  // first frame of catch-up would then scrub the whole fresh briefing away in
  // one step. (It did. That is why it is a ref.)
  const curRef = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [pinned, setPinned] = useState(canPin);
  const [phase, setPhase] = useState("approach");
  const [tookOver, setTookOver] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const queries = [
      window.matchMedia("(min-width: 721px)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
    ];
    const sync = () => setPinned(canPin());
    queries.forEach((q) => q.addEventListener("change", sync));
    return () => queries.forEach((q) => q.removeEventListener("change", sync));
  }, []);

  // Don't pay for the piece until the reader is near it. Nothing here is on
  // the network — the art is vendored under public/valorant/assets — but it
  // runs its own rAF loop and a GSAP ticker from the moment it boots, and
  // neither should be burning frames while someone is eleven chapters up.
  //
  // The margin is a screen and a half rather than the 200px it was: the piece
  // spends its first 1.8s on an entrance animation and only builds the scrubbed
  // timeline once that lands, so it has to be booting well before the approach
  // begins or the first stretch of runway drives nothing.
  useEffect(() => {
    const el = runwayRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const setPhaseOnce = useCallback((next) => {
    if (phaseRef.current === next) return;
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // A reload restores the scroll position, so the stage can be mounted already
  // stuck and full-bleed — but --open and --scrub start at their CSS defaults
  // of 0, and the driver's first write does not land until after the first
  // paint. That is one frame of a full-screen piece drawn at framed size and
  // then popping open, right where the reader is looking. Seed them before the
  // browser paints instead.
  useLayoutEffect(() => {
    if (!pinned) return;
    const runway = runwayRef.current;
    const pin = pinRef.current;
    if (!runway || !pin) return;
    const rect = runway.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrubDistance = Math.max(runway.offsetHeight - vh, 1);
    pin.style.setProperty("--open", clamp(1 - rect.top / (vh * 0.5), 0, 1).toFixed(4));
    pin.style.setProperty("--scrub", clamp(-rect.top / scrubDistance, 0, 1).toFixed(4));
  }, [pinned]);

  // ---- the driver: page scroll position -> the piece's own scrollbar --------
  //
  // window.__val is the piece's live config (valorant.js:599) and its scrollbar
  // is the same SmoothScroll the wheel would have driven, so this is the engine
  // being fed a different input, not a second engine running beside it. Nothing
  // inside the piece needed changing for this.
  useEffect(() => {
    if (!pinned || !mounted) return;
    const runway = runwayRef.current;
    const pin = pinRef.current;
    if (!runway || !pin) return;

    let raf = 0;
    let visible = true;

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                visible = e.isIntersecting;
                // The loop stops out here, so whatever phase it last computed
                // is the phase that will be on the element when the reader
                // comes back. Below the viewport, that answer is always
                // "approach" — otherwise a runway left in phase-live hands the
                // iframe the pointer for the whole of its next arrival.
                if (!visible && e.boundingClientRect.top > 0) setPhaseOnce("approach");
              });
            },
            { rootMargin: "50% 0px" }
          );
    if (io) io.observe(runway);

    const frameWindow = () => {
      const el = frameRef.current;
      try {
        // same-origin (the piece is served from PUBLIC_URL), so this is
        // readable — but a file:// build or a moved asset root would throw,
        // and a driver that throws every frame is worse than one that idles.
        return el && el.contentWindow && el.contentDocument ? el.contentWindow : null;
      } catch (err) {
        return null;
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;

      const rect = runway.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrubDistance = Math.max(runway.offsetHeight - vh, 1);

      // approach: closes exactly as the stage sticks, so the frame finishes
      // opening before a single unit of the briefing has been scrubbed — the
      // piece is never resized and scrubbed in the same frame.
      const open = clamp(1 - rect.top / (vh * 0.5), 0, 1);
      const p = clamp(-rect.top / scrubDistance, 0, 1);

      pin.style.setProperty("--open", open.toFixed(4));
      pin.style.setProperty("--scrub", p.toFixed(4));

      // The loop is armed half a screen early so it is warm on arrival, but it
      // must not *drive* from out there. A runway sitting above the viewport
      // reads p = 1, and writing that into a freshly reloaded piece would spend
      // its whole briefing off screen in one frame — which is exactly what the
      // rearm below exists to prevent.
      const onScreen = rect.bottom > 0 && rect.top < vh;

      // While the stage is the whole screen, the page's own chrome steps out of
      // the piece's way: the wordmark lands on the roster's vertical VALORANT
      // rail and the chapter dots sit in its right margin. Keyed on the stage
      // still covering the viewport rather than on `onScreen`, which stays true
      // for the half-screen on the way out — chrome that only comes back once
      // the frame is entirely gone reads as chrome that failed to come back.
      const covering = rect.top <= 0 && rect.bottom >= vh;
      document.documentElement.classList.toggle("gallery-immersive", open > 0.9 && covering);

      const win = frameWindow();
      const cfg = win && win.__val;
      const doc = win && win.document;
      const introLive =
        !!doc && doc.documentElement.classList.contains("q-with-intro");

      const intro = cfg && cfg.DOM && cfg.DOM.objs && cfg.DOM.objs.intro;
      // The piece opens on a 1.2s-per-column entrance and only builds the
      // scrubbed timeline when that lands (valorant.js:545). Until masterTl
      // exists there is no playhead to move, and writing into the scrollbar
      // meanwhile just fights the entrance — which is what a refresh partway
      // down the runway used to do.
      const ready = !!(intro && intro.masterTl);

      if (onScreen && cfg && cfg.scrollbar && introLive && ready) {
        const limit = cfg.scrollbar.limit.y;
        const target = p * limit;
        // A gap this size is not a gesture — it is a page reload with the
        // scroll position restored, an anchor jump, or the runway being
        // re-entered from somewhere else. Damping toward it would replay the
        // whole briefing as a fast-forward on the way; the reader asked to be
        // *at* that point, so go there.
        const teleport = Math.abs(target - curRef.current) > limit * 0.25;

        if (teleport && p >= HANDOFF_AT) {
          // Landing past the hand-off: there is no briefing left to show at
          // this position, so take the piece's own route to the roster rather
          // than scrubbing five screens of it past the reader to get there.
          curRef.current = target;
          // guarded the way the piece guards its own calls to this
          if (!intro.timelineDone) intro.finishTimeline();
        } else {
          let cur;
          if (teleport) {
            cur = target;
            // and no velocity shear for a jump nobody made: calcDelta reads
            // the frame-to-frame offset delta, and a teleport would otherwise
            // pin --skewX at its ±50 clamp for the next second
            intro.delta = cur;
            intro.val = 0;
          } else {
            cur = curRef.current + (target - curRef.current) * DAMPING;
            if (Math.abs(target - cur) < 0.5) cur = target;
          }
          curRef.current = cur;
          cfg.scrollbar.setPosition(0, cur);
        }
      }

      // The skew readout is the instrument made visible: this is the number the
      // piece is already computing from scroll velocity and writing into
      // --skewX. Updated by hand rather than through state — it changes every
      // frame, and a 60fps React render to print two digits is absurd.
      const readout = skewRef.current;
      if (readout) {
        const val = intro && introLive ? intro.val : 0;
        const text = (val > 0 ? "+" : val < 0 ? "−" : "±") + Math.abs(val).toFixed(1);
        if (readout.textContent !== text) readout.textContent = text;
      }

      if (!win || !cfg) setPhaseOnce(open >= 1 ? "briefing" : "approach");
      else if (!introLive) {
        spentRef.current = true;
        setPhaseOnce("live");
      } else setPhaseOnce(open >= 1 ? "briefing" : "approach");
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (io) io.disconnect();
      document.documentElement.classList.remove("gallery-immersive");
    };
  }, [pinned, mounted, setPhaseOnce]);

  // The briefing is one-way: hand-off destroys the intro's scrollbar and
  // removes #q-intro outright (valorant.js:477), so scrolling back up the
  // runway cannot rewind it. Rather than leave a spent runway behind, the piece
  // is reloaded once the reader has left — every asset is vendored and warm in
  // cache, so the next approach gets a real briefing rather than a roster they
  // scroll past.
  //
  // Only an *upward* exit rearms it, and that asymmetry is the whole point: a
  // reader who has left over the top will come back down through the approach,
  // which is the one direction a briefing can play in. Leaving downward and
  // returning enters the runway at its tail, where the roster is what that
  // stretch shows anyway — reloading there would just put a fresh intro
  // somewhere it can only be scrubbed backwards.
  useEffect(() => {
    if (!pinned || !mounted) return;
    const runway = runwayRef.current;
    if (!runway || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) continue;
          if (e.boundingClientRect.top <= 0) continue; // left downward
          if (!spentRef.current) continue;
          const el = frameRef.current;
          if (!el) continue;
          el.src = PIECE_URL;
          spentRef.current = false;
          curRef.current = 0;
          phaseRef.current = "approach";
          setPhase("approach");
        }
      },
      { threshold: 0 }
    );
    io.observe(runway);
    return () => io.disconnect();
  }, [pinned, mounted]);

  // The piece's own "skip the line" button is inside a frame that is
  // deliberately not taking pointer events during the briefing, so the skip
  // lives out here instead — and it is a scroll, not a jump, because the thing
  // being skipped is runway.
  const skipToRoster = useCallback(() => {
    const runway = runwayRef.current;
    if (!runway) return;
    const top = window.scrollY + runway.getBoundingClientRect().top;
    const scrubDistance = Math.max(runway.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: top + scrubDistance * HANDOFF_AT + 8, behavior: "smooth" });
  }, []);

  const head = (
    <div className="chapter-head">
      <div className="kicker">Applied — every technique above, in one piece</div>
      <h2 className="chapter-title">The Gallery</h2>
      <p className="chapter-desc gallery-intro">
        Techniques are tools. This is what happens when you spend them all at once: a
        scroll-scrubbed agent roster, where the whole briefing is a paused timeline whose
        playhead is your scroll position, the type shears to match your scroll velocity, and
        the roster underneath swaps art on scroll. Nine of the eleven chapters above are
        running inside this frame.
      </p>
      {pinned ? (
        <p className="chapter-desc gallery-intro gallery-cue">
          Keep scrolling — the page is the playhead.
        </p>
      ) : null}
    </div>
  );

  // Landing on the roster is a change of instrument, and nothing on screen says
  // so: the briefing answered to scroll, and the thing that arrives answers to
  // the pointer. The piece's own .q-keyhint lists the keys on this beat, but it
  // is a five-word legend in 8px type at the top of the screen, and the reader
  // has spent the last five screens with a hand on the wheel and no reason to
  // look up there.
  //
  // So the prompt is shown once, at the hand-off, and it is dismissed by the
  // gesture it asks for rather than by a timer — move the pointer, press a key,
  // click, and it goes. A prompt that outlives the thing it is prompting for is
  // just clutter, and one that expires on a clock is gone precisely when the
  // reader who needed it was still deciding.
  useEffect(() => {
    if (!pinned || phase !== "live") {
      setTookOver(false);
      return;
    }
    const el = frameRef.current;
    let doc = null;
    try {
      doc = el && el.contentDocument;
    } catch (err) {
      doc = null;
    }
    if (!doc) return;

    const done = () => setTookOver(true);
    // The listeners are armed on a delay rather than the prompt being hidden on
    // one: dismissal stays tied to the reader doing the thing, and the floor
    // only decides how early that can count. Anything they do inside the floor
    // still works — it just does not also delete the sentence explaining it.
    const arm = setTimeout(() => {
      // pointermove needs real movement, so a pointer resting over the frame
      // while the reader wheels past does not count as taking over
      doc.addEventListener("pointermove", done, { once: true, passive: true });
      doc.addEventListener("keydown", done, { once: true });
      doc.addEventListener("click", done, { once: true });
    }, PROMPT_MIN_MS);

    return () => {
      clearTimeout(arm);
      doc.removeEventListener("pointermove", done);
      doc.removeEventListener("keydown", done);
      doc.removeEventListener("click", done);
    };
  }, [pinned, phase]);

  // The piece's own "skip the line" is a wheel-era control: it belongs to a
  // copy that owns its scroll. Under the pinned build the frame is not in the
  // pointer's path during the briefing, so that button would sit there looking
  // live and doing nothing — the one thing worse than no skip. It is hidden for
  // the duration and .gallery-skip out in the rail does the job instead, by
  // scrolling, which is the only thing that can move a playhead made of scroll.
  const hidePieceSkip = useCallback(() => {
    if (!pinned) return;
    const el = frameRef.current;
    try {
      const doc = el && el.contentDocument;
      if (!doc || doc.getElementById("gallery-driven")) return;
      const style = doc.createElement("style");
      style.id = "gallery-driven";
      style.textContent = "#q-skip-the-line { display: none !important; }";
      doc.head.appendChild(style);
    } catch (err) {
      /* cross-origin build: the frame keeps its own controls, no harm done */
    }
  }, [pinned]);

  const embed = mounted ? (
    <iframe
      ref={frameRef}
      className="gallery-embed"
      src={PIECE_URL}
      title="VALORANT — Agent Roster"
      loading="lazy"
      onLoad={hidePieceSkip}
    />
  ) : (
    <div className="gallery-frame-placeholder">
      <span>Loading the piece…</span>
    </div>
  );

  // Phone and reduced-motion: the framed build, with the wheel gate that every
  // demo above uses. Nothing here choreographs scroll, so nothing here needs to
  // borrow it. See ScrollGuard for why capture is earned rather than assumed.
  if (!pinned) {
    return (
      <section id="gallery" className="section bg-blue gallery-section">
        {head}
        <div className="gallery-stage" ref={runwayRef}>
          <ScrollGuard className="gallery-frame" label="Click to run the briefing">
            {embed}
          </ScrollGuard>

          <div className="gallery-stage-foot">
            <ul className="gallery-keys">
              <li>
                <kbd>scroll</kbd>, <kbd>←</kbd> <kbd>→</kbd>, or hover pick an agent
              </li>
              <li>
                <kbd>click</kbd> or <kbd>enter</kbd> open the dossier
              </li>
              <li>
                <kbd>esc</kbd> close it, or hand the wheel back
              </li>
            </ul>
            <a className="gallery-open" href={PIECE_URL} target="_blank" rel="noreferrer">
              Open full screen ↗
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="section bg-blue gallery-section is-pinned">
      {head}

      <div
        className="gallery-runway"
        ref={runwayRef}
        style={{ "--runway-screens": RUNWAY_SCREENS }}
      >
        <div
          className={`gallery-pin phase-${phase}${tookOver ? " has-taken-over" : ""}`}
          ref={pinRef}
        >
          <div className="gallery-frame">{embed}</div>

          <div className="gallery-prompt" aria-hidden="true">
            <span className="gallery-prompt-cue">Move over a name</span>
            <span className="gallery-prompt-sub">the roster follows your pointer</span>
          </div>

          {/* The reader's own scroll, read back to them as an instrument.
              Nothing here repeats what the piece says itself: the keys are
              .q-keyhint's job and it reveals them on the same beat this rail
              leaves on. */}
          <aside className="gallery-rail">
            <div className="gallery-rail-label">Briefing</div>
            <div className="gallery-rail-track" aria-hidden="true">
              <span className="gallery-rail-fill" />
              {BEATS.map((b) => (
                <span key={b.label} className="gallery-rail-beat" style={{ "--at": b.at }}>
                  {b.label}
                </span>
              ))}
            </div>
            <div className="gallery-rail-foot">
              <div className="gallery-rail-skew" aria-hidden="true">
                <span className="gallery-rail-skew-key">skewX</span>
                <span className="gallery-rail-skew-val" ref={skewRef}>
                  ±0.0
                </span>
              </div>
              <button type="button" className="gallery-skip" onClick={skipToRoster}>
                Skip to roster ↓
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Lands as the stage lets go — the exhale after five screens of pinned
          runway, and somewhere to put the link that does not have to float
          over the art to be found. */}
      <div className="gallery-runway-foot">
        <p>
          Nine of the eleven chapters above are running in there. The full-screen build is
          the same document, unframed.
        </p>
        <a className="gallery-open" href={PIECE_URL} target="_blank" rel="noreferrer">
          Open full screen ↗
        </a>
      </div>
    </section>
  );
}
