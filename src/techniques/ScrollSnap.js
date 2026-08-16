import React from "react";
import ChapterHead from "../components/ChapterMeta";

const CARD_COLORS = ["var(--pink)", "var(--cyan)", "var(--yellow)", "var(--blue-deep)", "var(--pink-dark)", "var(--cyan-dark)"];
const LABELS = ["Snap", "Point", "Align", "Center", "Momentum", "Free"];

export default function ScrollSnap({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-blue">
      <ChapterHead tech={tech} total={total} />
      <div className="chapter-body">
        <div className="rail hide-scrollbar" role="list">
          {LABELS.map((label, i) => (
            <div
              key={label}
              role="listitem"
              className="demo-card"
              style={{ background: CARD_COLORS[i], color: i === 2 ? "var(--ink)" : "var(--white)" }}
            >
              <span className="num">0{i + 1}</span>
              <h4>{label}</h4>
              <p>scroll-snap-align: center</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
