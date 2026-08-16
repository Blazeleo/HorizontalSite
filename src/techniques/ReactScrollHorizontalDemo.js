import React from "react";
import HorizontalScroll from "react-scroll-horizontal";
import ChapterHead from "../components/ChapterMeta";
import ScrollGuard from "../components/ScrollGuard";

const PANELS = ["Spring", "Physics", "React Motion", "Whole-Page", "Batteries", "Included"];
const COLORS = ["var(--pink)", "var(--cyan)", "var(--yellow)", "var(--blue)", "var(--pink-dark)", "var(--cyan-dark)"];

export default function ReactScrollHorizontalDemo({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-cream">
      <ChapterHead tech={tech} total={total} />
      <div className="chapter-body" style={{ width: "100%", flexDirection: "column", gap: "0.75rem" }}>
        {/* This is the one demo whose whole point is that it eats the wheel,
            which is also exactly why it needs the guard most: unguarded, the
            library captures on hover, so merely reading past the chapter
            stopped the page. Behind the guard the capture is still the demo's
            headline behaviour — the reader just opts into it. */}
        <ScrollGuard className="rsh-box" label="Click to capture the wheel">
          <HorizontalScroll reverseScroll config={{ stiffness: 120, damping: 22 }} style={{ height: "100%", width: "100%" }}>
            {PANELS.map((label, i) => (
              <div
                key={label}
                className="demo-card"
                style={{ background: COLORS[i], color: i === 2 ? "var(--ink)" : "var(--white)", marginRight: "2rem" }}
              >
                <span className="num">0{i + 1}</span>
                <h4>{label}</h4>
                <p>wheel → spring translateX</p>
              </div>
            ))}
          </HorizontalScroll>
        </ScrollGuard>
        <p className="hint">
          Click the box and scroll — the wheel is captured only inside it. Escape or click away to
          give it back to the page.
        </p>
      </div>
    </section>
  );
}
