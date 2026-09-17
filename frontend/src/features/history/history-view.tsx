"use client";

import { AudioLines, Image as ImageIcon, Search, Sparkles, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { GenerationTile } from "@/components/history/generation-tile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveGenerationPolling, useInfiniteGenerations, useModels, useRegenerate } from "@/hooks/use-generations";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { dayLabel } from "@/lib/format";
import { generatorHref, reuseHref } from "@/lib/generation-links";
import type { Generation, GenerationType } from "@/types/generation";

export type HistoryFilter = "all" | GenerationType;

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
];

const PAGE_SIZE = 24;

const emptyCopy: Record<HistoryFilter, { icon: typeof ImageIcon; title: string; description: string; cta: string; href: string }> = {
  all: {
    icon: Sparkles,
    title: "Nothing generated yet",
    description: "Everything you create — images, videos and speech — is saved here automatically.",
    cta: "Create your first image",
    href: "/generate/image",
  },
  image: {
    icon: ImageIcon,
    title: "No images yet",
    description: "Describe a scene in the image generator and your results will show up here.",
    cta: "Generate an image",
    href: "/generate/image",
  },
  video: {
    icon: Video,
    title: "No videos yet",
    description: "Video generation lands in the Video workspace. Clips you make will be kept here.",
    cta: "Open Video",
    href: "/generate/video",
  },
  audio: {
    icon: AudioLines,
    title: "No audio yet",
    description: "Text-to-speech results from the Audio workspace will be collected here.",
    cta: "Open Audio",
    href: "/generate/audio",
  },
};

export function HistoryView({ initialFilter = "all" }: { initialFilter?: HistoryFilter }) {
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [detail, setDetail] = useState<Generation | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo<ListGenerationsParams>(
    () => ({ type: filter === "all" ? undefined : filter, q: debounced || undefined, limit: PAGE_SIZE }),
    [filter, debounced],
  );
  const feed = useInfiniteGenerations(params);
  const modelsQuery = useModels();
  const regenerate = useRegenerate();

  const items = useMemo(() => feed.data?.pages.flatMap((page) => page.items) ?? [], [feed.data]);
  useActiveGenerationPolling(items);

  // Keep the open dialog in sync with polled updates.
  const detailLive = detail ? (items.find((g) => g.id === detail.id) ?? detail) : null;
  const modelById = (id: string) => modelsQuery.data?.find((m) => m.id === id);

  const groups = useMemo(() => {
    const map = new Map<string, Generation[]>();
    for (const g of items) {
      const label = dayLabel(g.created_at);
      map.set(label, [...(map.get(label) ?? []), g]);
    }
    return Array.from(map, ([label, list]) => ({ label, items: list }));
  }, [items]);

  const onFilterChange = (value: string) => {
    setFilter(value as HistoryFilter);
    router.replace(value === "all" ? "/history" : `/history?type=${value}`, { scroll: false });
  };

  const reuse = (generation: Generation) => {
    setDetail(null);
    router.push(reuseHref(generation, modelsQuery.data));
  };

  const onRegenerate = async (generation: Generation) => {
    try {
      const child = await regenerate.mutateAsync(generation.id);
      setDetail(null);
      toast.success(generation.status === "failed" ? "Retrying generation…" : "Generating again…");
      router.push(generatorHref(child.type));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not start the generation.");
    }
  };

  const empty = emptyCopy[filter];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display-heading text-3xl sm:text-4xl">History</h1>
          <p className="mt-1.5 text-sm text-text-secondary">Every generation you create, saved with its prompt and settings.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-text-secondary focus-within:border-accent">
            <Search className="size-4 shrink-0" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts or models"
              aria-label="Search history"
              className="w-full min-w-0 bg-transparent text-text-primary outline-none placeholder:text-text-muted sm:w-52"
            />
            {search ? (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-text-muted hover:text-text-primary">
                <X className="size-3.5" />
              </button>
            ) : null}
          </label>
          <Tabs value={filter} onValueChange={onFilterChange}>
            <TabsList aria-label="Filter by type">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="mt-6">
        {feed.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true" aria-label="Loading history">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="aspect-square rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        ) : feed.isError ? (
          <EmptyState
            icon={Sparkles}
            title="History could not be loaded"
            description="The server may be starting up. Please try again in a moment."
            action={
              <Button variant="secondary" onClick={() => feed.refetch()}>
                Try again
              </Button>
            }
          />
        ) : items.length === 0 ? (
          debounced ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description={`Nothing in your history matches “${debounced}”.`}
              action={
                <Button variant="secondary" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={empty.icon}
              title={empty.title}
              description={empty.description}
              action={
                <Button asChild>
                  <Link href={empty.href}>{empty.cta}</Link>
                </Button>
              }
            />
          )
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">{group.label}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {group.items.map((generation) => (
                    <GenerationTile
                      key={generation.id}
                      generation={generation}
                      model={modelById(generation.model_id)}
                      onOpen={setDetail}
                      onRetry={onRegenerate}
                      retrying={regenerate.isPending}
                    />
                  ))}
                </div>
              </div>
            ))}
            {feed.hasNextPage ? (
              <div className="flex justify-center">
                <Button variant="secondary" size="lg" onClick={() => feed.fetchNextPage()} loading={feed.isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-text-muted">
                {items.length} {items.length === 1 ? "generation" : "generations"}
              </p>
            )}
          </div>
        )}
      </div>

      <GenerationDetailDialog
        generation={detailLive}
        model={detailLive ? modelById(detailLive.model_id) : undefined}
        onClose={() => setDetail(null)}
        onReusePrompt={reuse}
        onRegenerate={onRegenerate}
        regenerating={regenerate.isPending}
      />
    </section>
  );
}
