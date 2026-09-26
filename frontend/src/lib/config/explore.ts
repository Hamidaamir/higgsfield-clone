/** Curated discovery content for Explore. Product/catalog content, never user history. */
import type { ShowcaseMedia } from "@/types/showcase";

/** Real generations produced on this stack during the provider smoke tests, shipped locally. */
export const SHOWCASE = {
  fluxLimeJacket: { kind: "image", src: "/showcase/flux-lime-jacket.jpg" },
  ltxPaperBoat: { kind: "video", src: "/showcase/ltx-paper-boat.mp4" },
  auraWelcome: "/showcase/aura-welcome.mp3",
} as const satisfies Record<string, ShowcaseMedia | string>;
