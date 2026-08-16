import React from "react";
import ChapterHead from "../components/ChapterMeta";
import IframeDemo from "../components/IframeDemo";
import { generate, buildDocument } from "../builder/templates";
import palettes from "../builder/palettes";

// A one-off darker variant of the Motion palette for this chapter's
// backdrop — not part of the Builder's palette picker.
const deepPalette = { ...palettes.motion, bg: "#201dbd" };

const doc = buildDocument(
  generate("three", { palette: deepPalette, speed: 5 }),
  "WebGL 3D Scroll Dolly — mot/on scroll"
);

export default function ThreeScene({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-deep">
      <ChapterHead tech={tech} total={total} />
      <IframeDemo doc={doc} title="WebGL 3D scroll dolly demo" />
    </section>
  );
}
