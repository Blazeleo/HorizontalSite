/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER — dossier

   Clicking an agent (not hovering — clicking) opens a horizontally-scrolling
   dossier: a bio panel plus one section per active ability. This is the piece
   catalogued but never built in ../qode-replica/SPEC.md §9 — Qode's own
   "opening a project" transition and the 5 scroll-driven FX modules that run
   on their single-project pages, both left as documentation until now.

   Ported (numbers traced to the source, same as everywhere else in this
   piece):
     - the overlay wipe: fromTo {scaleX:0} -> {scaleX:1}, 1.25s, expo.inOut,
       transform-origin 100% 0
     - the --yVal yoyo kick: 0.6s, expo.inOut, yoyo, repeat 1
     - fadeOutImage(.35, .75) on the hover art, already implemented for the
       roster and reused here as-is
     - the horizontalScroll plugin (wheel Y redirected to X) — implemented in
       smooth-scroll.js, deliberately skipped in the qode-replica copy because
       it's a no-op on that page
     - the FX modules' formulas: layered / text / rail / rotate, all sharing
       the shape `buffer = f(offset.x, element); delta = lerp(delta, buffer,
       0.1)`. The source's fifth, 'vertical', is not used — see FX_ORDER
       below for why a horizontal parallax replaced it.

   NOT a port — this project's own: the dossier's content, layout, and which
   FX module lands on which section. The source's real single-project pages
   are bespoke per client; there is nothing specific to reproduce there, only
   the mechanism, which is what's carried over.

   The wrapper-slides-to-clicked-position beat documented alongside the wipe
   is deliberately NOT attempted: it depends on measuring position inside the
   rotated (-90deg) list coordinate system, and getting that subtly wrong is
   easy to ship and hard to notice — the yoyo kick alone reads as substantial
   feedback without it.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  /* One FX per ability, in order. The third slot used to be the source's
     'vertical' module, which slides its clip up and down — on a surface that
     scrolls sideways it was the only thing in the dossier moving across the
     grain, and it read as a glitch rather than as an effect. It is a plain
     horizontal parallax now: the clip drifts along the same axis as everything
     else, just slower than the panel carrying it. */
  var FX_ORDER = ['text', 'rail', 'parallax', 'rotate'];

  /* How far the parallax clip drifts, as a percentage of its own width, across
     the whole time its section is on screen. Small on purpose — the point is
     that the image has some depth against the panel, not that it moves. */
  var PARALLAX_RANGE = 18;

  /* How far the railed clip (ability 02) drifts either side of where it rests,
     in the viewport's cross-axis unit. See the 'rail' case in _render for why
     this is measured either side of rest rather than from the section's entry,
     and why the number came down from the source's 25. */
  var RAIL_RANGE = 14;

  /* VERTICAL — the phone layout (see the <=640px block in valorant.css) stacks
     the sections in a column instead of a row, so the same dossier is scrolled
     down rather than across. Only the axis changes: the scrollbar drops the
     horizontalScroll plugin, and DossierFX reads offset.y against each
     section's offsetTop/clientHeight. The five ported formulas below are
     untouched — they are written in terms of "distance along the scroll axis",
     which is what they always were. */
  function isVertical() {
    return window.matchMedia('(max-width: 640px)').matches;
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var SLOTS = ['a1', 'a2', 'a3', 'ult'];

  function buildSections(agent) {
    var slug = agent.name.toLowerCase();
    var out = [
      // NEW: background-image, not another <img> — .q-dossier-section::before
      // (css/valorant.css) reads it straight off the section via
      // background:inherit and blurs/dims it into an ambient backdrop, so
      // every section (this bio panel, each ability below) gets one from a
      // single shared rule rather than a bespoke layer per section. Reuses
      // the agent's own already-vendored splash art — nothing fetched.
      '<div class="q-dossier-section q-dossier-bio" style="background-image:url(assets/splash/' + slug + '.webp)">' +
        // NEW source. This used to read splash-layers/<agent>-figure.webp — a
        // 1400x788 full-frame layer built for the roster's wide composition and
        // therefore mostly transparent, which the base `img { max-width: 100% }`
        // then clamped to the viewport while height:140% stretched it, rendering
        // the figure squashed to ~64% of its true width. assets/agents/<agent>.png
        // is the tight 587x900 key art: the same painting, cropped to itself.
        '<img class="q-dossier-bg" data-fx="layered" data-fx-speed="0.7" data-fx-max="16" ' +
          'src="assets/agents/' + slug + '.png" alt="" />' +
        '<div class="q-dossier-bio-copy">' +
          '<span class="q-dossier-eyebrow">// Dossier</span>' +
          '<h3 class="q-dossier-name">' + escapeHTML(agent.name) + '</h3>' +
          '<span class="q-dossier-role" style="color:' + agent.accent + '">' + escapeHTML(agent.role) + '</span>' +
          '<p class="q-dossier-bio-text">' + escapeHTML(agent.bio) + '</p>' +
          (window.AbilityRail ? window.AbilityRail.build(agent) : '') +
          '<span class="q-dossier-hint">Drag the rail, or scroll to read abilities ' +
            (isVertical() ? '↓' : '→') + '</span>' +
        '</div>' +
      '</div>'
    ];

    agent.abilityInfo.forEach(function (ab, i) {
      var fx = FX_ORDER[i];
      // NEW: same background-image + ::before treatment as the bio panel
      // above, sourced from this ability's own clip poster — already
      // vendored (assets/fetch-ability-clips.py), already exactly what the
      // sharp clip in the foreground is a still of, so the blurred backdrop
      // reads as *this* ability's own scene rather than generic texture.
      out.push(
        '<div class="q-dossier-section q-dossier-ability" data-ability="' + i + '" ' +
             'style="background-image:url(assets/clips/' + slug + '-' + SLOTS[i] + '.jpg)">' +
          // Riot's own showcase footage for this ability, vendored and
          // transcoded by assets/fetch-ability-clips.py. preload="none" plus a
          // poster means nothing decodes until the section is actually in
          // range — see playClipsInRange().
          '<div class="q-ability-clip-wrap" data-fx="' + fx + '">' +
            '<video class="q-ability-clip" muted loop playsinline preload="none" ' +
                   'poster="assets/clips/' + slug + '-' + SLOTS[i] + '.jpg" ' +
                   'src="assets/clips/' + slug + '-' + SLOTS[i] + '.mp4"></video>' +
          '</div>' +
          '<div class="q-ability-copy">' +
            '<span class="q-ability-index">0' + (i + 1) + ' / 04</span>' +
            '<h4 class="q-ability-name">' +
              '<img class="q-ability-badge" src="' + ab.icon + '" alt="" />' +
              escapeHTML(ab.name) +
            '</h4>' +
            '<p class="q-ability-desc">' + escapeHTML(ab.desc) + '</p>' +
          '</div>' +
        '</div>'
      );
    });
    return out.join('');
  }

  /* ---- DossierFX -----------------------------------------------------------
     One rAF loop driving every [data-fx] element currently in range, each
     computing its own in-range delta from the shared scrollbar's offset.x —
     the same shape as the 5 source modules, generalised into one driver
     instead of 5 near-identical classes each with their own listener. */
  function DossierFX(scrollbar, containerEl, vertical) {
    this.sb = scrollbar;
    this.containerEl = containerEl;
    this.vertical = !!vertical;
    this.items = Array.prototype.slice.call(containerEl.querySelectorAll('[data-fx]')).map(function (el) {
      return {
        el: el,
        type: el.dataset.fx,
        speed: parseFloat(el.dataset.fxSpeed) || 1,
        max: parseFloat(el.dataset.fxMax) || 30,
        delta: 0
      };
    });
    this.sections = Array.prototype.slice.call(
      containerEl.querySelectorAll('.q-dossier-section'));
    this.current = -1;
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  /* Which section is nearest the middle of the surface, on whichever axis is
     scrolling. Reused for both the clips and the rail's active card, off the
     one rAF loop this file already runs rather than a second observer. */
  DossierFX.prototype._nearest = function (offset, cw) {
    var vert = this.vertical, best = -1, bestDist = Infinity, self = this;
    var mid = offset + cw / 2;
    this.sections.forEach(function (sec, i) {
      var start = vert ? sec.offsetTop : sec.offsetLeft;
      var size = vert ? sec.clientHeight : sec.clientWidth;
      var d = Math.abs(start + size / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  };

  /* Only the section you are on decodes video. Everything else is a poster. */
  DossierFX.prototype._syncMedia = function (offset, cw) {
    var i = this._nearest(offset, cw);
    if (i === this.current) return;
    this.current = i;

    this.sections.forEach(function (sec, n) {
      var v = sec.querySelector('.q-ability-clip');
      if (!v) return;
      if (n === i) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});   // autoplay refusal is fine
      } else if (!v.paused) {
        v.pause();
      }
    });

    // section 0 is the bio; abilities are 1..4, so the rail's index is i - 1
    if (window.AbilityRail) {
      window.AbilityRail.setActive(this.containerEl, i - 1);
    }
  };

  DossierFX.prototype._tick = function () {
    var sb = this.sb, self = this, vert = this.vertical;
    // "along the scroll axis": the viewport's extent, the scrollbar's offset,
    // and each section's start and size, all on whichever axis is scrolling.
    var cw = vert ? this.containerEl.clientHeight : this.containerEl.clientWidth;
    var offset = vert ? sb.offset.y : sb.offset.x;
    this.items.forEach(function (item) {
      var sel = item.el.closest('.q-dossier-section');
      if (!sel) return;
      var left = vert ? sel.offsetTop : sel.offsetLeft;
      var width = vert ? sel.clientHeight : sel.clientWidth;
      var inRange = offset >= left - cw && offset <= left + width;
      if (!inRange) return;

      var area, val, buffer;
      if (item.type === 'layered') {
        area = cw + width; val = offset + width - left; buffer = val / area + 0.5;
      } else if (item.type === 'text' || item.type === 'rotate' || item.type === 'parallax') {
        // This family runs 1 -> 0 across the section's whole time on screen and
        // sits at 0.5 when it is centred, which is what lets the parallax be
        // measured either side of rest rather than only ever drifting one way.
        area = cw + width; val = offset - left; buffer = 0.5 - val / area;
      } else { // rail
        area = cw; val = offset - left; buffer = val / area + 1;
      }
      item.delta = item.delta + (buffer - item.delta) * 0.1;
      self._render(item);
    });
    this._syncMedia(offset, cw);
    this._raf = requestAnimationFrame(this._tick);
  };

  DossierFX.prototype._render = function (item) {
    switch (item.type) {
      case 'layered':
        item.el.style.transform = 'translate3d(0,' + (-item.delta * item.max * item.speed).toFixed(2) + '%,0)';
        break;
      case 'text':
        item.el.style.setProperty('--xText', item.delta.toFixed(3));
        break;
      case 'rail':
        // Measured either side of REST, not from the section's entry — the one
        // real change to this module's formula, and it is a fix rather than a
        // preference. This family's delta is 1 exactly when the section is
        // parked at the reading position, so the ported `delta * 25vh` put the
        // module's *maximum* displacement precisely where the reader stops:
        // measured at 1440x900, ability 02's clip sat at 1010-1550, which is
        // 110px off the right edge of the screen and 225px further right than
        // the clip in every other ability. Subtracting 1 makes the resting
        // position the zero, so the clip lands where its three siblings land
        // and the drift reads as drift instead of as a layout mistake.
        //
        // The range came down from 25 with it: the swing is symmetric now, so
        // half of it is spent moving the clip toward the copy column, and 25
        // would have run it into the text. 14 keeps roughly the same visible
        // travel as before over the part of the pass you can actually see.
        //
        // The unit is the viewport's *cross* axis. The source is horizontal so
        // it says vh; stacked vertically on a phone, vh is the long axis and
        // the clip rails clean off the side of a 390px screen. vw is the same
        // "fraction of the short side" the module was written to mean.
        item.el.style.transform =
          'translate3d(' + ((item.delta - 1) * RAIL_RANGE).toFixed(2) +
          (this.vertical ? 'vw' : 'vh') + ',0,0)';
        break;
      case 'parallax':
        // delta is 0.5 at rest, so (delta - 0.5) swings +-0.5 and the clip
        // drifts symmetrically about its resting position. Positive moves it
        // with the scroll, i.e. slower than the panel — the usual read.
        //
        // On a phone the sections are stacked, so "along the scroll axis"
        // means down the page; translating X there would push the clip out of
        // a 390px column. Same idea, whichever axis is actually scrolling.
        item.el.style.transform = this.vertical
          ? 'translate3d(0,' + ((item.delta - 0.5) * PARALLAX_RANGE).toFixed(2) + '%,0)'
          : 'translate3d(' + ((item.delta - 0.5) * PARALLAX_RANGE).toFixed(2) + '%,0,0)';
        break;
      case 'rotate':
        item.el.style.setProperty('--rotate', item.delta.toFixed(3));
        break;
    }
  };

  DossierFX.prototype.destroy = function () {
    cancelAnimationFrame(this._raf);
    // Pause before the markup is torn out. A <video> left playing while its
    // element is detached keeps decoding on some engines, and the dossier can
    // be opened and closed all day.
    this.containerEl.querySelectorAll('.q-ability-clip').forEach(function (v) {
      v.pause();
    });
  };

  /* ---- Dossier --------------------------------------------------------- */
  var Dossier = {
    el: null, scrollEl: null, closeBtn: null,
    sb: null, fx: null, isOpen: false, openIndex: null,

    init: function () {
      this.el = document.querySelector('#q-dossier');
      this.scrollEl = document.querySelector('#q-dossier-scroll');
      this.closeBtn = document.querySelector('#q-dossier-close');
      if (!this.el) return;

      var self = this;
      this.closeBtn.addEventListener('click', function () { self.close(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });

      Array.prototype.forEach.call(document.querySelectorAll('.q-theme'), function (theme) {
        var hit = theme.querySelector('.q-home-to-single');
        if (!hit) return;
        hit.addEventListener('click', function (e) {
          e.stopPropagation();
          self.show(parseInt(theme.dataset.index, 10));
        });
      });
    },

    show: function (index) {
      if (this.isOpen) return;
      var agent = window.AGENTS[index];
      if (!agent) return;
      this.isOpen = true;
      this.openIndex = index;   // close() hands the roster back to this agent
      var self = this;
      var val = window.__val;

      // ported: non-active names cut, --yVal yoyo kick, hover art fades
      var others = document.querySelectorAll('.q-theme:not([data-index="' + index + '"]) .q-inner');
      gsap.set(others, { autoAlpha: 0, overwrite: true });
      var listInner = document.querySelector('#q-main-list > .q-inner');
      if (listInner) {
        gsap.to(listInner, { duration: 0.6, ease: 'expo.inOut', delay: 0.05, yoyo: true, repeat: 1, '--yVal': -6 });
      }
      if (val && val.DOM.objs.preview) val.DOM.objs.preview.fadeOutImage(0.35, 0.75);

      // build content now, but keep it invisible until the wipe finishes —
      // a scaleX transform on live text reads as a glitch, not a reveal
      this.scrollEl.innerHTML = buildSections(agent);
      gsap.set(this.scrollEl.querySelectorAll('.q-dossier-section'), { autoAlpha: 0 });
      gsap.set(this.scrollEl.querySelectorAll('.q-dossier-bio-copy > *'), { autoAlpha: 0 });

      gsap.set(this.el, { visibility: 'visible' });
      gsap.fromTo(this.el,
        { scaleX: 0 },
        {
          scaleX: 1, duration: 1.25, ease: 'expo.inOut', transformOrigin: '100% 0',
          onComplete: function () { self._reveal(); }
        });
    },

    _reveal: function () {
      var self = this;
      gsap.to(this.scrollEl.querySelectorAll('.q-dossier-section'),
        { duration: 0.4, autoAlpha: 1, stagger: 0.05 });
      gsap.fromTo(this.scrollEl.querySelectorAll('.q-dossier-bio-copy > *'),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.15 });

      // damping was 0.15, same long-glide value the roster's own scroller had
      // before js/controls.js's bindRosterScrollDesktop was bumped to 0.3 for
      // exactly this reason: damping paces how many frames a wheel/drag
      // impulse takes to resolve, not how far it travels, and 0.15 spreads
      // that resolution over enough frames to read as lag rather than glide
      // once a reader is doing it repeatedly — flipping between abilities
      // here, same as flipping between agents there. Matched to the same
      // 0.3, scoped to just this scroller: the intro's own #q-scroll-vh
      // instance (js/valorant.js) is untouched, so its just-tuned pacing
      // doesn't shift.
      var vertical = isVertical();
      this.sb = new SmoothScroll('#q-dossier-scroll', '#q-dossier',
        { damping: 0.3, horizontal: !vertical });
      this.fx = new DossierFX(this.sb, this.scrollEl, vertical);

      // The rail picks an ability; the dossier's own scrollbar is what moves.
      // Scrolling the surface to a section, rather than jumping it, keeps the
      // ported FX modules running through the move instead of snapping past.
      if (window.AbilityRail) {
        window.AbilityRail.bind(this.scrollEl, function (index) {
          var sec = self.scrollEl.querySelector(
            '.q-dossier-section[data-ability="' + index + '"]');
          if (!sec || !self.sb) return;
          if (vertical) self.sb.setMomentum(0, sec.offsetTop - self.sb.offset.y);
          else self.sb.setMomentum(sec.offsetLeft - self.sb.offset.x, 0);
        });
      }

      // sections are height:auto when stacked, so the scroll limit is only
      // right once they have laid out (and again if the art changes it)
      if (vertical) {
        var sb = this.sb;
        requestAnimationFrame(function () { sb.update(); });
        this.scrollEl.querySelectorAll('img').forEach(function (img) {
          if (!img.complete) img.addEventListener('load', function () { sb.update(); }, { once: true });
        });
      }
    },

    close: function () {
      if (!this.isOpen) return;
      this.isOpen = false;
      var self = this;

      if (this.fx) { this.fx.destroy(); this.fx = null; }
      if (this.sb) { this.sb.destroy(); this.sb = null; }

      gsap.to(this.scrollEl.children, { duration: 0.25, autoAlpha: 0 });
      gsap.to(this.el, {
        scaleX: 0, duration: 1.25, delay: 0.15, ease: 'expo.inOut', transformOrigin: '100% 0',
        onComplete: function () {
          gsap.set(self.el, { visibility: 'hidden' });
          self.scrollEl.innerHTML = '';
          gsap.set(document.querySelectorAll('.q-theme .q-inner'), { autoAlpha: 1 });

          // Put the roster back the way it was found. show() faded the
          // preview art out and nothing restored it, so closing landed you
          // on a bare wash — and since fadeOutImage also clears .q-hover,
          // this needs to explicitly reselect rather than assume anything
          // still is. NEW: used to re-fire the agent's own mouseenter to get
          // there, back when hover drove selection. Nothing listens for one
          // any more (js/valorant.js's Roster.prototype.select replaced that
          // binding — see js/controls.js's own header note), so the dispatch
          // was a silent no-op: closing the dossier left the roster with no
          // selection and no art at all. window.__roster.select is the same
          // entry point scroll and keyboard selection already call.
          if (window.__roster && self.openIndex != null) {
            window.__roster.select(self.openIndex);
          }
        }
      });
    }
  };

  window.addEventListener('DOMContentLoaded', function () {
    Dossier.init();
    window.__dossier = Dossier;
  });
})();
