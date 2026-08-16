import React from "react";

function ComplexityDots({ value }) {
  return (
    <span className="dots" aria-label={`complexity ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`dot${i <= value ? " on" : ""}`} />
      ))}
    </span>
  );
}

export function Kicker({ n, total, kicker }) {
  return (
    <div className="kicker">
      Technique {n} / {total} — {kicker}
    </div>
  );
}

// design.md §4 and CHAMELEON.md §4.4 both call for 2px-stroke outline icons and
// name emoji glyphs as the thing never to ship: they render as a different
// typeface on every OS, they carry their own colour into a two-colour palette,
// and they don't scale with the type around them. These are the same four
// concepts drawn to the site's own line weight, sized in em so they track the
// pill's font-size, and currentColor so they invert with it.
const ICONS = {
  perf: <polyline points="13 2 4 14 11 14 10 22 20 9 12 9 13 2" />,
  support: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19" />
      <path d="M12 2.5c2.7 3 4 6.2 4 9.5s-1.3 6.5-4 9.5c-2.7-3-4-6.2-4-9.5s1.3-6.5 4-9.5z" />
    </>
  ),
  bundle: (
    <>
      <path d="M12 2.5 21.5 7v10L12 21.5 2.5 17V7L12 2.5z" />
      <path d="M2.5 7 12 11.8 21.5 7" />
      <path d="M12 11.8v9.7" />
    </>
  ),
  useCase: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
};

function MetricIcon({ name }) {
  return (
    <svg
      className="metric-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

export function MetricsRow({ metrics }) {
  return (
    <div className="chapter-footer">
      <span className="metric"><ComplexityDots value={metrics.complexity} />&nbsp;Complexity</span>
      <span className="metric"><MetricIcon name="perf" /> <b>{metrics.perf}</b></span>
      <span className="metric"><MetricIcon name="support" /> {metrics.support}</span>
      <span className="metric"><MetricIcon name="bundle" /> {metrics.bundle}</span>
      <span className="metric"><MetricIcon name="useCase" /> {metrics.useCase}</span>
    </div>
  );
}

export function Snippet({ code }) {
  return <pre className="snippet-card">{code}</pre>;
}

export default function ChapterHead({ tech, total }) {
  return (
    <div className="chapter-head">
      <Kicker n={tech.n} total={total} kicker={tech.kicker} />
      <h2 className="chapter-title">{tech.title}</h2>
      <p className="chapter-desc">{tech.desc}</p>
      <MetricsRow metrics={tech.metrics} />
    </div>
  );
}
