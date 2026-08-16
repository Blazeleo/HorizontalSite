import React, { useCallback, useEffect, useRef, useState } from "react";

// Scrolling down the page used to stop dead the moment the pointer crossed a
// demo. Six of the eleven chapters put a full-width iframe in the reader's
// path, and an iframe with its own overflow swallows the wheel: measured on
// chapter 03, one wheel-down over the frame left the page at 2182 and moved
// the demo from 0 to 300. Nobody asked for that — they were reading past it.
//
// So capture is earned rather than assumed, the same rule the Gallery's frame
// follows. Until the reader deliberately engages, a veil sits over the demo;
// it has no scrollable overflow of its own, so the wheel walks straight past
// it to the document and the page scrolls the way it does everywhere else.
// Click (or focus and press Enter) and the demo takes the wheel.
//
// Getting back out matters as much as getting in, so there are four ways and
// the reader does not have to know any of them: Escape, clicking away,
// scrolling the demo off screen, and — for the iframe demos — reaching the
// bottom of the demo's own scroll, which is the natural "done" moment and the
// same courtesy public/valorant/js/smooth-scroll.js extends at its edges.
const VISIBLE_ENOUGH = 0.35;

export default function ScrollGuard({
  className = "",
  children,
  label = "Click to scroll inside",
  releaseAtEnd = false,
}) {
  const boxRef = useRef(null);
  const [engaged, setEngaged] = useState(false);

  const release = useCallback(() => setEngaged(false), []);

  // Escape, and any pointer press outside the box. Both are bound only while
  // engaged — there is nothing to listen for otherwise, and eleven chapters'
  // worth of idle document listeners is worth avoiding.
  useEffect(() => {
    if (!engaged) return;
    const onKey = (e) => {
      if (e.key === "Escape") release();
    };
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) release();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [engaged, release]);

  // Scrolled away from — the demo has no business holding the wheel once it
  // is mostly off screen, and this is the case the reader never thinks about
  // because they have already moved on.
  useEffect(() => {
    if (!engaged) return;
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio < VISIBLE_ENOUGH) release();
        }
      },
      { threshold: [0, VISIBLE_ENOUGH, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [engaged, release]);

  // Reached the end of the demo's own scroll. The frames hold generated
  // same-origin documents (srcDoc inherits this origin), so their scroll
  // position is readable. Releasing here is what stops the reader from having
  // to notice they are stuck: they scroll, the demo plays out, the page picks
  // up again. Only fires once they have actually moved — engaging while
  // already at the top would otherwise release immediately.
  useEffect(() => {
    if (!engaged || !releaseAtEnd) return;
    const frame = boxRef.current && boxRef.current.querySelector("iframe");
    const win = frame && frame.contentWindow;
    const doc = frame && frame.contentDocument;
    if (!win || !doc) return;

    const start = win.scrollY;
    const onScroll = () => {
      const max = doc.documentElement.scrollHeight - win.innerHeight;
      if (win.scrollY === start) return;
      if (win.scrollY >= max - 2 || win.scrollY <= 2) release();
    };
    win.addEventListener("scroll", onScroll, { passive: true });
    return () => win.removeEventListener("scroll", onScroll);
  }, [engaged, releaseAtEnd, release]);

  return (
    <div className={`${className} scroll-guard${engaged ? " is-engaged" : ""}`.trim()} ref={boxRef}>
      {children}
      <button
        type="button"
        className="scroll-guard-veil"
        onClick={() => setEngaged(true)}
        tabIndex={engaged ? -1 : 0}
        aria-hidden={engaged}
      >
        <span className="scroll-guard-label">{label}</span>
      </button>
    </div>
  );
}
