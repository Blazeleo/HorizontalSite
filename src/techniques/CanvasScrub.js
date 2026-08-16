import React from "react";
import ChapterHead from "../components/ChapterMeta";
import IframeDemo from "../components/IframeDemo";
import { generate, buildDocument } from "../builder/templates";
import palettes from "../builder/palettes";

const doc = buildDocument(
  generate("canvas", { palette: palettes.motion, speed: 5 }),
  "Canvas Frame-Scrub — mot/on scroll"
);

export default function CanvasScrub({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-cream">
      <ChapterHead tech={tech} total={total} />
      <IframeDemo doc={doc} title="Canvas frame-scrub demo" />
    </section>
  );
}
