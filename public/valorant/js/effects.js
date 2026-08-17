/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER — effects

   Everything in this file is original to this piece, not a port. It replaces
   the hover reveal Qode's Preview.changeImage used (a single 0.45s power4.out
   slide-in) with LayerParallax: the portrait is its four source planes
   (haze / motif / face / figure, from ../assets/compose-splash.py) rather
   than one flattened image, and both the change-of-agent entrance and the
   idle drift while an agent is selected are the same planes moving at their
   own depth-ordered rates — arriving is just the drift with a starting
   position, not a separate effect bolted on before it.

   NEW: this used to be two effects — an angular clip-path shard assembly
   (ShardReveal) that handed off to LayerParallax once it settled. Shards
   read as a transition; a roster where every agent used to arrive in a
   different size and screen position (agents.js used to hand-set width/pos
   per agent, 62vw-94vw) made that cut read rougher still. Uniform framing
   plus one continuous parallax-driven system in its place is meant to read
   as the portrait assembling into the same depth it idles at, not as a
   transition effect happening to it.

   LayerParallax assumes the four <img class="q-layer-*"> already in the DOM
   (see buildDOM in valorant.js). It doesn't own scheduling — Preview in
   valorant.js sequences it.
--------------------------------------------------------------------------- */

(function (global) {
  'use strict';

  /* ---- LayerParallax -------------------------------------------------------
     Drifts the four planes of the CURRENT item. One rAF loop total, not one
     per item — it just points at whichever item is active, so scrolling
     across the roster never accumulates loops.

     NEW: this used to chase the pointer. The roster has no hover left to
     chase (js/controls.js's scroll selection and arrow keys are the only
     ways to change agent now — see valorant.js's Roster.prototype.select),
     so this drifts off the *scroll* instead: js/controls.js calls kick() with
     each tick's scroll delta as the roster's real scroll moves, and the
     planes ease toward that velocity and spring back to rest the moment
     scrolling stops, the same chase-and-settle shape Intro.calcDelta already
     uses for the briefing's type skew. */
  var LayerParallax = {
    _raf: null,
    _active: null,      // the item element currently being driven
    _vel: 0,             // scroll-driven velocity, decays toward 0 every tick
    _cur: { x: 0, y: 0 },

    // (rate, extra) per plane — background moves least, the figure and motif
    // most, which is what actually reads as depth rather than one flat drift.
    RATES: {
      haze:   { move: 10,  rot: 0    },
      motif:  { move: 26,  rot: 2.2  },
      face:   { move: 16,  rot: 0    },
      figure: { move: 30,  rot: -1.4 }
    },

    // delta: this tick's scroll change, already signed so scrolling toward
    // the next agent reads as a positive drift. Clamped so one big flick
    // can't fling the planes past their frame.
    kick: function (delta) {
      this._vel = Math.max(-1, Math.min(1, this._vel + delta * 0.05));
    },

    /* The change-of-agent transition, and the reason attach() no longer
       needs a shard assembly to hand off from: each plane starts offset by
       a multiple of its own RATES.move (so figure travels furthest, haze
       barely at all — the same depth ordering the idle drift reads by) and
       eases to rest, staggered a beat per plane back-to-front. Preview.
       changeImage (valorant.js) calls attach() once this resolves, so the
       entrance is the first frame of the same system the idle drift runs,
       not a different effect bolted on before it. */
    enter: function (item) {
      var layerHost = item.querySelector('.q-layer-host');
      if (!layerHost) return Promise.resolve();
      gsap.set(layerHost, { autoAlpha: 1 });
      var layers = layerHost.querySelectorAll('.q-layer');
      // Killed before the new timeline starts, not just re-targeted by it —
      // an agent re-entered before its last entrance finished (the roster
      // loop's rebase can revisit one within a single fast scroll, see
      // valorant.js's Preview.prototype.changeImage) would otherwise still
      // have its previous fromTo() ticking away underneath the new one,
      // fighting it for the same transform/opacity on every frame.
      gsap.killTweensOf(layers);

      return new Promise(function (resolve) {
        var tl = gsap.timeline({ onComplete: resolve });
        for (var i = 0; i < layers.length; i++) {
          var el = layers[i];
          var rate = LayerParallax.RATES[el.dataset.plane] || { move: 0, rot: 0 };
          tl.fromTo(el, {
            x: rate.move * 2.6,
            y: rate.move * 1.3,
            rotate: rate.rot * 3,
            opacity: 0
          }, {
            x: 0, y: 0, rotate: 0, opacity: 1,
            duration: 0.7, ease: 'power3.out'
          }, i * 0.05);
        }
      });
    },

    attach: function (item) {
      if (this._active === item) return;
      this.detach();
      this._active = item;
      var layerHost = item.querySelector('.q-layer-host');
      if (!layerHost) return;
      gsap.set(layerHost, { autoAlpha: 1 });
      this._tick();
    },

    detach: function () {
      if (!this._active) return;
      var layerHost = this._active.querySelector('.q-layer-host');
      if (layerHost) gsap.set(layerHost, { autoAlpha: 0 });
      cancelAnimationFrame(this._raf);
      this._active = null;
      this._vel = 0;
      this._cur.x = this._cur.y = 0;
    },

    _tick: function () {
      var self = LayerParallax;
      if (!self._active) return;
      self._vel *= 0.9;   // spring back to rest between scroll gestures
      self._cur.x += (self._vel - self._cur.x) * 0.15;
      self._cur.y = self._cur.x * 0.5;

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

  global.LayerParallax = LayerParallax;
  global.CanvasWipe = CanvasWipe;
  global.OrbitMarker = OrbitMarker;
})(window);
