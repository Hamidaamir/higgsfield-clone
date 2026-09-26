"use client";

import { AlertTriangle, Download, Maximize2, RefreshCw, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { relativeTime } from "@/lib/format";
import { aspectRatioStyle, downloadUrl, ratioToStyle } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Asset, Generation, ModelSpec } from "@/types/generation";

export interface GenerationGroupActions {
  onOpen: (generation: Generation, asset: Asset) => void;
  onReusePrompt: (generation: Generation) => void;
  onRetry: (generation: Generation) => void;
  retrying?: boolean;
}

interface GenerationGroupProps extends GenerationGroupActions {
  generation: Generation;
  model: ModelSpec | undefined;
}

/** How many plates sit side by side; a single result stays a readable size rather than filling the row. */
const WIDTH_BY_COUNT: Record<number, string> = {
  1: "max-w-[26rem]",
  2: "max-w-[42rem]",
  3: "max-w-[56rem]",
  4: "max-w-[72rem]",
};

const GRID_BY_COUNT: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

/**
 * One request rendered as a contact-sheet entry: a thin metadata rule, the plates it produced,
 * and its actions. Keeping the generation as the unit (rather than flattening assets into a
 * grid) is what makes a batch readable as "one prompt, four takes".
 */
export function GenerationGroup({ generation, model, onOpen, onReusePrompt, onRetry, retrying }: GenerationGroupProps) {
  const ratio = generation.settings.aspect_ratio ?? "1:1";
  const batch = generation.settings.batch_size ?? 1;
  const pending = generation.status === "queued" || generation.status === "processing";
  const failed = generation.status === "failed" || (generation.status === "completed" && generation.assets.length === 0);
  const plates = pending ? batch : generation.assets.length;
  const columns = Math.min(Math.max(plates, 1), 4);

  return (
    <article className="border-t border-border-subtle pt-4" aria-label={`${model?.name ?? generation.model_id}: ${generation.prompt}`}>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3">
        <p className="min-w-0 flex-1 truncate text-[13px] text-foreground" title={generation.prompt}>
          {generation.prompt}
        </p>
        <p className="flex shrink-0 items-center gap-1.5 text-[11px] text-foreground-subtle">
          <span>{model?.name ?? generation.model_id}</span>
          <span aria-hidden>·</span>
          <span>{ratio}</span>
          {batch > 1 ? (
            <>
              <span aria-hidden>·</span>
              <span>{batch} images</span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <time dateTime={generation.created_at}>{relativeTime(generation.created_at)}</time>
        </p>
        {!pending ? (
          <span className="flex shrink-0 items-center gap-1">
            <Tooltip content="Reuse prompt & settings">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-none"
                onClick={() => onReusePrompt(generation)}
                aria-label={`Reuse prompt: ${generation.prompt}`}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Generate again">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-none"
                onClick={() => onRetry(generation)}
                disabled={retrying}
                aria-label={`Generate again: ${generation.prompt}`}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </Tooltip>
          </span>
        ) : null}
      </header>

      {failed ? (
        <FailedPlate generation={generation} onReusePrompt={onReusePrompt} onRetry={onRetry} retrying={retrying} />
      ) : (
        <div
          className={cn("grid gap-3", GRID_BY_COUNT[columns], WIDTH_BY_COUNT[columns])}
        >
          {pending
            ? Array.from({ length: batch }, (_, i) => (
                <PendingPlate key={`${generation.id}-${i}`} generation={generation} model={model} ratio={ratio} />
              ))
            : generation.assets.map((asset) => (
                <ResultPlate
                  key={asset.id}
                  generation={generation}
                  asset={asset}
                  onOpen={onOpen}
                  columns={columns}
                />
              ))}
        </div>
      )}
    </article>
  );
}

function useElapsed(since: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return Math.max(0, Math.round((now - new Date(since).getTime()) / 1000));
}

/** Aspect-correct placeholder. The backend reports no progress, so only status and elapsed time are shown. */
function PendingPlate({ generation, model, ratio }: { generation: Generation; model?: ModelSpec; ratio: string }) {
  const elapsed = useElapsed(generation.created_at);
  const queued = generation.status === "queued";
  const label = queued ? "Queued" : `Generating with ${model?.name ?? generation.model_id}`;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="relative overflow-hidden border border-border-subtle skeleton-shimmer"
      style={ratioToStyle(ratio)}
    >
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
        <span className="editorial-label text-accent-text">{queued ? "Queued" : "Generating"}</span>
        <span className="text-[11px] tabular-nums text-foreground-subtle">{elapsed}s</span>
      </div>
    </div>
  );
}

function ResultPlate({
  generation,
  asset,
  onOpen,
  columns,
}: {
  generation: Generation;
  asset: Asset;
  onOpen: GenerationGroupActions["onOpen"];
  columns: number;
}) {
  const filename = `higgsfield-${generation.id.slice(0, 8)}.png`;
  return (
    <figure className="group relative">
      <button
        type="button"
        onClick={() => onOpen(generation, asset)}
        className="relative block w-full overflow-hidden border border-border-subtle bg-surface-subtle transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        style={aspectRatioStyle(asset.width, asset.height)}
        aria-label={`Open image: ${generation.prompt}`}
      >
        <Image
          src={asset.thumbnail_url ?? asset.url}
          alt={generation.prompt}
          fill
          unoptimized={!(asset.thumbnail_url ?? asset.url).includes("res.cloudinary.com")}
          sizes={columns >= 3 ? "(max-width: 640px) 50vw, 22vw" : "(max-width: 640px) 100vw, 40vw"}
          className="object-cover"
        />
      </button>
      {/* Actions sit under the plate, not on hover, so they are reachable by touch and keyboard. */}
      <figcaption className="mt-1.5 flex items-center gap-1">
        <Tooltip content="Open">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 rounded-none"
            onClick={() => onOpen(generation, asset)}
            aria-label={`Open image full size: ${generation.prompt}`}
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </Tooltip>
        <Tooltip content="Download">
          <Button asChild size="icon" variant="ghost" className="size-7 rounded-none">
            <a href={downloadUrl(asset.url, filename)} download={filename} aria-label={`Download image: ${generation.prompt}`}>
              <Download className="size-3.5" />
            </a>
          </Button>
        </Tooltip>
      </figcaption>
    </figure>
  );
}

function FailedPlate({
  generation,
  onReusePrompt,
  onRetry,
  retrying,
}: {
  generation: Generation;
} & Pick<GenerationGroupActions, "onReusePrompt" | "onRetry" | "retrying">) {
  return (
    <div
      role="alert"
      className="flex max-w-[26rem] flex-col gap-3 border border-danger/40 bg-danger/5 p-4"
    >
      <AlertTriangle className="size-5 text-danger" aria-hidden />
      <div>
        <p className="text-sm font-medium text-foreground">Generation failed</p>
        {/* The API already normalises provider/quota/rate-limit failures into a safe message. */}
        <p className="mt-1 text-[13px] leading-snug text-foreground-muted">
          {generation.error_message ?? "Something went wrong."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-none" onClick={() => onReusePrompt(generation)}>
          Edit prompt
        </Button>
        <Button size="sm" className="rounded-none" onClick={() => onRetry(generation)} loading={retrying}>
          <RefreshCw className="size-3.5" aria-hidden />
          Retry
        </Button>
      </div>
    </div>
  );
}
