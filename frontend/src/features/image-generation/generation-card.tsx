"use client";

import { AlertTriangle, Download, Maximize2, RefreshCw, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { aspectRatioStyle, downloadUrl, ratioToStyle } from "@/lib/media";
import type { Asset, Generation, ModelSpec } from "@/types/generation";

export interface GenerationActions {
  onOpen: (generation: Generation, asset: Asset) => void;
  onReusePrompt: (generation: Generation) => void;
  onRetry: (generation: Generation) => void;
  retrying?: boolean;
}

interface GenerationCardsProps extends GenerationActions {
  generation: Generation;
  model: ModelSpec | undefined;
}

/** Renders one generation as N cards (batch) in whichever state it is in. */
export function GenerationCards({ generation, model, ...actions }: GenerationCardsProps) {
  const ratio = generation.settings.aspect_ratio ?? "1:1";
  const batch = generation.settings.batch_size ?? 1;

  if (generation.status === "queued" || generation.status === "processing") {
    return (
      <>
        {Array.from({ length: batch }, (_, i) => (
          <ProcessingCard key={`${generation.id}-${i}`} generation={generation} model={model} ratio={ratio} />
        ))}
      </>
    );
  }
  if (generation.status === "completed" && generation.assets.length > 0) {
    return (
      <>
        {generation.assets.map((asset) => (
          <ResultCard key={asset.id} generation={generation} asset={asset} model={model} {...actions} />
        ))}
      </>
    );
  }
  return <FailedCard generation={generation} model={model} ratio={ratio} {...actions} />;
}

function useElapsed(since: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return Math.max(0, Math.round((now - new Date(since).getTime()) / 1000));
}

function ProcessingCard({ generation, model, ratio }: { generation: Generation; model?: ModelSpec; ratio: string }) {
  const elapsed = useElapsed(generation.created_at);
  const label = generation.status === "queued" ? "Queued" : `Generating with ${model?.name ?? generation.model_id}`;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="relative overflow-hidden rounded-2xl border border-border skeleton-shimmer"
      style={ratioToStyle(ratio)}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden />
        <p className="text-sm font-semibold text-text-primary">{label}…</p>
        <p className="text-xs tabular-nums text-text-secondary">{elapsed}s</p>
      </div>
      <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-6 text-xs text-white/80">
        {generation.prompt}
      </p>
    </div>
  );
}

function ResultCard({ generation, asset, model, onOpen, onReusePrompt, onRetry, retrying }: GenerationCardsProps & { asset: Asset }) {
  const filename = `higgsfield-${generation.id.slice(0, 8)}.png`;
  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-border bg-surface" style={aspectRatioStyle(asset.width, asset.height)}>
      <button
        type="button"
        onClick={() => onOpen(generation, asset)}
        className="absolute inset-0 block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        aria-label={`Open image: ${generation.prompt}`}
      >
        <Image
          src={asset.url}
          alt={generation.prompt}
          fill
          unoptimized={!asset.url.includes("res.cloudinary.com")}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </button>
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="line-clamp-2 text-xs text-white/90">{generation.prompt}</p>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <span className="mr-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
            {model?.name ?? generation.model_id}
          </span>
          <Tooltip content="Open">
            <Button size="icon" variant="white" className="size-8" onClick={() => onOpen(generation, asset)} aria-label="Open image">
              <Maximize2 className="size-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content="Download">
            <Button asChild size="icon" variant="white" className="size-8">
              <a href={downloadUrl(asset.url, filename)} download={filename} aria-label="Download image">
                <Download className="size-3.5" />
              </a>
            </Button>
          </Tooltip>
          <Tooltip content="Reuse prompt & settings">
            <Button size="icon" variant="white" className="size-8" onClick={() => onReusePrompt(generation)} aria-label="Reuse prompt">
              <RotateCcw className="size-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content="Generate again">
            <Button size="icon" className="size-8" onClick={() => onRetry(generation)} disabled={retrying} aria-label="Generate again">
              <RefreshCw className="size-3.5" />
            </Button>
          </Tooltip>
        </div>
      </figcaption>
    </figure>
  );
}

function FailedCard({ generation, model, ratio, onRetry, onReusePrompt, retrying }: GenerationCardsProps & { ratio: string }) {
  return (
    <div
      role="alert"
      className="relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-danger/40 bg-danger/5 p-4 text-center"
      style={ratioToStyle(ratio)}
    >
      <AlertTriangle className="size-6 text-danger" aria-hidden />
      <p className="text-sm font-semibold">Generation failed</p>
      <p className="line-clamp-3 text-xs text-text-secondary">{generation.error_message ?? "Something went wrong."}</p>
      <p className="text-[11px] text-text-muted">{model?.name ?? generation.model_id}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => onReusePrompt(generation)}>
          Edit prompt
        </Button>
        <Button size="sm" onClick={() => onRetry(generation)} loading={retrying}>
          <RefreshCw className="size-3.5" aria-hidden />
          Retry
        </Button>
      </div>
    </div>
  );
}
