"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createImageGeneration,
  fetchGenerations,
  retryGeneration,
  type ImageGenerationInput,
  type ListGenerationsParams,
} from "@/lib/api/generations";
import { fetchModels } from "@/lib/api/models";
import { queryKeys } from "@/lib/query-keys";
import { isActive, type Generation, type GenerationList, type GenerationType } from "@/types/generation";

const POLL_INTERVAL_MS = 2000;

export function useModels(type: GenerationType) {
  return useQuery({ queryKey: queryKeys.models(type), queryFn: () => fetchModels(type), staleTime: Infinity });
}

/**
 * Newest-first list that polls every 2s while any item is still queued/processing.
 * One query drives both the workspace grid and progress state, so there is a single poll.
 */
export function useGenerationList(params: ListGenerationsParams) {
  return useQuery({
    queryKey: queryKeys.generations.list(params),
    queryFn: () => fetchGenerations(params),
    refetchInterval: (query) => (query.state.data?.items.some(isActive) ? POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: true,
  });
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

export function useRetryGeneration(listParams: ListGenerationsParams) {
  const prepend = usePrependGeneration(listParams);
  return useMutation({ mutationFn: (id: string) => retryGeneration(id), onSuccess: prepend });
}
