/** Curated community showcase (product content, not user history). */

export interface CommunityPost {
  slug: string;
  title: string;
  author: string;
  kind: "image" | "video";
  model: string;
  prompt: string;
  seed: string;
  likes: number;
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  { slug: "neon-runner", title: "Neon runner", author: "mira.k", kind: "video", model: "LTX Video", prompt: "a runner sprinting through neon-lit rain at night, reflections on wet asphalt, cinematic tracking shot", seed: "cm-neon-runner", likes: 1284 },
  { slug: "paper-boat", title: "Paper boat at golden hour", author: "Higgsfield Studio", kind: "video", model: "LTX Video", prompt: "a paper boat drifting across a calm pond at golden hour, gentle ripples, cinematic", seed: "cm-paper-boat", likes: 942 },
  { slug: "lime-jacket", title: "Lime jacket portrait", author: "jonas", kind: "image", model: "FLUX.1 Schnell", prompt: "portrait of a woman in a lime green jacket, neon-lit street at night, 35mm film, cinematic", seed: "cm-lime-jacket", likes: 2201 },
  { slug: "desert-car", title: "Desert highway", author: "aria.v", kind: "image", model: "SDXL Lightning", prompt: "a red vintage car parked on an empty desert road at sunset, wide shot", seed: "cm-desert-car", likes: 733 },
  { slug: "brutalist-poster", title: "Brutalist poster", author: "studio.forma", kind: "image", model: "Lucid Origin", prompt: "bold brutalist poster design, concrete textures, oversized typography, orange and black", seed: "cm-poster", likes: 611 },
  { slug: "storm-dancer", title: "Storm dancer", author: "kenji", kind: "video", model: "LTX Video", prompt: "a dancer spinning in a thunderstorm, lightning behind her, slow motion, dramatic", seed: "cm-storm", likes: 1870 },
  { slug: "tokyo-crossing", title: "Tokyo crossing", author: "lea", kind: "video", model: "LTX Video", prompt: "fpv drone diving over a busy Tokyo crossing at dusk, neon signs, dynamic", seed: "cm-tokyo", likes: 1512 },
  { slug: "film-still", title: "Film still", author: "Higgsfield Studio", kind: "image", model: "FLUX.2 Klein", prompt: "cinematic film still of two people in a diner at 2am, anamorphic, teal and orange", seed: "cm-diner", likes: 998 },
  { slug: "ceramic-studio", title: "Ceramic studio", author: "noor", kind: "image", model: "FLUX.1 Schnell", prompt: "hands shaping clay on a wheel in a sunlit ceramic studio, dust in the light, editorial", seed: "cm-ceramic", likes: 456 },
  { slug: "glacier", title: "Glacier flyover", author: "atlas", kind: "video", model: "LTX Video", prompt: "aerial flyover of a blue glacier at sunrise, slow, majestic", seed: "cm-glacier", likes: 1104 },
  { slug: "street-food", title: "Street food", author: "mei", kind: "image", model: "SDXL Lightning", prompt: "steaming street food stall at night, lanterns, shallow depth of field, photorealistic", seed: "cm-street-food", likes: 822 },
  { slug: "retro-arcade", title: "Retro arcade", author: "pixel.pat", kind: "video", model: "LTX Video", prompt: "camera dollies through a retro arcade, CRT glow, synthwave colors", seed: "cm-arcade", likes: 690 },
];

export const communityRecreateHref = (post: CommunityPost): string => {
  const params = new URLSearchParams({ prompt: post.prompt });
  if (post.kind === "video") params.set("model", "ltx-video");
  return `/generate/${post.kind}?${params}`;
};
