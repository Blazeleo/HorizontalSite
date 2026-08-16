import React from "react";
import ChapterHead from "../components/ChapterMeta";
import IframeDemo from "../components/IframeDemo";
import { generate, buildDocument } from "../builder/templates";
import palettes from "../builder/palettes";

const ITEMS = ["View()", "Timeline", "Range", "Compositor", "No JS"];

const doc = buildDocument(
  generate("scroll-driven-css", { items: ITEMS, palette: palettes.motion, speed: 5 }),
  "CSS Scroll-Driven Animation — mot/on scroll"
);

export default function ScrollDrivenCss({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-blue">
      <ChapterHead tech={tech} total={total} />
      <IframeDemo doc={doc} title="CSS scroll-driven animation demo" />
    </section>
  );
}
