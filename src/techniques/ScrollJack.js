import React from "react";
import ChapterHead from "../components/ChapterMeta";
import IframeDemo from "../components/IframeDemo";
import { generate, buildDocument } from "../builder/templates";
import palettes from "../builder/palettes";

const ITEMS = ["Sticky", "Runway", "getBoundingClientRect", "requestAnimationFrame", "translateX"];

const doc = buildDocument(
  generate("scroll-jack", { items: ITEMS, palette: palettes.motion, speed: 5 }),
  "Sticky-Pin Scroll-Jack — mot/on scroll"
);

export default function ScrollJack({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-cream">
      <ChapterHead tech={tech} total={total} />
      <IframeDemo doc={doc} title="Sticky-pin scroll-jack demo" />
    </section>
  );
}
