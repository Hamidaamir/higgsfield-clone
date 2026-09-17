"use client";

import { AudioLines } from "lucide-react";
import Image from "next/image";

import { Waveform } from "@/components/generation/waveform";
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

  const seconds = asset.duration_ms ? Math.round(asset.duration_ms / 1000) : null;
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(80%_60%_at_50%_100%,rgba(214,255,0,0.14),transparent_70%)] bg-surface-muted p-4",
        className,
      )}
    >
      <div className="flex h-16 w-full max-w-md items-center gap-3 overflow-hidden px-3">
        <AudioLines className="size-6 shrink-0 text-accent" aria-hidden />
        <Waveform seed={asset.id} bars={mode === "full" ? 56 : 24} className="h-full" />
        {seconds !== null && mode === "full" ? (
          <span className="shrink-0 text-xs tabular-nums text-text-secondary">{seconds}s</span>
        ) : null}
      </div>
      {mode === "full" ? (
        <audio src={asset.url} controls preload="metadata" aria-label={alt} className="w-full max-w-md" />
      ) : null}
    </div>
  );
}
