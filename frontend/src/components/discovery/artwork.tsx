import type { ReactNode } from "react";

/**
 * Locally rendered discovery artwork. Every card in Explore / catalogs / studios is a
 * deterministic SVG composition (seed → same picture) in one of a few visual themes, so
 * discovery imagery ships with the app, needs no third-party host and never contradicts
 * its caption the way random stock photos did. Real generations are shown only where we
 * have them (see `public/showcase`).
 */
export type ArtTheme = "cinematic" | "editorial" | "effects" | "advertising" | "character" | "tools" | "scenic" | "audio";

export const ART_THEMES: ArtTheme[] = ["cinematic", "editorial", "effects", "advertising", "character", "tools", "scenic", "audio"];

/** mulberry32: tiny seeded PRNG so a seed always draws the same scene. */
function rng(seed: string) {
  let a = 0;
  for (const ch of seed) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) + 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, items: readonly T[]): T => items[Math.floor(r() * items.length)];
/** One decimal is plenty for an 800×600 canvas, and rounding keeps SSR and client markup byte-identical
 * (Math.sin/cos can differ in the last bits between Node's and the browser's engine). */
const round1 = (n: number) => Math.round(n * 10) / 10;
const between = (r: () => number, lo: number, hi: number) => round1(lo + r() * (hi - lo));

/** Theme inferred from a seed's prefix when the caller doesn't pass one. */
export function themeForSeed(seed: string): ArtTheme {
  const s = seed.toLowerCase();
  if (/effect|fx|glitch|storm|burst|viral|genjutsu|jutsu/.test(s)) return "effects";
  if (/fashion|editorial|poster|portrait|moodboard|influencer|photodump/.test(s)) return "editorial";
  if (/ad|mk-|market|product|brand|ugc|unbox|commercial|click/.test(s)) return "advertising";
  if (/character|face|swap|avatar|persona|klein|edit|relight|inpaint/.test(s)) return "character";
  if (/tool|canvas|mcp|cli|chatgpt|supercomputer|studio|integration|academy|upscale|reframe|explainer|shorts|mixed/.test(s)) return "tools";
  if (/audio|voice|speech|tts|melo|aura|gemini|translate|sound|track/.test(s)) return "audio";
  if (/glacier|desert|mountain|ocean|sky|pond|boat|scenic|landscape|drone|flyover|aerial|forest/.test(s)) return "scenic";
  return "cinematic";
}

const PALETTES: Record<ArtTheme, { bg: [string, string]; a: string; b: string; hi: string }[]> = {
  cinematic: [
    { bg: ["#0b1020", "#1d0d08"], a: "#1f7a8c", b: "#ff7a2f", hi: "#ffd9a0" },
    { bg: ["#0a0a12", "#2a0f1e"], a: "#4b2a8a", b: "#ff2d8a", hi: "#ffc2dd" },
    { bg: ["#08111a", "#0b2a2a"], a: "#0fa3b1", b: "#f5b323", hi: "#fff2c6" },
  ],
  editorial: [
    { bg: ["#ecebe6", "#d9d5cc"], a: "#1a1a1a", b: "#ff2d8a", hi: "#ffffff" },
    { bg: ["#141414", "#232323"], a: "#f0ede6", b: "#d6ff00", hi: "#ffffff" },
    { bg: ["#e7dcd0", "#c9b8a6"], a: "#2b2320", b: "#c0392b", hi: "#fff8f0" },
  ],
  effects: [
    { bg: ["#05060f", "#12042a"], a: "#ff2d8a", b: "#00e5ff", hi: "#d6ff00" },
    { bg: ["#070a08", "#0c2a14"], a: "#d6ff00", b: "#00ffa3", hi: "#ffffff" },
    { bg: ["#0a0510", "#2a0a2a"], a: "#ff6a00", b: "#ff2d8a", hi: "#ffe14d" },
  ],
  advertising: [
    { bg: ["#f4f1ea", "#dcd6c9"], a: "#111111", b: "#d6ff00", hi: "#ffffff" },
    { bg: ["#101010", "#1c1c1c"], a: "#f2f2f2", b: "#ff2d8a", hi: "#ffffff" },
    { bg: ["#0d1b2a", "#1b2f4a"], a: "#e0e6ee", b: "#f5b323", hi: "#ffffff" },
  ],
  character: [
    { bg: ["#1a1030", "#0b0716"], a: "#8a5cff", b: "#ff2d8a", hi: "#ffd6f0" },
    { bg: ["#0d1b2a", "#071019"], a: "#2f7cff", b: "#d6ff00", hi: "#e8ffb0" },
    { bg: ["#1c0f12", "#0b0608"], a: "#ff8a3d", b: "#ffd166", hi: "#fff0d6" },
  ],
  tools: [
    { bg: ["#0c0c0c", "#161616"], a: "#d6ff00", b: "#2f7cff", hi: "#ffffff" },
    { bg: ["#0b0f14", "#141a22"], a: "#00e5ff", b: "#d6ff00", hi: "#ffffff" },
  ],
  scenic: [
    { bg: ["#ffb36b", "#2b1a3a"], a: "#5b3a8a", b: "#ff6a3d", hi: "#fff1cf" },
    { bg: ["#bfe7ff", "#1b3a5a"], a: "#2c5c8a", b: "#8fd3ff", hi: "#ffffff" },
    { bg: ["#ffd6a5", "#3a1f2b"], a: "#7a3b5a", b: "#ff8a5b", hi: "#fff7e6" },
    { bg: ["#d7f3ff", "#0f2a3a"], a: "#1e4a66", b: "#9fe0ff", hi: "#ffffff" },
  ],
  audio: [
    { bg: ["#0b0b0b", "#151515"], a: "#d6ff00", b: "#ff2d8a", hi: "#ffffff" },
    { bg: ["#0a0f1a", "#101a2a"], a: "#00e5ff", b: "#8a5cff", hi: "#ffffff" },
  ],
};

interface ArtworkProps {
  seed: string;
  theme?: ArtTheme;
  className?: string;
  /** `cover` crops the 4:3 scene to the frame (cards); `wide` paints an 8:3 canvas with the scene centred,
   * so hero banners keep the whole composition instead of zooming into a strip. */
  fit?: "cover" | "wide";
}

/** Full-bleed SVG art for a card frame (position the parent `relative`). */
export function Artwork({ seed, theme, className, fit = "cover" }: ArtworkProps) {
  const t = theme ?? themeForSeed(seed);
  const r = rng(`${t}:${seed}`);
  const p = pick(r, PALETTES[t]);
  const id = `art-${seed.replace(/[^a-z0-9]/gi, "")}-${t}`;
  const W = 800;
  const H = 600;
  const x0 = fit === "wide" ? -W / 2 : 0;
  const w = fit === "wide" ? W * 2 : W;

  const glows: ReactNode[] = Array.from({ length: 2 }, (_, i) => (
    <ellipse
      key={`g${i}`}
      cx={between(r, 80, W - 80)}
      cy={between(r, 60, H - 60)}
      rx={between(r, 160, 320)}
      ry={between(r, 120, 260)}
      fill={i === 0 ? p.a : p.b}
      opacity={t === "editorial" || t === "advertising" ? 0.28 : 0.45}
      filter={`url(#${id}-blur)`}
    />
  ));

  return (
    <svg
      viewBox={fit === "wide" ? `-400 0 ${W * 2} ${H}` : `0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className ?? "absolute inset-0 h-full w-full"}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={p.bg[0]} />
          <stop offset="1" stopColor={p.bg[1]} />
        </linearGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.5" r={fit === "wide" ? "0.5" : "0.75"}>
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={t === "editorial" || t === "advertising" ? 0.25 : 0.6} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.b} />
          <stop offset="1" stopColor={p.a} />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.hi} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.hi} stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="60" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <rect x={-W / 2} width={W * 2} height={H} fill={`url(#${id}-bg)`} />
      {glows}
      {/* Scenes are plain functions, not components: every PRNG draw happens inside this one render,
          so SSR and (double-invoked dev) client renders produce identical markup. */}
      {t === "cinematic" && Cinematic({ r, p, id, x0, w })}
      {t === "editorial" && Editorial({ r, p, id, x0, w })}
      {t === "effects" && Effects({ r, p, id, x0, w })}
      {t === "advertising" && Advertising({ r, p, id, x0, w })}
      {t === "character" && Character({ r, p, id, x0, w })}
      {t === "tools" && Tools({ r, p, id, x0, w })}
      {t === "scenic" && Scenic({ r, p, id, x0, w })}
      {t === "audio" && Audio({ r, p, id, x0, w })}
      <rect x={-W / 2} width={W * 2} height={H} fill={`url(#${id}-vig)`} />
    </svg>
  );
}

type Palette = (typeof PALETTES)[ArtTheme][number];
interface SceneProps {
  r: () => number;
  p: Palette;
  id: string;
  /** Painted extent: 0..800 for cards, -400..1200 for wide banners. */
  x0: number;
  w: number;
}

/** Head + shoulders silhouette, the recurring "subject" across themes. */
function Bust({ x, y, scale, fill, stroke }: { x: number; y: number; scale: number; fill: string; stroke?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-150 220 C-150 120 -90 80 -40 70 L-40 40 C-70 20 -80 -30 -70 -70 C-55 -125 55 -125 70 -70 C80 -30 70 20 40 40 L40 70 C90 80 150 120 150 220 Z" fill={fill} stroke={stroke} strokeWidth={stroke ? 6 : 0} />
    </g>
  );
}

function Cinematic({ r, p, id, x0, w }: SceneProps) {
  const horizon = between(r, 300, 400);
  const figures = Math.floor(between(r, 1, 3));
  return (
    <g>
      <rect x={x0} y={horizon - 40} width={w} height="80" fill={p.b} opacity="0.35" filter={`url(#${id}-blur)`} />
      <rect x={x0} y={horizon} width={w} height="600" fill="#000" opacity="0.55" />
      {Array.from({ length: Math.round(w / 60) }, (_, i) => (
        <rect key={i} x={x0 + i * 60 + between(r, 0, 20)} y={between(r, 0, horizon)} width="2" height={between(r, 40, 140)} fill={p.hi} opacity={between(r, 0.05, 0.18)} />
      ))}
      {/* Wide banners keep the copy on the left, so subjects sit in the right half. */}
      {Array.from({ length: figures }, (_, i) => (
        <Bust key={i} x={w > 800 ? between(r, 500, 1000) : between(r, 200, 600)} y={horizon - 40} scale={between(r, 0.45, 0.8)} fill="#050505" stroke={p.b} />
      ))}
      <ellipse cx={between(r, 200, 600)} cy={horizon - 10} rx="260" ry="6" fill={p.a} opacity="0.9" filter={`url(#${id}-soft)`} />
      <rect x={x0} y="0" width={w} height="52" fill="#000" />
      <rect x={x0} y="548" width={w} height="52" fill="#000" />
    </g>
  );
}

function Editorial({ r, p, id, x0, w }: SceneProps) {
  const cx = w > 800 ? between(r, 620, 900) : between(r, 220, 580);
  const cy = between(r, 160, 300);
  const dark = p.bg[0].startsWith("#1");
  const ink = dark ? p.a : p.a;
  return (
    <g>
      <circle cx={cx} cy={cy} r={between(r, 120, 200)} fill={p.b} opacity="0.9" />
      <Bust x={cx + between(r, -60, 60)} y={cy + 110} scale={between(r, 0.9, 1.2)} fill={ink} />
      <rect x="28" y="28" width="744" height="544" fill="none" stroke={ink} strokeOpacity="0.5" strokeWidth="2" />
      <rect x={x0} y={between(r, 380, 470)} width={w} height="3" fill={ink} opacity="0.7" />
      <g fill={ink} opacity="0.85" fontFamily="ui-monospace, monospace" fontSize="18" letterSpacing="4">
        <text x="400" y="64" textAnchor="middle">{pick(r, ["FW26", "SS27", "No. 03", "VOL. II", "ISSUE 9"])}</text>
        <text x="400" y="556" textAnchor="middle">{pick(r, ["FORM", "STILL", "EDIT", "LOOK 04", "STUDIO"])}</text>
      </g>
      <rect x={between(r, 500, 640)} y={between(r, 60, 140)} width="120" height="160" fill="none" stroke={p.hi} strokeWidth="3" opacity="0.6" filter={`url(#${id}-soft)`} />
    </g>
  );
}

function Effects({ r, p, id, x0, w }: SceneProps) {
  const cx = between(r, 250, 550);
  const cy = between(r, 200, 400);
  return (
    <g>
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const len = between(r, 220, 520);
        return <line key={i} x1={cx} y1={cy} x2={round1(cx + Math.cos(a) * len)} y2={round1(cy + Math.sin(a) * len)} stroke={i % 3 === 0 ? p.b : p.a} strokeWidth={between(r, 1, 3)} opacity={between(r, 0.15, 0.5)} />;
      })}
      {[180, 120, 60].map((rad, i) => (
        <circle key={rad} cx={cx} cy={cy} r={rad} fill="none" stroke={i === 1 ? p.hi : p.b} strokeWidth={i === 2 ? 10 : 2} opacity={0.5 + i * 0.15} />
      ))}
      <circle cx={cx} cy={cy} r="42" fill={p.hi} filter={`url(#${id}-soft)`} />
      <Bust x={cx + 8} y={cy + 160} scale={0.9} fill="#020204" stroke={p.a} />
      <Bust x={cx - 8} y={cy + 160} scale={0.9} fill="none" stroke={p.b} />
      {Array.from({ length: 22 }, (_, i) => (
        <circle key={`p${i}`} cx={between(r, x0, x0 + w)} cy={between(r, 0, 600)} r={between(r, 1, 4)} fill={pick(r, [p.a, p.b, p.hi])} opacity={between(r, 0.3, 0.9)} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`s${i}`} x={between(r, x0 - 40, x0 + w - 100)} y={between(r, 0, 600)} width={between(r, 120, 320)} height={between(r, 4, 14)} fill={p.b} opacity="0.5" />
      ))}
    </g>
  );
}

function Advertising({ r, p, id, w }: SceneProps) {
  const px = w > 800 ? between(r, 650, 900) : between(r, 300, 500);
  const shape = pick(r, ["bottle", "box", "sphere"] as const);
  return (
    <g>
      <polygon points={`${px - 60},0 ${px + 60},0 ${px + 260},430 ${px - 260},430`} fill={p.hi} opacity="0.22" filter={`url(#${id}-blur)`} />
      <ellipse cx={px} cy="470" rx="230" ry="36" fill="#000" opacity="0.28" filter={`url(#${id}-soft)`} />
      <ellipse cx={px} cy="450" rx="200" ry="30" fill={p.b} opacity="0.95" />
      <rect x={px - 200} y="450" width="400" height="60" fill={p.b} opacity="0.75" />
      <ellipse cx={px} cy="510" rx="200" ry="30" fill={p.b} opacity="0.6" />
      {shape === "bottle" && (
        <g>
          <rect x={px - 55} y="200" width="110" height="250" rx="26" fill={p.a} />
          <rect x={px - 22} y="150" width="44" height="60" rx="8" fill={p.a} />
          <rect x={px - 40} y="290" width="80" height="70" rx="6" fill={p.hi} opacity="0.9" />
          <rect x={px - 45} y="215" width="16" height="200" rx="8" fill={p.hi} opacity="0.35" />
        </g>
      )}
      {shape === "box" && (
        <g>
          <rect x={px - 110} y="230" width="220" height="220" rx="18" fill={p.a} />
          <rect x={px - 110} y="230" width="220" height="70" rx="18" fill={p.hi} opacity="0.25" />
          <circle cx={px} cy="360" r="34" fill={p.b} />
        </g>
      )}
      {shape === "sphere" && (
        <g>
          <circle cx={px} cy="330" r="125" fill={p.a} />
          <ellipse cx={px - 45} cy="280" rx="40" ry="26" fill={p.hi} opacity="0.7" />
        </g>
      )}
      <g fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="22" fill={p.a} opacity="0.85" letterSpacing="3">
        <text x="400" y="72" textAnchor="middle">{pick(r, ["NEW DROP", "SPRING EDIT", "LIMITED", "HERO SHOT", "UGC READY"])}</text>
      </g>
    </g>
  );
}

function Character({ r, p, id, x0, w }: SceneProps) {
  const cx = w > 800 ? between(r, 620, 900) : between(r, 320, 480);
  return (
    <g>
      <circle cx={cx} cy="250" r="190" fill={p.a} opacity="0.55" filter={`url(#${id}-blur)`} />
      <circle cx={cx} cy="250" r="150" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="3" opacity="0.7" />
      <Bust x={cx} y={330} scale={1.35} fill="#08060d" stroke={`url(#${id}-rim)`} />
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={between(r, x0, x0 + w)} cy={between(r, 0, 600)} r={between(r, 1, 3)} fill={p.hi} opacity={between(r, 0.2, 0.7)} />
      ))}
      <rect x={x0} y="0" width={w} height="600" fill={`url(#${id}-fade)`} opacity="0.08" />
    </g>
  );
}

function Tools({ r, p, id, x0, w }: SceneProps) {
  const nodes = Array.from({ length: w > 800 ? 9 : 6 }, () => ({ x: between(r, x0 + 80, x0 + w - 240), y: between(r, 80, 520), w: between(r, 120, 220), h: between(r, 70, 130) }));
  return (
    <g>
      <pattern id={`${id}-grid`} width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M50 0 H0 V50" fill="none" stroke={p.hi} strokeOpacity="0.08" />
      </pattern>
      <rect x={x0} y="0" width={w} height="600" fill={`url(#${id}-grid)`} />
      {nodes.slice(1).map((n, i) => (
        <path key={`e${i}`} d={`M${nodes[i].x + nodes[i].w / 2} ${nodes[i].y + nodes[i].h / 2} C ${nodes[i].x + 200} ${nodes[i].y}, ${n.x - 200} ${n.y + n.h}, ${n.x + n.w / 2} ${n.y + n.h / 2}`} fill="none" stroke={i % 2 ? p.a : p.b} strokeWidth="2.5" opacity="0.8" />
      ))}
      {nodes.map((n, i) => (
        <g key={`n${i}`}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="14" fill="#101010" stroke={p.hi} strokeOpacity="0.25" />
          <rect x={n.x + 12} y={n.y + 12} width={n.w * 0.5} height="10" rx="5" fill={i % 2 ? p.a : p.b} />
          <rect x={n.x + 12} y={n.y + 32} width={n.w - 24} height={n.h - 44} rx="8" fill={p.hi} opacity="0.08" />
        </g>
      ))}
      <path d={`M${between(r, 300, 500)} ${between(r, 200, 400)} l0 34 l9 -8 l7 15 l7 -3 l-7 -15 l12 -1 z`} fill={p.hi} stroke="#000" strokeWidth="2" />
    </g>
  );
}

function Scenic({ r, p, id, x0, w }: SceneProps) {
  const sunX = between(r, 200, 600);
  const layers = 4;
  const steps = w / 100;
  return (
    <g>
      <circle cx={sunX} cy={between(r, 160, 260)} r={between(r, 50, 90)} fill={p.hi} filter={`url(#${id}-soft)`} />
      {Array.from({ length: layers }, (_, i) => {
        const base = 320 + i * 60;
        const pts = Array.from({ length: steps + 1 }, (_, k) => `${x0 + k * 100},${base - between(r, 20, 140 - i * 20)}`).join(" ");
        return <polygon key={i} points={`${x0},600 ${pts} ${x0 + w},600`} fill={i % 2 ? p.a : p.bg[1]} opacity={0.55 + i * 0.15} />;
      })}
      <rect x={x0} y="470" width={w} height="130" fill={p.b} opacity="0.3" filter={`url(#${id}-blur)`} />
      <path d={`M${x0} 430 Q ${x0 + w / 4} ${between(r, 400, 460)} ${x0 + w / 2} 430 T ${x0 + w} 430`} fill="none" stroke={p.hi} strokeWidth="2" opacity="0.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={between(r, x0, x0 + w)} cy={between(r, 20, 200)} r={between(r, 1, 2.5)} fill={p.hi} opacity={between(r, 0.3, 0.8)} />
      ))}
    </g>
  );
}

function Audio({ r, p, id, x0, w }: SceneProps) {
  const bars = Math.round((w - 80) / 15);
  return (
    <g>
      {Array.from({ length: bars }, (_, i) => {
        const h = round1(40 + Math.abs(Math.sin(i * 0.45) * 180) * between(r, 0.6, 1.2));
        return <rect key={i} x={x0 + 40 + i * 15} y={round1(300 - h / 2)} width="8" height={h} rx="4" fill={i % 4 === 0 ? p.b : p.a} opacity={0.6 + (i % 3) * 0.15} />;
      })}
      <rect x={x0 + 40} y="299" width={w - 80} height="2" fill={p.hi} opacity="0.35" />
      <circle cx={between(r, 120, 680)} cy="300" r="90" fill={p.b} opacity="0.3" filter={`url(#${id}-soft)`} />
    </g>
  );
}
