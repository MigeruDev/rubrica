import { useId } from 'react';

/*
 * Hand-drawn ink illustrations for Rúbrica.
 * Every line is `currentColor` (the ink), fills come from the paper tokens and
 * the only accent is `var(--seal)`, kept for a small stamp mark.
 */

/* ---------- tiny "pencil" path helpers ---------- */

const f = (n) => Math.round(n * 10) / 10;

// Quadratic segment to (x2,y2) whose control point sits `k` units off the
// straight chord: a straight line with a faint hand wobble.
function wob(x1, y1, x2, y2, k) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 - (dy / len) * k;
  const cy = (y1 + y2) / 2 + (dx / len) * k;
  return `Q${f(cx)},${f(cy)} ${f(x2)},${f(y2)}`;
}

// Polyline through `pts`; segment i wobbles by ks[i % ks.length].
function sketch(pts, ks, closed = false) {
  const n = closed ? pts.length : pts.length - 1;
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    d += ` ${wob(x1, y1, x2, y2, ks[i % ks.length])}`;
  }
  return closed ? `${d} Z` : d;
}

const JITTER = [0.9, 1.15, 0.85, 1.1, 1, 0.8, 1.2, 0.95, 1.05];

// Loose ellipse drawn in one stroke. `turns` > 1 overlaps the start the way a
// pen does; `drift` lets the radius grow or shrink along the way.
function loop(cx, cy, rx, ry, start, turns = 1.04, n = 8, drift = 0) {
  const step = (360 * turns) / n;
  const base = -2 * ((rx + ry) / 2) * (1 - Math.cos((step * Math.PI) / 360));
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const a = ((start + step * i) * Math.PI) / 180;
    const g = 1 + (drift * i) / n;
    pts.push([cx + rx * g * Math.cos(a), cy + ry * g * Math.sin(a)]);
  }
  return sketch(pts, JITTER.map((j) => base * j));
}

/* ---------- shared sketched parts ---------- */

const CUBE_KS = [1, -1, 1.2, -0.8, 1, -1.1];
const ICON_KS = [0.5, -0.5, 0.6, -0.4, 0.5, -0.5];

// Isometric block: hexagon silhouette, lighter top face, inner "Y" edges.
// `cx,cy` is the front-bottom vertex, `L` the edge length.
function Cube({ cx, cy, L = 38, ks = CUBE_KS, sw = 2.5, hatch = false, ghost = false, children }) {
  const a = 0.866 * L;
  const h = 0.5 * L;
  const F = [cx, cy];
  const LB = [cx - a, cy - h];
  const RB = [cx + a, cy - h];
  const LT = [cx - a, cy - h - L];
  const RT = [cx + a, cy - h - L];
  const BT = [cx, cy - 2 * L];
  const FT = [cx, cy - L];
  const body = sketch([LB, F, RB, RT, BT, LT], ks, true);
  const top = sketch([LT, FT, RT, BT], [ks[0], ks[1], ks[3], ks[4]], true);
  const shade = [0.25, 0.5, 0.75]
    .map((u, i) => `M${f(cx - a * u)},${f(cy - h * u - 3)} l${[0.4, -0.3, 0.5][i]},${f(-L * [0.62, 0.56, 0.66][i])}`)
    .join(' ');
  return (
    <g>
      <path d={body} fill="var(--paper-2)" stroke="none" />
      <path d={top} fill="var(--paper)" stroke="none" />
      <path d={body} strokeWidth={sw} />
      <path d={sketch([LT, FT, RT], [ks[0], ks[1]])} />
      <path d={sketch([FT, F], [ks[2]])} />
      {hatch && <path d={shade} strokeWidth={1.2} opacity={0.45} />}
      {ghost && <path d={body} transform="translate(1.3 1)" strokeWidth={1.3} opacity={0.5} />}
      {children}
    </g>
  );
}

// Two interlocked links laid along the isometric up-right axis.
function ChainLink({ x, y }) {
  const x2 = x + 19;
  const y2 = y - 11;
  return (
    <g>
      <path d={loop(x, y, 12, 6, -40)} transform={`rotate(-30 ${x} ${y})`} />
      <path d={loop(x2, y2, 12, 3.5, 140)} transform={`rotate(-30 ${x2} ${y2})`} />
    </g>
  );
}

/* ---------- hero scene ---------- */

const PAPER_D = sketch([[170, 118], [265, 173], [135, 248], [40, 193]], [1.6, -1.4, 1.5, -1.2], true);
const PAPER_EDGE = sketch([[40, 197], [135, 252], [265, 177]], [-1.2, 1.5]);
const PAPER_LINES = [
  [[158.8, 139.5], [206.4, 167]],
  [[141.4, 149.5], [210.7, 189.5]],
  [[125.8, 158.5], [189, 195]],
  [[110.3, 167.5], [177, 206]],
  [[94.7, 176.5], [133.7, 199]],
].map((seg, i) => sketch(seg, [i % 2 ? -0.9 : 1.1])).join(' ');
const HASH = [
  [[306, 164], [301, 188]],
  [[319, 164], [314, 188]],
  [[297, 172], [324, 171]],
  [[295, 181], [322, 180]],
].map((seg, i) => sketch(seg, [i % 2 ? -0.6 : 0.7])).join(' ');
const ARROW = `${sketch([[276, 216], [310, 210], [344, 211]], [1.6, -1.3])} ${sketch([[334, 201], [346, 211], [335, 221]], [0.6, -0.6])}`;

export function HeroIllustration({ className }) {
  const titleId = useId();
  return (
    <svg className={className} viewBox="30 106 545 188" width="100%" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Un documento se hashea en el navegador y queda trazado en la cadena</title>
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {/* (a) the certificate: isometric sheet, scribbled lines, a small seal */}
        <path d={PAPER_EDGE} />
        <path d={PAPER_D} fill="var(--paper-2)" strokeWidth={2.5} />
        <path d={PAPER_D} transform="translate(1.3 1)" strokeWidth={1.3} opacity={0.5} />
        <path d={PAPER_LINES} />
        <g stroke="var(--seal)">
          <path d={loop(135, 223, 16, 9, -30)} />
          <path d={loop(135, 223, 10, 5.5, 20, 1.03)} strokeWidth={1.3} opacity={0.8} />
        </g>
        {/* (b) hashed in the browser: keccak glyph over a hand-drawn arrow */}
        <path d={HASH} />
        <path d={ARROW} strokeWidth={2.5} />
        <path d={ARROW} transform="translate(1 1.2)" strokeWidth={1.3} opacity={0.5} />
        {/* (c) the chain: three linked blocks, the last one ticked */}
        <Cube cx={384} cy={282} hatch />
        <ChainLink x={410} y={210} />
        <Cube cx={456} cy={240} hatch ks={[-0.9, 1.1, -1, 0.9, -1.2, 1]} />
        <ChainLink x={482} y={168} />
        <Cube cx={529} cy={198} hatch ghost ks={[1.1, -0.8, 0.9, -1.1, 1, -0.9]}>
          <path d={sketch([[537, 176], [543, 179], [555, 155]], [0.5, -0.8])} strokeWidth={3} />
        </Cube>
      </g>
    </svg>
  );
}

/* ---------- step icons ---------- */

const ICON_SHEET = sketch([[12, 5], [29, 5], [37, 13], [37, 43], [12, 43]], [0.6, -0.5, 0.7, -0.6, 0.5], true);
const ICON_FOLD = sketch([[29, 5], [29, 13], [37, 13]], [0.4, -0.4]);
const ICON_HASH = [
  [[22, 19], [20, 36]],
  [[29.5, 19], [27.5, 36]],
  [[16, 25.5], [33, 25]],
  [[15, 31], [32, 30.5]],
].map((seg, i) => sketch(seg, [i % 2 ? -0.4 : 0.5])).join(' ');

export function StepIcon({ kind, size = 48 }) {
  let art = null;
  if (kind === 'hash') {
    art = (
      <>
        <path d={ICON_SHEET} fill="var(--paper-2)" strokeWidth={2.5} />
        <path d={ICON_FOLD} />
        <path d={ICON_HASH} />
      </>
    );
  } else if (kind === 'chain') {
    art = (
      <>
        <Cube cx={14} cy={41} L={11} ks={ICON_KS} sw={2} />
        <Cube cx={34} cy={29} L={11} ks={ICON_KS} sw={2} />
        <path d={loop(24, 18.5, 6, 3, -40)} transform="rotate(-30 24 18.5)" />
      </>
    );
  } else if (kind === 'stamp') {
    art = (
      <>
        <path d={loop(24, 24, 18, 18, -80, 1.04)} strokeWidth={2.5} />
        <path d={loop(24, 24, 13, 13, 40, 1.02)} strokeWidth={1.2} opacity={0.6} />
        <path d={sketch([[15, 25], [21, 31], [33, 17]], [0.6, -0.8])} strokeWidth={2.5} />
      </>
    );
  }
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 48 48">
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {art}
      </g>
    </svg>
  );
}

/* ---------- circled text ---------- */

const SCRIBBLE_A = loop(50, 50, 44, 41, -100, 1.08, 9, 0.03);
const SCRIBBLE_B = loop(50, 51, 45, 40, -70, 1.04, 9, -0.03);

export function CircleScribble({ children, className }) {
  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', padding: '0.4em 1.1em' }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
      >
        <g fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d={SCRIBBLE_A} vectorEffect="non-scaling-stroke" />
          <path d={SCRIBBLE_B} vectorEffect="non-scaling-stroke" opacity={0.55} />
        </g>
      </svg>
      <span style={{ position: 'relative' }}>{children}</span>
    </span>
  );
}
