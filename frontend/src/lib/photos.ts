/**
 * Curated discovery imagery. Seeded picsum.photos URLs are deterministic (same seed →
 * same photo) and free; MediaCard falls back to generated gradient art if a photo fails.
 */
export function photoUrl(seed: string, width = 800, height = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

const PALETTES = [
  ["#ff2d8a", "#3b1d64", "#0b0b0b"],
  ["#d6ff00", "#1f5a3a", "#0b0b0b"],
  ["#2f7cff", "#0b2f4f", "#050914"],
  ["#ff8a3d", "#7a1f3f", "#1c0f12"],
  ["#9ad1ff", "#1e1b4b", "#0b0b0b"],
  ["#f6b26b", "#3b1f0e", "#0b0b0b"],
];

/** Deterministic gradient art for a seed — used as the fallback (and for abstract covers). */
export function artFor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const [a, b, c] = PALETTES[hash % PALETTES.length];
  const x = 20 + (hash % 60);
  const y = 15 + ((hash >> 3) % 60);
  return `radial-gradient(90% 80% at ${x}% ${y}%, ${a} 0%, transparent 55%), radial-gradient(90% 90% at ${100 - x}% ${100 - y}%, ${b} 0%, transparent 60%), linear-gradient(180deg, ${b}33 0%, ${c} 100%)`;
}
