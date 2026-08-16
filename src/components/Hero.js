import React from "react";
import styled from "styled-components";

const Head = styled.h1`
  font-size: clamp(3.2rem, 12vw, 9.5rem);
  color: var(--white);
`;

const Sub = styled.p`
  max-width: 620px;
  font-size: clamp(1rem, 1.6vw, 1.2rem);
  margin-top: 1.5rem;
  opacity: 0.92;
`;

const Cue = styled.div`
  position: absolute;
  bottom: 34px;
  left: var(--pad);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::after {
    content: "↓";
    animation: bob 1.8s ease-in-out infinite;
  }

  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
  }
`;

export default function Hero({ count, onStart }) {
  return (
    <section id="top" className="section bg-blue" style={{ justifyContent: "center" }}>
      <div className="doodle" style={{ width: 120, height: 120, top: "18%", right: "8%", borderRadius: "50%", transform: "rotate(12deg)" }} />
      <div className="doodle" style={{ width: 70, height: 70, bottom: "22%", left: "6%", transform: "rotate(20deg)" }} />
      <div className="doodle" style={{ width: 40, height: 40, top: "62%", right: "22%", borderRadius: "50%" }} />

      <div className="kicker" style={{ position: "relative", zIndex: 2 }}>mot/on scroll — a field guide, {count} techniques deep</div>
      <Head style={{ position: "relative", zIndex: 2 }}>
        EVERY WAY
        <br />
        TO GO SIDEWAYS
      </Head>
      <Sub style={{ position: "relative", zIndex: 2 }}>
        A working museum of horizontal scroll — from a single CSS property to a
        pinned WebGL scene. Every chapter below is a real, live implementation
        of one technique: how it's built, what it costs, and where you'd
        actually reach for it. Keep scrolling down — vertically — to unlock
        the sideways motion inside each one.
      </Sub>
      <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap", marginTop: "2rem", position: "relative", zIndex: 2 }}>
        <button className="pill-btn pink" onClick={onStart}>
          Start Scrolling ↓
        </button>
        <button
          className="pill-btn cyan"
          onClick={() => document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" })}
        >
          Build Your Own →
        </button>
      </div>

      <Cue>Scroll to begin</Cue>
    </section>
  );
}
