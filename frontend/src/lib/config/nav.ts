import type { LucideIcon } from "lucide-react";

import { catalogModelHref, catalogModelsFor } from "@/lib/config/catalog-models";
import { toolHref, toolsByCategory, type ToolCategory } from "@/lib/config/tools";

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
  /** Preview tools open a representative page instead of a generator. */
  preview?: boolean;
}

function featuresFor(category: ToolCategory): MegaMenuFeature[] {
  return toolsByCategory(category).map((tool) => ({
    label: tool.name,
    description: tool.description,
    href: toolHref(tool),
    icon: tool.icon,
    badge: tool.badge,
    preview: tool.status === "preview",
  }));
}

export interface MegaMenuModel {
  id: string;
  name: string;
  description: string;
  href: string;
  badge?: NavBadge;
  /** Catalog-only models open a representative page instead of a generator. */
  preview?: boolean;
}

function modelsFor(category: ToolCategory): MegaMenuModel[] {
  return catalogModelsFor(category).map((model) => ({
    id: model.slug,
    name: model.name,
    description: model.description,
    href: catalogModelHref(model),
    badge: model.badge,
    preview: !model.registryId,
  }));
}

export interface MegaMenu {
  features: MegaMenuFeature[];
  models: MegaMenuModel[];
}

export const primaryNav: NavLink[] = [
  { label: "Explore", href: "/" },
  { label: "Image", href: "/image", menu: "image" },
  { label: "Video", href: "/video", menu: "video" },
  { label: "Audio", href: "/audio", menu: "audio" },
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
    features: featuresFor("image"),
    models: modelsFor("image"),
  },
  video: {
    features: featuresFor("video"),
    models: modelsFor("video"),
  },
  audio: {
    features: featuresFor("audio"),
    models: modelsFor("audio"),
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
      { label: "Text to Speech", href: "/generate/audio" },
      { label: "Inpaint", href: "/tools/inpaint" },
      { label: "Upscale", href: "/tools/image-upscale" },
      { label: "AI Face Swap", href: "/tools/face-swap" },
      { label: "AI Influencer", href: "/tools/ai-influencer" },
    ],
  },
  {
    title: "Video Models",
    links: [
      { label: "LTX Video", href: "/generate/video?model=ltx-video" },
      { label: "Seedance 2.5", href: "/models/seedance-2-5" },
      { label: "Kling 3.0", href: "/models/kling-3" },
      { label: "Sora 2", href: "/models/sora-2" },
      { label: "Veo 3.1", href: "/models/veo-3-1" },
      { label: "Wan 3.0", href: "/models/wan-3" },
    ],
  },
  {
    title: "Image Models",
    links: [
      { label: "FLUX.1 Schnell", href: "/generate/image?model=flux-1-schnell" },
      { label: "FLUX.2 Klein", href: "/generate/image?model=flux-2-klein" },
      { label: "SDXL Lightning", href: "/generate/image?model=sdxl-lightning" },
      { label: "Nano Banana Pro", href: "/models/nano-banana-pro" },
      { label: "GPT Image 2", href: "/models/gpt-image-2" },
      { label: "Soul 2.0", href: "/models/higgsfield-soul-2" },
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
