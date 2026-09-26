"use client";

import { AlertTriangle, ArrowRight, AudioLines } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { GenerationTypeIcon, typeLabel } from "@/components/generation/generation-type-icon";
import { MediaPreview } from "@/components/generation/media-preview";
import { StatusBadge } from "@/components/generation/status-badge";
import { Waveform } from "@/components/generation/waveform";
import { Button } from "@/components/ui/button";
import {
  useActiveGenerationPolling,
  useGenerationList,
  useModels,
  useRegenerate,
} from "@/hooks/use-generations";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { relativeTime } from "@/lib/format";
import { reuseHref } from "@/lib/generation-links";
import { studioItems } from "@/lib/config/navigation";
import { ContactSheet, Section } from "@/features/create/section";
import { cn } from "@/lib/utils";
import type { Generation } from "@/types/generation";

const RECENT_PARAMS: ListGenerationsParams = { limit: 6 };

/**
 * Recent Creations for signed-in users; `fallback` (a server-rendered curated showcase) for
 * everyone else. One component owns the switch so anonymous visitors never trigger a request
 * to the authenticated generations endpoint.
 */
export function RecentWork({ fallback }: { fallback: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <RecentSkeleton />;
  if (!user) return <>{fallback}</>;
  return <SignedInRecentWork />;
}

function SignedInRecentWork() {
  const listQuery = useGenerationList(RECENT_PARAMS);
  const modelsQuery = useModels();
  const regenerate = useRegenerate();
  const [detail, setDetail] = useState<Generation | null>(null);

  const items = listQuery.data?.items ?? [];
  // Reuses the shared poller: queued/processing items refresh in place, no second system.
  useActiveGenerationPolling(items);
  const live = detail ? (items.find((g) => g.id === detail.id) ?? detail) : null;
  const modelById = (id: string) => modelsQuery.data?.find((m) => m.id === id);

  const onRegenerate = (generation: Generation) => {
    setDetail(null);
    regenerate.mutate(generation.id, {
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "Could not start that generation again."),
    });
  };

  return (
    <Section
      title="Recent creations"
      action={
        items.length > 0 ? (
          <Link
            href="/history"
            className="group inline-flex items-center gap-1.5 text-[13px] text-foreground-muted transition-colors hover:text-accent-text"
          >
            View archive
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ) : null
      }
    >
      {listQuery.isPending ? (
        <ContactSheet>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[4/5] skeleton-shimmer" />
          ))}
        </ContactSheet>
      ) : listQuery.isError ? (
        <div className="border border-border-subtle px-6 py-12 text-center">
          <p className="text-sm text-foreground-muted">Your recent work could not be loaded.</p>
          <Button variant="outline" size="sm" className="mt-4 rounded-none" onClick={() => listQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <ContactSheet>
          {items.map((generation) => (
            <RecentTile key={generation.id} generation={generation} onOpen={setDetail} />
          ))}
        </ContactSheet>
      )}

      <GenerationDetailDialog
        generation={live}
        model={live ? modelById(live.model_id) : undefined}
        onClose={() => setDetail(null)}
        onReusePrompt={(generation) => {
          setDetail(null);
          window.location.assign(reuseHref(generation, modelsQuery.data));
        }}
        onRegenerate={onRegenerate}
        regenerating={regenerate.isPending}
      />
    </Section>
  );
}

function RecentSkeleton() {
  return (
    <Section title="Recent creations">
      <ContactSheet>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[4/5] skeleton-shimmer" />
        ))}
      </ContactSheet>
    </Section>
  );
}

function RecentTile({ generation, onOpen }: { generation: Generation; onOpen: (g: Generation) => void }) {
  const cover = generation.assets[0];
  const pending = generation.status === "queued" || generation.status === "processing";
  const failed = generation.status === "failed" || (generation.status === "completed" && !cover);

  return (
    <article className="group min-w-0">
      <button
        type="button"
        onClick={() => onOpen(generation)}
        className={cn(
          "relative block w-full overflow-hidden border border-border-subtle bg-surface-subtle transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          pending && "skeleton-shimmer",
        )}
        style={{ aspectRatio: "4 / 5" }}
        aria-label={`Open details: ${generation.prompt}`}
      >
        {cover && cover.media_type === "audio" ? (
          <AudioPlate seed={cover.id} seconds={cover.duration_ms ? Math.round(cover.duration_ms / 1000) : null} />
        ) : cover ? (
          <MediaPreview
            asset={cover}
            alt={generation.prompt}
            mode="tile"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
            {failed ? (
              <>
                <AlertTriangle className="size-5 text-danger" aria-hidden />
                <span className="text-[13px] font-medium text-foreground">Didn&apos;t finish</span>
              </>
            ) : (
              <span className="editorial-label">{generation.status === "queued" ? "Queued" : "Working"}</span>
            )}
          </span>
        )}
        <span className="grain pointer-events-none absolute inset-0" aria-hidden />
        {generation.status !== "completed" ? (
          <span className="absolute left-2 top-2">
            <StatusBadge status={generation.status} />
          </span>
        ) : null}
      </button>

      <div className="mt-2.5 min-w-0">
        <p className="truncate text-[13px] text-foreground" title={generation.prompt}>
          {generation.prompt}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground-subtle">
          <GenerationTypeIcon type={generation.type} className="size-3" />
          <span>{typeLabel(generation.type)}</span>
          <span aria-hidden>·</span>
          <time dateTime={generation.created_at}>{relativeTime(generation.created_at)}</time>
        </p>
      </div>
    </article>
  );
}

/**
 * Audio has no frame to show, so it gets its own plate: a type mark over a decorative
 * waveform seeded from the asset id. It represents nothing measured and claims nothing.
 */
function AudioPlate({ seed, seconds }: { seed: string; seconds: number | null }) {
  return (
    <span className="absolute inset-0 flex flex-col justify-between bg-surface p-3">
      <AudioLines className="size-5 text-accent-text" aria-hidden />
      <Waveform seed={seed} bars={18} className="h-12 w-full" />
      <span className="text-[11px] tabular-nums text-foreground-subtle">
        {seconds !== null ? `${seconds}s` : "Audio"}
      </span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="border border-border-subtle px-6 py-14 text-center">
      <p className="editorial-display text-2xl">Nothing here yet.</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-foreground-muted">
        Everything you generate is kept here and in your archive. Pick somewhere to start.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {studioItems.slice(0, 3).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border-b border-border-default pb-0.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent-text"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
