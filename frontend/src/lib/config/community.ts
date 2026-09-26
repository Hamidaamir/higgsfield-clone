/** Curated showcase (product content, not user history). Two entries are real outputs of this stack. */
import type { ArtTheme } from "@/components/discovery/artwork";
import type { ShowcaseMedia } from "@/types/showcase";
import { SHOWCASE } from "@/lib/config/explore";

export interface CommunityPost {
  slug: string;
  title: string;
  kind: "image" | "video";
  model: string;
  prompt: string;
  seed: string;
  theme: ArtTheme;
  /** Shipped real generation; the card says so. */
  media?: ShowcaseMedia;
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  { slug: "lime-jacket", title: "Lime jacket portrait", kind: "image", model: "FLUX.1 Schnell", prompt: "portrait of a woman in a lime green jacket, neon-lit street at night, 35mm film, cinematic", seed: "cm-lime-jacket", theme: "editorial", media: SHOWCASE.fluxLimeJacket },
  { slug: "paper-boat", title: "Paper boat at golden hour", kind: "video", model: "LTX Video", prompt: "a paper boat drifting across a calm pond at golden hour, gentle ripples, cinematic", seed: "cm-paper-boat", theme: "scenic", media: SHOWCASE.ltxPaperBoat },
  { slug: "neon-runner", title: "Neon runner", kind: "video", model: "LTX Video", prompt: "a runner sprinting through neon-lit rain at night, reflections on wet asphalt, cinematic tracking shot", seed: "cm-neon-runner", theme: "cinematic" },
  { slug: "desert-car", title: "Desert highway", kind: "image", model: "SDXL Lightning", prompt: "a red vintage car parked on an empty desert road at sunset, wide shot", seed: "cm-desert-car", theme: "scenic" },
  { slug: "brutalist-poster", title: "Brutalist poster", kind: "image", model: "Lucid Origin", prompt: "bold brutalist poster design, concrete textures, oversized typography, orange and black", seed: "cm-poster", theme: "editorial" },
  { slug: "storm-dancer", title: "Storm dancer", kind: "video", model: "LTX Video", prompt: "a dancer spinning in a thunderstorm, lightning behind her, slow motion, dramatic", seed: "cm-storm", theme: "effects" },
  { slug: "tokyo-crossing", title: "Tokyo crossing", kind: "video", model: "LTX Video", prompt: "fpv drone diving over a busy Tokyo crossing at dusk, neon signs, dynamic", seed: "cm-tokyo", theme: "cinematic" },
  { slug: "film-still", title: "Film still", kind: "image", model: "FLUX.2 Klein", prompt: "cinematic film still of two people in a diner at 2am, anamorphic, teal and orange", seed: "cm-diner", theme: "cinematic" },
  { slug: "ceramic-studio", title: "Ceramic studio", kind: "image", model: "FLUX.1 Schnell", prompt: "hands shaping clay on a wheel in a sunlit ceramic studio, dust in the light, editorial", seed: "cm-ceramic", theme: "character" },
  { slug: "glacier", title: "Glacier flyover", kind: "video", model: "LTX Video", prompt: "aerial flyover of a blue glacier at sunrise, slow, majestic", seed: "cm-glacier", theme: "scenic" },
  { slug: "street-food", title: "Street food", kind: "image", model: "SDXL Lightning", prompt: "steaming street food stall at night, lanterns, shallow depth of field, photorealistic", seed: "cm-street-food", theme: "advertising" },
  { slug: "retro-arcade", title: "Retro arcade", kind: "video", model: "LTX Video", prompt: "camera dollies through a retro arcade, CRT glow, synthwave colors", seed: "cm-arcade", theme: "effects" },
];

export const communityRecreateHref = (post: CommunityPost): string => {
  const params = new URLSearchParams({ prompt: post.prompt });
  if (post.kind === "video") params.set("model", "ltx-video");
  return `/generate/${post.kind}?${params}`;
};
