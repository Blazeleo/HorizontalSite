/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER — controls

   Two things the roster screen was missing once the intro handed off:

     1. It could only be driven by a mouse. Hover was the only way to change
        agent and a click — with nothing on screen saying so — was the only way
        into the dossier. Arrow keys now step the roster, Enter opens the
        dossier, Escape closes it (dossier.js already bound Escape), and a
        legend in the corner says so.
     2. The four roles in the left rail were painted-on labels. They are
        buttons now: picking one dims the agents that don't match and retitles
        the status line.

   Neither of these owns any preview logic. A selection change dispatches a
   synthetic `mouseenter` on the agent's existing `.q-theme .q-inner`, and an
   open dispatches `click` on its `.q-home-to-single` — so the shard reveal,
   the parallax planes, the live --accent, the tagline and the dossier all fire
   through the one pipeline that already exists (see SPEC §6.1, §7). This file
   only decides *which* agent.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var ROLE_KEY = 'q-role-active';
  var activeRole = null;

  function fire(el, type) {
    if (!el) return;
    var e = document.createEvent('Events');
    e.initEvent(type, true, false);
    el.dispatchEvent(e);
  }

  function themes() {
    return Array.prototype.slice.call(document.querySelectorAll('#q-themes .q-theme'));
  }

  /* Agents the current filter leaves selectable — the whole roster when no
     role is picked. Every navigation decision below runs on this list, so
     arrow keys skip dimmed agents instead of landing on ones you can't see. */
  function selectable() {
    return themes().filter(function (t) { return !t.classList.contains('q-dim'); });
  }

  function currentIndex() {
    var hovered = document.querySelector('#q-themes .q-theme.q-hover');
    return hovered ? parseInt(hovered.dataset.index, 10) : -1;
  }

  /* The intro owns the screen until it removes itself; nothing here should
     respond while it is still running. */
  function introRunning() {
    return !!document.querySelector('#q-intro');
  }

  function dossierOpen() {
    return !!(window.__dossier && window.__dossier.isOpen);
  }

  function select(index) {
    var theme = document.querySelector('#q-themes .q-theme[data-index="' + index + '"]');
    if (!theme) return;
    fire(theme.querySelector('.q-inner'), 'mouseenter');
  }

  /* Step n places through the selectable agents, wrapping at both ends. */
  function step(n) {
    var list = selectable();
    if (!list.length) return;
    var at = -1;
    var here = currentIndex();
    list.forEach(function (t, i) { if (parseInt(t.dataset.index, 10) === here) at = i; });
    var next = at === -1
      ? (n > 0 ? 0 : list.length - 1)
      : (at + n + list.length) % list.length;
    select(parseInt(list[next].dataset.index, 10));
  }

  function openCurrent() {
    var i = currentIndex();
    if (i < 0) { step(1); i = currentIndex(); }
    if (i < 0) return;
    fire(document.querySelector('#q-themes .q-theme[data-index="' + i + '"] .q-home-to-single'), 'click');
  }

  /* ---- role filter -------------------------------------------------------- */

  function setStatus(role, count) {
    var status = document.querySelector('.q-status');
    if (!status) return;
    var label = role ? role.charAt(0) + role.slice(1).toLowerCase() : 'Agent roster';
    status.innerHTML = '// ' + label + ' <b>—</b> ' + count + ' active';
  }

  function applyFilter(role) {
    activeRole = role;
    var kept = 0;
    var firstKept = null;

    themes().forEach(function (t) {
      var agent = (window.AGENTS || [])[parseInt(t.dataset.index, 10)];
      var match = !role || (agent && agent.role === role);
      t.classList.toggle('q-dim', !match);
      if (match) { kept++; if (firstKept === null) firstKept = parseInt(t.dataset.index, 10); }
    });

    document.querySelectorAll('#q-header .q-role').forEach(function (b) {
      b.classList.toggle(ROLE_KEY, b.dataset.role === role);
      b.setAttribute('aria-pressed', String(b.dataset.role === role));
    });
    document.documentElement.classList.toggle('q-filtered', !!role);

    setStatus(role, kept);

    // If the agent on screen is one the filter just dimmed, move to one it
    // kept — otherwise the art and the roster disagree about who is selected.
    var here = currentIndex();
    var stillValid = here >= 0 && !document.querySelector(
      '#q-themes .q-theme[data-index="' + here + '"].q-dim');
    if (!stillValid && firstKept !== null) select(firstKept);
  }

  function bindRoles() {
    document.querySelectorAll('#q-header .q-role').forEach(function (btn) {
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        applyFilter(activeRole === btn.dataset.role ? null : btn.dataset.role);
      });
    });
  }

  /* ---- keys --------------------------------------------------------------- */

  function bindKeys() {
    /* Capture phase, deliberately. dossier.js binds Escape on the document in
       the bubble phase and clears its own isOpen flag; listening on the same
       phase means this handler runs *after* that and sees a dossier that has
       just closed, so one Escape would both close the dossier and drop the
       role filter. Capturing puts this first, while isOpen is still true. */
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (introRunning()) return;

      // Escape while filtered clears the filter; dossier.js owns Escape while
      // the dossier is open, so only claim it once that has closed.
      if (e.key === 'Escape') {
        if (!dossierOpen() && activeRole) { applyFilter(null); e.preventDefault(); }
        return;
      }
      if (dossierOpen()) return;

      // A focused role button owns its own Enter/Space; swallowing them here
      // would leave the filter untoggleable from the keyboard.
      if (e.target && e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;

      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown':
          step(1); e.preventDefault(); break;
        case 'ArrowLeft': case 'ArrowUp':
          step(-1); e.preventDefault(); break;
        case 'Home': case 'End':
          var l = selectable();
          if (l.length) {
            select(parseInt((e.key === 'Home' ? l[0] : l[l.length - 1]).dataset.index, 10));
          }
          e.preventDefault(); break;
        case 'Enter': case ' ':
          openCurrent(); e.preventDefault(); break;
      }
    }, true);
  }

  /* ---- touch selection ----------------------------------------------------

     Every way into the preview is a hover, and a phone has no hover. Upright,
     the roster is a scrolling list with the agent art behind it, so the art
     simply never changed: you got whichever agent was seeded at boot until you
     tapped one, and tapping opens the dossier rather than previewing.

     So scrolling is the selection. Whichever name is nearest a focus line a
     third of the way down the list becomes the current agent — which is what
     the eye is doing anyway. It routes through select(), so the shard reveal,
     --accent and the tagline all fire on the one pipeline this file uses for
     the keyboard. */
  function bindTouchSelection() {
    var scroller = document.querySelector('#q-main-list .q-list-part');
    if (!scroller) return;

    var queued = false;
    var lastIndex = -1;

    function pick() {
      queued = false;
      var list = selectable();
      if (!list.length) return;

      var box = scroller.getBoundingClientRect();
      var line = box.top + box.height * 0.33;
      var best = null, bestDist = Infinity;

      list.forEach(function (t) {
        var r = t.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - line);
        if (d < bestDist) { bestDist = d; best = t; }
      });

      if (!best) return;
      var index = parseInt(best.dataset.index, 10);
      // select() dispatches a synthetic mouseenter, which re-runs the whole
      // reveal — so only on an actual change, not on every scroll frame.
      if (index === lastIndex) return;
      lastIndex = index;
      select(index);
    }

    scroller.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(pick);
    }, { passive: true });

    pick();
  }

  /* ---- wheel selection -----------------------------------------------------

     Desktop has no scroll surface once the intro hands off — html,body sit at
     overflow:hidden (SPEC's rotated-list layout fits all 13 names without
     scrolling) — so today a wheel notch over the roster does nothing at all,
     and hover is the only way to move through it. This gives the wheel a job:
     one notch steps the roster exactly like an arrow key, so scrolling is a
     first-class way to browse rather than something the piece just eats.
     Hover is untouched — it still selects on its own the moment the pointer
     lands on a name — so a reader can do either.

     DELIBERATELY not step() — step() wraps at both ends, which is right for
     arrow keys but wrong here. This document has zero scrollable height
     (overflow:hidden everywhere), which is exactly what lets a wheel event
     the piece doesn't consume fall through to whatever contains it: the page
     this sits in embeds it via the Gallery's ScrollGuard
     (src/gallery/Gallery.js), un-engages once the frame scrolls off-screen,
     and the standalone /valorant/ intro hands momentum back at its own edges
     the same way (_shouldPropagateMomentum in js/smooth-scroll.js). Wrapping
     past the last agent would mean *every* wheel notch over the roster gets
     preventDefault()'d forever, so a reader who scrolls down past Skye would
     never be able to scroll the rest of the page again — the exact trap
     ScrollGuard exists to avoid.

     v2 — the first cut of this fired on every single wheel event above a
     magnitude floor, debounced by a flat 240ms lock. That was fine for a
     notched mouse wheel but not for a trackpad: a real flick sends dozens of
     tiny deltaY events over 500ms-1500ms of inertia, so the lock kept
     re-arming mid-flick and one swipe could skip two or three agents
     unevenly — the "not smooth" of it. It also decided edge-release *after*
     already calling preventDefault() on that gesture's opening ticks, so a
     flick that turned out to have nowhere to go still hung onto its own head
     before handing off, which reads as a stutter right at the moment it lets
     go.

     This tracks the *gesture*, not the event: the first tick of it decides,
     once, whether this gesture has anywhere to go — and every later tick in
     the same gesture (no gap over GESTURE_GAP ms) just replays that one
     decision instead of re-deciding. Consuming gestures fire their step
     immediately (no accumulation delay) and swallow their own tail;
     releasing gestures never call preventDefault at all, from their very
     first tick, so the whole flick — not just its back half — chains to the
     page in one smooth motion.

     That first tick used to have to clear a magnitude deadzone (4px) before
     it could decide anything, to filter the zero-ish deltas some trackpads
     send at rest. It filtered too much: a real trackpad gesture *ramps up*
     from near-zero, and every one of those ramp-up ticks was falling through
     un-prevented while the gesture waited for one big enough to decide with —
     for a gentle or moderate scroll (most scrolling), the whole gesture could
     end before any tick ever cleared 4px, so nothing was ever captured and
     it read as "scrolling just moves the page." Now the very first nonzero
     tick decides — no magnitude floor — so there is no ramp-up window left
     to leak through.

     v3 — all of the above used to run for a wheel notch anywhere over the
     roster: the art, the names, the empty gap between them, all of it. That
     made the piece feel like it could grab the wheel from anywhere, which is
     the same complaint ScrollGuard exists to solve one level up. Now it only
     runs for a notch over .q-scroll-rail (css/valorant.css has the rail
     itself); everywhere else a wheel event is left completely alone, same as
     it always was for the intro before it starts and the dossier while it's
     open. */
  function bindWheelSelection() {
    var GESTURE_GAP = 140;   // ms of silence that starts a new gesture

    var lastAt = 0;
    var decided = false;   // this gesture already chose consume-vs-release
    var release = false;   // ...and this is which way it chose

    document.addEventListener('wheel', function (e) {
      if (introRunning() || dossierOpen()) return;
      // the rail is the only surface this owns; everywhere else (art, names,
      // HUD, the dossier's own ability rail) a wheel event is left alone
      if (!e.target || !e.target.closest('.q-scroll-rail')) return;

      var now = performance.now();
      if (now - lastAt > GESTURE_GAP) decided = false;   // silence -> a fresh gesture
      lastAt = now;

      if (decided) {
        if (!release) e.preventDefault();   // swallow this gesture's tail; a
        return;                             // releasing gesture is left alone
      }
      if (!e.deltaY) return;   // a genuine zero carries no scroll intent either way

      var list = selectable();
      var dir = e.deltaY > 0 ? 1 : -1;
      var here = currentIndex();
      var at = -1;
      list.forEach(function (t, i) { if (parseInt(t.dataset.index, 10) === here) at = i; });
      var next = at === -1 ? (dir > 0 ? 0 : list.length - 1) : at + dir;

      decided = true;
      release = !list.length || next < 0 || next >= list.length;
      if (release) return;   // an edge — hand this whole gesture to the page

      e.preventDefault();
      select(parseInt(list[next].dataset.index, 10));
    }, { passive: false });
  }

  /* ---- scroll rail position -------------------------------------------------

     Writes --rail-pos (0 = first agent, 1 = last) on <html> whenever the
     selected agent changes — same custom-property idiom js/valorant.js
     already uses for --accent: written once here, read wherever it's needed
     (just the rail's own thumb, in css/valorant.css).

     A MutationObserver instead of hooking select() directly, deliberately —
     this file's own header note says nothing here owns selection, it only
     reacts to it. select() is one of three paths to a new .q-hover (raw
     mouse hover and this file's own synthetic dispatch are the other two,
     and both still land on the same class), so watching the class is what
     actually covers all of them instead of just the one this file causes. */
  function bindRailPosition() {
    var total = (window.AGENTS || []).length;
    if (!total) return;

    function update() {
      var i = currentIndex();
      if (i < 0) return;
      document.documentElement.style.setProperty(
        '--rail-pos', String(total > 1 ? i / (total - 1) : 0));
    }

    var themes = document.querySelector('#q-themes');
    if (!themes) return;
    var mo = new MutationObserver(update);
    mo.observe(themes, { subtree: true, attributes: true, attributeFilter: ['class'] });
    update();
  }

  /* ---- the legend --------------------------------------------------------- */

  /* Shown only once the intro is gone. `q-with-intro` is on <html> for the
     whole intro and removed on hand-off (and by the skip path), so watching
     that one class covers both routes without touching valorant.js. */
  function watchHandoff() {
    var root = document.documentElement;
    var reveal = function () {
      if (root.classList.contains('q-with-intro')) return false;
      root.classList.add('q-controls-ready');
      return true;
    };
    if (reveal()) return;
    var mo = new MutationObserver(function () { if (reveal()) mo.disconnect(); });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  window.addEventListener('DOMContentLoaded', function () {
    bindRoles();
    bindKeys();
    watchHandoff();
    if (window.matchMedia('(hover: none)').matches ||
        window.matchMedia('(max-width: 640px)').matches) {
      bindTouchSelection();
    }
    // Unconditional, deliberately — unlike touch selection above, this reads
    // nothing from `hover` or viewport width, so there is no media query
    // whose mismatch against a real device can silently leave the roster
    // wheel-deaf. Wheel events are their own reliable signal: a touch-only
    // swipe never fires one, so binding this everywhere costs nothing on a
    // device that only ever sends touch/pointer events, and the one device
    // that *can* fire both (a touchscreen laptop with a mouse, narrow enough
    // to also get the real scrolling list from bindTouchSelection above)
    // still resolves cleanly — this just selects directly, skipping the
    // list's own scroll.
    bindWheelSelection();
    bindRailPosition();
    window.__controls = { select: select, step: step, filter: applyFilter };
  });
})();
