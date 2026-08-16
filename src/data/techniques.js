// Metadata for every horizontal-scroll technique demoed in the showcase.
// bg: 'blue' | 'cream' — chapter background per the Motion for Mobile palette.

const techniques = [
  {
    id: "scroll-snap",
    n: "01",
    bg: "blue",
    title: "Native CSS Scroll-Snap",
    kicker: "Zero JS · CSS only",
    desc: "A plain overflow-x:auto row with scroll-snap-type:x mandatory. The browser owns momentum, snapping and accessibility for free — no JavaScript runs at all.",
    snippet: `.rail{
  display:flex;
  overflow-x:auto;
  scroll-snap-type:x mandatory;
}
.card{ scroll-snap-align:center; }`,
    metrics: { complexity: 1, perf: "Native — GPU composited", support: "All modern browsers", bundle: "0 KB", useCase: "Product carousels, image galleries, tab strips" },
  },
  {
    id: "drag-row",
    n: "02",
    bg: "blue",
    title: "Pointer Drag-to-Scroll",
    kicker: "~25 lines JS · pointer events",
    desc: "A flex row scrolled by grabbing and dragging with mouse or touch. pointerdown/move/up adjust scrollLeft directly, with a small velocity carry-over for momentum on release.",
    snippet: `onPointerDown = e => { startX = e.clientX; scrollStart = el.scrollLeft }
onPointerMove = e => {
  el.scrollLeft = scrollStart - (e.clientX - startX)
}`,
    metrics: { complexity: 2, perf: "Main-thread, cheap", support: "All modern browsers", bundle: "0 KB", useCase: "Kanban boards, filmstrips, sliders without arrows" },
  },
  {
    id: "scroll-jack",
    n: "03",
    bg: "cream",
    title: "Sticky-Pin Scroll-Jack",
    kicker: "The Apple trick · position:sticky + rAF",
    desc: "A tall runway section holds a position:sticky stage. As you scroll down through the runway, its progress (0→1) drives a translateX on the inner track — vertical scroll becomes horizontal motion, and it's real document scroll the whole time.",
    snippet: `stage.style.position='sticky'; stage.style.top=0
onScroll = () => {
  const p = clamp((0 - rect.top) / (rect.height - vh), 0, 1)
  track.style.transform = \`translateX(\${-p*trackWidth}px)\`
}`,
    metrics: { complexity: 3, perf: "rAF-throttled, smooth", support: "All modern browsers", bundle: "0 KB", useCase: "Storytelling sections, Apple-style product pages" },
  },
  {
    id: "scroll-driven-css",
    n: "04",
    bg: "blue",
    title: "CSS Scroll-Driven Animations",
    kicker: "Zero JS · animation-timeline",
    desc: "The newest way to pin: animation-timeline:view() ties a keyframe animation directly to an element's position in the viewport — the compositor drives it, no scroll listener exists at all.",
    snippet: `.track{
  animation: slide linear;
  animation-timeline: view();
}
@keyframes slide{ from{transform:translateX(0)} to{transform:translateX(-60%)} }`,
    metrics: { complexity: 2, perf: "Compositor-only, off main thread", support: "Chrome/Edge 115+, Safari 18+, ~84% global", bundle: "0 KB", useCase: "Lightweight reveal effects, progressive enhancement" },
  },
  {
    id: "gsap",
    n: "05",
    bg: "cream",
    title: "GSAP ScrollTrigger Pin",
    kicker: "Library · industry standard",
    desc: "GSAP's ScrollTrigger.create({pin:true}) does the same sticky+translate job as #03, but adds scrubbing, easing, snapping and timeline sequencing as configuration instead of hand-rolled math — the go-to for agency scrollytelling sites.",
    snippet: `gsap.to(track, {
  x: () => -(track.scrollWidth - innerWidth),
  ease: "none",
  scrollTrigger: { trigger: runway, start: "top top",
    end: () => "+=" + track.scrollWidth, scrub: 0.6, pin: true }
})`,
    metrics: { complexity: 3, perf: "Excellent — scrub-tuned", support: "All modern browsers", bundle: "~30 KB (gsap + ScrollTrigger)", useCase: "Agency landers, product reveals, complex timelines" },
  },
  {
    id: "parallax",
    n: "06",
    bg: "blue",
    title: "Horizontal Parallax Layers",
    kicker: "Library · react-scroll-parallax",
    desc: "Multiple layers drift sideways at different speeds as you scroll vertically — driven by this repo's own react-scroll-parallax dependency. No pinning: it's ordinary page scroll with translateX applied per layer.",
    snippet: `<Parallax translateX={['-60px','60px']} easing="easeInOut">
  <Layer />
</Parallax>`,
    metrics: { complexity: 2, perf: "IntersectionObserver + rAF", support: "All modern browsers", bundle: "~6 KB", useCase: "Depth/atmosphere behind hero content" },
  },
  {
    id: "scroll-horizontal-lib",
    n: "07",
    bg: "cream",
    title: "Full-Page Scroll-Jack Library",
    kicker: "Library · react-scroll-horizontal",
    desc: "This repo also ships react-scroll-horizontal, which converts an entire wrapped tree's vertical wheel input into horizontal motion at the page level — the packaged, batteries-included version of technique #03.",
    snippet: `import HorizontalScroll from "react-scroll-horizontal"

<HorizontalScroll reverseScroll config={{stiffness: 90}}>
  <Panel /><Panel /><Panel />
</HorizontalScroll>`,
    metrics: { complexity: 2, perf: "Spring-physics via react-motion", support: "All modern browsers", bundle: "~9 KB", useCase: "Whole-site horizontal portfolios, case-study pages" },
  },
  {
    id: "marquee",
    n: "08",
    bg: "blue",
    title: "Infinite Marquee Ticker",
    kicker: "Zero JS · @keyframes loop",
    desc: "Content is duplicated once, and a linear @keyframes translateX(-50%) loop runs forever — because the second copy picks up exactly where the first ends, the seam is invisible.",
    snippet: `.track{ display:flex; width:max-content;
  animation: marquee 18s linear infinite; }
@keyframes marquee{ to{ transform: translateX(-50%); } }`,
    metrics: { complexity: 1, perf: "Native — GPU composited", support: "All modern browsers", bundle: "0 KB", useCase: "Logo banners, ticker tape, credits" },
  },
  {
    id: "canvas",
    n: "09",
    bg: "cream",
    title: "Canvas Frame-Scrub",
    kicker: "2D Canvas · procedural per-frame draw",
    desc: "Instead of animating DOM nodes, each scroll tick clears a <canvas> and redraws a scene procedurally at that exact progress — the same technique behind Apple's image-sequence product scrubs, minus the sprite sheet.",
    snippet: `onProgress = p => {
  ctx.clearRect(0,0,w,h)
  drawScene(ctx, p) // positions/rotations are pure functions of p
}`,
    metrics: { complexity: 4, perf: "Main-thread draw calls, needs care", support: "All modern browsers", bundle: "0 KB", useCase: "Product scrubbers, data-driven scroll visuals" },
  },
  {
    id: "svg-path",
    n: "10",
    bg: "blue",
    title: "SVG Motion-Path Follower",
    kicker: "SVG · getPointAtLength",
    desc: "A marker travels along an arbitrary squiggly <path> by sampling path.getPointAtLength(progress * totalLength) every scroll tick — motion isn't limited to a straight line.",
    snippet: `const len = path.getTotalLength()
onProgress = p => {
  const {x,y} = path.getPointAtLength(p * len)
  marker.setAttribute('transform', \`translate(\${x},\${y})\`)
}`,
    metrics: { complexity: 3, perf: "Cheap — one DOM write/frame", support: "All modern browsers", bundle: "0 KB", useCase: "Journey maps, timelines, playful mascots" },
  },
  {
    id: "three",
    n: "11",
    bg: "deep",
    title: "WebGL 3D Scroll Dolly",
    kicker: "3D · Three.js",
    desc: "A real 3D scene: scroll progress drives the camera's X position and mesh rotation inside a WebGL canvas via Three.js's own render loop — full depth, lighting and geometry instead of flat layers.",
    snippet: `function animate() {
  requestAnimationFrame(animate)
  camera.position.x += (progress * 6 - camera.position.x) * 0.08
  mesh.rotation.y = progress * Math.PI * 2
  renderer.render(scene, camera)
}`,
    metrics: { complexity: 5, perf: "GPU-bound, mind draw calls", support: "Needs WebGL (~97% global)", bundle: "~150 KB (three.js)", useCase: "Hero product renders, immersive brand scenes" },
  },
];

export default techniques;
