import { AudioLines, Image as ImageIcon, Video } from "lucide-react";

import type { GenerationType } from "@/types/generation";

const icons = { image: ImageIcon, video: Video, audio: AudioLines } as const;
const labels = { image: "Image", video: "Video", audio: "Audio" } as const;

export function typeLabel(type: GenerationType): string {
  return labels[type];
}

export function GenerationTypeIcon({ type, className }: { type: GenerationType; className?: string }) {
  const Icon = icons[type];
  return <Icon className={className} aria-label={labels[type]} />;
}
