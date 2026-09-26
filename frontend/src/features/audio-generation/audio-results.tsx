"use client";

import { Download, ExternalLink, Maximize2 } from "lucide-react";

import {
  FailedAnnotation,
  GenerationGroupFrame,
  PendingRow,
  type GroupActions,
} from "@/components/generation/generation-group-frame";
import { Waveform } from "@/components/generation/waveform";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DOWNLOAD_PREFIX, downloadUrl } from "@/lib/media";
import type { Asset, Generation, ModelSpec } from "@/types/generation";

interface AudioResultsProps extends GroupActions {
  items: Generation[];
  loading: boolean;
  modelById: (id: string) => ModelSpec | undefined;
  onOpen: (generation: Generation) => void;
}

/**
 * Takes list: every generation gets the same treatment, newest first, in the order the API
 * returns. There is no featured latest take — a take is a take, and a uniform list makes
 * comparing two readings of the same script far easier than one large card plus thumbnails.
 */
export function AudioResults({ items, loading, modelById, onOpen, onReusePrompt, onRetry, retrying }: AudioResultsProps) {
  return (
    <section className="min-w-0" aria-label="Audio takes">
      <h2 className="editorial-label border-b border-border-subtle pb-3">Takes</h2>

      <div className="mt-6 max-w-[56rem]">
        {loading ? (
          <div className="border-t border-border-subtle pt-4" aria-busy="true" aria-label="Loading audio">
            <div className="h-3 w-56 skeleton-shimmer" />
            <div className="mt-4 h-20 skeleton-shimmer" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-8">
            {items.map((generation) => (
              <AudioGroup
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

function AudioGroup({
  generation,
  model,
  onOpen,
  onReusePrompt,
  onRetry,
  retrying,
}: { generation: Generation; model: ModelSpec | undefined; onOpen: (g: Generation) => void } & GroupActions) {
  const pending = generation.status === "queued" || generation.status === "processing";
  const failed = generation.status === "failed" || (generation.status === "completed" && generation.assets.length === 0);
  const voice = model?.voices.find((v) => v.id === generation.settings.voice)?.name;
  const language = model?.languages.find((l) => l.code === generation.settings.language)?.name;
  const meta = [voice, language, generation.settings.style_prompt ? "styled" : null].filter(
    (value): value is string => Boolean(value),
  );

  return (
    <GenerationGroupFrame
      generation={generation}
      model={model}
      meta={meta}
      showActions={!pending}
      onReusePrompt={onReusePrompt}
      onRetry={onRetry}
      retrying={retrying}
    >
      {failed ? (
        <FailedAnnotation generation={generation} onReusePrompt={onReusePrompt} onRetry={onRetry} retrying={retrying} />
      ) : pending ? (
        <PendingRow generation={generation} model={model} />
      ) : (
        // One request can produce several takes; they stay grouped under their generation.
        <div className="flex flex-col gap-2">
          {generation.assets.map((asset, index) => (
            <TakeRow
              key={asset.id}
              asset={asset}
              generation={generation}
              index={index}
              total={generation.assets.length}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </GenerationGroupFrame>
  );
}

function TakeRow({
  asset,
  generation,
  index,
  total,
  onOpen,
}: {
  asset: Asset;
  generation: Generation;
  index: number;
  total: number;
  onOpen: (g: Generation) => void;
}) {
  const seconds = asset.duration_ms ? Math.round(asset.duration_ms / 1000) : null;
  const filename = `${DOWNLOAD_PREFIX}-${generation.id.slice(0, 8)}${total > 1 ? `-${index + 1}` : ""}.mp3`;

  return (
    <figure className="border border-border-subtle bg-surface p-3">
      <div className="flex items-center gap-3">
        {total > 1 ? <span className="editorial-label shrink-0 tabular-nums">{String(index + 1).padStart(2, "0")}</span> : null}
        {/* Decorative: a deterministic pattern seeded from the asset id, not measured audio. */}
        <div className="h-8 min-w-0 flex-1">
          <Waveform seed={asset.id} bars={40} />
        </div>
        {seconds !== null ? (
          <span className="shrink-0 text-[11px] tabular-nums text-foreground-subtle">{seconds}s</span>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {/* Native controls, never autoplayed: audio only ever plays on a deliberate click. */}
        <audio
          src={asset.url}
          controls
          preload="metadata"
          aria-label={`Take ${index + 1} of ${total}: ${generation.prompt}`}
          className="h-9 min-w-0 flex-1 basis-56"
        />
        <span className="flex shrink-0 items-center gap-1">
          <Tooltip content="Details">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-none"
              onClick={() => onOpen(generation)}
              aria-label={`Open details: ${generation.prompt}`}
            >
              <Maximize2 className="size-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content="Download">
            <Button asChild size="icon" variant="ghost" className="size-7 rounded-none">
              <a href={downloadUrl(asset.url, filename)} download={filename} aria-label={`Download take: ${generation.prompt}`}>
                <Download className="size-3.5" />
              </a>
            </Button>
          </Tooltip>
          <Tooltip content="Open original">
            <Button asChild size="icon" variant="ghost" className="size-7 rounded-none">
              <a href={asset.url} target="_blank" rel="noreferrer" aria-label={`Open original audio: ${generation.prompt}`}>
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </Tooltip>
        </span>
      </div>
    </figure>
  );
}

function EmptyState() {
  return (
    <div className="py-6">
      <h3 className="editorial-display text-4xl sm:text-5xl">Give the words a voice.</h3>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-foreground-muted">
        Write a script in the rail and pick a model. Each take lands here with its own player and
        is saved to your archive.
      </p>
      {/* Recording-line motif: three quiet rules standing in for empty takes. */}
      <div className="mt-10 flex max-w-sm flex-col gap-4" aria-hidden>
        {[0.9, 0.55, 0.3].map((width) => (
          <span key={width} className="h-px bg-border-default" style={{ width: `${width * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
