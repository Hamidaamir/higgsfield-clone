import type { ToolCategory } from "@/lib/config/tools";

/**
 * The model catalog shown in navigation and discovery. `registryId` marks models that the
 * backend really runs (they deep-link into a generator); the rest are representative
 * entries from the reference product and open a preview page.
 */
export interface CatalogModel {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  registryId?: string;
  badge?: "New" | "Free" | "TOP";
  vendor: string;
  seed: string;
}

export const CATALOG_MODELS: CatalogModel[] = [
  // Image — real
  { slug: "flux-1-schnell", name: "FLUX.1 Schnell", description: "Fast, high-quality images in seconds", category: "image", registryId: "flux-1-schnell", badge: "TOP", vendor: "Black Forest Labs", seed: "m-flux-schnell" },
  { slug: "flux-2-klein", name: "FLUX.2 Klein", description: "Generation and reference-guided editing in one model", category: "image", registryId: "flux-2-klein", badge: "New", vendor: "Black Forest Labs", seed: "m-flux-klein" },
  { slug: "sdxl-lightning", name: "SDXL Lightning", description: "1024px images in a few steps, any aspect ratio", category: "image", registryId: "sdxl-lightning", vendor: "ByteDance", seed: "m-sdxl" },
  { slug: "lucid-origin", name: "Lucid Origin", description: "Leonardo's most prompt-responsive model for design and renders", category: "image", registryId: "lucid-origin", vendor: "Leonardo", seed: "m-lucid" },
  // Image — catalog
  { slug: "gpt-image-2-5-sunburst", name: "GPT Image 2.5 Sunburst", description: "Exceptional quality, precise edits", category: "image", badge: "New", vendor: "OpenAI", seed: "m-gpt-sunburst" },
  { slug: "gpt-image-2", name: "GPT Image 2", description: "4K images with near-perfect text rendering", category: "image", vendor: "OpenAI", seed: "m-gpt-image" },
  { slug: "seedream-5-pro", name: "Seedream 5.0 Pro", description: "Logically consistent images with intelligent visual reasoning", category: "image", vendor: "ByteDance", seed: "m-seedream" },
  { slug: "nano-banana-pro", name: "Nano Banana Pro", description: "Best 4K image model ever", category: "image", badge: "TOP", vendor: "Google", seed: "m-nano-banana" },
  { slug: "recraft-v4", name: "Recraft V4 Styles", description: "Style it once, every image matches", category: "image", badge: "New", vendor: "Recraft", seed: "m-recraft" },
  { slug: "grok-imagine-2", name: "Grok Imagine 2.0", description: "High-resolution image generation by xAI", category: "image", badge: "New", vendor: "xAI", seed: "m-grok" },
  // Video — real
  { slug: "ltx-video", name: "LTX Video", description: "Fast distilled text-to-video and image-to-video clips", category: "video", registryId: "ltx-video", badge: "New", vendor: "Lightricks", seed: "m-ltx" },
  // Video — catalog
  { slug: "seedance-2-5", name: "Seedance 2.5", description: "Create cinematic videos up to 30 seconds", category: "video", badge: "TOP", vendor: "ByteDance", seed: "m-seedance" },
  { slug: "kling-3", name: "Kling 3.0", description: "Cinematic videos with audio", category: "video", vendor: "Kuaishou", seed: "m-kling" },
  { slug: "kling-motion-control", name: "Kling Motion Control", description: "Transfer motion from video to image", category: "video", vendor: "Kuaishou", seed: "m-kling-motion" },
  { slug: "wan-3", name: "Wan 3.0", description: "Create videos from text, keyframes, or multimodal references", category: "video", vendor: "Alibaba", seed: "m-wan" },
  { slug: "minimax-h3", name: "MiniMax H3", description: "Create 2K videos from text, keyframes, or multimodal references", category: "video", vendor: "MiniMax", seed: "m-minimax" },
  { slug: "sora-2", name: "Sora 2", description: "OpenAI's most advanced video model", category: "video", vendor: "OpenAI", seed: "m-sora" },
  { slug: "veo-3-1", name: "Google Veo 3.1", description: "Advanced AI video with sound", category: "video", vendor: "Google", seed: "m-veo" },
  { slug: "grok-imagine-1-5", name: "Grok Imagine 1.5", description: "Cinematic videos with synchronized audio", category: "video", vendor: "xAI", seed: "m-grok-video" },
  // Audio — real
  { slug: "aura-1", name: "Aura 1", description: "Twelve expressive English voices with natural pacing", category: "audio", registryId: "aura-1", badge: "TOP", vendor: "Deepgram", seed: "m-aura" },
  { slug: "melotts", name: "MeloTTS", description: "Fast multilingual narration, one natural voice per language", category: "audio", registryId: "melotts", vendor: "MyShell", seed: "m-melo" },
  { slug: "gemini-tts", name: "Gemini TTS", description: "Describe the delivery in words: tone, pace, emotion", category: "audio", registryId: "gemini-tts", badge: "New", vendor: "Google", seed: "m-gemini" },
  // Audio — catalog
  { slug: "seed-audio-1", name: "Seed Audio 1.0", description: "Multi-speaker scenes with speech and ambience", category: "audio", vendor: "ByteDance", seed: "m-seed-audio" },
  { slug: "eleven-v3", name: "Eleven v3", description: "Emotion and delivery control via inline tags", category: "audio", vendor: "ElevenLabs", seed: "m-eleven" },
  { slug: "minimax-speech-2-8", name: "MiniMax Speech 2.8 HD", description: "High-fidelity single-voice narration", category: "audio", vendor: "MiniMax", seed: "m-minimax-speech" },
];

const GENERATOR: Record<ToolCategory, string> = { image: "/generate/image", video: "/generate/video", audio: "/generate/audio" };

export const catalogModelsFor = (category: ToolCategory): CatalogModel[] =>
  CATALOG_MODELS.filter((m) => m.category === category);

export const getCatalogModel = (slug: string): CatalogModel | undefined => CATALOG_MODELS.find((m) => m.slug === slug);

export const catalogModelHref = (model: CatalogModel): string =>
  model.registryId ? `${GENERATOR[model.category]}?model=${model.registryId}` : `/models/${model.slug}`;

export const generatorHrefFor = (category: ToolCategory): string => GENERATOR[category];
