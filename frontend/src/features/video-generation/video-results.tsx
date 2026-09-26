"use client";

import { Download, ExternalLink, Maximize2 } from "lucide-react";
import { useState } from "react";

import {
  FailedAnnotation,
  GenerationGroupFrame,
  PendingPlate,
  type GroupActions,
} from "@/components/generation/generation-group-frame";
import { MediaPreview } from "@/components/generation/media-preview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { downloadUrl, ratioToStyle } from "@/lib/media";
import type { Generation, ModelSpec } from "@/types/generation";

interface VideoResultsProps extends GroupActions {
  items: Generation[];
  loading: boolean;
  modelById: (id: string) => ModelSpec | undefined;
  onOpen: (generation: Generation) => void;
}

/** Results canvas: the clips this account has made, newest first, plus a quiet explainer tab. */
export function VideoResults({ items, loading, modelById, onOpen, onReusePrompt, onRetry, retrying }: VideoResultsProps) {
  // Default follows the data (explainer when empty); an explicit click wins until the next
  // submission — the generator remounts this component then, so a fresh clip is always visible.
  const [userTab, setUserTab] = useState<"history" | "how" | null>(null);
  const tab = userTab ?? (items.length ? "history" : "how");

  return (
    <section className="min-w-0" aria-label="Video workspace">
      <Tabs value={tab} onValueChange={(v) => setUserTab(v as "history" | "how")}>
        <TabsList className="h-auto rounded-none border-0 bg-transparent p-0">
          <TabsTrigger value="history" className="rounded-none px-0 pb-2 pr-5 data-[state=active]:bg-transparent data-[state=active]:text-accent-text">
            Your clips
          </TabsTrigger>
          <TabsTrigger value="how" className="rounded-none px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:text-accent-text">
            How it works
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {tab === "how" || (!loading && items.length === 0) ? (
          <HowItWorks empty={items.length === 0} />
        ) : loading ? (
          <div className="border-t border-border-subtle pt-4">
            <div className="h-3 w-56 skeleton-shimmer" />
            <div className="mt-4 aspect-video max-w-[46rem] skeleton-shimmer" aria-busy="true" aria-label="Loading videos" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {items.map((generation) => (
              <VideoGroup
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

/** Portrait clips would otherwise tower over the canvas, so each ratio gets its own ceiling. */
const WIDTH_BY_RATIO: Record<string, string> = {
  "16:9": "max-w-[46rem]",
  "1:1": "max-w-[30rem]",
  "9:16": "max-w-[19rem]",
};

function VideoGroup({
  generation,
  model,
  onOpen,
  onReusePrompt,
  onRetry,
  retrying,
}: { generation: Generation; model: ModelSpec | undefined; onOpen: (g: Generation) => void } & GroupActions) {
  const asset = generation.assets[0];
  const ratio = generation.settings.aspect_ratio ?? "16:9";
  const pending = generation.status === "queued" || generation.status === "processing";
  const failed = generation.status === "failed" || (generation.status === "completed" && !asset);
  const seconds = generation.settings.duration_s;
  const filename = `higgsfield-${generation.id.slice(0, 8)}.mp4`;
  const meta = [seconds ? `${seconds}s` : null, ratio, generation.settings.reference_asset_id ? "image to video" : null]
    .filter((v): v is string => Boolean(v));

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
        <div className={WIDTH_BY_RATIO[ratio] ?? WIDTH_BY_RATIO["16:9"]}>
          <PendingPlate
            generation={generation}
            model={model}
            ratio={ratio}
            note="Clips take a minute or two on the free GPU tier. You can keep working — the result lands here and in your archive."
          />
        </div>
      ) : (
        <figure className={WIDTH_BY_RATIO[ratio] ?? WIDTH_BY_RATIO["16:9"]}>
          <div
            className="relative overflow-hidden border border-border-subtle bg-black"
            style={asset.width && asset.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : ratioToStyle(ratio)}
          >
            {/* MediaPreview renders a poster with native controls and never autoplays. */}
            <MediaPreview asset={asset} alt={generation.prompt} mode="full" />
          </div>
          <figcaption className="mt-1.5 flex items-center gap-1">
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
                <a href={downloadUrl(asset.url, filename)} download={filename} aria-label={`Download clip: ${generation.prompt}`}>
                  <Download className="size-3.5" />
                </a>
              </Button>
            </Tooltip>
            <Tooltip content="Open original">
              <Button asChild size="icon" variant="ghost" className="size-7 rounded-none">
                <a href={asset.url} target="_blank" rel="noreferrer" aria-label={`Open original clip: ${generation.prompt}`}>
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </Tooltip>
          </figcaption>
        </figure>
      )}
    </GenerationGroupFrame>
  );
}

const STEPS = [
  { n: "01", title: "Add a frame", text: "Optionally upload an image to animate, or start from a prompt alone." },
  { n: "02", title: "Describe the motion", text: "Say what moves and how the camera behaves, then pick a length and ratio." },
  { n: "03", title: "Generate", text: "The clip appears here when it is ready and is saved to your archive." },
];

function HowItWorks({ empty }: { empty: boolean }) {
  return (
    <div className="py-6">
      {empty ? (
        <>
          <h2 className="editorial-display text-4xl sm:text-5xl">Give the idea motion.</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-foreground-muted">
            Write a prompt in the rail, or attach a still to animate. Clips are short by design —
            two to five seconds on the free tier.
          </p>
        </>
      ) : null}
      <ol className="mt-8 grid gap-px border border-border-subtle bg-border-subtle sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.n} className="bg-surface p-4">
            <span className="editorial-label">{step.n}</span>
            <h3 className="mt-2 text-[15px] font-medium text-foreground">{step.title}</h3>
            <p className="mt-1 text-[13px] leading-snug text-foreground-muted">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
