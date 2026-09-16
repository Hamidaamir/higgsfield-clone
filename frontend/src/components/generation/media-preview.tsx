"use client";

import { AudioLines } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Asset } from "@/types/generation";

interface MediaPreviewProps {
  asset: Asset;
  alt: string;
  /** `tile` uses thumbnails / posters and no controls; `full` renders the original with controls. */
  mode?: "tile" | "full";
  className?: string;
  sizes?: string;
  priority?: boolean;
}

const isCloudinary = (url: string) => url.includes("res.cloudinary.com");

/**
 * The single place that knows how each media type is displayed. Image today;
 * video/audio branches are ready for the M4/M5 generators.
 */
export function MediaPreview({ asset, alt, mode = "tile", className, sizes, priority }: MediaPreviewProps) {
  if (asset.media_type === "image") {
    const src = mode === "tile" ? (asset.thumbnail_url ?? asset.url) : asset.url;
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        unoptimized={!isCloudinary(src)}
        sizes={sizes ?? (mode === "tile" ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" : "90vw")}
        className={cn(mode === "tile" ? "object-cover" : "object-contain", className)}
      />
    );
  }

  if (asset.media_type === "video") {
    return (
      <video
        src={asset.url}
        poster={asset.thumbnail_url ?? undefined}
        controls={mode === "full"}
        muted={mode === "tile"}
        playsInline
        preload="metadata"
        aria-label={alt}
        className={cn("absolute inset-0 h-full w-full bg-black", mode === "tile" ? "object-cover" : "object-contain", className)}
      />
    );
  }

  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-muted to-surface p-4", className)}>
      <AudioLines className="size-10 text-accent" aria-hidden />
      {mode === "full" ? <audio src={asset.url} controls preload="metadata" aria-label={alt} className="w-full max-w-md" /> : null}
      {asset.duration_ms ? (
        <span className="text-xs tabular-nums text-text-secondary">{Math.round(asset.duration_ms / 1000)}s</span>
      ) : null}
    </div>
  );
}
