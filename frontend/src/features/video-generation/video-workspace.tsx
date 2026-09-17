"use client";

import { AlertTriangle, BookOpen, Clapperboard, Download, ExternalLink, History, ImagePlus, RefreshCw, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";

import { MediaPreview } from "@/components/generation/media-preview";
import { StatusBadge } from "@/components/generation/status-badge";
import { GenerationTile } from "@/components/history/generation-tile";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadUrl, ratioToStyle } from "@/lib/media";
import type { Generation, ModelSpec } from "@/types/generation";

interface VideoWorkspaceProps {
  items: Generation[];
  loading: boolean;
  modelById: (id: string) => ModelSpec | undefined;
  onOpen: (generation: Generation) => void;
  onRetry: (generation: Generation) => void;
  retrying?: boolean;
}

/** Main column: History (latest clip featured + earlier clips) or the "How it works" explainer. */
export function VideoWorkspace({ items, loading, modelById, onOpen, onRetry, retrying }: VideoWorkspaceProps) {
  // Default follows the data (explainer when empty); an explicit click wins until the next submission
  // (the generator remounts this component then, so a fresh result is always visible).
  const [userTab, setUserTab] = useState<"history" | "how" | null>(null);
  const tab = userTab ?? (items.length ? "history" : "how");
  const [latest, ...rest] = items;

  return (
    <section className="min-w-0 rounded-3xl border border-border bg-surface p-3 sm:p-4" aria-label="Video workspace">
      <Tabs value={tab} onValueChange={(v) => setUserTab(v as "history" | "how")}>
        <TabsList>
          <TabsTrigger value="history">
            <History className="size-3.5" aria-hidden />
            History
          </TabsTrigger>
          <TabsTrigger value="how">
            <BookOpen className="size-3.5" aria-hidden />
            How it works
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {tab === "how" || (!loading && items.length === 0) ? (
          <HowItWorks />
        ) : loading ? (
          <div className="aspect-video w-full rounded-2xl skeleton-shimmer" aria-busy="true" aria-label="Loading videos" />
        ) : (
          <div className="space-y-6">
            <FeaturedGeneration generation={latest} model={modelById(latest.model_id)} onOpen={onOpen} onRetry={onRetry} retrying={retrying} />
            {rest.length ? (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">Earlier</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {rest.map((generation) => (
                    <GenerationTile
                      key={generation.id}
                      generation={generation}
                      model={modelById(generation.model_id)}
                      onOpen={onOpen}
                      onRetry={onRetry}
                      retrying={retrying}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
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

function FeaturedGeneration({
  generation,
  model,
  onOpen,
  onRetry,
  retrying,
}: {
  generation: Generation;
  model: ModelSpec | undefined;
  onOpen: (g: Generation) => void;
  onRetry: (g: Generation) => void;
  retrying?: boolean;
}) {
  const asset = generation.assets[0];
  const active = generation.status === "queued" || generation.status === "processing";
  const elapsed = useElapsed(generation.created_at);
  const ratio = generation.settings.aspect_ratio ?? "16:9";
  const filename = `higgsfield-${generation.id.slice(0, 8)}`;

  return (
    <article aria-label="Latest video" className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      <div className="relative w-full bg-black" style={asset?.width && asset.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : ratioToStyle(ratio)}>
        {asset ? (
          <MediaPreview asset={asset} alt={generation.prompt} mode="full" />
        ) : (
          <div role={active ? "status" : "alert"} aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {active ? (
              <>
                <span className="size-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden />
                <p className="text-base font-semibold">
                  {generation.status === "queued" ? "Queued" : `Generating with ${model?.name ?? generation.model_id}`}…
                </p>
                <p className="max-w-sm text-sm text-text-secondary">
                  Video clips take a minute or two on the free GPU tier. You can keep browsing — the result is saved to your History.
                </p>
                <p className="text-xs tabular-nums text-text-muted">{elapsed}s</p>
              </>
            ) : (
              <>
                <AlertTriangle className="size-8 text-danger" aria-hidden />
                <p className="text-base font-semibold">Generation failed</p>
                <p className="max-w-md text-sm text-text-secondary">{generation.error_message ?? "Something went wrong."}</p>
                <Button size="sm" onClick={() => onRetry(generation)} loading={retrying}>
                  <RefreshCw className="size-3.5" aria-hidden />
                  Retry
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={generation.status} />
            <span className="text-xs text-text-secondary">
              {model?.name ?? generation.model_id} · {generation.settings.duration_s ?? "?"}s · {ratio}
              {generation.settings.reference_asset_id ? " · image to video" : ""}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm">{generation.prompt}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {asset ? (
            <>
              <Button asChild variant="white" size="sm">
                <a href={downloadUrl(asset.url, filename)} download={filename}>
                  <Download className="size-3.5" aria-hidden />
                  Download
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={asset.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" aria-hidden />
                  Open
                </a>
              </Button>
            </>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => onOpen(generation)}>
            Details
          </Button>
        </div>
      </div>
    </article>
  );
}

const steps = [
  {
    icon: ImagePlus,
    title: "Add image",
    text: "Optionally upload an image to animate, or start from a prompt alone.",
    art: "radial-gradient(90% 80% at 30% 30%, #2f7cff 0%, transparent 60%), linear-gradient(180deg, #0f1a2e, #0a0d14)",
  },
  {
    icon: Wand2,
    title: "Write a prompt",
    text: "Describe the motion, camera and mood. Pick a clip length and aspect ratio.",
    art: "radial-gradient(90% 80% at 70% 30%, #ff2d8a 0%, transparent 60%), linear-gradient(180deg, #2a0f1c, #120609)",
  },
  {
    icon: Clapperboard,
    title: "Get video",
    text: "Generate and watch the clip appear here, saved automatically to History.",
    art: "radial-gradient(90% 80% at 50% 40%, #d6ff00 0%, transparent 60%), linear-gradient(180deg, #1d2405, #0b0d04)",
  },
];

/** "Make videos in one click" explainer from the reference workspace. */
function HowItWorks() {
  return (
    <div className="px-1 py-4 sm:px-4 sm:py-8">
      <h1 className="display-heading text-3xl sm:text-5xl">Make videos in one click</h1>
      <p className="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
        Turn a prompt or a still image into a short clip with LTX Video. Add references, describe the motion, and generate.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
            <div className="flex aspect-[4/3] items-center justify-center" style={{ backgroundImage: step.art }}>
              <step.icon className="size-10 text-white/90" aria-hidden />
            </div>
            <div className="p-4">
              <h3 className="display-heading text-lg">{step.title}</h3>
              <p className="mt-1.5 text-sm text-text-secondary">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
