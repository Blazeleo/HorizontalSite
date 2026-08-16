import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Bar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--pink);
  z-index: 100;
  transform-origin: left;
  transition: width 0.05s linear;
`;

const Logo = styled.a`
  position: fixed;
  top: 22px;
  left: var(--pad);
  z-index: 100;
  font-family: var(--display);
  font-size: 1.1rem;
  color: var(--white);
  text-decoration: none;
  letter-spacing: -0.02em;
  mix-blend-mode: difference;
`;

const Rail = styled.nav`
  position: fixed;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  mix-blend-mode: difference;

  @media (max-width: 720px) {
    display: none;
  }
`;

const MobileJump = styled.select`
  display: none;
  position: fixed;
  top: 16px;
  right: var(--pad);
  z-index: 100;
  max-width: 42vw;
  appearance: none;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.25);
  color: var(--white);
  border-radius: 999px;
  padding: 0.4em 1.8em 0.4em 0.9em;
  font-family: var(--sans);
  font-weight: 500;
  font-size: 0.72rem;
  mix-blend-mode: difference;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='white' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.8em center;

  @media (max-width: 720px) {
    display: block;
  }
`;

const RailDot = styled.button`
  appearance: none;
  border: none;
  background: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  &::before {
    content: "";
    width: ${(p) => (p.$active ? "18px" : "7px")};
    height: 7px;
    border-radius: 999px;
    background: var(--white);
    opacity: ${(p) => (p.$active ? 1 : 0.4)};
    transition: width 0.25s ease, opacity 0.25s ease;
  }
`;

export default function Nav({ chapters }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = chapters
      .map((c) => document.getElementById(c.id))
      .filter(Boolean);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = els.indexOf(entry.target);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [chapters]);

  return (
    <>
      <Bar style={{ width: `${progress * 100}%` }} />
      <Logo href="#top">mot/on scroll</Logo>
      <MobileJump
        aria-label="Jump to chapter"
        value={active}
        onChange={(e) => {
          const chapter = chapters[Number(e.target.value)];
          document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        {chapters.map((c, i) => (
          <option key={c.id} value={i}>
            {c.label}
          </option>
        ))}
      </MobileJump>
      <Rail aria-label="Chapter navigation">
        {chapters.map((c, i) => (
          <RailDot
            key={c.id}
            $active={i === active}
            title={c.label}
            aria-label={c.label}
            onClick={() =>
              document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth" })
            }
          />
        ))}
      </Rail>
    </>
  );
}
