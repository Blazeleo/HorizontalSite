/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER — controls

   Two things the roster screen was missing once the intro handed off:

     1. Selection had nothing behind it but a mouseenter. NEW: hover is gone
        entirely (js/valorant.js's Roster.prototype.select replaced it) —
        scrolling the roster ("roster scroll", below) is now the primary way
        to browse, with arrow keys and Home/End as the keyboard equivalent.
        Enter opens the dossier, Escape closes it (dossier.js already bound
        Escape), and a legend in the corner says so.
     2. The four roles in the left rail were painted-on labels. They are
        buttons now: picking one dims the agents that don't match and retitles
        the status line.

   Neither of these owns any preview logic. A selection change calls straight
   into window.__roster.select (js/valorant.js), and an open dispatches
   `click` on the agent's `.q-home-to-single` — so the shard reveal, the
   scroll-driven parallax planes, the live --accent, the tagline and the
   dossier all fire through the one pipeline that already exists (see SPEC
   §6.1, §7). This file only decides *which* agent.
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

  // :not(.q-theme-echo) — the loop's decorative passes (js/valorant.js's
  // buildDOM) share the .q-theme class so they inherit its styling, but
  // they aren't real agents: arrow keys, the role filter and Home/End all
  // read this list, and none of them should be able to land on scenery.
  // bindRosterScrollDesktop (below) is the one place that deliberately
  // queries .q-theme directly instead — it needs the echoes as candidates,
  // that being the whole mechanism the loop runs on.
  function themes() {
    return Array.prototype.slice.call(document.querySelectorAll('#q-themes .q-theme:not(.q-theme-echo)'));
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

  /* NEW: selection used to be a synthetic mouseenter — nothing listens for
     one any more (js/valorant.js's Roster.prototype.select replaced the
     hover binding). This calls straight into the roster instead.

     scrollTo: true re-centres the roster's own scroll on the new selection —
     needed for arrow keys and the role filter, which move the selection
     without the reader having scrolled at all. The scroll-driven paths below
     (bindRosterScrollDesktop/Mobile) pass false: the list is already exactly
     where the reader put it, and re-centring under them mid-gesture is the
     one thing a scroll-linked control must never do.

     Two ways to move the list because desktop and mobile scroll two
     different ways (see the "roster scroll" note below): mobile still has a
     real scrollTop to animate; desktop's is virtual, owned by the
     SmoothScroll instance bindRosterScrollDesktop creates, so this nudges
     that instead — jumping straight there rather than animating, since
     SmoothScroll has no built-in tween and fighting its own momentum
     integrator with a parallel animation is worse than an instant cut.

     Deliberately not theme.scrollIntoView() for the mobile path — it
     measures against the rendered bounding box, which the desktop layout's
     rotate(-90deg) on #q-main-list (css/valorant.css's "Qode rotated list")
     reports identically for every item, the same trap the scroll-selection
     pick() functions hit. Both paths target the same focus line those pick()
     functions read from, in the same untransformed offsetTop space, so
     keyboard and scroll selection land an agent in the same place either
     way. */
  function select(index, scrollTo) {
    if (window.__roster) window.__roster.select(index);
    if (!scrollTo) return;

    var theme = document.querySelector('#q-themes .q-theme[data-index="' + index + '"]');
    if (!theme) return;

    if (window.__rosterScroller) {
      var viewport = document.querySelector('#q-main-list .q-list-part');
      var target = theme.offsetTop + theme.offsetHeight / 2 - viewport.clientHeight * 0.33;
      window.__rosterScroller.setPosition(0, target);
      return;
    }

    var scroller = document.querySelector('#q-main-list .q-list-part');
    if (scroller) {
      var top = theme.offsetTop + theme.offsetHeight / 2 - scroller.clientHeight * 0.33;
      scroller.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  /* Jumps straight to the first selectable agent — the same move Home
     already does (below), pulled out so the new .q-keyhint-home button can
     call it too instead of the click handler duplicating Home's own list
     lookup. */
  function goToStart() {
    var l = selectable();
    if (!l.length) return;
    select(parseInt(l[0].dataset.index, 10), true);
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
    select(parseInt(list[next].dataset.index, 10), true);
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
    if (!stillValid && firstKept !== null) select(firstKept, true);
  }

  /* The briefing (#q-intro) hands off exactly once — js/valorant.js's
     switchToList destroys its scrollbar and removes it from the DOM, on
     purpose, so scrolling back up the runway can't rewind it (see that
     file's own note). A reload is the only way back to "Defy the limits"
     once you're on the roster, so that's what this button does at heart —
     but which document to reload, and how, depends on where this copy is
     running.

     Standalone (this file opened directly, or the framed-but-unpinned build
     src/gallery/Gallery.js falls back to under phone/reduced-motion): a
     plain reload is the whole story. Nothing outside this document owns any
     part of the piece's scroll position.

     Embedded in the site's *pinned* Gallery runway is a different animal.
     That page continuously re-derives the piece's own scrollbar position
     from the reader's page scroll (Gallery.js's own driver loop) — so a bare
     reload here while the page is still scrolled past the hand-off point
     boots a fresh intro only to have the very next driven frame read "page
     scroll says you're past hand-off" and immediately call finishTimeline()
     again, snapping straight back to the roster before the briefing ever
     gets a frame on screen. Reloading in place cannot fix this: the page's
     own scroll position is the actual problem.

     What that page already has is a rearm effect for precisely this case —
     a spent copy scrolling back into view from *above* gets its iframe
     src reset, the same instant reload this button would otherwise fire
     itself, plus (the part this button cannot do from in here) its own
     phase/curRef state reset in step with it. So rather than race that
     effect with a reload of our own, this scrolls the parent window to just
     above the runway instead — same-origin, since the piece is always
     served from the site's own PUBLIC_URL — and lets that effect do the
     rest, which is also what makes this "go back to the start" rather than
     "replay the animation in place": the reader lands back where they were
     before ever scrolling into the piece, runway included. */
  function bindKeyhintReplay() {
    var btn = document.querySelector('.q-keyhint-replay');
    if (!btn) return;
    btn.addEventListener('click', function () {
      try {
        if (window.self !== window.top && window.parent && window.parent.document) {
          var runway = window.parent.document.querySelector('.gallery-runway');
          if (runway) {
            var rect = runway.getBoundingClientRect();
            var vh = window.parent.innerHeight;
            // Comfortably past "not intersecting" (rect.top > vh), not just
            // past its top edge — the rearm effect's own IntersectionObserver
            // needs a real non-intersecting frame to fire on, and landing
            // exactly at the boundary risks one that still grazes the viewport.
            var target = window.parent.pageYOffset + rect.top - vh - 80;
            window.parent.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
            return;
          }
        }
      } catch (err) {
        // Cross-origin parent (a moved asset root, an embed this piece
        // doesn't know about) — fall through to the plain reload below,
        // same as running standalone.
      }
      window.location.reload();
    });
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
        case 'Home':
          goToStart(); e.preventDefault(); break;
        case 'End':
          var l = selectable();
          if (l.length) select(parseInt(l[l.length - 1].dataset.index, 10), true);
          e.preventDefault(); break;
        case 'Enter': case ' ':
          openCurrent(); e.preventDefault(); break;
      }
    }, true);
  }

  /* ---- roster scroll -------------------------------------------------------

     NEW: this replaces both hover (desktop's old way in) and a first cut of
     this file that tried overflow-y:auto on the desktop list directly. That
     failed silently — a genuine wheel gesture over a rotated element
     (css/valorant.css's "Qode rotated list") does not reliably reach the
     browser's native scroll machinery, which is almost certainly why the
     original build reached for hover here in the first place.

     So desktop and mobile take genuinely different paths to the same job:

       - Mobile's list was never rotated (the phone layout in
         css/valorant.css drops the rotation entirely), so its native
         overflow-y:auto was never the broken part. bindRosterScrollMobile
         keeps reading real scrollTop, same as ever.
       - Desktop routes through js/smooth-scroll.js's SmoothScroll instead —
         the same engine already driving the intro. It never touches native
         overflow: it transforms a plain wrapper div off raw wheel events,
         which sidesteps the rotated-container problem instead of fighting
         it. bindRosterScrollDesktop wires that up and reads its virtual
         offset in place of scrollTop.

     Both feed js/effects.js's LayerParallax — a kick() on every tick's
     delta — so the active agent's art layers drift with the reader's own
     scroll instead of a pointer that no longer drives anything, whichever
     path got them there. */

  function isPhoneLayout() {
    return window.matchMedia('(hover: none)').matches ||
      window.matchMedia('(max-width: 640px)').matches;
  }

  /* Shared by both paths: whichever name sits nearest a focus line a third
     of the way into the list becomes current. offsetTop/offsetHeight, not
     getBoundingClientRect — the desktop layout's rotation makes a rendered
     bounding box report the same top for every item, where offsetTop (the
     element's own untransformed layout space) varies correctly either way. */
  function nearestAgent(list, focusLine) {
    var best = null, bestDist = Infinity;
    list.forEach(function (t) {
      var d = Math.abs(t.offsetTop + t.offsetHeight / 2 - focusLine);
      if (d < bestDist) { bestDist = d; best = t; }
    });
    return best;
  }

  function bindRosterScrollMobile() {
    var scroller = document.querySelector('#q-main-list .q-list-part');
    if (!scroller) return;

    var queued = false;
    var lastIndex = -1;
    var lastTop = scroller.scrollTop;

    function pick() {
      queued = false;

      var top = scroller.scrollTop;
      if (window.LayerParallax) window.LayerParallax.kick(top - lastTop);
      lastTop = top;

      var list = selectable();
      if (!list.length) return;
      var best = nearestAgent(list, top + scroller.clientHeight * 0.33);
      if (!best) return;

      var index = parseInt(best.dataset.index, 10);
      // only select() on an actual change, not on every scroll frame — it
      // re-runs the whole reveal (shard assembly, --accent, the tagline)
      if (index === lastIndex) return;
      lastIndex = index;
      select(index);   // scrollTo omitted: the list is already where the reader put it
    }

    scroller.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(pick);
    }, { passive: true });

    pick();
  }

  function bindRosterScrollDesktop() {
    if (!window.SmoothScroll) return;
    var viewport = document.querySelector('#q-main-list .q-list-part');
    var delegate = document.querySelector('#q-main-list');
    if (!viewport || !delegate) return;

    // #q-main-list, not the viewport itself: the viewport wraps tightly
    // around the roster names, but the portrait art (#q-preview) sits behind
    // it at a lower z-index with pointer-events:none, so a wheel gesture
    // anywhere over the roster screen — art included — bubbles up through
    // #q-main-list's own full-bleed box and reaches this delegate either way.
    // damping was 0.15, same as the intro and dossier — but damping only
    // controls how many frames a given wheel impulse takes to resolve, not
    // how far it travels (js/smooth-scroll.js's _nextTick: the total
    // distance covered by one impulse is the momentum itself regardless of
    // damping, only the pacing changes). At 0.15 that pacing is a long,
    // floaty glide, which reads as smooth on the intro's one-time scrub but
    // as laggy here, where a reader flips between names continuously and
    // feels every one of those frames as a delay before the next name
    // settles. Bumped just for this surface, not shared globally, since the
    // intro's own feel was only just tuned (its own scroll *length*, not
    // this) and the dossier's horizontal drag has different expectations.
    var scroller = new SmoothScroll('#q-main-list .q-list-part', '#q-main-list', { damping: 0.3 });
    window.__rosterScroller = scroller;

    /* ---- the loop ----------------------------------------------------
       NEW: this used to stop dead at either end and hand the gesture off
       to whatever embeds the page. A roster reads better as a loop than a
       wall — there's no real "first" or "last" agent on a select screen,
       just wherever a reader happened to start scrolling. A first cut of
       the loop wrapped straight to offset 0 / limit.y at the edges, sized
       with a fixed vw guess for how much scroll room to leave past Skye —
       and that guess measured short on at least one real screen, so the
       wrap fired with Cypher still selected rather than Skye. Hardcoding
       any single distance was always going to be wrong for *some* viewport.

       So there's no guess to get wrong any more: js/valorant.js's buildDOM
       appends two more full, non-interactive passes through the roster —
       .q-theme-echo-trail after Skye, .q-theme-echo-lead rendered *before*
       Brimstone via CSS order:-1 despite coming last in the DOM — so
       there's always real, correctly-sized content to scroll into no
       matter the screen. loopLength is the measured distance between an
       item and its own echo; once the nearest match is an echo, the
       position rebases by exactly that distance, landing on the
       pixel-identical real agent. The swap is invisible at any point in
       the echo, not just once "far enough" in — real and echo render
       identically, so there is no version of this jump a reader could
       actually see. */
    // A function, not a value measured once at bind time — this used to be
    // cached here, and it went stale twice over: once on any later window
    // resize (SmoothScroll.update, above, already re-measures its own
    // limit.y on resize, but this measurement had nothing rerunning it), and
    // again if the webfonts (Big Shoulders Display/Barlow) hadn't finished
    // loading yet at this point in boot — DOMContentLoaded doesn't wait on a
    // <link rel="stylesheet">, so a real page load can build the roster in
    // the fallback font, measure loopLength against that, and only then have
    // the swap to the real font reflow every item to a different height. A
    // stale loopLength rebases the loop by the wrong distance, landing
    // between two agents instead of exactly on one. Two offsetTop reads is
    // cheap enough to just not cache.
    function loopLength() {
      var realBrimstone = document.querySelector('#q-themes .q-theme[data-index="0"]:not(.q-theme-echo)');
      var trailEchoBrimstone = document.querySelector('#q-themes .q-theme-echo-trail[data-index="0"]');
      return (realBrimstone && trailEchoBrimstone)
        ? trailEchoBrimstone.offsetTop - realBrimstone.offsetTop
        : 0;
    }

    var lastIndex = -1;
    var lastY = 0;

    scroller.addListener(function (state) {
      if (window.LayerParallax) window.LayerParallax.kick(state.offset.y - lastY);
      lastY = state.offset.y;

      // .q-theme directly, not themes()/selectable() — the echoes are
      // exactly what this needs as candidates, which is the one thing
      // those two deliberately exclude (see their own comment).
      var list = Array.prototype.slice.call(document.querySelectorAll('#q-themes .q-theme'));
      if (!list.length) return;
      var best = nearestAgent(list, state.offset.y + viewport.clientHeight * 0.33);
      if (!best) return;

      if (best.classList.contains('q-theme-echo')) {
        var loop = loopLength();
        if (loop <= 0) return;
        var dir = best.classList.contains('q-theme-echo-lead') ? 1 : -1;
        scroller.offset.y += dir * loop;
        lastY = scroller.offset.y;
        scroller.contentEl.style.transform = 'translate3d(0,' + -scroller.offset.y + 'px,0)';
        best = document.querySelector('#q-themes .q-theme[data-index="' + best.dataset.index + '"]:not(.q-theme-echo)');
        if (!best) return;
      }

      var index = parseInt(best.dataset.index, 10);
      if (index === lastIndex) return;
      lastIndex = index;
      select(index);
    });
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
    bindKeyhintReplay();
    watchHandoff();
    // Mobile's list is never rotated, so its native scroll was never the
    // broken part — desktop's needs SmoothScroll instead (see "roster
    // scroll" above). Both bind at boot: #q-intro sits fixed at z-index 3000
    // for the whole briefing (css/valorant.css), fully occluding #q-main-list
    // underneath, so neither path's wheel delegate receives anything until
    // the intro actually hands off — no introRunning() gate needed here.
    if (isPhoneLayout()) bindRosterScrollMobile();
    else bindRosterScrollDesktop();
    bindRailPosition();
    window.__controls = { select: select, step: step, filter: applyFilter, goToStart: goToStart };
  });
})();
