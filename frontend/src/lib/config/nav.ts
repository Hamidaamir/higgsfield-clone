import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  Box,
  Camera,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Languages,
  Layers,
  LayoutGrid,
  Mic,
  Palette,
  Paintbrush,
  Repeat,
  ScanFace,
  Scissors,
  Sparkles,
  SquareUser,
  UserRound,
  Video,
  Wand2,
  ZoomIn,
} from "lucide-react";

export type NavBadge = "New" | "Free" | "TOP";

export interface NavLink {
  label: string;
  href: string;
  badge?: NavBadge;
  /** Links with a mega menu key open a dropdown instead of navigating on hover. */
  menu?: MegaMenuKey;
}

export type MegaMenuKey = "image" | "video" | "audio";

export interface MegaMenuFeature {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: NavBadge;
}

export interface MegaMenuModel {
  id: string;
  name: string;
  description: string;
  href: string;
  badge?: NavBadge;
}

export interface MegaMenu {
  features: MegaMenuFeature[];
  models: MegaMenuModel[];
}

export const primaryNav: NavLink[] = [
  { label: "Explore", href: "/" },
  { label: "Image", href: "/generate/image", menu: "image" },
  { label: "Video", href: "/generate/video", menu: "video" },
  { label: "Audio", href: "/generate/audio", menu: "audio" },
  { label: "MCP", href: "/integrations/mcp" },
  { label: "ChatGPT Plugin", href: "/integrations/chatgpt", badge: "New" },
  { label: "Genjutsu", href: "/genjutsu", badge: "New" },
  { label: "Effects", href: "/effects", badge: "Free" },
  { label: "Cinema Studio", href: "/cinema-studio" },
  { label: "Marketing Studio", href: "/marketing-studio" },
  { label: "Supercomputer", href: "/supercomputer" },
  { label: "3D Jutsu", href: "/3d-jutsu", badge: "New" },
  { label: "Edit", href: "/edit/image" },
  { label: "Academy", href: "/academy" },
  { label: "Community", href: "/community" },
  { label: "Contests", href: "/contests" },
];

export const megaMenus: Record<MegaMenuKey, MegaMenu> = {
  image: {
    features: [
      { label: "Create Image", description: "Generate AI images", href: "/generate/image", icon: ImageIcon },
      { label: "Cinematic Cameras", description: "Image generation with camera controls", href: "/generate/image?mode=cinematic", icon: Camera, badge: "TOP" },
      { label: "Canvas", description: "Visual ideation meets repeatable AI workflows.", href: "/canvas", icon: LayoutGrid },
      { label: "Soul Moodboard", description: "Turn your references into a focused moodboard", href: "/generate/image?mode=moodboard", icon: Layers },
      { label: "Soul ID Character", description: "Create unique character", href: "/generate/image?mode=soul-id", icon: SquareUser },
      { label: "AI Influencer", description: "Create and manage your AI influencer", href: "/generate/image?mode=influencer", icon: UserRound },
      { label: "Photodump", description: "Generate Your Aesthetic", href: "/generate/image?mode=photodump", icon: Sparkles },
      { label: "Relight", description: "Adjust lighting position, color, and brightness", href: "/edit/image?tool=relight", icon: Wand2 },
      { label: "Inpaint", description: "Select an area, describe the change", href: "/edit/image?tool=inpaint", icon: Paintbrush },
      { label: "Image Upscale", description: "Enhance image quality", href: "/edit/image?tool=upscale", icon: ZoomIn },
      { label: "Face Swap", description: "Create Realistic Face Swaps", href: "/edit/image?tool=face-swap", icon: ScanFace },
      { label: "Character Swap", description: "Create Realistic Character Swaps", href: "/edit/image?tool=character-swap", icon: Repeat },
    ],
    models: [
      { id: "higgsfield-soul-2", name: "Higgsfield Soul 2.0", description: "Next generation ultra-realistic fashion visuals", href: "/generate/image?model=higgsfield-soul-2", badge: "TOP" },
      { id: "higgsfield-soul-cinema", name: "Higgsfield Soul Cinema", description: "Cinematic Film-Grade Aesthetic", href: "/generate/image?model=higgsfield-soul-cinema" },
      { id: "gpt-image-2-5-sunburst", name: "GPT Image 2.5 Sunburst", description: "Exceptional quality, precise edits", href: "/generate/image?model=gpt-image-2-5-sunburst", badge: "New" },
      { id: "gpt-image-2-5-flare", name: "GPT Image 2.5 Flare", description: "Stunning everyday images, fast", href: "/generate/image?model=gpt-image-2-5-flare", badge: "New" },
      { id: "gpt-image-2", name: "GPT Image 2", description: "4K images with near-perfect text rendering", href: "/generate/image?model=gpt-image-2", badge: "TOP" },
      { id: "seedream-5-pro", name: "Seedream 5.0 Pro", description: "Logically consistent images with intelligent visual reasoning", href: "/generate/image?model=seedream-5-pro" },
      { id: "nano-banana-2-lite", name: "Nano Banana 2 Lite", description: "Lightweight image generation at speed", href: "/generate/image?model=nano-banana-2-lite" },
      { id: "nano-banana-pro", name: "Nano Banana Pro", description: "Best 4K image model ever", href: "/generate/image?model=nano-banana-pro", badge: "TOP" },
      { id: "recraft-v4-styles", name: "Recraft V4 Styles", description: "Style it once, every image matches", href: "/generate/image?model=recraft-v4-styles", badge: "New" },
      { id: "recraft-v4-1", name: "Recraft V4.1", description: "Photorealistic and expressive image generation", href: "/generate/image?model=recraft-v4-1" },
      { id: "grok-imagine-2", name: "Grok Imagine 2.0", description: "High-resolution image generation by xAI", href: "/generate/image?model=grok-imagine-2", badge: "New" },
      { id: "flux-2", name: "FLUX.2", description: "Speed-optimized detail", href: "/generate/image?model=flux-2" },
    ],
  },
  video: {
    features: [
      { label: "Create Video", description: "Generate AI videos", href: "/generate/video", icon: Video },
      { label: "Cinema Studio", description: "Cinematic video with AI director", href: "/cinema-studio", icon: Clapperboard },
      { label: "Faceless Studio", description: "Start a faceless channel in one click", href: "/generate/video?mode=faceless", icon: SquareUser },
      { label: "3D Jutsu", description: "Create 3D scenes and turn them into videos", href: "/3d-jutsu", icon: Box, badge: "New" },
      { label: "Shorts Studio", description: "Turn your footage into ready-made shorts", href: "/generate/video?mode=shorts", icon: Film },
      { label: "Higgsfield Explainer", description: "Turn any topic into an explainer video", href: "/generate/video?mode=explainer", icon: Sparkles },
      { label: "Canvas", description: "Visual ideation meets repeatable AI workflows.", href: "/canvas", icon: LayoutGrid },
      { label: "Mixed Media", description: "Create mixed media projects", href: "/generate/video?mode=mixed-media", icon: Layers },
      { label: "Edit Video", description: "Edit scenes, shots, elements", href: "/edit/video", icon: Scissors },
      { label: "Higgsfield Reframe", description: "Reframe and resize videos to any aspect ratio", href: "/edit/video?tool=reframe", icon: Repeat },
      { label: "Click to Ad", description: "Turn product URLs into video ads", href: "/marketing-studio", icon: Wand2 },
      { label: "Change Color Palette", description: "Adjust color palette, tones, and overall mood", href: "/edit/video?tool=color", icon: Palette },
    ],
    models: [
      { id: "seedance-2-5", name: "Seedance 2.5", description: "Create cinematic videos up to 30 seconds", href: "/generate/video?model=seedance-2-5", badge: "TOP" },
      { id: "higgsfield-genjutsu", name: "Higgsfield Genjutsu", description: "Transfer motion or swap objects from a reference video", href: "/genjutsu", badge: "New" },
      { id: "gemini-omni-flash-1-1", name: "Gemini Omni Flash 1.1", description: "Generate and edit video from any input", href: "/generate/video?model=gemini-omni-flash-1-1" },
      { id: "kling-3", name: "Kling 3.0", description: "Cinematic videos with audio", href: "/generate/video?model=kling-3" },
      { id: "kling-motion-control", name: "Kling Motion Control", description: "Transfer motion from video to image", href: "/generate/video?model=kling-motion-control" },
      { id: "flux-3-video", name: "FLUX.3 Video", description: "Text, image, and video generation with synchronized audio", href: "/generate/video?model=flux-3-video" },
      { id: "minimax-h3", name: "MiniMax H3", description: "Create 2K videos from text, keyframes, or multimodal references", href: "/generate/video?model=minimax-h3" },
      { id: "wan-3", name: "Wan 3.0", description: "Create videos from text, keyframes, or multimodal references", href: "/generate/video?model=wan-3" },
      { id: "grok-imagine-1-5", name: "Grok Imagine 1.5", description: "Cinematic videos with synchronized audio", href: "/generate/video?model=grok-imagine-1-5" },
      { id: "kling-3-omni-edit", name: "Kling 3.0 Omni Edit", description: "Edit videos with text prompts", href: "/edit/video?model=kling-3-omni-edit" },
      { id: "sora-2", name: "Sora 2", description: "OpenAI's most advanced video model", href: "/generate/video?model=sora-2" },
      { id: "veo-3-1", name: "Google Veo 3.1", description: "Advanced AI video with sound", href: "/generate/video?model=veo-3-1" },
    ],
  },
  audio: {
    features: [
      { label: "Text to Speech", description: "Generate speech from text", href: "/generate/audio", icon: Mic },
      { label: "Voice Change", description: "Swap voices in any video", href: "/generate/audio?mode=voice-change", icon: AudioLines },
      { label: "Translate", description: "Translate and lip-sync your video into a new language", href: "/generate/audio?mode=translate", icon: Languages },
    ],
    models: [
      { id: "seed-audio-1", name: "Seed Audio 1.0", description: "Multi-speaker scenes with speech and ambience", href: "/generate/audio?model=seed-audio-1" },
      { id: "eleven-v3", name: "Eleven v3", description: "Emotion and delivery control via inline tags", href: "/generate/audio?model=eleven-v3" },
      { id: "qwen-audio-3", name: "Qwen Audio 3.0", description: "Natural speech with voice, style, and emotion control", href: "/generate/audio?model=qwen-audio-3" },
      { id: "minimax-speech-2-8-hd", name: "MiniMax Speech 2.8 HD", description: "High-fidelity single-voice narration", href: "/generate/audio?model=minimax-speech-2-8-hd" },
      { id: "seed-speech", name: "Seed Speech", description: "Multilingual speech across 30+ languages", href: "/generate/audio?model=seed-speech" },
    ],
  },
};

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: "Create",
    links: [
      { label: "AI Video", href: "/generate/video" },
      { label: "AI Image", href: "/generate/image" },
      { label: "Edit Image", href: "/edit/image" },
      { label: "Inpaint", href: "/edit/image?tool=inpaint" },
      { label: "Upscale", href: "/edit/image?tool=upscale" },
      { label: "Mixed Media", href: "/generate/video?mode=mixed-media" },
      { label: "AI Face Swap", href: "/edit/image?tool=face-swap" },
      { label: "AI Influencer", href: "/generate/image?mode=influencer" },
    ],
  },
  {
    title: "Video Models",
    links: [
      { label: "Seedance 2.5", href: "/generate/video?model=seedance-2-5" },
      { label: "Kling 3.0", href: "/generate/video?model=kling-3" },
      { label: "Sora 2", href: "/generate/video?model=sora-2" },
      { label: "Veo 3.1", href: "/generate/video?model=veo-3-1" },
      { label: "Wan 3.0", href: "/generate/video?model=wan-3" },
      { label: "Grok Imagine 1.5", href: "/generate/video?model=grok-imagine-1-5" },
    ],
  },
  {
    title: "Image Models",
    links: [
      { label: "Nano Banana Pro", href: "/generate/image?model=nano-banana-pro" },
      { label: "FLUX.2", href: "/generate/image?model=flux-2" },
      { label: "Seedream 5.0", href: "/generate/image?model=seedream-5-pro" },
      { label: "GPT Image 2", href: "/generate/image?model=gpt-image-2" },
      { label: "Soul 2.0", href: "/generate/image?model=higgsfield-soul-2" },
      { label: "Soul Cinema", href: "/generate/image?model=higgsfield-soul-cinema" },
    ],
  },
  {
    title: "Studios",
    links: [
      { label: "Cinema Studio", href: "/cinema-studio" },
      { label: "Marketing Studio", href: "/marketing-studio" },
      { label: "Supercomputer", href: "/supercomputer" },
      { label: "3D Jutsu", href: "/3d-jutsu" },
      { label: "Genjutsu", href: "/genjutsu" },
      { label: "Higgsfield Canvas", href: "/canvas" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "MCP / CLI", href: "/integrations/mcp" },
      { label: "ChatGPT Plugin", href: "/integrations/chatgpt" },
      { label: "Effects", href: "/effects" },
      { label: "Pricing", href: "/pricing" },
      { label: "Enterprise", href: "/enterprise" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Community", href: "/community" },
      { label: "Academy", href: "/academy" },
      { label: "Contests", href: "/contests" },
      { label: "History", href: "/history" },
      { label: "Settings", href: "/settings" },
    ],
  },
];
