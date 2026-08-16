import React from "react";
import ChapterHead from "../components/ChapterMeta";
import IframeDemo from "../components/IframeDemo";
import { generate, buildDocument } from "../builder/templates";
import palettes from "../builder/palettes";

const doc = buildDocument(
  generate("svg-path", { palette: palettes.motion }),
  "SVG Motion-Path Follower — mot/on scroll"
);

export default function SvgPath({ tech, total }) {
  return (
    <section id={tech.id} className="section bg-blue">
      <ChapterHead tech={tech} total={total} />
      <IframeDemo doc={doc} title="SVG motion-path demo" />
    </section>
  );
}
