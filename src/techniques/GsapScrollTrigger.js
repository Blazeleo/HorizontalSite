import React from "react";
import ChapterHead from "../components/ChapterMeta";
import IframeDemo from "../components/IframeDemo";
import { generate, buildDocument } from "../builder/templates";
import palettes from "../builder/palettes";

const ITEMS = ["gsap.to()", "ScrollTrigger", "scrub: 0.6", "pin: true", "ease: none", "timeline()"];

const doc = buildDocument(
  generate("gsap", { items: ITEMS, palette: palettes.motion, speed: 5 }),
  "GSAP ScrollTrigger Pin — mot/on scroll"
);

export default function GsapScrollTrigger({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-cream">
      <ChapterHead tech={tech} total={total} />
      <IframeDemo doc={doc} title="GSAP ScrollTrigger pin demo" />
    </section>
  );
}
