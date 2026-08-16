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

  function fireEvent(selector, type) {
    var el = document.querySelector(selector);
    if (!el) return;
    var e = document.createEvent('Events');
    e.initEvent(type, true, false);
    el.dispatchEvent(e);
  }

  /* ---- NEW: build the roster from data -----------------------------------
     13 slides, 13 names and 13 art frames all come off one array, so the
     carousel, the list and the hover art can never drift out of sync. */
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
      var tag = a.role + ' — ' + a.abilities.join(' · ');
      var li = document.createElement('li');
      li.className = 'q-theme';
      li.dataset.index = i;
      li.dataset.accent = a.accent;
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
      themes.appendChild(li);

      // --- hover art frame (hand-set width + anchor, per agent) ---
      // Two visual systems share this box: a shard-host, where ShardReveal
      // (effects.js) assembles the flattened splash out of angled slices on
      // reveal, and a layer-host of the four source planes, cross-alpha-masked
      // to reproduce that same flattened image, which LayerParallax takes over
      // once the shards settle. See effects.js for why it's split this way.
      var slug = a.name.toLowerCase();
      var item = document.createElement('div');
      item.className = 'q-preview-item';
      item.dataset.index = i;
      item.dataset.splash = a.splash;
      item.dataset.accent = a.accent;
      item.setAttribute('style', 'width:' + a.width + ';' + a.pos);
      item.innerHTML =
        '<div class="q-shard-host"></div>' +
        '<div class="q-layer-host">' +
          '<img class="q-layer" data-plane="haze"   src="assets/splash-layers/' + slug + '-haze.webp"   alt="" loading="lazy" decoding="async" />' +
          '<img class="q-layer" data-plane="motif"  src="assets/splash-layers/' + slug + '-motif.webp"  alt="" loading="lazy" decoding="async" />' +
          '<img class="q-layer" data-plane="face"   src="assets/splash-layers/' + slug + '-face.webp"   alt="" loading="lazy" decoding="async" />' +
          '<img class="q-layer" data-plane="figure" src="assets/splash-layers/' + slug + '-figure.webp" alt="' + a.name + '" loading="lazy" decoding="async" />' +
        '</div>';
      preview.appendChild(item);
    });

    var canvasEl = document.querySelector('#q-intro-canvas');
    if (canvasEl) CanvasWipe.init(canvasEl);
  }

  /* ---- Preview -------------------------------------------------------------
     The asymmetry Qode's version had is kept — the outgoing frame withdraws
     fast, only the incoming one gets the production. What plays for the
     incoming frame is no longer a straight port: see effects.js. This class
     just sequences the two effects it defines and keeps the asymmetric feel
     intact: outgoing is near-instant, incoming is the whole show. */
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
      var prevShardHost = prev.querySelector('.q-shard-host');
      if (prevShardHost) ShardReveal.clear(prevShardHost);
      gsap.set(prev.querySelector('.q-layer-host'), { autoAlpha: 0 });
      gsap.to(prev, { duration: 0.12, autoAlpha: 0, overwrite: true });
    }

    var item = this.DOM.items[index];
    this.DOM.active = item;
    gsap.set(item, { autoAlpha: 1 });

    var shardHost = item.querySelector('.q-shard-host');
    ShardReveal.play(shardHost, item.dataset.splash, item.dataset.accent).then(function () {
      // hand off to the pointer-driven planes only once the assembly settles
      // and only if this item is still the one being hovered
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
      var host = item.querySelector('.q-shard-host');
      if (host) ShardReveal.clear(host);
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

  Roster.prototype.changeImage = function () {
    var self = this;
    var onEnter = function (e) {
      var current = document.querySelector('.q-hover');
      if (current) {
        if (e.target.parentElement !== current) {
          self.removeHover();
          self.setHover(e.target.parentElement);
        }
      } else {
        self.setHover(e.target.parentElement);
      }
    };
    this.DOM.themeInners.forEach(function (el) {
      el.addEventListener('mouseenter', onEnter);
    });
  };

  Roster.prototype.initEvents = function () { this.changeImage(); };

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
    return tl.to('#q-intro-slider', { duration: 100, x: -150 + this.viewportUnit() });
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

  /* Seeds a hover so the roster isn't blank on hand-off. Unlike the source —
     whose 0-based index into 1-based :nth-child() means it sometimes seeds
     nothing — this one always lands on an agent. */
  function checkForActive() {
    if (document.querySelector('.q-hover')) return;
    var themes = document.querySelectorAll('#q-themes .q-theme');
    if (!themes.length) return;
    var t = Math.floor(Math.random() * themes.length) + 1;
    fireEvent('#q-themes .q-theme:nth-child(' + t + ') .q-inner', 'mouseenter');
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
          if (n === 3) {
            self.showSlider();
            self.showScroll();
            gsap.to('.q-mark', { duration: 1, autoAlpha: 1 });
            self.initTimeline();
            togglePointer(document.body, true);
          }
        }
      });
    };

    this.showSkip();
    document.querySelectorAll('#q-intro-title .q-move').forEach(run);
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
