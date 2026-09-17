"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  createAudioGeneration,
  createImageGeneration,
  createVideoGeneration,
  fetchGeneration,
  fetchGenerations,
  retryGeneration,
  type AudioGenerationInput,
  type ImageGenerationInput,
  type ListGenerationsParams,
  type VideoGenerationInput,
} from "@/lib/api/generations";
import { fetchModels } from "@/lib/api/models";
import { queryKeys } from "@/lib/query-keys";
import { isActive, type Generation, type GenerationList, type GenerationType } from "@/types/generation";

const POLL_INTERVAL_MS = 2000;

export function useModels(type?: GenerationType) {
  return useQuery({ queryKey: queryKeys.models(type), queryFn: () => fetchModels(type), staleTime: Infinity });
}

/** Newest-first first page for a generator workspace. Pair with `useActiveGenerationPolling`. */
export function useGenerationList(params: ListGenerationsParams) {
  return useQuery({ queryKey: queryKeys.generations.list(params), queryFn: () => fetchGenerations(params) });
}

function usePrependGeneration(params: ListGenerationsParams) {
  const queryClient = useQueryClient();
  return (generation: Generation) => {
    queryClient.setQueryData<GenerationList>(queryKeys.generations.list(params), (current) =>
      current
        ? { ...current, items: [generation, ...current.items.filter((g) => g.id !== generation.id)] }
        : { items: [generation], next_cursor: null },
    );
    queryClient.invalidateQueries({ queryKey: queryKeys.generations.all, refetchType: "none" });
  };
}

export function useCreateImageGeneration(listParams: ListGenerationsParams) {
  const prepend = usePrependGeneration(listParams);
  return useMutation({
    mutationFn: (input: ImageGenerationInput) => createImageGeneration(input),
    onSuccess: prepend,
  });
}

export function useCreateVideoGeneration(listParams: ListGenerationsParams) {
  const prepend = usePrependGeneration(listParams);
  return useMutation({
    mutationFn: (input: VideoGenerationInput) => createVideoGeneration(input),
    onSuccess: prepend,
  });
}

export function useCreateAudioGeneration(listParams: ListGenerationsParams) {
  const prepend = usePrependGeneration(listParams);
  return useMutation({
    mutationFn: (input: AudioGenerationInput) => createAudioGeneration(input),
    onSuccess: prepend,
  });
}

export function useRetryGeneration(listParams: ListGenerationsParams) {
  const prepend = usePrependGeneration(listParams);
  return useMutation({ mutationFn: (id: string) => retryGeneration(id), onSuccess: prepend });
}

/** Cursor-paginated history feed ("Load more"). Active items are refreshed by `useActiveGenerationPolling`. */
export function useInfiniteGenerations(params: ListGenerationsParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.generations.infinite(params),
    queryFn: ({ pageParam }) => fetchGenerations({ ...params, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });
}

/**
 * Polls only the generations that are still queued/processing (usually zero or one)
 * and patches the result into every cached list, instead of refetching whole pages.
 */
export function useActiveGenerationPolling(generations: Generation[]) {
  const queryClient = useQueryClient();
  const activeIds = generations.filter(isActive).map((g) => g.id).join(",");

  useEffect(() => {
    if (!activeIds) return;
    const ids = activeIds.split(",");
    let cancelled = false;
    const tick = async () => {
      const updates = await Promise.allSettled(ids.map((id) => fetchGeneration(id)));
      if (cancelled) return;
      for (const result of updates) {
        if (result.status === "fulfilled") patchGenerationInCaches(queryClient, result.value);
      }
    };
    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeIds, queryClient]);
}

type InfiniteData = { pages: GenerationList[]; pageParams: unknown[] };

function patchGenerationInCaches(queryClient: ReturnType<typeof useQueryClient>, updated: Generation) {
  const replace = (items: Generation[]) => items.map((g) => (g.id === updated.id ? updated : g));
  queryClient.setQueriesData<GenerationList>({ queryKey: ["generations", "list"] }, (data) =>
    data ? { ...data, items: replace(data.items) } : data,
  );
  queryClient.setQueriesData<InfiniteData>({ queryKey: ["generations", "infinite"] }, (data) =>
    data ? { ...data, pages: data.pages.map((page) => ({ ...page, items: replace(page.items) })) } : data,
  );
}

export function useRegenerate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retryGeneration(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.generations.all }),
  });
}
