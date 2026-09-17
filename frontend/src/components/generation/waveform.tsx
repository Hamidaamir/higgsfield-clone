import { cn } from "@/lib/utils";

interface WaveformProps {
  /** Any stable string (asset id) so the same clip always draws the same bars. */
  seed: string;
  bars?: number;
  className?: string;
}

/** Decorative deterministic bar pattern that gives audio an intentional visual identity. */
function barHeights(seed: string, bars: number): number[] {
  let state = 0;
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0;
  const heights: number[] = [];
  for (let i = 0; i < bars; i += 1) {
    state = (state * 1103515245 + 12345) >>> 0;
    const noise = (state % 1000) / 1000;
    const envelope = Math.sin((i / (bars - 1)) * Math.PI) * 0.7 + 0.3;
    heights.push(15 + Math.round(80 * noise * envelope));
  }
  return heights;
}

export function Waveform({ seed, bars = 40, className }: WaveformProps) {
  const heights = barHeights(seed, bars);
  return (
    <div className={cn("flex h-full w-full items-center justify-center gap-[3px]", className)} aria-hidden>
      {heights.map((h, i) => (
        <span key={i} className="w-1 rounded-full bg-accent/80" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
