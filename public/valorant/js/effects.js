/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER — effects

   Everything in this file is original to this piece, not a port. It replaces
   the hover reveal Qode's Preview.changeImage used (a single 0.45s power4.out
   slide-in) with two effects layered together:

     1. ShardReveal   — the incoming portrait assembles out of angular clip-path
                         slices, staggered in on a HUD-scan beat. Valorant's own
                         UI is built from bevelled diagonal panels (menus, the
                         agent-select highlight, the buy-phase timer) — this
                         borrows that language instead of a generic cross-fade.

     2. LayerParallax  — once the shards settle, the flattened portrait is
                         swapped for its four source planes (haze / motif /
                         face / figure, from ../assets/compose-splash.py) and a
                         pointer-driven rAF loop drifts them at different rates.
                         The planes were alpha-masked identically at build time,
                         so stacked at rest they reproduce the flattened image
                         exactly — the swap is invisible until the pointer moves.

   Both read from a single source of truth: SHARD assumes an <img> it's told to
   slice; PARALLAX assumes the four <img class="q-layer-*"> already in the DOM
   (see buildDOM in valorant.js). Neither one owns scheduling — Preview in
   valorant.js sequences them.
--------------------------------------------------------------------------- */

(function (global) {
  'use strict';

  /* ---- ShardReveal --------------------------------------------------------
     N diagonal slices of the SAME image, stacked exactly on top of each other
     and each showing only its own clip-path window — so unlike a sprite sheet
     or background-position trick, the slices always line up regardless of the
     element's rendered size. */
  var ShardReveal = {
    N: 8,
    SKEW: 0.09,     // fraction of width the top/bottom edges shear by

    /* Builds N <img> clones inside `host`, all sourced from `src`, clipped to
       contiguous angled bands. Kills any tweens/children left over from a
       previous call on this host first, so re-hovering the same agent doesn't
       leak elements or fight an in-flight timeline. */
    build: function (host, src) {
      gsap.killTweensOf(host.children);
      host.innerHTML = '';
      var shards = [];
      for (var i = 0; i < this.N; i++) {
        var img = document.createElement('img');
        img.className = 'q-shard';
        img.src = src;
        img.alt = '';
        img.decoding = 'async';
        var x0 = (i / this.N) * 100;
        var x1 = ((i + 1) / this.N) * 100;
        var skew = this.SKEW * 100;
        img.style.clipPath =
          'polygon(' +
          (x0 + skew) + '% 0%, ' + (x1 + skew) + '% 0%, ' +
          (x1 - skew) + '% 100%, ' + (x0 - skew) + '% 100%)';
        host.appendChild(img);
        shards.push(img);
      }
      return shards;
    },

    /* Plays the assembly and resolves when it settles. Shards left of centre
       fly in from the left, right of centre from the right, with a vertical
       jitter that alternates per shard — a converging "scan open" rather than
       everything arriving from one direction, which reads flatter. */
    play: function (host, src, accent) {
      var self = this;
      var shards = this.build(host, src);
      var n = shards.length;

      var flash = document.createElement('div');
      flash.className = 'q-shard-flash';
      flash.style.background = accent || '#fff';
      host.appendChild(flash);

      return new Promise(function (resolve) {
        gsap.timeline({ onComplete: resolve })
          .fromTo(shards, {
            opacity: 0,
            x: function (i) { return ((i / (n - 1)) - 0.5) * 220; },
            y: function (i) { return (i % 2 === 0) ? -26 : 26; },
            scale: 1.04
          }, {
            opacity: 1, x: 0, y: 0, scale: 1,
            duration: 0.55, ease: 'expo.out', stagger: 0.032
          }, 0)
          .fromTo(flash, { opacity: 0.5 }, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0)
          .set(flash, { display: 'none' });
      });
    },

    /* Quick withdrawal, not a mirror of play() — a shard *dis*assembly would
       linger exactly when the reason for hovering away is usually "show me
       the next one already". */
    clear: function (host) {
      gsap.killTweensOf(host.children);
      gsap.to(host, {
        duration: 0.12, opacity: 0, ease: 'power2.in',
        onComplete: function () { host.innerHTML = ''; host.style.opacity = 1; }
      });
    }
  };

  /* ---- LayerParallax -------------------------------------------------------
     Drifts the four planes of the CURRENT item against the pointer. One rAF
     loop total, not one per item — it just points at whichever item is
     active, so hovering across the roster never accumulates loops. */
  var LayerParallax = {
    _raf: null,
    _active: null,      // the item element currently being driven
    _target: { x: 0, y: 0 },
    _cur: { x: 0, y: 0 },

    // (rate, extra) per plane — background moves least, the figure and motif
    // most, which is what actually reads as depth rather than one flat drift.
    RATES: {
      haze:   { move: 10,  rot: 0    },
      motif:  { move: 26,  rot: 2.2  },
      face:   { move: 16,  rot: 0    },
      figure: { move: 30,  rot: -1.4 }
    },

    _onMove: function (e) {
      var vw = window.innerWidth, vh = window.innerHeight;
      LayerParallax._target.x = (e.clientX / vw) * 2 - 1;   // -1..1
      LayerParallax._target.y = (e.clientY / vh) * 2 - 1;
    },

    attach: function (item) {
      if (this._active === item) return;
      this.detach();
      this._active = item;
      var layerHost = item.querySelector('.q-layer-host');
      if (!layerHost) return;
      gsap.set(layerHost, { autoAlpha: 1 });
      window.addEventListener('pointermove', this._onMove);
      this._tick();
    },

    detach: function () {
      if (!this._active) return;
      var layerHost = this._active.querySelector('.q-layer-host');
      if (layerHost) gsap.set(layerHost, { autoAlpha: 0 });
      window.removeEventListener('pointermove', this._onMove);
      cancelAnimationFrame(this._raf);
      this._active = null;
    },

    _tick: function () {
      var self = LayerParallax;
      if (!self._active) return;
      self._cur.x += (self._target.x - self._cur.x) * 0.07;
      self._cur.y += (self._target.y - self._cur.y) * 0.07;

      var layers = self._active.querySelectorAll('.q-layer');
      for (var i = 0; i < layers.length; i++) {
        var el = layers[i];
        var rate = self.RATES[el.dataset.plane] || { move: 0, rot: 0 };
        var tx = self._cur.x * rate.move;
        var ty = self._cur.y * rate.move * 0.6;
        var rot = self._cur.x * rate.rot;
        el.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      }
      self._raf = requestAnimationFrame(self._tick);
    }
  };
  LayerParallax._onMove = LayerParallax._onMove.bind(LayerParallax);

  /* ---- CanvasWipe -----------------------------------------------------------
     Routes the intro carousel's slide-to-slide reveal through a <canvas>
     instead of a plain img cross-fade — the piece's nod to the Canvas
     Frame-Scrub chapter in the showcase this whole site is built around.

     The wipe is an angular clip sweeping across the frame (direction tied to
     scroll direction), and its shear steepens with the intro's own --skewX —
     scroll fast and the cut leans harder, same velocity signal that already
     drives the title's chromatic ghosts, here bent into the picture instead
     of the type. Two thin offset strokes in the piece's red/teal along the
     cut edge echo those ghosts rather than re-deriving a new visual language. */
  var CanvasWipe = {
    canvas: null, ctx: null, dpr: 1, w: 0, h: 0,
    curImg: null, raf: null,

    init: function (canvasEl) {
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
      this.resize();
      window.addEventListener('resize', this.resize.bind(this));
    },

    resize: function () {
      if (!this.canvas) return;
      var rect = this.canvas.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, Math.round(rect.width));
      this.h = Math.max(1, Math.round(rect.height));
      this.canvas.width = this.w * this.dpr;
      this.canvas.height = this.h * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.curImg) this._drawCover(this.curImg);
    },

    _drawCover: function (img) {
      if (!img || !img.naturalWidth) return;
      var scale = Math.max(this.w / img.naturalWidth, this.h / img.naturalHeight);
      var dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      this.ctx.drawImage(img, (this.w - dw) / 2, (this.h - dh) / 2, dw, dh);
    },

    /* Paints instantly, no transition — the very first slide has nothing to
       wipe from. */
    set: function (img) {
      this.curImg = img;
      this.ctx.clearRect(0, 0, this.w, this.h);
      this._drawCover(img);
    },

    /* dir: +1/-1, which way the cut sweeps (tied to scroll direction).
       skewDeg: the intro's current --skewX, in the same units Intro.calcDelta
       produces (roughly -50..50) — steepens the shear and offsets the
       chromatic strokes, so a fast scroll cuts a more aggressive edge. */
    to: function (img, duration, dir, skewDeg) {
      if (!img || img === this.curImg) return;
      if (!this.curImg) { this.set(img); return; }
      var self = this;
      if (this.raf) cancelAnimationFrame(this.raf);
      var from = this.curImg;
      this.curImg = img;
      dir = dir >= 0 ? 1 : -1;
      var lean = Math.max(-1, Math.min(1, (skewDeg || 0) / 26));
      var t0 = null;

      function frame(now) {
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / duration);
        var e = 1 - Math.pow(1 - p, 3);                       // cubic out
        var edge = (dir > 0 ? e : 1 - e) * self.w;
        var shear = self.h * (0.16 + Math.abs(lean) * 0.22) * dir;

        self.ctx.clearRect(0, 0, self.w, self.h);
        if (from) self._drawCover(from);

        // The reveal region (where the NEW image gets clipped in) grows from
        // nothing to full width as p:0->1. For dir>0 it grows from the left
        // edge rightward; for dir<0, from the right edge leftward — so which
        // polygon pairs with which `dir` matters and is easy to get backwards
        // (it was, in an earlier pass: swapping these two fixed new content
        // appearing to snap in immediately instead of sweeping in).
        self.ctx.save();
        self.ctx.beginPath();
        if (dir > 0) {
          self.ctx.moveTo(0, 0);
          self.ctx.lineTo(edge + shear, 0);
          self.ctx.lineTo(edge - shear, self.h);
          self.ctx.lineTo(0, self.h);
        } else {
          self.ctx.moveTo(edge - shear, 0);
          self.ctx.lineTo(self.w, 0);
          self.ctx.lineTo(self.w, self.h);
          self.ctx.lineTo(edge + shear, self.h);
        }
        self.ctx.closePath();
        self.ctx.clip();
        self._drawCover(img);
        self.ctx.restore();

        if (p < 1 && p > 0.02) {
          self.ctx.save();
          self.ctx.globalCompositeOperation = 'lighter';
          self.ctx.lineWidth = 3;
          self.ctx.strokeStyle = '#FF4655';
          self.ctx.beginPath();
          self.ctx.moveTo(edge - shear + 3, 0);
          self.ctx.lineTo(edge + shear + 3, self.h);
          self.ctx.stroke();
          self.ctx.strokeStyle = '#18E5B7';
          self.ctx.beginPath();
          self.ctx.moveTo(edge - shear - 3, 0);
          self.ctx.lineTo(edge + shear - 3, self.h);
          self.ctx.stroke();
          self.ctx.restore();
        }

        if (p < 1) self.raf = requestAnimationFrame(frame);
        else self.raf = null;
      }
      this.raf = requestAnimationFrame(frame);
    }
  };

  /* ---- OrbitMarker -----------------------------------------------------------
     A marker tracing the HUD frame's rectangle forever — the SVG Motion-Path
     Follower chapter from the showcase, applied here as pure ambience rather
     than a scroll-driven follower. Vanilla SVG (getPointAtLength), no plugin:
     the vendored GSAP build doesn't include MotionPathPlugin.

     The path's viewBox is 0-100 with preserveAspectRatio="none", so the SVG
     element stretches non-uniformly to fill its box; converting a viewBox
     point to screen space by simple proportion (pt.x/100 * renderedWidth) is
     exactly correct under that stretch, not an approximation — x and y each
     scale independently by their own axis's ratio, and a point on an
     axis-aligned rectangle stays exactly on the rectangle either way. */
  var OrbitMarker = {
    path: null, marker: null, len: 0, pos: 0,
    speed: 16,     // viewBox units/sec — ~24s per full lap at this path's length
    _last: 0, raf: null,

    init: function (pathEl, markerEl) {
      this.path = pathEl;
      this.marker = markerEl;
      this.len = pathEl.getTotalLength();
      this._last = performance.now();
      this._tick = this._tick.bind(this);
      this._tick();
    },

    _tick: function () {
      var now = performance.now();
      var dt = Math.min(0.1, (now - this._last) / 1000);   // clamp — a stalled
      this._last = now;                                     // tab shouldn't
      this.pos = (this.pos + this.speed * dt) % this.len;   // jump on resume
      var pt = this.path.getPointAtLength(this.pos);
      var rect = this.path.ownerSVGElement.getBoundingClientRect();
      var x = rect.left + (pt.x / 100) * rect.width;
      var y = rect.top + (pt.y / 100) * rect.height;
      this.marker.style.transform =
        'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%) rotate(45deg)';
      this.raf = requestAnimationFrame(this._tick);
    }
  };

  global.ShardReveal = ShardReveal;
  global.LayerParallax = LayerParallax;
  global.CanvasWipe = CanvasWipe;
  global.OrbitMarker = OrbitMarker;
})(window);
