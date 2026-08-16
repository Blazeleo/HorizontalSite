import "./theme.css";
import "./techniques/techniques.css";
import React from "react";

import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Outro from "./components/Outro";
import techniques from "./data/techniques";

import ScrollSnap from "./techniques/ScrollSnap";
import DragRow from "./techniques/DragRow";
import ScrollJack from "./techniques/ScrollJack";
import ScrollDrivenCss from "./techniques/ScrollDrivenCss";
import GsapScrollTrigger from "./techniques/GsapScrollTrigger";
import ParallaxDrift from "./techniques/ParallaxDrift";
import ReactScrollHorizontalDemo from "./techniques/ReactScrollHorizontalDemo";
import Marquee from "./techniques/Marquee";
import CanvasScrub from "./techniques/CanvasScrub";
import SvgPath from "./techniques/SvgPath";
import ThreeScene from "./techniques/ThreeScene";
import Builder from "./builder/Builder";
import Gallery from "./gallery/Gallery";

const COMPONENTS = {
  "scroll-snap": ScrollSnap,
  "drag-row": DragRow,
  "scroll-jack": ScrollJack,
  "scroll-driven-css": ScrollDrivenCss,
  gsap: GsapScrollTrigger,
  parallax: ParallaxDrift,
  "scroll-horizontal-lib": ReactScrollHorizontalDemo,
  marquee: Marquee,
  canvas: CanvasScrub,
  "svg-path": SvgPath,
  three: ThreeScene,
};

export default function App() {
  const total = techniques.length;

  const chapters = [
    { id: "top", label: "Intro" },
    ...techniques.map((t) => ({ id: t.id, label: t.title })),
    { id: "builder", label: "Build Your Own" },
    { id: "gallery", label: "The Gallery" },
    { id: "outro", label: "Outro" },
  ];

  return (
    <div className="App">
      <Nav chapters={chapters} />
      <Hero
        count={total}
        onStart={() =>
          document.getElementById(techniques[0].id)?.scrollIntoView({ behavior: "smooth" })
        }
      />
      {techniques.map((tech) => {
        const Demo = COMPONENTS[tech.id];
        return <Demo key={tech.id} tech={tech} total={total} />;
      })}
      <Builder />
      <Gallery />
      <Outro />
    </div>
  );
}
