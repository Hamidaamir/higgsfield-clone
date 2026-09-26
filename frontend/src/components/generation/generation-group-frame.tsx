"use client";

import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { relativeTime } from "@/lib/format";
import { ratioToStyle } from "@/lib/media";
import type { Generation, ModelSpec } from "@/types/generation";

/**
 * Presentation shared by the Image and Video results canvases. Only the pieces that are
 * genuinely identical live here — the group frame, the pending placeholder and the failure
 * annotation. Each studio still owns how its own media is laid out.
 */

export interface GroupActions {
  onReusePrompt: (generation: Generation) => void;
  onRetry: (generation: Generation) => void;
  retrying?: boolean;
}

interface GenerationGroupFrameProps extends GroupActions {
  generation: Generation;
  model: ModelSpec | undefined;
  /** Short facts shown after the model name, e.g. ["16:9", "4 images"] or ["3s", "16:9"]. */
  meta: string[];
  /** Reuse/retry are hidden while a generation is still running. */
  showActions: boolean;
  children: ReactNode;
}

export function GenerationGroupFrame({
  generation,
  model,
  meta,
  showActions,
  onReusePrompt,
  onRetry,
  retrying,
  children,
}: GenerationGroupFrameProps) {
  return (
    <article
      className="border-t border-border-subtle pt-4"
      aria-label={`${model?.name ?? generation.model_id}: ${generation.prompt}`}
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3">
        <p className="min-w-0 flex-1 truncate text-[13px] text-foreground" title={generation.prompt}>
          {generation.prompt}
        </p>
        <p className="flex shrink-0 items-center gap-1.5 text-[11px] text-foreground-subtle">
          <span>{model?.name ?? generation.model_id}</span>
          {meta.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <span aria-hidden>·</span>
              <span>{item}</span>
            </span>
          ))}
          <span aria-hidden>·</span>
          <time dateTime={generation.created_at}>{relativeTime(generation.created_at)}</time>
        </p>
        {showActions ? (
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
      {children}
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

/**
 * Aspect-correct placeholder for a running generation. The API reports no progress figure,
 * so only the real status and elapsed time are shown — no fake percentage or ETA.
 */
export function PendingPlate({
  generation,
  model,
  ratio,
  note,
}: {
  generation: Generation;
  model: ModelSpec | undefined;
  ratio: string;
  /** Optional honest context, e.g. how long the free video tier usually takes. */
  note?: string;
}) {
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
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
        <span className="editorial-label text-accent-text">{queued ? "Queued" : "Generating"}</span>
        <span className="text-[11px] tabular-nums text-foreground-subtle">{elapsed}s</span>
        {note ? <span className="w-full text-[11px] leading-snug text-foreground-muted">{note}</span> : null}
      </div>
    </div>
  );
}

/** A failed request stays in the feed as an annotation carrying the API's normalised message. */
export function FailedAnnotation({
  generation,
  onReusePrompt,
  onRetry,
  retrying,
}: { generation: Generation } & GroupActions) {
  return (
    <div role="alert" className="flex max-w-[26rem] flex-col gap-3 border border-danger/40 bg-danger/5 p-4">
      <AlertTriangle className="size-5 text-danger" aria-hidden />
      <div>
        <p className="text-sm font-medium text-foreground">Generation failed</p>
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
