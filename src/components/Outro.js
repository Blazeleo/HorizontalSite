import React from "react";
import styled from "styled-components";

const Band = styled.div`
  background: var(--pink);
  padding: clamp(3rem, 8vw, 6rem) var(--pad);
  text-align: center;
  border-radius: 0 0 50% 50% / 0 0 40px 40px;
`;

const Legend = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  max-width: var(--maxw);
  margin: 2.5rem auto 0;
  text-align: left;
`;

const LegendItem = styled.div`
  font-size: 0.85rem;
  color: var(--footer-blue-text);
  b { display: block; font-family: var(--sans); font-weight: 600; color: var(--blue); margin-bottom: 0.2rem; }
`;

export default function Outro() {
  return (
    <footer id="outro" style={{ background: "var(--white)" }}>
      <Band>
        <h2 className="display" style={{ color: "var(--white)", fontSize: "clamp(2.2rem, 7vw, 5rem)" }}>
          NOW GO BUILD ONE
        </h2>
        <p style={{ color: "var(--white)", maxWidth: 520, margin: "1rem auto 0", opacity: 0.95 }}>
          Every demo on this page is real, inspectable code — open devtools,
          read the source, steal the technique that fits your project.
        </p>
        <button
          className="pill-btn cyan"
          style={{ marginTop: "1.75rem" }}
          onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })}
        >
          Back to the top
        </button>
      </Band>

      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "3rem var(--pad) 4rem" }}>
        <div className="kicker" style={{ color: "var(--footer-blue-text)" }}>Reading the metric pills</div>
        <Legend>
          <LegendItem><b>⚡ Perf</b>Where the animation runs — compositor/GPU is cheapest, main-thread JS costs the most.</LegendItem>
          <LegendItem><b>🌐 Support</b>Real-world browser coverage, so you know what needs a fallback.</LegendItem>
          <LegendItem><b>📦 Bundle</b>What the technique adds to your JS payload, gzipped.</LegendItem>
          <LegendItem><b>🎯 Use case</b>Where this specific technique earns its complexity.</LegendItem>
          <LegendItem><b>●●●○○ Complexity</b>Rough build/maintain effort, 1 (trivial) to 5 (involved).</LegendItem>
        </Legend>
        <p style={{ fontSize: "0.75rem", color: "var(--footer-blue-text)", opacity: 0.7, marginTop: "3rem" }}>
          Built as a horizontal-scroll technique showcase · styled in the
          "Motion for Mobile" visual language · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
