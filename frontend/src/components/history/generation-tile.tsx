"use client";

import { AlertTriangle, Layers, RefreshCw } from "lucide-react";

import { GenerationTypeIcon } from "@/components/generation/generation-type-icon";
import { MediaPreview } from "@/components/generation/media-preview";
import { StatusBadge } from "@/components/generation/status-badge";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Generation, ModelSpec } from "@/types/generation";

interface GenerationTileProps {
  generation: Generation;
  model: ModelSpec | undefined;
  onOpen: (generation: Generation) => void;
  onRetry: (generation: Generation) => void;
  retrying?: boolean;
}

/**
 * History card: uniform square, media-first (cropped thumbnail; the detail dialog shows
 * the full asset), prompt/model/time on hover and a status badge for anything that is
 * not a finished result. Media rendering is delegated to MediaPreview.
 */
export function GenerationTile({ generation, model, onOpen, onRetry, retrying }: GenerationTileProps) {
  const cover = generation.assets[0];
  const active = generation.status === "queued" || generation.status === "processing";
  const failed = generation.status === "failed" || (generation.status === "completed" && !cover);
  const modelName = model?.name ?? generation.model_id;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-surface",
        failed ? "border-danger/40" : "border-border",
        active && "skeleton-shimmer",
      )}
      style={{ aspectRatio: "1 / 1" }}
      aria-label={`${modelName}: ${generation.prompt}`}
    >
      <button
        type="button"
        onClick={() => onOpen(generation)}
        className="absolute inset-0 block h-full w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        aria-label={`Open details: ${generation.prompt}`}
      >
        {cover ? (
          <MediaPreview asset={cover} alt={generation.prompt} mode="tile" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            {failed ? (
              <>
                <AlertTriangle className="size-6 text-danger" aria-hidden />
                <span className="text-sm font-semibold">Generation failed</span>
                <span className="line-clamp-3 text-xs text-text-secondary">{generation.error_message ?? "Something went wrong."}</span>
              </>
            ) : (
              <>
                <span className="size-7 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden />
                <span className="text-sm font-semibold">{generation.status === "queued" ? "Queued" : "Generating"}…</span>
                <span className="text-xs text-text-secondary">{modelName}</span>
              </>
            )}
          </span>
        )}
      </button>

      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5">
        <span className="flex size-6 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur">
          <GenerationTypeIcon type={generation.type} className="size-3.5" />
        </span>
        {generation.assets.length > 1 ? (
          <span className="flex h-6 items-center gap-1 rounded-md bg-black/55 px-1.5 text-[11px] font-semibold text-white backdrop-blur">
            <Layers className="size-3" aria-hidden />
            {generation.assets.length}
          </span>
        ) : null}
        {generation.status !== "completed" ? <StatusBadge status={generation.status} /> : null}
      </div>

      {failed ? (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <Button size="sm" onClick={() => onRetry(generation)} loading={retrying}>
            <RefreshCw className="size-3.5" aria-hidden />
            Retry
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 transition-opacity",
            cover ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" : "opacity-100",
          )}
        >
          <p className="line-clamp-2 text-xs text-white/90">{generation.prompt}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/65">
            <span className="truncate">{modelName}</span>
            <span aria-hidden>·</span>
            <time dateTime={generation.created_at}>{relativeTime(generation.created_at)}</time>
          </p>
        </div>
      )}
    </article>
  );
}
