"use client";

import { Download, Maximize2 } from "lucide-react";
import Image from "next/image";

import {
  FailedAnnotation,
  GenerationGroupFrame,
  PendingPlate,
  type GroupActions,
} from "@/components/generation/generation-group-frame";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DOWNLOAD_PREFIX, aspectRatioStyle, downloadUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Asset, Generation, ModelSpec } from "@/types/generation";

export interface GenerationGroupActions extends GroupActions {
  onOpen: (generation: Generation, asset: Asset) => void;
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
 * One image request rendered as a contact-sheet entry: a thin metadata rule, the plates it
 * produced, and its actions. Keeping the generation as the unit (rather than flattening
 * assets into a grid) is what makes a batch readable as "one prompt, four takes".
 */
export function GenerationGroup({ generation, model, onOpen, onReusePrompt, onRetry, retrying }: GenerationGroupProps) {
  const ratio = generation.settings.aspect_ratio ?? "1:1";
  const batch = generation.settings.batch_size ?? 1;
  const pending = generation.status === "queued" || generation.status === "processing";
  const failed = generation.status === "failed" || (generation.status === "completed" && generation.assets.length === 0);
  const plates = pending ? batch : generation.assets.length;
  const columns = Math.min(Math.max(plates, 1), 4);

  return (
    <GenerationGroupFrame
      generation={generation}
      model={model}
      meta={batch > 1 ? [ratio, `${batch} images`] : [ratio]}
      showActions={!pending}
      onReusePrompt={onReusePrompt}
      onRetry={onRetry}
      retrying={retrying}
    >
      {failed ? (
        <FailedAnnotation generation={generation} onReusePrompt={onReusePrompt} onRetry={onRetry} retrying={retrying} />
      ) : (
        <div className={cn("grid gap-3", GRID_BY_COUNT[columns], WIDTH_BY_COUNT[columns])}>
          {pending
            ? Array.from({ length: batch }, (_, i) => (
                <PendingPlate key={`${generation.id}-${i}`} generation={generation} model={model} ratio={ratio} />
              ))
            : generation.assets.map((asset) => (
                <ResultPlate key={asset.id} generation={generation} asset={asset} onOpen={onOpen} columns={columns} />
              ))}
        </div>
      )}
    </GenerationGroupFrame>
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
  const filename = `${DOWNLOAD_PREFIX}-${generation.id.slice(0, 8)}.png`;
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
