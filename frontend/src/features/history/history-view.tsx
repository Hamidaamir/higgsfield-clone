"use client";

import { AudioLines, Image as ImageIcon, Search, Sparkles, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveGenerationPolling, useInfiniteGenerations, useModels, useRegenerate } from "@/hooks/use-generations";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { dayLabel } from "@/lib/format";
import { generatorHref, reuseHref } from "@/lib/generation-links";
import type { Generation, GenerationType } from "@/types/generation";

import { ArchiveGeneration } from "./archive-generation";

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
    title: "Nothing here yet.",
    description: "Your images, videos, audio and image edits are saved here automatically.",
    cta: "Image Studio",
    href: "/generate/image",
  },
  image: {
    icon: ImageIcon,
    title: "No image generations yet.",
    description: "Describe a scene in the image generator and your results will show up here.",
    cta: "Generate an image",
    href: "/generate/image",
  },
  video: {
    icon: Video,
    title: "No video generations yet.",
    description: "Video generation lands in the Video workspace. Clips you make will be kept here.",
    cta: "Open Video",
    href: "/generate/video",
  },
  audio: {
    icon: AudioLines,
    title: "No audio generations yet.",
    description: "Text-to-speech results from the Audio workspace will be collected here.",
    cta: "Open Audio",
    href: "/generate/audio",
  },
};

export function HistoryView({ initialFilter = "all" }: { initialFilter?: HistoryFilter }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type");
  const filter: HistoryFilter = FILTERS.some((f) => f.value === urlType) ? urlType as HistoryFilter : initialFilter;
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [detail, setDetail] = useState<Generation | null>(null);
  const [assetIndex, setAssetIndex] = useState(0);
  const openDetail = (generation: Generation, index: number) => {
    setAssetIndex(index);
    setDetail(generation);
  };

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
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
      <header>
        <div>
          <p className="editorial-label text-accent-text">03 / Your work</p>
          <h1 className="editorial-display mt-3 text-4xl sm:text-5xl">Archive</h1>
          <p className="mt-3 text-sm text-foreground-muted">Everything you’ve made, in one place.</p>
        </div>
        <div className="mt-8 flex flex-col gap-5 border-y border-border-default py-4 md:flex-row md:items-center md:justify-between">
          <label className="flex min-h-11 min-w-0 items-center gap-3 border-b border-border-default text-sm text-foreground-muted focus-within:border-accent md:w-96">
            <span className="sr-only">Search prompts and models</span>
            <Search className="size-4 shrink-0" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts and models…"
              aria-label="Search prompts and models"
              className="w-full min-w-0 bg-transparent text-text-primary outline-none placeholder:text-foreground-muted"
            />
            {search ? (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="flex size-10 shrink-0 items-center justify-center text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">
                <X className="size-3.5" />
              </button>
            ) : null}
          </label>
          <Tabs value={filter} onValueChange={onFilterChange}>
            <TabsList aria-label="Filter by type" className="h-auto flex-wrap justify-start gap-1 rounded-none border-0 bg-transparent p-0">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="min-h-10 rounded-none px-3 text-xs uppercase tracking-wider data-[state=active]:bg-accent-subtle data-[state=active]:text-accent-text data-[state=active]:shadow-none">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="mt-8">
        {feed.isPending ? (
          <div className="space-y-8" role="status" aria-busy="true" aria-label="Loading archive">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 border-t border-border-subtle skeleton-shimmer" />
            ))}
          </div>
        ) : feed.isError ? (
          <EmptyState
            className="rounded-none border-0 border-y border-solid border-border-subtle bg-transparent [&>span]:hidden [&>h2]:editorial-display [&>h2]:text-3xl"
            icon={Sparkles}
            title="Archive could not be loaded"
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
              className="rounded-none border-0 border-y border-solid border-border-subtle bg-transparent [&>span]:hidden [&>h2]:editorial-display [&>h2]:text-3xl"
              icon={Search}
              title="No matches"
              description={`No results in your archive for “${debounced}”.`}
              action={
                <Button variant="secondary" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              className="rounded-none border-0 border-y border-solid border-border-subtle bg-transparent [&>span]:hidden [&>h2]:editorial-display [&>h2]:text-3xl"
              icon={empty.icon}
              title={empty.title}
              description={empty.description}
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild>
                    <Link href={empty.href}>{empty.cta}</Link>
                  </Button>
                  {filter === "all" ? (
                    <>
                      <Button asChild variant="secondary">
                        <Link href="/generate/video">Video Studio</Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link href="/generate/audio">Audio Studio</Link>
                      </Button>
                      <Button asChild variant="secondary"><Link href="/edit/image">Edit &amp; Enhance</Link></Button>
                    </>
                  ) : null}
                </div>
              }
            />
          )
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h2 className="editorial-label pb-4 pt-3 text-foreground-muted">{group.label}</h2>
                <div>
                  {group.items.map((generation) => (
                    <ArchiveGeneration
                      key={generation.id}
                      generation={generation}
                      model={modelById(generation.model_id)}
                      onOpen={openDetail}
                      onReusePrompt={reuse}
                      onRetry={onRegenerate}
                      retrying={regenerate.isPending}
                    />
                  ))}
                </div>
              </section>
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
        initialAssetIndex={assetIndex}
        model={detailLive ? modelById(detailLive.model_id) : undefined}
        onClose={() => setDetail(null)}
        onReusePrompt={reuse}
        onRegenerate={onRegenerate}
        regenerating={regenerate.isPending}
      />
    </section>
  );
}
