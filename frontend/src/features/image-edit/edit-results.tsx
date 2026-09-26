"use client";

import { ArrowRight, Download, ExternalLink, Maximize2 } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  FailedAnnotation,
  GenerationGroupFrame,
  PendingPlate,
  type GroupActions,
} from "@/components/generation/generation-group-frame";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useAsset } from "@/hooks/use-asset";
import { downloadUrl } from "@/lib/media";
import type { Asset, Generation, ModelSpec } from "@/types/generation";

/** Both halves of a comparison sit in a plate of the same height, like two prints hung level. */
const PLATE =
  "relative flex h-56 items-center justify-center overflow-hidden border border-border-subtle bg-surface-subtle sm:h-64 lg:h-[21rem]";

interface EditResultsProps extends GroupActions {
  items: Generation[];
  loading: boolean;
  modelById: (id: string) => ModelSpec | undefined;
  onOpen: (generation: Generation, assetIndex: number) => void;
}

/**
 * Edits read as comparisons, so every generation is a diptych: the image it started from
 * beside what the model returned. Nothing is ever shown on the BEFORE side except the real
 * reference asset the edit was actually made from.
 */
export function EditResults({ items, loading, modelById, onOpen, onReusePrompt, onRetry, retrying }: EditResultsProps) {
  return (
    <section className="min-w-0" aria-label="Edits">
      <h2 className="editorial-label border-b border-border-subtle pb-3">Edits</h2>

      <div className="mt-6">
        {loading ? (
          <div className="max-w-[52rem] border-t border-border-subtle pt-4" aria-busy="true" aria-label="Loading edits">
            <div className="h-3 w-56 skeleton-shimmer" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="aspect-square skeleton-shimmer" />
              <div className="aspect-square skeleton-shimmer" />
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-8">
            {items.map((generation) => (
              <EditDiptych
                key={generation.id}
                generation={generation}
                model={modelById(generation.model_id)}
                onOpen={onOpen}
                onReusePrompt={onReusePrompt}
                onRetry={onRetry}
                retrying={retrying}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EditDiptych({
  generation,
  model,
  onOpen,
  onReusePrompt,
  onRetry,
  retrying,
}: {
  generation: Generation;
  model: ModelSpec | undefined;
  onOpen: EditResultsProps["onOpen"];
} & GroupActions) {
  const ratio = generation.settings.aspect_ratio ?? "1:1";
  const pending = generation.status === "queued" || generation.status === "processing";
  const failed = generation.status === "failed" || (generation.status === "completed" && generation.assets.length === 0);
  // The reference is fetched by id through the assets API, which enforces ownership.
  const reference = useAsset(generation.settings.reference_asset_id as string | undefined);
  const result = generation.assets[0];

  return (
    <GenerationGroupFrame
      generation={generation}
      model={model}
      meta={[ratio]}
      showActions={!pending}
      onReusePrompt={onReusePrompt}
      onRetry={onRetry}
      retrying={retrying}
    >
      {/* One row on a phone, two columns from `sm` up: never two thumbnails squeezed side by side. */}
      <div className="grid max-w-[52rem] gap-3 sm:grid-cols-2">
        <Panel label="Before">
          <div className={PLATE}>
            {reference.data ? (
              <Image
                src={reference.data.thumbnail_url ?? reference.data.url}
                alt={`Before the edit: ${generation.prompt}`}
                fill
                unoptimized={!(reference.data.thumbnail_url ?? reference.data.url).includes("res.cloudinary.com")}
                sizes="(max-width: 640px) 100vw, 26vw"
                className="object-contain"
              />
            ) : reference.isError ? (
              <p className="p-4 text-center text-[13px] text-foreground-muted">The original image is no longer available.</p>
            ) : (
              <span className="absolute inset-0 skeleton-shimmer" aria-label="Loading the original" />
            )}
          </div>
        </Panel>

        <Panel label="After" arrow>
          {failed ? (
            <FailedAnnotation generation={generation} onReusePrompt={onReusePrompt} onRetry={onRetry} retrying={retrying} />
          ) : pending ? (
            <PendingPlate generation={generation} model={model} ratio={ratio} />
          ) : result ? (
            <ResultPanel generation={generation} asset={result} onOpen={onOpen} />
          ) : null}
        </Panel>
      </div>
    </GenerationGroupFrame>
  );
}

/** Before/after is stated, not implied by position, so it survives a screen reader and a stacked phone layout. */
function Panel({ label, arrow, children }: { label: string; arrow?: boolean; children: ReactNode }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 flex items-center gap-1 editorial-label">
        {arrow ? <ArrowRight className="size-3 text-foreground-subtle" aria-hidden /> : null}
        {label}
      </figcaption>
      {children}
    </figure>
  );
}

function ResultPanel({
  generation,
  asset,
  onOpen,
}: {
  generation: Generation;
  asset: Asset;
  onOpen: EditResultsProps["onOpen"];
}) {
  const filename = `higgsfield-edit-${generation.id.slice(0, 8)}.png`;
  const index = Math.max(0, generation.assets.findIndex((a) => a.id === asset.id));
  return (
    <>
      <button
        type="button"
        onClick={() => onOpen(generation, index)}
        className={`${PLATE} w-full transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
        aria-label={`Open the edited image: ${generation.prompt}`}
      >
        <Image
          src={asset.thumbnail_url ?? asset.url}
          alt={`After the edit: ${generation.prompt}`}
          fill
          unoptimized={!(asset.thumbnail_url ?? asset.url).includes("res.cloudinary.com")}
          sizes="(max-width: 640px) 100vw, 26vw"
          className="object-contain"
        />
      </button>
      <div className="mt-1.5 flex items-center gap-1">
        <Tooltip content="Details">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 rounded-none"
            onClick={() => onOpen(generation, index)}
            aria-label={`Open details: ${generation.prompt}`}
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </Tooltip>
        <Tooltip content="Download">
          <Button asChild size="icon" variant="ghost" className="size-7 rounded-none">
            <a href={downloadUrl(asset.url, filename)} download={filename} aria-label={`Download the edited image: ${generation.prompt}`}>
              <Download className="size-3.5" />
            </a>
          </Button>
        </Tooltip>
        <Tooltip content="Open original">
          <Button asChild size="icon" variant="ghost" className="size-7 rounded-none">
            <a href={asset.url} target="_blank" rel="noreferrer" aria-label={`Open the edited image at full size: ${generation.prompt}`}>
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </Tooltip>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="py-6">
      <h3 className="editorial-display text-4xl sm:text-5xl">Start with an image.</h3>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-foreground-muted">
        Upload a reference, then describe what you want to change. Each edit appears here beside the
        image it came from, and is saved to your archive.
      </p>
      {/* Two empty plates standing in for the pair every edit produces — no sample imagery. */}
      <div className="mt-10 grid max-w-md grid-cols-2 gap-3" aria-hidden>
        <div className="aspect-square border border-dashed border-border-default" />
        <div className="aspect-square border border-dashed border-border-subtle" />
      </div>
    </div>
  );
}
