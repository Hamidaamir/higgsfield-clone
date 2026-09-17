"use client";

import { AlertTriangle, BookOpen, Download, ExternalLink, History, Mic, PenLine, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { MediaPreview } from "@/components/generation/media-preview";
import { StatusBadge } from "@/components/generation/status-badge";
import { Waveform } from "@/components/generation/waveform";
import { GenerationTile } from "@/components/history/generation-tile";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadUrl } from "@/lib/media";
import type { Generation, ModelSpec } from "@/types/generation";

interface AudioWorkspaceProps {
  items: Generation[];
  loading: boolean;
  modelById: (id: string) => ModelSpec | undefined;
  onOpen: (generation: Generation) => void;
  onRetry: (generation: Generation) => void;
  retrying?: boolean;
}

/** Main column: History (latest take featured + earlier takes) or the "How it works" explainer. */
export function AudioWorkspace({ items, loading, modelById, onOpen, onRetry, retrying }: AudioWorkspaceProps) {
  const [userTab, setUserTab] = useState<"history" | "how" | null>(null);
  const tab = userTab ?? (items.length ? "history" : "how");
  const [latest, ...rest] = items;

  return (
    <section className="min-w-0 rounded-3xl border border-border bg-surface p-3 sm:p-4" aria-label="Audio workspace">
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
          <div className="h-56 w-full rounded-2xl skeleton-shimmer" aria-busy="true" aria-label="Loading audio" />
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
  const active = generation.status === "queued" || generation.status === "processing";
  const elapsed = useElapsed(generation.created_at);
  const voice = generation.settings.voice ? model?.voices.find((v) => v.id === generation.settings.voice)?.name : null;
  const language = generation.settings.language
    ? model?.languages.find((l) => l.code === generation.settings.language)?.name
    : null;

  return (
    <article aria-label="Latest audio" className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      {generation.assets.length ? (
        <ul className="divide-y divide-border">
          {generation.assets.map((asset, index) => (
            <li key={asset.id} className="relative h-40 sm:h-44">
              <MediaPreview asset={asset} alt={`${generation.prompt} (take ${index + 1})`} mode="full" />
              {generation.assets.length > 1 ? (
                <span className="absolute left-3 top-3 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  Take {index + 1}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div role={active ? "status" : "alert"} aria-live="polite" className="relative flex h-44 flex-col items-center justify-center gap-3 p-6 text-center">
          {active ? (
            <>
              <div className="absolute inset-x-6 top-1/2 h-12 -translate-y-1/2 opacity-30">
                <Waveform seed={generation.id} bars={48} className="h-full animate-pulse" />
              </div>
              <span className="relative size-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden />
              <p className="relative text-base font-semibold">
                {generation.status === "queued" ? "Queued" : `Synthesizing with ${model?.name ?? generation.model_id}`}…
              </p>
              <p className="relative text-xs tabular-nums text-text-muted">{elapsed}s</p>
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
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={generation.status} />
            <span className="text-xs text-text-secondary">
              {model?.name ?? generation.model_id}
              {voice ? ` · ${voice}` : ""}
              {language ? ` · ${language}` : ""}
              {generation.settings.style_prompt ? " · styled" : ""}
            </span>
          </div>
          <p className="mt-2 line-clamp-3 text-sm">{generation.prompt}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {generation.assets[0] ? (
            <>
              <Button asChild variant="white" size="sm">
                <a href={downloadUrl(generation.assets[0].url, `higgsfield-${generation.id.slice(0, 8)}`)} download>
                  <Download className="size-3.5" aria-hidden />
                  Download
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={generation.assets[0].url} target="_blank" rel="noreferrer">
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

/** "Turn text into speech" explainer from the reference workspace. */
function HowItWorks() {
  return (
    <div className="px-1 py-4 text-center sm:px-4 sm:py-10">
      <h1 className="display-heading text-3xl sm:text-5xl">Turn text into speech</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm text-text-secondary sm:text-base">
        Lifelike speech from any script — ready for your projects
      </p>
      <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
          <div className="p-5">
            <h3 className="text-lg font-semibold">Pick a voice</h3>
            <p className="mt-1.5 text-sm text-text-secondary">Choose a model and one of its voices — twelve expressive Aura voices, multilingual MeloTTS, or describe the delivery for Gemini.</p>
          </div>
          <div className="relative h-40 bg-[radial-gradient(80%_80%_at_30%_20%,#4d6b00_0%,#0f1400_70%)]">
            {[
              { name: "Anna", tone: "Female voice", left: "8%", top: "16%" },
              { name: "Kobbie", tone: "Male voice", left: "38%", top: "44%" },
              { name: "Josh", tone: "Male voice", left: "68%", top: "20%" },
            ].map((chip) => (
              <span key={chip.name} className="absolute flex items-center gap-2 rounded-full bg-black/60 py-1 pl-1 pr-3 text-white backdrop-blur" style={{ left: chip.left, top: chip.top }}>
                <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Mic className="size-3.5" aria-hidden />
                </span>
                <span className="text-sm font-semibold">{chip.name}</span>
                <span className="text-[11px] text-white/70">{chip.tone}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
          <div className="p-5">
            <h3 className="text-lg font-semibold">Write, describe and generate</h3>
            <p className="mt-1.5 text-sm text-text-secondary">Type your script, optionally describe how it should sound, and create. Every take is saved to History.</p>
          </div>
          <div className="relative h-40 bg-[radial-gradient(80%_80%_at_70%_20%,#1f2a4d_0%,#0a0d16_70%)] p-5">
            <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white/85">
              <PenLine className="mb-1.5 size-3.5 text-accent" aria-hidden />
              …gravel, like a late-night nature documentary narrator. Thoughtful pauses between sentences.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
