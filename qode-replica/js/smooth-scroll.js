/* ---------------------------------------------------------------------------
   SmoothScroll — a faithful port of the scroll engine the source site uses.

   The real page runs idiotwu/smooth-scrollbar, configured in bundle.js as:

       Scrollbar.use(horizontalScroll, state, edgeEasing);
       Scrollbar.init(document.querySelector('#q-scroll-vh'), {
         damping: 0.15,
         renderByPixels: false,
         delegateTo: document.querySelector('#q-intro')
       });

   Only the pieces the intro depends on are ported here — vertical axis, wheel
   input, the edgeEasing plugin, and the per-frame momentum integrator. The
   integrator below is a line-for-line transcription of the library's _render /
   _nextTick, because the feel of the whole intro is that curve:

       _nextTick(axis) {
         const o = offset[axis], i = momentum[axis];
         if (Math.abs(i) <= 0.1) return { momentum: 0, position: o + i };
         const a = i * (1 - damping);
         return { momentum: a, position: o + i - a };
       }

   i.e. every frame the surface travels 15% of the momentum still owed, and the
   remaining 85% is carried to the next frame. renderByPixels:false means no
   rounding anywhere — sub-pixel offsets are what keep the velocity-driven skew
   smooth instead of steppy.

   NOT ported (unneeded here, flagged rather than silently dropped):
     - the horizontalScroll plugin (it is a no-op on this page: it bails out
       when namespace == 'home', which the catalog page is)
     - keyboard / drag-the-track / scrollbar-thumb input
     - _shouldPropagateMomentum: the intro is a fixed full-screen overlay with
       nothing behind it to hand the scroll off to, so wheel events are always
       consumed here.
     - the library's touch handler. The real site does not use this code path on
       touch at all — it swaps to an 8-slide tap-to-skip variant. The touch drag
       below is this rebuild's own approximation, not a copy of anything.
--------------------------------------------------------------------------- */

(function (global) {
  'use strict';

  // wheel delta normalisation, from the library's getDeltaFromEvent:
  // DELTA_MODE = [pixel, line, page]
  var DELTA_MODE = [1, 28, 500];
  var deltaScale = function (mode) { return DELTA_MODE[mode] || DELTA_MODE[0]; };

  var clamp = function (v, min, max) { return Math.max(min, Math.min(v, max)); };

  function SmoothScroll(containerSelector, delegateSelector, options) {
    options = options || {};
    this.damping = options.damping != null ? options.damping : 0.15;

    this.containerEl = document.querySelector(containerSelector);
    this.delegateEl = document.querySelector(delegateSelector) || this.containerEl;

    // The library wraps the container's children in .scroll-content and drives
    // that element's transform; do the same so the DOM matches the original.
    this.contentEl = document.createElement('div');
    this.contentEl.className = 'scroll-content';
    while (this.containerEl.firstChild) this.contentEl.appendChild(this.containerEl.firstChild);
    this.containerEl.appendChild(this.contentEl);
    this.containerEl.style.overflow = 'hidden';

    this.offset = { x: 0, y: 0 };
    this.limit = { x: 0, y: 0 };
    this._momentum = { x: 0, y: 0 };
    this._remainMomentum = { x: 0, y: 0 };   // edgeEasing plugin state
    this._listeners = new Set();

    this.update();
    this._bind();
    this._render();
  }

  SmoothScroll.prototype.update = function () {
    this.limit.y = Math.max(this.contentEl.offsetHeight - this.containerEl.clientHeight, 0);
    this.limit.x = Math.max(this.contentEl.offsetWidth - this.containerEl.clientWidth, 0);
  };

  SmoothScroll.prototype.addListener = function (fn) { this._listeners.add(fn); };
  SmoothScroll.prototype.removeListener = function (fn) { this._listeners.delete(fn); };

  SmoothScroll.prototype.setMomentum = function (x, y) {
    if (this.limit.x === 0) x = 0;
    if (this.limit.y === 0) y = 0;
    this._momentum.x = x;
    this._momentum.y = y;
  };

  /* edgeEasing plugin, verbatim in behaviour: incoming deltas are folded into
     whatever momentum is still outstanding and clamped to the distance that
     actually remains in each direction, so the surface can never overshoot an
     end and rubber-band back. */
  SmoothScroll.prototype.addTransformableMomentum = function (dx, dy) {
    var nx = this._remainMomentum.x + dx;
    var ny = this._remainMomentum.y + dy;
    this.setMomentum(
      Math.max(-this.offset.x, Math.min(nx, this.limit.x - this.offset.x)),
      Math.max(-this.offset.y, Math.min(ny, this.limit.y - this.offset.y))
    );
  };

  SmoothScroll.prototype.setPosition = function (x, y) {
    x = clamp(x, 0, this.limit.x);
    y = clamp(y, 0, this.limit.y);
    if (x === this.offset.x && y === this.offset.y) return;
    this.offset.x = x;
    this.offset.y = y;
    // renderByPixels:false — no rounding, sub-pixel offsets preserved.
    this.contentEl.style.transform = 'translate3d(' + -x + 'px, ' + -y + 'px, 0)';
    var self = this;
    this._listeners.forEach(function (fn) { fn.call(self, { offset: self.offset, limit: self.limit }); });
  };

  SmoothScroll.prototype._nextTick = function (axis) {
    var o = this.offset[axis];
    var i = this._momentum[axis];
    if (Math.abs(i) <= 0.1) return { momentum: 0, position: o + i };
    var a = i * (1 - this.damping);
    return { momentum: a, position: o + i - a };
  };

  SmoothScroll.prototype._render = function () {
    var m = this._momentum;
    if (m.x || m.y) {
      var tx = this._nextTick('x');
      var ty = this._nextTick('y');
      m.x = tx.momentum;
      m.y = ty.momentum;
      this.setPosition(tx.position, ty.position);
    }
    // the state/edgeEasing plugins read momentum back on every render tick
    this._remainMomentum.x = m.x;
    this._remainMomentum.y = m.y;
    this._renderID = requestAnimationFrame(this._render.bind(this));
  };

  SmoothScroll.prototype._bind = function () {
    var self = this;

    this.delegateEl.addEventListener('wheel', function (e) {
      var scale = deltaScale(e.deltaMode);
      self.addTransformableMomentum(e.deltaX * scale, e.deltaY * scale);
      e.preventDefault();
    }, { passive: false });

    // --- approximation, not a port: see header note ---
    var touchY = null;
    this.delegateEl.addEventListener('touchstart', function (e) {
      touchY = e.touches[0].clientY;
      self.setMomentum(0, 0);
    }, { passive: true });
    this.delegateEl.addEventListener('touchmove', function (e) {
      if (touchY === null) return;
      var y = e.touches[0].clientY;
      self.addTransformableMomentum(0, (touchY - y) * 2);
      touchY = y;
    }, { passive: true });
    this.delegateEl.addEventListener('touchend', function () { touchY = null; }, { passive: true });

    window.addEventListener('resize', function () { self.update(); });
  };

  SmoothScroll.prototype.destroy = function () {
    cancelAnimationFrame(this._renderID);
    this._listeners.clear();
    this.setMomentum(0, 0);
  };

  global.SmoothScroll = SmoothScroll;
})(window);
