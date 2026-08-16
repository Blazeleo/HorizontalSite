import React, { useRef, useState } from "react";
import ChapterHead from "../components/ChapterMeta";

const CARDS = ["Grab", "Drag", "Release", "Momentum", "Touch", "Mouse"];
const COLORS = ["var(--cream)", "var(--pink)", "var(--cyan)", "var(--yellow)", "var(--blue-deep)", "var(--pink-dark)"];

export default function DragRow({ tech, total }) {
  const railRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const state = useRef({ startX: 0, startScroll: 0, lastX: 0, lastT: 0, vx: 0 });

  const onPointerDown = (e) => {
    const el = railRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    state.current.startX = e.clientX;
    state.current.startScroll = el.scrollLeft;
    state.current.lastX = e.clientX;
    state.current.lastT = performance.now();
    state.current.vx = 0;
  };

  const onPointerMove = (e) => {
    const el = railRef.current;
    if (!el || !dragging) return;
    const dx = e.clientX - state.current.startX;
    el.scrollLeft = state.current.startScroll - dx;

    const now = performance.now();
    const dt = now - state.current.lastT;
    if (dt > 0) {
      state.current.vx = (e.clientX - state.current.lastX) / dt;
      state.current.lastX = e.clientX;
      state.current.lastT = now;
    }
  };

  const onPointerUp = (e) => {
    const el = railRef.current;
    setDragging(false);
    if (!el) return;
    el.releasePointerCapture(e.pointerId);

    let v = state.current.vx;
    const step = () => {
      if (Math.abs(v) < 0.02) return;
      el.scrollLeft -= v * 16;
      v *= 0.94;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <section id={tech.id} className="section bg-blue">
      <ChapterHead tech={tech} total={total} />
      <div className="chapter-body">
        <div
          ref={railRef}
          className={`drag-row hide-scrollbar${dragging ? " dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={(e) => dragging && onPointerUp(e)}
        >
          {CARDS.map((label, i) => (
            <div key={label} className="demo-card" style={{ background: COLORS[i], color: i === 0 || i === 3 ? "var(--ink)" : "var(--white)" }}>
              <span className="num">0{i + 1}</span>
              <h4>{label}</h4>
              <p>pointer-driven scrollLeft</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
