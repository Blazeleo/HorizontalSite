# Horizontal Scroll Showcase

A React app exploring horizontal-scroll techniques on the web — from zero-JS
CSS to GSAP-driven scroll-jacking to a full WebGL scene — built around one
finished centerpiece: an interactive VALORANT agent roster.

## What's here

**A chapter-by-chapter technique showcase** (`src/techniques/`, driven by
`src/data/techniques.js`). Each chapter demonstrates one horizontal-scroll
approach in isolation, with a live demo, a code snippet, and notes on
performance/browser support/bundle cost:

1. Native CSS Scroll-Snap — zero JS, browser-native momentum and snapping
2. Pointer Drag-to-Scroll — grab-and-drag with velocity carry-over
3. Sticky-Pin Scroll-Jack — `position: sticky` + rAF turning vertical scroll into horizontal motion
4. CSS Scroll-Driven Animations — `animation-timeline: scroll()`, no JS at all
5. GSAP ScrollTrigger Pin — the industry-standard pinned-scrub pattern
6. Horizontal Parallax Layers — multi-speed layers via `react-scroll-parallax`
7. Full-Page Scroll-Jack Library — `react-scroll-horizontal` wired up end to end
8. Infinite Marquee Ticker — seamless looping ticker
9. Canvas Frame-Scrub — scroll position mapped to a canvas image sequence
10. SVG Motion-Path Follower — an element riding a path as you scroll
11. WebGL 3D Scroll Dolly — `three.js` / `@react-three/fiber` camera dolly

There's also a **Build Your Own** section (`src/builder/`) for assembling a
custom scroll rail from the patterns above, and a chapter nav / hero / outro
shell tying it together (`src/components/`).

**The Gallery** (`src/gallery/Gallery.js`) is the finished piece the rest of
the showcase builds toward: a scroll-scrubbed VALORANT agent roster, served
as a standalone document at `public/valorant/` rather than as React
components (it owns its own wheel handling and full-viewport layout, and
runs the same way whether embedded in this app or opened directly). It's
built on a scroll engine ported from `public/qode-replica/` — a scrubbed GSAP
master timeline, damped smooth-scroll, velocity-driven type skew, and a
hover-swap art system — running against real agent art, ability icons, and
clips. See `public/valorant/SPEC.md` for the full behavior spec.

## Stack

React 18 · GSAP · three.js / `@react-three/fiber` · `react-scroll-parallax` ·
`react-scroll-horizontal` · Bootstrap / `react-bootstrap` · styled-components

## Getting started

```bash
npm install
npm start
```

Runs at [http://localhost:3000](http://localhost:3000). Standard Create
React App scripts apply (`npm test`, `npm run build`).
