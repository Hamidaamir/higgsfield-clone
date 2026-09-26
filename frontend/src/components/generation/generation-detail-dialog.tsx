"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, Download, ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { useState } from "react";

import { MediaPreview } from "@/components/generation/media-preview";
import { StatusBadge } from "@/components/generation/status-badge";
import { typeLabel } from "@/components/generation/generation-type-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime, formatDuration } from "@/lib/format";
import { DOWNLOAD_PREFIX, downloadUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Generation, ModelSpec } from "@/types/generation";

export interface GenerationDetailProps {
  generation: Generation | null;
  /** Which output to show first when the generation has several. */
  initialAssetIndex?: number;
  model: ModelSpec | undefined;
  onClose: () => void;
  onReusePrompt: (generation: Generation) => void;
  onRegenerate: (generation: Generation) => void;
  regenerating?: boolean;
}

/** Full-size viewer + metadata + actions for any generation type. Used by the generators and History. */
export function GenerationDetailDialog({
  generation,
  initialAssetIndex = 0,
  model,
  onClose,
  onReusePrompt,
  onRegenerate,
  regenerating,
}: GenerationDetailProps) {
  return (
    <Dialog open={generation !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid max-h-[calc(100vh-2rem)] max-w-6xl gap-0 overflow-hidden p-0 md:grid-cols-[1fr_320px]">
        {generation ? (
          <DetailBody
            key={generation.id}
            generation={generation}
            initialAssetIndex={initialAssetIndex}
            model={model}
            onReusePrompt={onReusePrompt}
            onRegenerate={onRegenerate}
            regenerating={regenerating}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({
  generation,
  initialAssetIndex,
  model,
  onReusePrompt,
  onRegenerate,
  regenerating,
}: Omit<GenerationDetailProps, "generation" | "onClose"> & { generation: Generation }) {
  const [index, setIndex] = useState(Math.min(initialAssetIndex ?? 0, Math.max(0, generation.assets.length - 1)));
  const asset = generation.assets[index];
  const failed = generation.status === "failed";
  const active = generation.status === "queued" || generation.status === "processing";
  const filename = `${DOWNLOAD_PREFIX}-${generation.id.slice(0, 8)}-${index + 1}`;
  const duration = formatDuration(generation.started_at, generation.completed_at);

  return (
    <>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-black text-white",
          generation.type === "audio" ? "min-h-[240px] md:min-h-[320px]" : "min-h-[40vh] md:min-h-[70vh]",
        )}
      >
        {asset ? (
          <MediaPreview asset={asset} alt={generation.prompt} mode="full" priority />
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            {failed ? (
              <AlertTriangle className="size-8 text-danger" aria-hidden />
            ) : (
              <span className="size-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden />
            )}
            <p className="text-sm font-semibold">{failed ? "Generation failed" : "Still generating…"}</p>
            <p className="max-w-sm text-sm text-white/70">
              {failed ? generation.error_message : "This result will appear here as soon as it is ready."}
            </p>
          </div>
        )}
        {generation.assets.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            <Button size="icon" variant="white" className="size-8 rounded-full" aria-label="Previous output" onClick={() => setIndex((i) => (i - 1 + generation.assets.length) % generation.assets.length)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
              {index + 1} / {generation.assets.length}
            </span>
            <Button size="icon" variant="white" className="size-8 rounded-full" aria-label="Next output" onClick={() => setIndex((i) => (i + 1) % generation.assets.length)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <aside className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto p-5 scrollbar-thin md:max-h-none">
        <div className="flex items-center gap-2">
          <StatusBadge status={generation.status} />
          <span className="text-xs text-text-secondary">{typeLabel(generation.type)}</span>
        </div>
        <div>
          <DialogTitle className="text-sm font-semibold text-text-secondary">
            {generation.type === "audio" ? "Script" : "Prompt"}
          </DialogTitle>
          <DialogDescription className="mt-1.5 max-h-40 overflow-y-auto text-sm leading-relaxed text-text-primary scrollbar-thin">
            {generation.prompt}
          </DialogDescription>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
          <dt className="text-text-secondary">Model</dt>
          <dd className="font-medium">{model?.name ?? generation.model_id}</dd>
          {asset?.width && asset.height ? (
            <>
              <dt className="text-text-secondary">Size</dt>
              <dd className="font-medium">
                {asset.width} × {asset.height}
              </dd>
            </>
          ) : null}
          {generation.settings.aspect_ratio ? (
            <>
              <dt className="text-text-secondary">Aspect</dt>
              <dd className="font-medium">{generation.settings.aspect_ratio}</dd>
            </>
          ) : null}
          {generation.settings.voice ? (
            <>
              <dt className="text-text-secondary">Voice</dt>
              <dd className="font-medium">
                {model?.voices.find((v) => v.id === generation.settings.voice)?.name ?? generation.settings.voice}
              </dd>
            </>
          ) : null}
          {generation.settings.language ? (
            <>
              <dt className="text-text-secondary">Language</dt>
              <dd className="font-medium">
                {model?.languages.find((l) => l.code === generation.settings.language)?.name ?? generation.settings.language}
              </dd>
            </>
          ) : null}
          {generation.settings.style_prompt ? (
            <>
              <dt className="text-text-secondary">Voice details</dt>
              <dd className="font-medium">{generation.settings.style_prompt}</dd>
            </>
          ) : null}
          {generation.settings.batch_size && generation.settings.batch_size > 1 ? (
            <>
              <dt className="text-text-secondary">Batch</dt>
              <dd className="font-medium">{generation.settings.batch_size}</dd>
            </>
          ) : null}
          <dt className="text-text-secondary">Created</dt>
          <dd className="font-medium">{formatDateTime(generation.created_at)}</dd>
          {duration ? (
            <>
              <dt className="text-text-secondary">Took</dt>
              <dd className="font-medium">{duration}</dd>
            </>
          ) : null}
          {failed && generation.error_message ? (
            <>
              <dt className="text-text-secondary">Error</dt>
              <dd className="font-medium text-danger">{generation.error_message}</dd>
            </>
          ) : null}
        </dl>
        <p className="truncate font-mono text-[10px] text-text-muted" title={generation.id}>
          id {generation.id}
        </p>

        <div className={cn("mt-auto flex flex-col gap-2", !asset && "pt-2")}>
          {asset ? (
            <>
              <Button asChild variant="white">
                <a href={downloadUrl(asset.url, filename)} download={filename}>
                  <Download className="size-4" aria-hidden />
                  Download
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={asset.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  Open original
                </a>
              </Button>
            </>
          ) : null}
          <Button variant="secondary" onClick={() => onReusePrompt(generation)}>
            <RotateCcw className="size-4" aria-hidden />
            Reuse prompt
          </Button>
          <Button onClick={() => onRegenerate(generation)} loading={regenerating} disabled={active}>
            <RefreshCw className="size-4" aria-hidden />
            {failed ? "Retry" : "Generate again"}
          </Button>
        </div>
      </aside>
    </>
  );
}
