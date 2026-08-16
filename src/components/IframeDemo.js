import React from "react";
import ScrollGuard from "./ScrollGuard";

// Wraps a technique's generated standalone doc (same source as the Builder's
// export) in a fixed-size box, so the scroll-driven effect is visible as a
// contained "before/after" while scrolling instead of taking over the page.
//
// The box is a ScrollGuard: the frame does not take the wheel until the reader
// clicks it, and hands it back at the end of the demo. Before that, scrolling
// past this chapter just scrolls the page. See ScrollGuard.js.
export default function IframeDemo({
  doc,
  title,
  hint = "Click the frame, then scroll — Escape or click away to carry on down the page.",
}) {
  return (
    <div className="chapter-body" style={{ width: "100%", flexDirection: "column", gap: "0.75rem" }}>
      <ScrollGuard className="demo-frame-box" label="Click to scroll inside" releaseAtEnd>
        <iframe title={title} className="demo-frame" srcDoc={doc} />
      </ScrollGuard>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
