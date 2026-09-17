/** Curated discovery content for Explore. Product/catalog content, never user history. */

export interface FeatureCard {
  seed: string;
  overlay: string;
  overlayPosition?: "bottom-right" | "top-left" | "center";
  title: string;
  subtitle: string;
  href: string;
}

export const featureCards: FeatureCard[] = [
  { seed: "hf-motion-designer", overlay: "ANY TRACK\nANY MOOD", title: "Higgsfield AI Motion Designer", subtitle: "ChatGPT can now do motion design in After Effects.", href: "/integrations/chatgpt" },
  { seed: "hf-effects", overlay: "/INCLINE", title: "Higgsfield Effects", subtitle: "Viral video presets, ready to drop into your prompt.", href: "/effects" },
  { seed: "hf-genjutsu", overlay: "CAMERA\nMOVEMENT", overlayPosition: "top-left", title: "Higgsfield Genjutsu", subtitle: "One upload in. Endless new visions out.", href: "/genjutsu" },
  { seed: "hf-klein-edit", overlay: "SUNBURST", title: "FLUX.2 Klein Edits", subtitle: "Sharper edits with more natural light and texture.", href: "/edit/image" },
];

export interface GalleryItem {
  seed: string;
  href: string;
  alt: string;
  /** Portrait items get a taller frame in mixed grids. */
  portrait?: boolean;
  overlay?: string;
}

export interface GallerySection {
  id: string;
  title: string;
  subtitle: string;
  items: GalleryItem[];
  viewAll: { label: string; href: string };
  cta?: { label: string; href: string };
  ratio?: string;
}

const gallery = (prefix: string, href: string, count: number, portraits: number[] = []): GalleryItem[] =>
  Array.from({ length: count }, (_, i) => ({
    seed: `${prefix}-${i + 1}`,
    href,
    alt: `${prefix.replace(/-/g, " ")} example ${i + 1}`,
    portrait: portraits.includes(i),
  }));

export const gallerySections: GallerySection[] = [
  {
    id: "effects",
    title: "Visual effects",
    subtitle: "Big-budget visual effects, from explosions to surreal transformations.",
    items: gallery("visual-effects", "/effects", 5, [1, 3]),
    viewAll: { label: "View all presets", href: "/effects" },
    cta: { label: "Try for free", href: "/effects" },
    ratio: "3 / 4",
  },
  {
    id: "video",
    title: "LTX Video",
    subtitle: "Text and image to video — generated in seconds on the free tier.",
    items: gallery("ltx-video", "/generate/video", 4),
    viewAll: { label: "View all of LTX Video", href: "/video" },
  },
  {
    id: "image",
    title: "FLUX.1 Schnell",
    subtitle: "Fast photographic and illustrative stills with near-instant results.",
    items: gallery("flux-schnell", "/generate/image", 4),
    viewAll: { label: "View all of FLUX.1 Schnell", href: "/image" },
  },
  {
    id: "marketing",
    title: "Marketing Studio",
    subtitle: "See what creators and brands are making with Marketing Studio.",
    items: gallery("marketing-studio", "/marketing-studio", 4),
    viewAll: { label: "View all of Marketing Studio", href: "/marketing-studio" },
  },
  {
    id: "soul",
    title: "Higgsfield Soul Cinema",
    subtitle: "Explore the community gallery for stunning cinematic stills.",
    items: gallery("soul-cinema", "/tools/cinematic-cameras", 4),
    viewAll: { label: "View all of Soul Cinema", href: "/tools/cinematic-cameras" },
  },
];

export interface ProjectCard {
  seed: string;
  title: string;
  author: string;
  visibility: "Public";
  href: string;
}

export const projectCards: ProjectCard[] = [
  { seed: "project-loving-me", title: "If you stop loving me, I'll die — I don't like dying, but…", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
  { seed: "project-cully-hill", title: "Cully Hill Boys", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
  { seed: "project-red-flag", title: "Red Flag", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
  { seed: "project-kok-boru", title: "Kok Boru", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
  { seed: "project-adiliada", title: "Adiliada", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
  { seed: "project-oneiric", title: "Oneiric", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
  { seed: "project-zephyr", title: "Zephyr Special", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
  { seed: "project-hell-grind", title: "Hell Grind", author: "Higgsfield Studio", visibility: "Public", href: "/community" },
];

export const moreFeatures: { label: string; href: string }[] = [
  { label: "Cinema Studio", href: "/cinema-studio" },
  { label: "Visual Effects", href: "/effects" },
  { label: "Higgsfield Soul", href: "/tools/cinematic-cameras" },
  { label: "Camera Controls", href: "/tools/cinematic-cameras" },
  { label: "Viral", href: "/effects" },
  { label: "Action movements", href: "/effects" },
  { label: "Commercial", href: "/marketing-studio" },
  { label: "LTX Video", href: "/generate/video" },
  { label: "Seedance Pro", href: "/models/seedance-2-5" },
  { label: "Community", href: "/community" },
  { label: "FLUX.2 Klein", href: "/edit/image" },
  { label: "SDXL Lightning", href: "/generate/image?model=sdxl-lightning" },
  { label: "Lucid Origin", href: "/generate/image?model=lucid-origin" },
  { label: "Nano Banana", href: "/models/nano-banana-pro" },
  { label: "GPT Image", href: "/models/gpt-image-2" },
  { label: "Kling 3.0", href: "/models/kling-3" },
  { label: "Claude MCP", href: "/integrations/mcp" },
  { label: "Sora 2", href: "/models/sora-2" },
  { label: "Edit Image", href: "/edit/image" },
  { label: "Upscale", href: "/tools/image-upscale" },
  { label: "YouTube Shorts", href: "/tools/shorts-studio" },
  { label: "Instagram Reels", href: "/tools/shorts-studio" },
  { label: "Text to Speech", href: "/generate/audio" },
  { label: "Aura voices", href: "/generate/audio?model=aura-1" },
  { label: "Mixed Media", href: "/tools/mixed-media" },
  { label: "Soul Presets", href: "/tools/soul-moodboard" },
  { label: "Visual Effects Collection", href: "/effects" },
];
