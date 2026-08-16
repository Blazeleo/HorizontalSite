import React from "react";
import { Parallax } from "react-scroll-parallax";
import ChapterHead from "../components/ChapterMeta";

const LAYERS = [
  { label: "Back", key: "back", x: ["-30px", "30px"], color: "rgba(255,255,255,0.12)" },
  { label: "Mid", key: "mid", x: ["-90px", "90px"], color: "var(--pink)" },
  { label: "Front", key: "front", x: ["-170px", "170px"], color: "var(--cyan)" },
];

export default function ParallaxDrift({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-blue">
      <ChapterHead tech={tech} total={total} />
      <div className="chapter-body" style={{ width: "100%" }}>
        <div className="parallax-stage">
          {LAYERS.map((l) => (
            <Parallax
              key={l.label}
              translateX={l.x}
              easing="easeInOut"
              className="parallax-layer"
              data-layer={l.key}
            >
              <div
                className="demo-card"
                style={{ background: l.color, color: l.label === "Back" ? "var(--white)" : "var(--ink)" }}
              >
                <h4>{l.label}</h4>
                <p>translateX {l.x.join(" → ")}</p>
              </div>
            </Parallax>
          ))}
        </div>
      </div>
    </section>
  );
}
