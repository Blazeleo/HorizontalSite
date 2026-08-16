import React from "react";
import ChapterHead from "../components/ChapterMeta";

const WORDS = ["MARQUEE", "TICKER", "LOOP", "SEAMLESS", "INFINITE", "CSS ONLY"];

export default function Marquee({ tech, total }) {
  const row = [...WORDS, ...WORDS];
  return (
    <section id={tech.id} className="section bg-blue">
      <ChapterHead tech={tech} total={total} />
      <div className="chapter-body" style={{ width: "100%" }}>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {row.map((w, i) => (
              <span key={i}>{w} ✦</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
