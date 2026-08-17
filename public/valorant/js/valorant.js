/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER

   The motion here is a port of the Qode Interactive catalog intro, transcribed
   in ../qode-replica/js/intro.js from that site's own bundle. Durations,
   easings, the master-timeline layout and the velocity maths are carried over
   unchanged — if a number below looks arbitrary, it is because it is theirs,
   and ../qode-replica/SPEC.md says where it came from.

   What is new here: the DOM is built from js/agents.js instead of being
   hand-written, the roster drives a live --accent, and the closing beat hands
   off to an agent-select rather than a project list. Anything that departs
   from the port is marked NEW.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var AGENTS = window.AGENTS || [];

  var config = {
    damping: 0.15,
    forwards: true,
    scrollbar: null,
    DOM: {}
  };

  document.body.addEventListener('wheel', function (e) {
    config.forwards = e.deltaY > 0;
  }, { passive: true });

  function togglePointer(el, on) {
    if (!el) return;
    if (on) el.classList.remove('q-no-point');
    else el.classList.add('q-no-point');
  }

  /* ---- NEW: build the roster from data -----------------------------------
     13 slides, 13 names and 13 art frames all come off one array, so the
     carousel, the list and the hover art can never drift out of sync. */
  /* Builds one <li class="q-theme"> — pulled out of buildDOM so the same
     markup can be stamped out three times: once as the real, interactive
     roster, and twice more as the loop's decorative echoes (see buildDOM's
     own comment below for why). echo elements get the extra class plus
     aria-hidden and (css/valorant.css) pointer-events:none, so they read
     and behave as pure scenery — never selectable, never clickable — while
     still being pixel-identical to the real thing, which is what the loop
     needs them for. */
  function buildThemeLI(a, i, echoClass) {
    var tag = a.role + ' — ' + a.abilities.join(' · ');
    var li = document.createElement('li');
    li.className = echoClass ? 'q-theme q-theme-echo ' + echoClass : 'q-theme';
    li.dataset.index = i;
    li.dataset.accent = a.accent;
    if (echoClass) li.setAttribute('aria-hidden', 'true');
    li.innerHTML =
      '<div class="q-inner">' +
        '<span class="q-home-to-single q-abs"></span>' +
        '<div class="q-col"><h2 class="q-theme-title">' +
          '<span>' + a.name + ' </span>' +
          '<span class="q-shadow q-front" aria-hidden="true">' + a.name + ' </span>' +
          '<span class="q-shadow q-back" aria-hidden="true">' + a.name + '</span>' +
        '</h2></div>' +
        // Two copies inside one track, translated -50% — the seamless marquee
        // idiom the HUD ticker uses. See the .q-theme-tagline note in the CSS
        // for why the old two-against-each-other version couldn't survive the
        // window being clamped.
        '<h5 class="q-theme-tagline">' +
          '<span class="q-tag-track">' +
            '<span>' + tag + '</span>' +
            '<span>' + tag + '</span>' +
          '</span>' +
        '</h5>' +
      '</div>';
    return li;
  }

  /* The loop's demarcation — not a `.q-theme` (selectable() and
     nearestAgent() in controls.js both key off that class, so this is
     invisible to both, same as the echoes: it can never become "the
     current agent"), just a divider the reader scrolls past right before
     the loop rebases. Built twice, once for each seam — see buildDOM. */
  function buildLoopMark(dirClass) {
    var mark = document.createElement('li');
    mark.className = 'q-roster-loop ' + dirClass;
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML =
      '<span class="q-roster-loop-line"></span>' +
      '<span class="q-roster-loop-label">Roster loops<br />back to start</span>' +
      '<span class="q-roster-loop-line"></span>';
    return mark;
  }

  function buildDOM() {
    var slideWrap = document.querySelector('#q-intro-slide-wrap');
    var themes = document.querySelector('#q-themes');
    var preview = document.querySelector('#q-preview');

    AGENTS.forEach(function (a, i) {
      // --- carousel slide: an invisible image holder. #q-intro-canvas (see
      // CanvasWipe in effects.js) is what actually gets painted; this div
      // just keeps the <img> in the DOM, on-screen, so loading="lazy" fires
      // normally, and gives showSlide something to hand the canvas. ---
      var slide = document.createElement('div');
      slide.className = 'q-intro-slide';
      slide.dataset.index = i;
      slide.innerHTML =
        '<img class="q-slide-art" src="' + a.splash + '" alt="' + a.name + '" loading="lazy" decoding="async" />';
      slideWrap.appendChild(slide);

      // --- roster name ---
      themes.appendChild(buildThemeLI(a, i, null));

      // --- preview art frame (uniform width + anchor, every agent) ---
      // The four source planes, cross-alpha-masked at build time to
      // reproduce the flattened splash when stacked at rest. LayerParallax
      // (effects.js) both assembles them in on a change of agent and drifts
      // them apart on scroll while one stays selected — one system, not a
      // separate reveal effect handing off to a separate idle one.
      var slug = a.name.toLowerCase();
      var item = document.createElement('div');
      item.className = 'q-preview-item';
      item.dataset.index = i;
      item.dataset.splash = a.splash;
      item.dataset.accent = a.accent;
      item.setAttribute('style', 'width:' + a.width + ';' + a.pos);
      item.innerHTML =
        '<div class="q-layer-host">' +
          '<img class="q-layer" data-plane="haze"   src="assets/splash-layers/' + slug + '-haze.webp"   alt="" loading="lazy" decoding="async" />' +
          '<img class="q-layer" data-plane="motif"  src="assets/splash-layers/' + slug + '-motif.webp"  alt="" loading="lazy" decoding="async" />' +
          '<img class="q-layer" data-plane="face"   src="assets/splash-layers/' + slug + '-face.webp"   alt="" loading="lazy" decoding="async" />' +
          '<img class="q-layer" data-plane="figure" src="assets/splash-layers/' + slug + '-figure.webp" alt="' + a.name + '" loading="lazy" decoding="async" />' +
        '</div>';
      preview.appendChild(item);
    });

    /* --- NEW: the loop, made to look continuous --------------------------
       The roster loops on desktop now (js/controls.js's bindRosterScrollDesktop)
       rather than stopping dead at Skye — scroll past the last agent and it
       wraps back to Brimstone, and the same the other way. A wrap that just
       teleports reads as a bug the first time it happens, and — the actual
       bug report this replaced — sizing the scrollable tail with a fixed
       vw guess so there was *something* past Skye to scroll into never
       reliably matched every screen size (measured short on at least one:
       the loop fired while Cypher, not Skye, was still selected).

       Both problems share one fix: two more full, non-interactive passes
       through the roster, one appended after Skye and one after that
       (rendered *before* Brimstone via CSS order:-1 — see .q-theme-echo-lead
       in css/valorant.css — despite coming last in the DOM, which is what
       keeps every `[data-index]` lookup elsewhere finding the real,
       interactive agent first). Scrolling now has real content in both
       directions no matter the viewport, and once the nearest match is an
       echo, bindRosterScrollDesktop rebases the scroll position by exactly
       one loop's length — landing on the pixel-identical real agent, so the
       swap is invisible regardless of screen size, because it no longer
       depends on measuring one. */
    themes.appendChild(buildLoopMark('q-roster-loop-trail'));
    AGENTS.forEach(function (a, i) {
      themes.appendChild(buildThemeLI(a, i, 'q-theme-echo-trail'));
    });
    // The lead echo before its own mark, not after — order:-1 (css/valorant.css)
    // renders this whole group before the real list, and within a shared
    // order value elements still lay out in DOM sequence, so the mark has to
    // come last in source order to end up adjacent to real Brimstone rather
    // than stranded at the very start of the roster.
    AGENTS.forEach(function (a, i) {
      themes.appendChild(buildThemeLI(a, i, 'q-theme-echo-lead'));
    });
    themes.appendChild(buildLoopMark('q-roster-loop-lead'));

    var canvasEl = document.querySelector('#q-intro-canvas');
    if (canvasEl) CanvasWipe.init(canvasEl);
  }

  /* ---- Preview -------------------------------------------------------------
     The asymmetry Qode's version had is kept — the outgoing frame withdraws
     fast, only the incoming one gets the production. What plays for the
     incoming frame is no longer a straight port: see effects.js. This class
     sequences LayerParallax's own two beats (enter, then the idle drift) and
     keeps the asymmetric feel intact: outgoing is near-instant, incoming is
     the whole show. */
  function Preview(el) {
    this.DOM = { sel: el };
    this.DOM.active = null;
    this.DOM.items = Array.prototype.slice.call(el.querySelectorAll('.q-preview-item'));
    this.DOM.wash = document.querySelector('#q-preview-wash');
  }
  Preview.prototype.changeImage = function (index) {
    var prev = this.DOM.active;
    if (prev && prev !== this.DOM.items[index]) {
      LayerParallax.detach();
      gsap.set(prev.querySelector('.q-layer-host'), { autoAlpha: 0 });
      gsap.to(prev, { duration: 0.12, autoAlpha: 0, overwrite: true });
    }

    var item = this.DOM.items[index];
    this.DOM.active = item;
    /* NEW: killTweensOf before the set, not just the set itself. Scrolling
       fast enough — the loop's own rebase can revisit an agent within a
       single burst (js/controls.js's bindRosterScrollDesktop) — calls this
       for the same item twice in quick succession: once while it's "prev"
       above (a queued 0.12s fade-to-0 on some *other* call), once here as
       the new `item`. gsap.set has no implicit overwrite, so without this
       the earlier fade tween keeps running after the set and quietly drags
       the opacity back to 0 once it resumes ticking — the agent stays
       flagged as selected with nothing rendered. Killing first guarantees
       whichever item is selected when the dust settles is the one actually
       shown, regardless of what it was mid-animating a moment before. */
    gsap.killTweensOf(item);
    gsap.set(item, { autoAlpha: 1 });

    LayerParallax.enter(item).then(function () {
      // hand off to the scroll-driven drift only once the entrance settles
      // and only if this item is still the one selected
      if (item.classList.contains('q-preview-active')) LayerParallax.attach(item);
    });
    this.DOM.items.forEach(function (i) { i.classList.remove('q-preview-active'); });
    item.classList.add('q-preview-active');

    if (this.DOM.wash) this.DOM.wash.classList.add('on');
  };
  Preview.prototype.fadeOutImage = function (duration, delay) {
    duration = duration === undefined ? 0.5 : duration;
    delay = delay || 0;
    if (this.DOM.active) {
      var item = this.DOM.active;
      item.classList.remove('q-preview-active');
      LayerParallax.detach();
      gsap.to(item,
        { duration: duration, autoAlpha: 0, scale: 1.1, delay: delay, ease: 'expo.out' });

      // the same teardown changeImage does for an outgoing item — it is skipped
      // there once DOM.active is null, so it has to happen here instead
      gsap.set(item.querySelector('.q-layer-host'), { autoAlpha: 0 });
    }

    /* NEW: tearing the art down also disarms the roster's hover guard.
       Roster.changeImage's onEnter (ported) ignores a mouseenter on whichever
       agent already carries .q-hover — which is correct while the art is up,
       and a trap once it isn't: with the art gone and .q-hover still set, the
       agent you were just looking at becomes the one agent that can no longer
       bring it back, and you get a coloured void until you happen to hover
       someone else. Dropping the class here means any later hover re-arms,
       whatever tore the art down and whoever you hover next. */
    this.DOM.items.forEach(function (i) { i.classList.remove('q-preview-active'); });
    this.DOM.active = null;
    document.querySelectorAll('#q-themes .q-theme.q-hover')
      .forEach(function (t) { t.classList.remove('q-hover'); });
    if (this.DOM.wash) this.DOM.wash.classList.remove('on');
  };

  /* ---- Roster (Qode's List) ---------------------------------------------- */
  function Roster(el) {
    this.DOM = { sel: el };
    this.DOM.mainList = document.querySelector('#q-main-list');
    this.DOM.themeInners = Array.prototype.slice.call(
      document.querySelectorAll('.q-theme:not(.q-active) .q-inner')
    );
    this.initEvents();
  }

  Roster.prototype.removeHover = function () {
    this.DOM.themeInners.forEach(function (el) {
      el.parentElement.classList.remove('q-hover');
    });
  };

  Roster.prototype.setHover = function (theme) {
    theme.classList.add('q-hover');
    // NEW: the whole page takes the hovered agent's colour — HUD corners and
    // the wash behind the portrait retint on the same .15s/.4s beat the
    // source uses for its title colour swap.
    document.documentElement.style.setProperty('--accent', theme.dataset.accent);
    config.DOM.objs.preview.changeImage(theme.dataset.index);
  };

  /* NEW: selection used to be mouseenter-driven — hovering a name was the
     only way to change agent. It isn't anymore: js/controls.js's scroll
     selection and arrow keys are the only ways in, both routing through
     window.__roster.select below. This class keeps setHover/removeHover as
     the one place --accent and the preview actually change; it just no
     longer listens for a pointer to tell it when. */
  Roster.prototype.select = function (theme) {
    if (!theme || theme.classList.contains('q-hover')) return;
    this.removeHover();
    this.setHover(theme);
  };

  Roster.prototype.initEvents = function () {};

  Roster.prototype.set = function () {
    gsap.set(this.DOM.themeInners, { autoAlpha: 1 });
    togglePointer(document.body, true);
    this.DOM.mainList.classList.add('q-blend');
  };

  Roster.prototype.reset = function (instant, delay) {
    delay = delay || 0;
    togglePointer(document.body, true);
    gsap.set(this.DOM.sel.parentElement, { y: '0%' });
    gsap.fromTo(this.DOM.themeInners,
      { autoAlpha: 0 },
      { duration: 0.1, autoAlpha: 1, ease: 'power4.out', delay: delay, stagger: 0.025 });
    gsap.fromTo(this.DOM.themeInners,
      { x: '-10%' },
      { duration: 1, x: '0%', ease: 'power4.out', stagger: 0.025 });
    this.DOM.mainList.classList.add('q-blend');
  };

  /* ---- Intro -------------------------------------------------------------
     Ported wholesale. See ../qode-replica/SPEC.md sections 2-5 for where each
     number comes from. */
  function Intro(el) {
    this.DOM = { sel: el };
    this.timelineDone = false;
    this.val = this.delta = 0;
    this.total = document.querySelectorAll('#q-intro-slider .q-intro-slide').length;
    this.initEvents();
  }

  Intro.prototype.progress = function () {
    return config.scrollbar.offset.y / config.scrollbar.limit.y;
  };

  Intro.prototype.viewportUnit = function () {
    return window.innerWidth > window.innerHeight ? 'vw' : 'vh';
  };

  /* velocity -> --skewX. d is this frame's travel capped at ±50; val chases it
     at 10% a frame, with a ±0.05 deadzone so it settles instead of jittering. */
  Intro.prototype.calcDelta = function () {
    this.d = 10 * Math.min(Math.max(0.1 * (config.scrollbar.offset.y - this.delta), -5), 5);
    this.val = this.ease(this.val, this.d, 0.1);
    this.delta = config.scrollbar.offset.y;
  };

  Intro.prototype.ease = function (from, to, amount) {
    var v = Math.round(100 * (from * (1 - amount) + to * amount)) / 100;
    if (v >= -0.05 && v <= 0.05) v = 0;
    return v;
  };

  Intro.prototype.skewIntro = function (axis) {
    this.DOM.sel.style.setProperty('--skew' + axis, this.val);
  };

  Intro.prototype.skewList = function () {
    document.querySelector('#q-main-list > .q-inner').style.setProperty('--yVal', 0.25 * -this.val);
  };

  Intro.prototype.rAF = function (axis) {
    var self = this;
    this.calcDelta();
    if (axis) requestAnimationFrame(function () { self.skewIntro(axis); });
    else requestAnimationFrame(function () { self.skewList(); });
  };

  Intro.prototype.idleSkew = function (axis) {
    var self = this;
    var vars = { duration: 0.4, onComplete: function () { self.val = 0; self.delta = 0; } };
    vars['--skew' + axis] = '0';
    gsap.to(this.DOM.sel, vars);
  };

  Intro.prototype.showScroll = function () {
    gsap.fromTo('#q-intro-scroll polyline',
      { strokeDashoffset: 430, x: -20 },
      { duration: 0.65, strokeDashoffset: 0, x: 0, repeat: -1, yoyo: true, repeatDelay: 1 });
  };
  Intro.prototype.hideScroll = function () {
    gsap.to('#q-intro-scroll polyline',
      { duration: 0.65, strokeDashoffset: 430, x: -20, overwrite: true });
  };
  Intro.prototype.showSkip = function () {
    gsap.fromTo('#q-skip-the-line',
      { x: 10, autoAlpha: 0 },
      { duration: 0.4, x: 0, autoAlpha: 1, delay: 0.6, ease: 'power2.out' });
  };
  Intro.prototype.hideSkip = function () {
    gsap.fromTo('#q-skip-the-line',
      { x: 0, autoAlpha: 1 },
      { duration: 0.4, x: 10, autoAlpha: 0, ease: 'power2.out' });
  };

  Intro.prototype.skipTheLine = function () {
    var self = this;
    document.querySelector('#q-skip-the-line').addEventListener('click', function () {
      gsap.to(self.DOM.sel, {
        duration: 0.7,
        x: '-100%',
        ease: 'power4.inOut',
        onStart: function () {
          document.documentElement.classList.remove('q-with-intro');
          config.DOM.objs.roster.reset(true, 0.25);
          gsap.to(self.DOM.sel.querySelectorAll('section'), {
            duration: 0.55,
            autoAlpha: 0,
            onComplete: function () {
              if (!self.timelineDone) self.finishTimeline();
              document.documentElement.classList.remove('q-with-intro');
            }
          });
        }
      });
    }, { once: true });
  };

  /* Master layout — titles 0-65, slider 0-100, bg 20-70, total 100 units. */
  Intro.prototype.titlesTimeline = function () {
    var self = this;
    var tl = gsap.timeline({
      onStart: function () { self.hideScroll(); },
      onUpdate: function () { self.rAF('X'); },
      onComplete: function () { self.idleSkew('X'); },
      onReverseComplete: function () { self.showScroll(); self.idleSkew('X'); }
    });
    return tl
      .to('#q-intro-title .q-1', { duration: 65, x: '-110vh' })
      .to('#q-intro-title .q-2', { duration: 65, x: '120vh' }, '-=65')
      .to('#q-intro-title .q-3', { duration: 65, x: '-130vh' }, '-=65')
      .to('#q-intro-title .q-4', { duration: 65, x: '140vh' }, '-=65');
  };

  Intro.prototype.showSlider = function () {
    // Restored to the original two-tween entrance (box + inner content
    // sliding in together) — see sliderTimeline() below for where the
    // conflict this used to have with it actually got fixed. Cutting the
    // box's own motion here traded an intermittent invisible-box bug for a
    // permanent, visible one: the box (with its border/background) now
    // popped into place instantly while only the content inside kept
    // sliding, which read as janky rather than as one coordinated reveal.
    gsap.fromTo('#q-intro-slider',
      { x: '100%', autoAlpha: 1 },
      { duration: 1, x: '0%', delay: 0.1, ease: 'power4.out' });
    gsap.fromTo('#q-intro-slider .q-inner',
      { x: '-80%' },
      { duration: 1, x: '0%', delay: 0.1, ease: 'power4.out' });

    // NEW: paint the first agent as the frame arrives. The carousel used to be
    // driven only by the scrubbed timeline's onUpdate, so before the first
    // wheel event the frame slid in as an empty black box with no label and no
    // counter — the one part of the intro that looked unfinished at rest.
    // CanvasWipe.to falls through to an instant paint when it has nothing to
    // wipe from, so this needs no special-casing.
    this.showSlide(0);
  };

  /* NEW: routed through CanvasWipe (effects.js) instead of the source's
     stacked-alpha reveal — see effects.js for why. Direction and the current
     scroll-velocity skew both feed the wipe, so it reads as one continuous
     effect with the title's own velocity-driven skew rather than a separate
     unrelated transition. */
  Intro.prototype.showSlide = function (i) {
    var self = this;
    var img = document.querySelector('.q-intro-slide[data-index="' + i + '"] .q-slide-art');
    if (!img) return;

    var draw = function () {
      var skew = parseFloat(getComputedStyle(self.DOM.sel).getPropertyValue('--skewX')) || 0;
      CanvasWipe.to(img, 300, config.forwards ? 1 : -1, skew);
    };
    if (img.complete && img.naturalWidth) draw();
    else img.addEventListener('load', draw, { once: true });

    var agent = AGENTS[i];
    if (agent) {
      var nameEl = document.querySelector('#q-slide-label-live .q-slide-name');
      var roleEl = document.querySelector('#q-slide-label-live .q-slide-role');
      if (nameEl) nameEl.textContent = agent.name;
      if (roleEl) roleEl.textContent = agent.role;
    }

    var counter = document.querySelector('.q-slide-index');
    if (counter) {
      counter.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(this.total).padStart(2, '0');
    }
  };

  Intro.prototype.sliderTimeline = function () {
    var self = this;
    var last = 0;   // slide 0 is already painted by showSlider, above
    var tl = gsap.timeline({
      onUpdate: function () {
        var i = Math.floor(tl.progress() * self.total);
        if (last !== i) self.showSlide(i);
        last = i;
      }
    });
    // FIX: this used to scrub #q-intro-slider's own `x` — the exact same
    // element and property showSlider() above tweens once, on its own
    // 1.1s clock, for the entrance. Two writers to one property: whichever
    // rendered last on the first scroll won, and which one that was
    // depended on how far the entrance tween had gotten, which is why the
    // whole box (not just its picture) intermittently vanished — parked at
    // the entrance's *own* off-screen "from" (x:100%) — on the very first
    // scroll after titles finished, worse the faster a reader scrolled in.
    // #q-pt-2 is the section wrapping #q-intro-slider — .q-pt's own
    // position:fixed;inset:0 (this file's own note above #q-intro-title)
    // carries no transform of its own and nothing else ever sets one on it,
    // so scrubbing *this* element's x moves the same single child the same
    // visual distance, with no second tween anywhere near it to race.
    return tl.to('#q-pt-2', { duration: 100, x: -150 + this.viewportUnit() });
  };

  Intro.prototype.resetList = function () {
    gsap.set('#q-main-list .q-main', { clearProps: 'all', overwrite: true });
  };
  Intro.prototype.moveList = function (p) {
    gsap.set('#q-main-list .q-main', { y: (25 * (1 - p)) + '%' });
  };

  Intro.prototype.bgTimeline = function () {
    var self = this;
    var fired = false;
    var tl = gsap.timeline({
      onUpdate: function () {
        var p = tl.progress();
        self.moveList(p);
        self.rAF();
        if (p >= 0.95 && !fired) {
          fired = true;
          gsap.to(document.querySelector('#q-main-list > .q-inner'), { duration: 0.4, '--yVal': 0 });
          gsap.to('#q-main-list .q-main', { duration: 0.3, y: '0%' });
          gsap.to('#q-header', { duration: 0.2, x: '0%', y: '0%' });
          gsap.to('#q-intro-bg', {
            duration: 0.4, scaleX: 0, overwrite: true,
            onComplete: function () { if (!self.timelineDone) self.finishTimeline(); }
          });
        }
      },
      onStart: function () {
        gsap.set('.q-theme > .q-inner', { autoAlpha: 1 });
        self.hideSkip();
      },
      onComplete: function () { if (!self.timelineDone) self.finishTimeline(); },
      onReverseComplete: function () {
        gsap.set('.q-theme > .q-inner', { autoAlpha: 0 });
        self.resetList();
        self.showSkip();
        self.idleSkew('Y');
      }
    });
    return tl.to('#q-intro-bg', { duration: 50, scaleX: 0, ease: 'none' });
  };

  Intro.prototype.finishTimeline = function () {
    this.timelineDone = true;
    config.DOM.objs.roster.set();
    gsap.to(document.querySelector('#q-main-list > .q-inner'), { duration: 0.4, '--yVal': 0 });
    this.switchToList();
  };

  Intro.prototype.switchToList = function () {
    config.scrollbar.destroy();
    this.DOM.sel.remove();
    document.documentElement.classList.remove('q-with-intro');
    this.checkForActive();
  };

  /* Seeds a selection so the roster isn't blank on hand-off. Calls straight
     into Roster.select rather than firing a synthetic mouseenter — nothing
     listens for one any more (NEW, see Roster.prototype.select above). */
  function checkForActive() {
    if (document.querySelector('.q-hover')) return;
    // :not(.q-theme-echo) — the loop's decorative passes (buildDOM) share
    // the .q-theme class so they inherit its styling, but they aren't real
    // agents; landing the seed on one would set .q-hover on scenery instead
    // of an interactive item.
    var themes = document.querySelectorAll('#q-themes .q-theme:not(.q-theme-echo)');
    if (!themes.length || !config.DOM.objs.roster) return;
    var i = Math.floor(Math.random() * themes.length);
    var theme = themes[i];
    config.DOM.objs.roster.select(theme);

    /* NEW: the seed used to only change what's displayed, not the roster's
       actual scroll position — which stayed at 0 regardless of which agent
       got picked. Land on Killjoy (say) with the scroll still at 0 and the
       first backward gesture has nowhere to go, since as far as the scroller
       is concerned there is no "before" the top — it reads as the seeded
       agent being stuck rather than as "you haven't scrolled yet". This
       moves the real position to match, on whichever engine js/controls.js
       is actually running (window.__rosterScroller desktop, native scrollTop
       mobile). */
    var viewport = document.querySelector('#q-main-list .q-list-part');
    if (!viewport) return;
    var target = theme.offsetTop + theme.offsetHeight / 2 - viewport.clientHeight * 0.33;
    if (window.__rosterScroller) {
      target = Math.max(0, Math.min(target, window.__rosterScroller.limit.y));
      window.__rosterScroller.setPosition(0, target);
    } else {
      viewport.scrollTop = Math.max(0, target);
    }
  }
  Intro.prototype.checkForActive = checkForActive;

  Intro.prototype.initTimeline = function () {
    var self = this;
    /* The source sets TweenMax.defaultEase = Power2.easeOut here. It is a dead
       assignment — GSAP 2 falls back to TweenLite.defaultEase, which stays
       Power1.easeOut — so porting it would make every scrubbed tween wrong.
       GSAP 3's default is already power1.out. See ../qode-replica/SPEC.md §7.1. */
    this.masterTl = gsap.timeline({
      paused: true,
      onComplete: function () { if (!self.timelineDone) self.finishTimeline(); }
    });
    this.masterTl
      .add(this.titlesTimeline())
      .add(this.sliderTimeline(), '-=65')
      .add(this.bgTimeline(), '-=80');

    // never played — the playhead is set from scroll position every frame
    gsap.ticker.add(function () {
      if (!self.timelineDone) self.masterTl.progress(self.progress());
    });
  };

  Intro.prototype.initialAnimation = function () {
    var self = this;

    /* Everything scroll-driven — the carousel painting its first card, the
       scrubbed master timeline, the SCROLL chevron, pointer events coming
       back — switches on here, normally reached from run()'s own onComplete
       below once column 4's entrance tween finishes at duration + delay =
       1.8s. Pulled out to its own guarded function because it now has two
       ways in: that onComplete, and the fallback timer at the bottom of this
       method. Idempotent (the entered flag) so whichever fires first wins
       and the other is a plain no-op — no risk of initTimeline() (which
       attaches the gsap.ticker callback) running twice. */
    var entered = false;
    function enterLive() {
      if (entered) return;
      entered = true;
      self.showSlider();
      self.showScroll();
      gsap.to('.q-mark', { duration: 1, autoAlpha: 1 });
      self.initTimeline();
      togglePointer(document.body, true);
    }

    var run = function (el, n) {
      var o = n % 2 === 0 ? 1 : -1;
      gsap.to(el, {
        duration: 1.2,
        x: 0,
        ease: 'power4.inOut',
        delay: 0.2 * n,
        onStart: function () {
          [
            { sel: el.querySelector('.q-skew'),  prop: 'skewX', start: 40 * o,  duration: 1.32 },
            { sel: el.querySelector('.q-front'), prop: 'x',     start: 200 * o, duration: 1.5 },
            { sel: el.querySelector('.q-back'),  prop: 'x',     start: 50 * o,  duration: 1.5 }
          ].forEach(function (fx) {
            var from = {}; from[fx.prop] = fx.start;
            var to = { duration: fx.duration };
            to[fx.prop] = 0;
            to.onComplete = function () { gsap.set(fx.sel, { clearProps: 'all' }); };
            gsap.fromTo(fx.sel, from, to);
          });
        },
        onComplete: function () {
          if (n === 3) enterLive();
        }
      });
    };

    this.showSkip();
    document.querySelectorAll('#q-intro-title .q-move').forEach(run);

    /* Safety net, not a second code path in practice: under real contention
       (many tabs, a slow/throttled machine — reproduced here by deliberately
       loading the test browser with a dozen other tabs and dev servers) a
       GSAP tween can be created and then simply never progress, even while
       the ticker keeps advancing elsewhere on the page. Nothing timeboxed
       run()'s onComplete before this, so a stall there stuck the piece on
       the title screen forever — titles still read as "done" (their resting
       position is what's on screen either way), the carousel just never
       shows up and scrolling does nothing, which is exactly the failure this
       fixes. 4000ms is more than double the nominal 1.8s completion time, so
       a healthy run always reaches enterLive() through run()'s own
       onComplete first; this only ever rescues a stalled one. */
    setTimeout(enterLive, 4000);
  };

  Intro.prototype.initEvents = function () {
    document.documentElement.classList.add('q-with-intro');
    togglePointer(document.body, false);
    config.scrollbar = new SmoothScroll('#q-scroll-vh', '#q-intro', { damping: config.damping });
    this.initialAnimation();
    this.skipTheLine();
  };

  /* The briefing is six screens of scroll-scrubbed type built for a landscape
     desktop viewport. On a phone — and especially inside the Gallery's frame,
     where the piece gets about 349x557 — it is six screens of a composition
     you are seeing through a slot, in front of a roster you cannot reach until
     you have sat through it. The same 640px boundary the phone layout uses
     drops it entirely and opens on the roster. */
  function isPhone() {
    return window.matchMedia('(max-width: 640px)').matches;
  }

  /* ---- boot -------------------------------------------------------------- */
  window.addEventListener('DOMContentLoaded', function () {
    buildDOM();
    config.DOM.objs = {};
    config.DOM.objs.preview = new Preview(document.querySelector('#q-preview'));
    config.DOM.objs.roster = new Roster(document.querySelector('#q-themes'));

    // NEW: the one way anything outside this file changes the selected agent
    // now — js/controls.js's scroll selection, arrow keys and role-filter
    // fallback all call this instead of firing a synthetic mouseenter.
    window.__roster = {
      select: function (index) {
        var theme = document.querySelector('#q-themes .q-theme[data-index="' + index + '"]');
        if (theme) config.DOM.objs.roster.select(theme);
      }
    };

    if (isPhone()) {
      // Land where the hand-off would have landed, without the six screens in
      // between. `q-with-intro` is never added, so controls.js's watchHandoff
      // reveals the legend on its first check and introRunning() is false from
      // the start — no code downstream needs to know the intro was skipped.
      var introEl = document.querySelector('#q-intro');
      if (introEl) introEl.remove();
      config.DOM.objs.roster.set();
      checkForActive();
    } else {
      config.DOM.objs.intro = new Intro(document.querySelector('#q-intro'));
    }
    document.documentElement.classList.add('q-loaded');

    var orbitPath = document.querySelector('#q-orbit-path');
    var orbitMarker = document.querySelector('#q-orbit-marker');
    if (orbitPath && orbitMarker) OrbitMarker.init(orbitPath, orbitMarker);

    window.__val = config;
  });
})();
