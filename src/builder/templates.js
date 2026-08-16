// Generates standalone, dependency-free (except where a CDN is declared)
// HTML + CSS + JS for each horizontal-scroll technique, parametrized by the
// user's config. The same output feeds both the live iframe preview and the
// downloadable export, so there's no drift between what you see and what
// you get.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function accent(palette, i) {
  return palette.accents[i % palette.accents.length];
}

function readableOn(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111111" : "#FBFDFD";
}

function cardHtml(label, i, palette) {
  const bg = accent(palette, i);
  return `<div class="card" style="background:${bg};color:${readableOn(bg)}"><span class="card-num">0${i + 1}</span><h4>${esc(label)}</h4></div>`;
}

const CARD_CSS = `
.card{flex:0 0 auto;width:min(60vw,280px);height:min(60vw,280px);max-height:300px;border-radius:26px;display:flex;flex-direction:column;justify-content:flex-end;padding:1.3rem;position:relative;box-sizing:border-box;font-family:inherit;}
.card h4{margin:0;font-size:1.2rem;text-transform:uppercase;letter-spacing:-0.01em;}
.card-num{position:absolute;top:1.1rem;left:1.3rem;font-size:0.8rem;opacity:0.55;font-weight:700;}
`;

const BASE_CSS = (palette) => `
*{box-sizing:border-box;}
body{margin:0;background:${palette.bg};color:${palette.text};font-family:'Poppins',system-ui,sans-serif;}
h1,h2,h3{font-family:'Archivo Black','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:-0.01em;}
.wrap{padding:4rem 6vw;}
.hint{opacity:0.65;font-size:0.8rem;margin-top:1rem;}
${CARD_CSS}
`;

function itemsOrDefault(items) {
  return items && items.length ? items : ["One", "Two", "Three", "Four"];
}

// ---------- 1. scroll-snap ----------
function scrollSnap({ items, palette }) {
  const list = itemsOrDefault(items);
  return {
    title: "Native CSS Scroll-Snap",
    html: `<div class="wrap"><h2>Scroll Snap</h2><div class="rail">${list.map((l, i) => cardHtml(l, i, palette)).join("")}</div><p class="hint">Drag the scrollbar, trackpad-swipe, or shift+wheel to snap between cards.</p></div>`,
    css: `${BASE_CSS(palette)}
.rail{display:flex;gap:1.25rem;overflow-x:auto;scroll-snap-type:x mandatory;padding:1.5rem 0 2rem;}
.rail .card{scroll-snap-align:center;}
`,
    js: "",
    cdn: [],
  };
}

// ---------- 2. drag-row ----------
function dragRow({ items, palette }) {
  const list = itemsOrDefault(items);
  return {
    title: "Pointer Drag-to-Scroll",
    html: `<div class="wrap"><h2>Drag to Scroll</h2><div class="drag-row" id="dragRow">${list.map((l, i) => cardHtml(l, i, palette)).join("")}</div><p class="hint">Click and drag (or touch) — releases with momentum.</p></div>`,
    css: `${BASE_CSS(palette)}
.drag-row{display:flex;gap:1.25rem;overflow-x:auto;padding:1.5rem 0 2rem;cursor:grab;user-select:none;}
.drag-row.dragging{cursor:grabbing;}
.drag-row.dragging .card{pointer-events:none;}
`,
    js: `
(function(){
  var el = document.getElementById('dragRow');
  var state = { down:false, startX:0, startScroll:0, lastX:0, lastT:0, vx:0 };
  el.addEventListener('pointerdown', function(e){
    state.down = true; el.classList.add('dragging'); el.setPointerCapture(e.pointerId);
    state.startX = e.clientX; state.startScroll = el.scrollLeft; state.lastX = e.clientX; state.lastT = performance.now(); state.vx = 0;
  });
  el.addEventListener('pointermove', function(e){
    if(!state.down) return;
    el.scrollLeft = state.startScroll - (e.clientX - state.startX);
    var now = performance.now(); var dt = now - state.lastT;
    if(dt > 0){ state.vx = (e.clientX - state.lastX) / dt; state.lastX = e.clientX; state.lastT = now; }
  });
  function release(e){
    if(!state.down) return;
    state.down = false; el.classList.remove('dragging');
    var v = state.vx;
    function step(){ if(Math.abs(v) < 0.02) return; el.scrollLeft -= v * 16; v *= 0.94; requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  el.addEventListener('pointerup', release);
  el.addEventListener('pointerleave', release);
})();
`,
    cdn: [],
  };
}

// ---------- 3. scroll-jack ----------
function runwayShell(innerHtml, runwayVh) {
  return `<div class="runway" style="height:${runwayVh}vh"><div class="pin"><div class="wrap" style="width:100%;padding:2rem 0;">${innerHtml}</div></div></div>`;
}

const RUNWAY_CSS = `
.runway{position:relative;width:100%;}
.pin{position:sticky;top:0;height:100vh;width:100%;overflow:hidden;display:flex;flex-direction:column;justify-content:center;}
`;

function scrollJack({ items, palette, speed }) {
  const list = itemsOrDefault(items);
  const runwayVh = 140 + speed * 20;
  return {
    title: "Sticky-Pin Scroll-Jack",
    html: `<h2 style="padding:2rem 6vw 0">Scroll-Jack</h2>${runwayShell(`<div class="jack-track" id="jackTrack">${list.map((l, i) => cardHtml(l, i, palette)).join("")}</div>`, runwayVh)}<div class="wrap"><p class="hint">Scroll down through this whole block — vertical scroll drives the horizontal translateX.</p></div>`,
    css: `${BASE_CSS(palette)}
${RUNWAY_CSS}
.jack-track{display:flex;gap:2rem;align-items:center;padding-left:6vw;will-change:transform;}
`,
    js: `
(function(){
  var runway = document.querySelector('.runway');
  var track = document.getElementById('jackTrack');
  var ticking = false;
  function apply(){
    ticking = false;
    var rect = runway.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = rect.height - vh;
    var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
    var max = Math.max(0, track.scrollWidth - window.innerWidth + 100);
    track.style.transform = 'translateX(' + (-p * max) + 'px)';
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(apply); } }
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  apply();
})();
`,
    cdn: [],
  };
}

// ---------- 4. scroll-driven-css ----------
function scrollDrivenCss({ items, palette }) {
  const list = itemsOrDefault(items);
  return {
    title: "CSS Scroll-Driven Animation",
    html: `<h2 style="padding:2rem 6vw 0">Scroll-Driven CSS</h2>${runwayShell(`<div class="sda-track">${list.map((l, i) => cardHtml(l, i, palette)).join("")}</div>`, 220)}<div class="wrap"><p class="hint" id="sdaNote">Pure CSS — animation-timeline: view(x). No scroll listener runs at all.</p></div>`,
    css: `${BASE_CSS(palette)}
${RUNWAY_CSS}
.sda-track{display:flex;gap:2rem;align-items:center;padding-left:6vw;animation-name:sda-slide;animation-timing-function:linear;animation-fill-mode:both;}
@supports (animation-timeline: view()) {
  .sda-track{animation-timeline:view(x);animation-range:entry 0% exit 100%;}
}
@keyframes sda-slide{ from{transform:translateX(0)} to{transform:translateX(-55%)} }
`,
    js: `
if (typeof CSS === 'undefined' || !CSS.supports || !CSS.supports('animation-timeline: view()')) {
  var note = document.getElementById('sdaNote');
  if (note) note.textContent = "Your browser doesn't support animation-timeline yet — this sits static instead of scrubbing.";
}
`,
    cdn: [],
  };
}

// ---------- 5. gsap ----------
function gsapTechnique({ items, palette, speed }) {
  const list = itemsOrDefault(items);
  const scrub = Math.max(0.1, (11 - speed) / 10);
  return {
    title: "GSAP ScrollTrigger Pin",
    html: `<h2 style="padding:2rem 6vw 0">GSAP ScrollTrigger</h2><div class="pinTarget" id="pinTarget" style="height:100vh;width:100%;overflow:hidden;display:flex;flex-direction:column;justify-content:center;"><div class="wrap" style="width:100%;padding:0;"><div class="gsap-track" id="gsapTrack">${list.map((l, i) => cardHtml(l, i, palette)).join("")}</div></div></div><div class="wrap"><p class="hint">gsap.to(track,{x, scrollTrigger:{pin:true, scrub:${scrub}}})</p></div>`,
    css: `${BASE_CSS(palette)}
.gsap-track{display:flex;gap:2rem;align-items:center;padding-left:6vw;will-change:transform;}
`,
    js: `
gsap.registerPlugin(ScrollTrigger);
(function(){
  var track = document.getElementById('gsapTrack');
  var distance = Math.max(0, track.scrollWidth - window.innerWidth + 100);
  gsap.to(track, {
    x: -distance,
    ease: 'none',
    scrollTrigger: {
      trigger: '#pinTarget',
      start: 'top top',
      end: '+=' + distance,
      scrub: ${scrub},
      pin: true,
      invalidateOnRefresh: true
    }
  });
})();
`,
    cdn: [
      "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js",
      "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js",
    ],
  };
}

// ---------- 6. parallax ----------
function parallax({ palette, speed }) {
  const spread = 40 + speed * 12;
  const layers = [
    { label: "Back", mult: 0.3, size: 170, left: "10%", top: "18%" },
    { label: "Mid", mult: 0.7, size: 220, left: "40%", top: "40%" },
    { label: "Front", mult: 1.2, size: 270, left: "60%", top: "14%" },
  ];
  const layerHtml = layers
    .map((l, i) => {
      const bg = accent(palette, i);
      return `<div class="p-layer" data-mult="${l.mult}" style="left:${l.left};top:${l.top};"><div class="card" style="width:${l.size}px;height:${l.size}px;background:${bg};color:${readableOn(bg)}"><h4>${l.label}</h4></div></div>`;
    })
    .join("");
  return {
    title: "Horizontal Parallax Layers",
    html: `<div class="wrap"><h2>Parallax Drift</h2><div class="parallax-stage">${layerHtml}</div><p class="hint">Scroll — each layer drifts sideways at its own speed.</p></div>`,
    css: `${BASE_CSS(palette)}
.parallax-stage{position:relative;width:100%;height:70vh;}
.p-layer{position:absolute;transform:translateY(-50%);will-change:transform;}
`,
    js: `
(function(){
  var layers = document.querySelectorAll('.p-layer');
  var ticking = false;
  function apply(){
    ticking = false;
    var center = window.scrollY + window.innerHeight/2;
    layers.forEach(function(el){
      var mult = parseFloat(el.getAttribute('data-mult'));
      var rect = el.getBoundingClientRect();
      var elCenter = rect.top + window.scrollY + rect.height/2;
      var delta = (elCenter - center) * -mult * 0.25;
      delta = Math.max(-${spread}, Math.min(${spread}, delta));
      el.style.transform = 'translateY(-50%) translateX(' + delta + 'px)';
    });
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(apply); } }
  window.addEventListener('scroll', onScroll, { passive:true });
  apply();
})();
`,
    cdn: [],
  };
}

// ---------- 7. scroll-horizontal-lib (vanilla wheel-capture box) ----------
function scrollHorizontalLib({ items, palette, speed }) {
  const list = itemsOrDefault(items);
  const ease = Math.min(0.3, 0.08 + speed / 60);
  return {
    title: "Full-Page Scroll-Jack (boxed)",
    html: `<div class="wrap"><h2>Wheel-Capture Box</h2><div class="rsh-box" id="rshBox"><div class="rsh-track" id="rshTrack">${list.map((l, i) => cardHtml(l, i, palette)).join("")}</div></div><p class="hint">Hover the box and scroll — wheel is captured only inside it.</p></div>`,
    css: `${BASE_CSS(palette)}
.rsh-box{width:min(90vw,900px);height:56vh;border-radius:26px;overflow:hidden;position:relative;background:rgba(0,0,0,0.18);}
.rsh-track{display:flex;height:100%;align-items:center;gap:2rem;padding:0 3rem;will-change:transform;}
`,
    js: `
(function(){
  var box = document.getElementById('rshBox');
  var track = document.getElementById('rshTrack');
  var target = 0, current = 0;
  function max(){ return Math.max(0, track.scrollWidth - box.clientWidth + 60); }
  box.addEventListener('wheel', function(e){
    e.preventDefault();
    target += e.deltaY;
    target = Math.max(0, Math.min(max(), target));
  }, { passive:false });
  function tick(){
    current += (target - current) * ${ease};
    track.style.transform = 'translateX(' + (-current) + 'px)';
    requestAnimationFrame(tick);
  }
  tick();
})();
`,
    cdn: [],
  };
}

// ---------- 8. marquee ----------
function marquee({ items, palette, speed }) {
  const list = itemsOrDefault(items).length ? itemsOrDefault(items) : ["MARQUEE", "TICKER", "LOOP"];
  const duration = Math.max(4, 26 - speed * 2);
  const row = [...list, ...list];
  return {
    title: "Infinite Marquee Ticker",
    html: `<div class="wrap"><h2>Marquee</h2><div class="marquee-wrap"><div class="marquee-track">${row.map((w, i) => `<span style="${i % list.length === 0 ? `color:${accent(palette, 0)};-webkit-text-stroke:0;` : ""}">${esc(w)} ✦</span>`).join("")}</div></div></div>`,
    css: `${BASE_CSS(palette)}
.marquee-wrap{overflow:hidden;width:100%;}
.marquee-track{display:flex;width:max-content;gap:3rem;align-items:center;animation:marquee ${duration}s linear infinite;}
.marquee-track span{font-family:'Archivo Black',sans-serif;font-size:clamp(2rem,6vw,4.5rem);text-transform:uppercase;white-space:nowrap;-webkit-text-stroke:2px ${palette.text};color:transparent;}
@keyframes marquee{ to{ transform:translateX(-50%); } }
`,
    js: "",
    cdn: [],
  };
}

// ---------- 9. canvas ----------
function canvasScrub({ palette, speed }) {
  const rot = (speed / 10).toFixed(2);
  return {
    title: "Canvas Frame-Scrub",
    html: `<h2 style="padding:2rem 6vw 0">Canvas Scrub</h2>${runwayShell('<canvas id="scrubCanvas" class="canvas-stage"></canvas>', 220)}<div class="wrap"><p class="hint">Each scroll tick clears and redraws the scene as a pure function of progress.</p></div>`,
    css: `${BASE_CSS(palette)}
${RUNWAY_CSS}
.canvas-stage{width:min(92vw,900px);height:56vh;border-radius:26px;background:rgba(0,0,0,0.18);display:block;margin:0 auto;}
`,
    js: `
(function(){
  var runway = document.querySelector('.runway');
  var canvas = document.getElementById('scrubCanvas');
  var ctx = canvas.getContext('2d');
  var accents = ${JSON.stringify(palette.accents)};
  var w = 0, h = 0;
  function size(){
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    w = rect.width; h = rect.height;
  }
  function mountain(baseY, offset, color, height){
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, baseY);
    for (var i=0;i<=5;i++){
      var x = (i/5)*w*1.4 - offset*w*0.6;
      var y = baseY - height*(0.5+0.5*Math.sin(i*2.1));
      ctx.lineTo(x,y);
    }
    ctx.lineTo(w, baseY); ctx.closePath(); ctx.fill();
  }
  function draw(p){
    if(!w) return;
    ctx.clearRect(0,0,w,h);
    var sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0, accents[3] || '#2B27E7'); sky.addColorStop(1, accents[1] || '#66CCDE');
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,h);
    mountain(h*0.8, p*0.3, accents[3] || '#4A47EC', h*0.2);
    mountain(h*0.8, p*0.65, accents[1] || '#7A78F5', h*0.13);
    ctx.beginPath(); ctx.fillStyle = accents[2] || '#EDC010';
    ctx.arc(p*(w+160)-80, h*0.4 - Math.sin(p*Math.PI)*70, 40, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(w*0.5, h*0.66); ctx.rotate(p*Math.PI*2*${rot});
    ctx.fillStyle = accents[0] || '#FF236D'; ctx.fillRect(-26,-26,52,52); ctx.restore();
  }
  var ticking = false;
  function apply(){
    ticking = false;
    var rect = runway.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -rect.top/total)) : 0;
    draw(p);
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(apply); } }
  window.addEventListener('resize', function(){ size(); apply(); });
  window.addEventListener('scroll', onScroll, { passive:true });
  size(); apply();
})();
`,
    cdn: [],
  };
}

// ---------- 10. svg-path ----------
function svgPath({ palette }) {
  return {
    title: "SVG Motion-Path Follower",
    html: `<h2 style="padding:2rem 6vw 0">SVG Motion Path</h2>${runwayShell(
      `<svg viewBox="0 0 1200 500" class="svg-stage"><path id="motionPath" d="M 20 260 C 160 40, 300 460, 460 260 S 720 40, 880 260 S 1080 460, 1180 220" fill="none" stroke="${palette.text}" stroke-width="3" opacity="0.4" /><g id="marker"><circle r="24" fill="${accent(palette, 0)}" /></g></svg>`,
      200
    )}<div class="wrap"><p class="hint">path.getPointAtLength(progress * totalLength) every scroll tick.</p></div>`,
    css: `${BASE_CSS(palette)}
${RUNWAY_CSS}
.svg-stage{width:min(92vw,900px);height:50vh;display:block;margin:0 auto;}
`,
    js: `
(function(){
  var runway = document.querySelector('.runway');
  var path = document.getElementById('motionPath');
  var marker = document.getElementById('marker');
  var len = path.getTotalLength ? path.getTotalLength() : 0;
  var ticking = false;
  function apply(){
    ticking = false;
    var rect = runway.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -rect.top/total)) : 0;
    if (path.getPointAtLength) {
      var pt = path.getPointAtLength(p * len);
      marker.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
    }
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(apply); } }
  window.addEventListener('scroll', onScroll, { passive:true });
  apply();
})();
`,
    cdn: [],
  };
}

// ---------- 11. three ----------
function threeScene({ palette, speed }) {
  const rotSpeed = (speed / 10).toFixed(2);
  return {
    title: "WebGL 3D Scroll Dolly",
    html: `${runwayShell('<div id="threeStage" style="position:absolute;inset:0;"></div><h2 style="position:relative;padding:2rem 6vw 0;pointer-events:none;">3D Scroll Dolly</h2>', 240)}<div class="wrap"><p class="hint">Scroll drives the camera’s X position and mesh rotation inside a WebGL canvas.</p></div>`,
    css: `${BASE_CSS(palette)}
${RUNWAY_CSS}
.pin{padding:0;justify-content:flex-start;}
`,
    js: `
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const stage = document.getElementById('threeStage');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, stage.clientWidth / stage.clientHeight, 0.1, 100);
camera.position.set(0, 0.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.setSize(stage.clientWidth, stage.clientHeight);
stage.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dir = new THREE.DirectionalLight(0xffffff, 1.4);
dir.position.set(4, 6, 4);
scene.add(dir);

const accents = ${JSON.stringify(palette.accents)};
const group = new THREE.Group();
const geo1 = new THREE.IcosahedronGeometry(0.9, 0);
const mesh1 = new THREE.Mesh(geo1, new THREE.MeshStandardMaterial({ color: accents[0] || '#FF236D', flatShading: true }));
mesh1.position.x = -3;
const geo2 = new THREE.TorusGeometry(0.85, 0.3, 16, 48);
const mesh2 = new THREE.Mesh(geo2, new THREE.MeshStandardMaterial({ color: accents[1] || '#66CCDE' }));
const geo3 = new THREE.BoxGeometry(1.3, 1.3, 1.3);
const mesh3 = new THREE.Mesh(geo3, new THREE.MeshStandardMaterial({ color: accents[2] || '#EDC010', flatShading: true }));
mesh3.position.x = 3;
group.add(mesh1, mesh2, mesh3);
scene.add(group);

const runway = document.querySelector('.runway');
function progress() {
  const rect = runway.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  return total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
}

function resize() {
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  camera.aspect = stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);
  const p = progress();
  camera.position.x += ((p - 0.5) * 7 - camera.position.x) * 0.08;
  camera.lookAt(0, 0, 0);
  group.rotation.y = p * Math.PI * 2 * ${rotSpeed};
  renderer.render(scene, camera);
}
animate();
`,
    cdn: [],
    moduleJs: true,
  };
}

const registry = {
  "scroll-snap": scrollSnap,
  "drag-row": dragRow,
  "scroll-jack": scrollJack,
  "scroll-driven-css": scrollDrivenCss,
  gsap: gsapTechnique,
  parallax,
  "scroll-horizontal-lib": scrollHorizontalLib,
  marquee,
  canvas: canvasScrub,
  "svg-path": svgPath,
  three: threeScene,
};

export function generate(techniqueId, config) {
  const fn = registry[techniqueId];
  if (!fn) throw new Error(`Unknown technique: ${techniqueId}`);
  return fn(config);
}

export function buildDocument(result, docTitle) {
  const cdnTags = (result.cdn || []).map((src) => `<script src="${src}"></script>`).join("\n    ");
  const scriptTag = result.moduleJs
    ? `<script type="module">\n${result.js}\n    </script>`
    : `<script>\n${result.js}\n    </script>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(docTitle || result.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
${cdnTags}
<style>
${result.css}
</style>
</head>
<body>
${result.html}
${result.js ? scriptTag : ""}
</body>
</html>
`;
}

const templates = { generate, buildDocument };
export default templates;
