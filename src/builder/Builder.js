import React, { useMemo, useState } from "react";
import techniques from "../data/techniques";
import palettes from "./palettes";
import { generate, buildDocument } from "./templates";
import "./builder.css";

const ITEMS_FIELD = new Set([
  "scroll-snap",
  "drag-row",
  "scroll-jack",
  "scroll-driven-css",
  "gsap",
  "scroll-horizontal-lib",
  "marquee",
]);
const SPEED_FIELD = new Set(["scroll-jack", "gsap", "parallax", "scroll-horizontal-lib", "marquee", "canvas", "three"]);

const TABS = ["Full File", "HTML", "CSS", "JS"];

export default function Builder() {
  const [techniqueId, setTechniqueId] = useState("scroll-snap");
  const [itemsText, setItemsText] = useState("One, Two, Three, Four, Five, Six");
  const [paletteKey, setPaletteKey] = useState("motion");
  const [speed, setSpeed] = useState(5);
  const [tab, setTab] = useState("Full File");
  const [copied, setCopied] = useState(false);

  const tech = techniques.find((t) => t.id === techniqueId);
  const palette = palettes[paletteKey];

  const config = useMemo(
    () => ({
      items: itemsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
      palette,
      speed,
    }),
    [itemsText, palette, speed]
  );

  const result = useMemo(() => generate(techniqueId, config), [techniqueId, config]);
  const doc = useMemo(() => buildDocument(result, `${result.title} — mot/on scroll export`), [result]);

  const tabContent = { "Full File": doc, HTML: result.html, CSS: result.css, JS: result.js || "/* zero JS — nothing to show */" }[tab];

  const handleCopy = () => {
    navigator.clipboard?.writeText(tabContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${techniqueId}-horizontal-scroll.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="builder" className="section bg-cream builder-section">
      <div className="chapter-head">
        <div className="kicker">Build Your Own — pick a technique, tweak it, take the code</div>
        <h2 className="chapter-title" style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}>
          Build &amp; Export
        </h2>
        <p className="chapter-desc" style={{ maxWidth: 720 }}>
          Every technique above, live-configurable. Pick one, adjust its content, color and speed, then copy or
          download a standalone HTML file — no React, no build step, just open it in a browser.
        </p>
      </div>

      <div className="builder-layout">
        <div className="builder-controls">
          <label className="b-field">
            <span>Technique</span>
            <select value={techniqueId} onChange={(e) => setTechniqueId(e.target.value)}>
              {techniques.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.n}. {t.title}
                </option>
              ))}
            </select>
          </label>

          <label className="b-field">
            <span>Color palette</span>
            <div className="b-swatches">
              {Object.entries(palettes).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  className={`b-swatch${key === paletteKey ? " on" : ""}`}
                  style={{ background: p.bg, borderColor: p.accents[0] }}
                  onClick={() => setPaletteKey(key)}
                  title={p.label}
                >
                  <span style={{ background: p.accents[0] }} />
                  <span style={{ background: p.accents[1] }} />
                </button>
              ))}
            </div>
          </label>

          {ITEMS_FIELD.has(techniqueId) && (
            <label className="b-field">
              <span>{techniqueId === "marquee" ? "Words (comma-separated)" : "Card labels (comma-separated)"}</span>
              <input type="text" value={itemsText} onChange={(e) => setItemsText(e.target.value)} maxLength={160} />
            </label>
          )}

          {SPEED_FIELD.has(techniqueId) && (
            <label className="b-field">
              <span>Speed / intensity — {speed}</span>
              <input type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            </label>
          )}

          <div className="b-meta">
            <div>
              <b>Complexity</b> {tech.metrics.complexity}/5
            </div>
            <div>
              <b>Best for</b> {tech.metrics.useCase}
            </div>
          </div>
        </div>

        <div className="builder-preview">
          <div className="builder-preview-label">Live preview — scroll inside the frame</div>
          <iframe title="technique preview" className="builder-iframe" srcDoc={doc} />
        </div>
      </div>

      <div className="builder-code">
        <div className="builder-code-tabs">
          {TABS.map((t) => (
            <button key={t} type="button" className={`b-tab${t === tab ? " on" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
          <div className="b-tab-actions">
            <button type="button" className="pill-btn cyan" onClick={handleCopy}>
              {copied ? "Copied ✓" : "Copy code"}
            </button>
            <button type="button" className="pill-btn pink" onClick={handleDownload}>
              Download .html
            </button>
          </div>
        </div>
        <pre className="builder-code-pane">
          <code>{tabContent}</code>
        </pre>
      </div>
    </section>
  );
}
