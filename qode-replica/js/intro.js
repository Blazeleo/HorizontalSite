/* ---------------------------------------------------------------------------
   QI Catalog intro — port of the site's own Intro class.

   Source: the `Intro` module inside qodeinteractive.com/catalog/js/bundle.js
   (webpack build, GSAP 2 / TweenMax). Method names, durations, easings, tween
   values and call order below are transcribed from that module rather than
   inferred from watching the page. GSAP 2 → 3 translation is mechanical:

       TweenMax.to(t, 0.7, {...})     ->  gsap.to(t, {duration: 0.7, ...})
       Power4.easeInOut               ->  'power4.inOut'
       Expo.easeOut                   ->  'expo.out'
       Linear.easeNone                ->  'none'
       overwrite: 1                   ->  overwrite: true
       staggerFromTo(t, d, a, b, s)   ->  gsap.fromTo(t, a, {...b, stagger: s})

   See ../SPEC.md for the full spec and for the short list of places this
   rebuild knowingly departs from the original.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  /* ---- config ------------------------------------------------------------
     Mirrors the site's shared config module. `forwards` is fed by a wheel
     listener on <body> and is the only thing that tells the carousel which
     direction the user is scrolling — showSlide() uses it to decide whether it
     must fade the covering slide back out.                                  */
  var config = {
    damping: 0.15,
    forwards: true,
    scrollbar: null,
    DOM: {}
  };

  document.body.addEventListener('wheel', function (e) {
    config.forwards = e.deltaY > 0;
  }, { passive: true });

  // utils.togglePointer — toggles the .q-no-point (pointer-events:none) class
  function togglePointer(el, on) {
    if (!el) return;
    if (on) el.classList.remove('q-no-point');
    else el.classList.add('q-no-point');
  }

  // utils.fireEvent — dispatches a synthetic event at the first match
  function fireEvent(selector, type) {
    var el = document.querySelector(selector);
    if (!el) return;
    var e = document.createEvent('Events');
    e.initEvent(type, true, false);
    el.dispatchEvent(e);
  }

  /* ---- Preview -----------------------------------------------------------
     The art that swaps in when you hover a project name. Note what this is
     NOT: there is no cursor tracking anywhere. The image does not follow the
     mouse, does not tilt, does not parallax. Each project's frame is a fixed,
     hand-placed rectangle (see the CSS) and hovering just cuts to it.

     The swap is deliberately asymmetric:
       outgoing -> `set {autoAlpha:0}`, an instant cut, no fade-out at all
       incoming -> 0.45s fromTo, starting 20px left and 5% wide, power4.out
     Nothing fades the art out when the pointer leaves the list — the last
     hovered piece stays up. That is the original's behaviour, not an omission. */
  function Preview(el) {
    this.DOM = { sel: el };
    this.DOM.active = null;
    this.DOM.items = Array.prototype.slice.call(el.querySelectorAll('.q-preview-item'));
  }
  Preview.prototype.changeImage = function (index, fadeWhenDone) {
    var self = this;
    if (this.DOM.active) gsap.set(this.DOM.active, { autoAlpha: 0, overwrite: true });
    this.DOM.active = this.DOM.items[index];
    gsap.fromTo(this.DOM.active,
      { scaleX: 1.05, x: -20, autoAlpha: 0 },
      {
        duration: 0.45, scaleX: 1, x: 0, autoAlpha: 1, delay: 0.1, ease: 'power4.out',
        onComplete: function () { if (fadeWhenDone) self.fadeOutImage(0); }
      });
  };
  Preview.prototype.fadeOutImage = function (duration, delay) {
    duration = duration === undefined ? 0.5 : duration;
    delay = delay || 0;
    if (this.DOM.active) {
      gsap.to(this.DOM.active,
        { duration: duration, autoAlpha: 0, scaleX: 1.1, delay: delay, ease: 'expo.out' });
    }
  };

  /* ---- List -------------------------------------------------------------
     Hover bookkeeping for the catalog + the two methods the intro calls into.
     Opening a project (readySingle) is not part of this build.             */
  function List(el) {
    this.DOM = { sel: el };
    this.DOM.mainList = document.querySelector('#q-main-list');
    this.DOM.themeInners = Array.prototype.slice.call(
      document.querySelectorAll('.q-theme:not(.q-active) .q-inner')
    );
    this.initEvents();
  }

  List.prototype.removeHover = function () {
    this.DOM.themeInners.forEach(function (el) {
      el.parentElement.classList.remove('q-hover');
    });
  };

  List.prototype.setHover = function (theme) {
    theme.classList.add('q-hover');           // reveals that project's marquee tagline
    config.DOM.objs.preview.changeImage(theme.dataset.index);
  };

  /* mouseenter is bound to each .q-theme > .q-inner — i.e. the name's own box,
     not the whole column — so the art only changes when the pointer is
     actually over a name. */
  List.prototype.changeImage = function () {
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

  List.prototype.initEvents = function () {
    this.changeImage();
  };
  List.prototype.set = function () {
    gsap.set(this.DOM.themeInners, { autoAlpha: 1 });
    togglePointer(document.body, true);
    this.DOM.mainList.classList.add('q-blend');
  };
  List.prototype.reset = function (instant, delay) {
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

  /* ---- Intro ------------------------------------------------------------- */
  function Intro(el) {
    this.DOM = { sel: el };
    this.timelineDone = false;
    this.val = this.delta = 0;
    this.total = document.querySelectorAll('#q-intro-slider .q-intro-slide').length; // 13
    this.initEvents();
  }

  /* progress of the whole intro = how far down the 600vh sizer we are.
     limit.y is 500vh, so the sequence is exactly five screens of scrolling. */
  Intro.prototype.progress = function () {
    return config.scrollbar.offset.y / config.scrollbar.limit.y;
  };

  Intro.prototype.viewportUnit = function () {
    return window.innerWidth > window.innerHeight ? 'vw' : 'vh';
  };

  /* ---- velocity-driven skew ---------------------------------------------
     This is the heart of the "the type reacts to your scroll" effect.

       d   = 10 * clamp(0.1 * (offset.y - lastOffset), -5, 5)
       val = ease(val, d, 0.1)

     d is this frame's scroll distance clamped to +/-50; val chases it with a
     10%-per-frame lerp. `val` is then written straight into --skewX, and the
     CSS turns it into shear + two lagging ghost copies. The lerp's deadzone
     (anything within +/-0.05 snaps to 0) is what stops the type jittering
     forever at the tail of a scroll.                                        */
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
    // the catalog underneath shears too, at a quarter strength and inverted
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

  /* ---- affordances ------------------------------------------------------- */
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
          config.DOM.objs.list.reset(true, 0.25);
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

  /* ---- the three child timelines ----------------------------------------
     They are assembled into one 100-unit master that is never played — it is
     scrubbed by scroll position. Layout on the master's timeline:

       titles  0 -> 65    four columns fly past each other
       slider  0 -> 100   the carousel strip travels -150vw
       bg     20 -> 70    the black panel wipes open to the left

     (.add(titles) then .add(slider,'-=65') then .add(bg,'-=80'))          */

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
  };

  /* Slides are stacked and revealed, not cross-faded: going forwards each new
     slide simply fades in on top of the previous one (0.3s expo.out). Only
     when scrolling BACK does the covering slide have to be faded out (0.2s),
     which is why this needs to know the wheel direction. */
  Intro.prototype.showSlide = function (i) {
    var above = document.querySelector('.q-intro-slide[data-index="' + (i + 1) + '"]');
    var current = document.querySelector('.q-intro-slide[data-index="' + i + '"]');
    if (!config.forwards && above) {
      gsap.to(above, { duration: 0.2, autoAlpha: 0, ease: 'expo.out' });
    }
    if (current) {
      gsap.to(current, { duration: 0.3, autoAlpha: 1, overwrite: true, ease: 'expo.out' });
    }
  };

  Intro.prototype.sliderTimeline = function () {
    var self = this;
    var last = null;
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
    config.DOM.objs.list.set();
    gsap.to(document.querySelector('#q-main-list > .q-inner'), { duration: 0.4, '--yVal': 0 });
    this.switchToList();
  };

  Intro.prototype.switchToList = function () {
    config.scrollbar.destroy();
    this.DOM.sel.remove();
    document.documentElement.classList.remove('q-with-intro');
    this.checkForActive();
  };

  /* Seeds a hover so the catalog isn't blank when the intro ends. Ported with
     its quirk intact: `nth-child(t)` is fed a 0-based random index, so t=0
     matches nothing (~1 in 13 hand-offs land on an empty catalog) and the
     13th project can never be the one seeded. */
  Intro.prototype.checkForActive = function () {
    if (document.querySelector('.q-hover')) return;
    var themes = document.querySelectorAll('#q-themes .q-theme');
    var t = Math.floor(Math.random() * themes.length);
    if (!document.querySelector('.q-hover')) {
      fireEvent('#q-themes .q-theme:nth-child(' + t + ') .q-inner', 'mouseenter');
    }
  };

  Intro.prototype.initTimeline = function () {
    var self = this;
    /* The original opens this method with `TweenMax.defaultEase = Power2.easeOut`.
       That line is a no-op and is deliberately NOT ported: in GSAP 2 the ease a
       tween falls back to is TweenLite.defaultEase, and assigning to
       TweenMax.defaultEase writes a different object (verified on the live page:
       TweenMax.defaultEase !== TweenLite.defaultEase, and TweenLite.defaultEase
       is still Power1.easeOut). So every un-eased tween here really runs
       power1.out — which is also GSAP 3's default, i.e. exactly what this file
       gets by saying nothing. Confirmed against the live page at scroll y=1700:
       title x -845.83 vs -845.8 predicted for power1.out (-973.0 for power2.out),
       slider x -1000.86 vs -1000.9 (-1260.6 for power2.out). */
    this.masterTl = gsap.timeline({
      paused: true,
      onComplete: function () { if (!self.timelineDone) self.finishTimeline(); }
    });
    this.masterTl
      .add(this.titlesTimeline())
      .add(this.sliderTimeline(), '-=65')
      .add(this.bgTimeline(), '-=80');

    // The master is never played. Every frame its playhead is set from scroll.
    gsap.ticker.add(function () {
      if (!self.timelineDone) self.masterTl.progress(self.progress());
    });
  };

  /* ---- the entrance (runs before scroll is armed) ------------------------
     Each of the four columns slides to x:0 over 1.2s power4.inOut, 0.2s apart.
     As each one starts, its face and its two ghosts spring back from an
     offset that alternates sign per line, then clearProps hands the elements
     back to the CSS so --skewX can drive them again.                        */
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

  /* ---- boot -------------------------------------------------------------- */
  window.addEventListener('DOMContentLoaded', function () {
    config.DOM.objs = {};
    config.DOM.objs.preview = new Preview(document.querySelector('#q-preview'));
    config.DOM.objs.list = new List(document.querySelector('#q-themes'));
    config.DOM.objs.intro = new Intro(document.querySelector('#q-intro'));
    document.documentElement.classList.add('q-loaded');
    window.__qode = config; // sandbox: lets the console inspect the running sequence

  });
})();
