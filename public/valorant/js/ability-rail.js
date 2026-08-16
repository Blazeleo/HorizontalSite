/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER — ability rail

   A horizontal, scroll-snapped, drag-flickable strip of the open agent's four
   abilities, sitting in the dossier's bio panel. Clicking a card scrolls the
   dossier to that ability's section.

   This is where the retired js/filmstrip.js's two techniques went — native
   `scroll-snap-type: x mandatory` and a pointer-drag velocity flick — and why
   they moved. On the roster screen that strip existed only to have those two
   techniques on show: it duplicated a selection the names already owned,
   chased them around as you hovered, and left two surfaces disagreeing about
   which agent was selected. Here the same two techniques have an actual job
   (pick an ability, jump to it) and nothing else on screen competes for it.

   Both of the bugs that strip taught us are carried over deliberately —

     - Pointer capture is taken on the first real movement, never on
       pointerdown. A captured pointer makes the browser retarget the following
       `click` to the capturing element, which silently makes every card
       unclickable.
     - The flick velocity is cleared the moment a glide is handed its starting
       value, not at the start of the next drag. Otherwise the "suppress the
       click that ends a flick" guard reads a stale velocity forever and eats
       ordinary clicks made long afterwards.

   — because both are invisible on inspection and only show up when a real
   mouse drives the thing.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var SLOTS = ['a1', 'a2', 'a3', 'ult'];
  var SLOT_LABELS = ['C', 'Q', 'E', 'X'];   // the keys these sit on in-game

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Markup only — dossier.js owns when this is built and torn down. */
  function build(agent) {
    var slug = agent.name.toLowerCase();
    var cards = agent.abilityInfo.map(function (ab, i) {
      return '' +
        '<button type="button" class="q-rail-card" data-ability="' + i + '">' +
          '<img class="q-rail-shot" src="assets/clips/' + slug + '-' + SLOTS[i] + '.jpg" ' +
               'alt="" loading="lazy" decoding="async" />' +
          '<span class="q-rail-key">' + SLOT_LABELS[i] + '</span>' +
          '<span class="q-rail-name">' + escapeHTML(ab.name) + '</span>' +
        '</button>';
    }).join('');

    return '' +
      '<div class="q-rail" data-fx-rail>' +
        '<div class="q-rail-track">' + cards + '</div>' +
      '</div>';
  }

  /* Pointer-drag flick. Same idiom as the main site's own Gallery card track. */
  function bindDrag(rail, onClickCard) {
    var dragging = false, captured = false;
    var startX = 0, startScroll = 0, lastX = 0, lastT = 0, vx = 0;
    var SLOP = 4;

    rail.addEventListener('pointerdown', function (e) {
      dragging = true;
      captured = false;
      startX = lastX = e.clientX;
      startScroll = rail.scrollLeft;
      lastT = performance.now();
      vx = 0;
    });

    rail.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (!captured) {
        if (Math.abs(dx) <= SLOP) return;      // still a click, not a drag
        captured = true;
        try { rail.setPointerCapture(e.pointerId); } catch (err) {}
        rail.classList.add('q-rail-dragging');
      }
      rail.scrollLeft = startScroll - dx;
      var now = performance.now(), dt = now - lastT;
      if (dt > 0) { vx = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = now; }
    });

    var release = function (e) {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('q-rail-dragging');
      if (captured && e && e.pointerId != null) {
        try { rail.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      captured = false;
      var v = vx;
      vx = 0;                                   // see the header note
      (function glide() {
        if (Math.abs(v) < 0.02) return;
        rail.scrollLeft -= v * 16;
        v *= 0.94;
        requestAnimationFrame(glide);
      })();
    };
    rail.addEventListener('pointerup', release);
    rail.addEventListener('pointerleave', function (e) { if (dragging) release(e); });

    rail.addEventListener('click', function (e) {
      if (Math.abs(vx) > 0.35) { e.preventDefault(); return; }   // ends a flick
      var card = e.target.closest('.q-rail-card');
      if (card) onClickCard(parseInt(card.dataset.ability, 10));
    });

    /* A vertical wheel over the rail steps it one card, and is released at both
       ends so the dossier's own horizontal scroll picks it back up — the same
       direction-aware handover smooth-scroll.js uses (SPEC §4). Stepping between
       snap points rather than adding the raw delta, because mandatory snapping
       re-snaps after any imperative scroll and a small delta gets pulled back. */
    var wheelLock = 0;
    rail.addEventListener('wheel', function (e) {
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      var cards = Array.prototype.slice.call(rail.querySelectorAll('.q-rail-card'));
      var at = cards.indexOf(centreCard(rail));
      var next = at + (d > 0 ? 1 : -1);
      if (at === -1 || next < 0 || next >= cards.length) return;
      e.preventDefault();
      var now = performance.now();
      if (now < wheelLock) return;
      wheelLock = now + 260;
      centreOn(rail, cards[next]);
    }, { passive: false });
  }

  function centreCard(rail) {
    var mid = rail.scrollLeft + rail.clientWidth / 2;
    var best = null, bestDist = Infinity;
    rail.querySelectorAll('.q-rail-card').forEach(function (c) {
      var d = Math.abs((c.offsetLeft + c.offsetWidth / 2) - mid);
      if (d < bestDist) { bestDist = d; best = c; }
    });
    return best;
  }

  function centreOn(rail, card) {
    if (!card) return;
    var left = card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
    if (rail.scrollTo) rail.scrollTo({ left: left, behavior: 'smooth' });
    else rail.scrollLeft = left;
  }

  /* Mark which card the dossier is currently parked on, so the rail reads as a
     position indicator and not just a menu. Called by dossier.js from the one
     rAF loop it already runs, rather than adding another. */
  function setActive(root, index) {
    var cards = root.querySelectorAll('.q-rail-card');
    var changed = false;
    cards.forEach(function (c) {
      var on = parseInt(c.dataset.ability, 10) === index;
      if (on !== c.classList.contains('q-rail-active')) changed = true;
      c.classList.toggle('q-rail-active', on);
    });
    return changed;
  }

  window.AbilityRail = {
    build: build,
    bind: function (root, onClickCard) {
      var rail = root.querySelector('.q-rail');
      if (rail) bindDrag(rail, onClickCard);
      return rail;
    },
    setActive: setActive,
    centreOnIndex: function (root, index) {
      var rail = root.querySelector('.q-rail');
      if (rail) centreOn(rail, rail.querySelector('.q-rail-card[data-ability="' + index + '"]'));
    }
  };
})();
