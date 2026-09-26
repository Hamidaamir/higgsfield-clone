"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { GenerationGroup } from "@/features/image-generation/generation-group";
import { PromptDock } from "@/features/image-generation/prompt-dock";
import { WorkspaceEmptyState } from "@/features/image-generation/workspace-hero";
import {
  useActiveGenerationPolling,
  useCreateImageGeneration,
  useGenerationList,
  useModels,
  useRetryGeneration,
} from "@/hooks/use-generations";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { imagePromptSchema } from "@/lib/schemas/generation";
import type { Generation, ModelSpec } from "@/types/generation";

const LIST_PARAMS: ListGenerationsParams = { type: "image", limit: 24 };
const DEFAULT_MODEL_ID = "flux-1-schnell";

interface ImageGeneratorProps {
  /** `?model=` from the URL (mega-menu links); ignored when it is not a runnable model. */
  initialModelId?: string;
  initialPrompt?: string;
  initialAspectRatio?: string;
  initialBatchSize?: number;
  initialNegativePrompt?: string;
}

export function ImageGenerator({
  initialModelId,
  initialPrompt,
  initialAspectRatio,
  initialBatchSize,
  initialNegativePrompt,
}: ImageGeneratorProps) {
  const modelsQuery = useModels("image");
  const listQuery = useGenerationList(LIST_PARAMS);
  const create = useCreateImageGeneration(LIST_PARAMS);
  const retry = useRetryGeneration(LIST_PARAMS);

  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const [prompt, setPrompt] = useState(() => (initialPrompt ?? "").slice(0, 2000));
  const [modelId, setModelId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio ?? "1:1");
  // The floor is all that is needed here: the ceiling is the model's own `max_batch`,
  // applied by `effectiveBatchSize` below so the registry stays the only authority.
  const [batchSize, setBatchSize] = useState(() => Math.max(1, initialBatchSize ?? 1));
  const [negativePrompt, setNegativePrompt] = useState(initialNegativePrompt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ generation: Generation; assetIndex: number } | null>(null);
  const detailLive = detail ? (listQuery.data?.items.find((g) => g.id === detail.generation.id) ?? detail.generation) : null;

  const model = useMemo(() => {
    const wanted = modelId ?? initialModelId ?? DEFAULT_MODEL_ID;
    return models.find((m) => m.id === wanted) ?? models.find((m) => m.id === DEFAULT_MODEL_ID) ?? models[0];
  }, [models, modelId, initialModelId]);
  const modelById = useCallback((id: string) => models.find((m) => m.id === id), [models]);

  // Derive the effective settings so they always sit inside the selected model's capabilities.
  const effectiveAspectRatio = model && !model.aspect_ratios.includes(aspectRatio) ? model.aspect_ratios[0] : aspectRatio;
  const effectiveBatchSize = model ? Math.min(batchSize, model.max_batch) : batchSize;

  const selectModel = (next: ModelSpec) => {
    setModelId(next.id);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!model) return;
    const parsed = imagePromptSchema.safeParse(prompt);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid prompt.");
      return;
    }
    setError(null);
    try {
      const trimmedNegative = negativePrompt.trim();
      await create.mutateAsync({
        prompt: parsed.data,
        model_id: model.id,
        aspect_ratio: effectiveAspectRatio,
        batch_size: effectiveBatchSize,
        // Only sent when the selected model advertises support, so the API never rejects it.
        ...(model.supports_negative_prompt && trimmedNegative ? { negative_prompt: trimmedNegative } : {}),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(describeError(err));
    }
  };

  const reusePrompt = (generation: Generation) => {
    setPrompt(generation.prompt);
    if (modelById(generation.model_id)) setModelId(generation.model_id);
    if (generation.settings.aspect_ratio) setAspectRatio(generation.settings.aspect_ratio);
    if (generation.settings.batch_size) setBatchSize(generation.settings.batch_size);
    setNegativePrompt(generation.settings.negative_prompt ?? "");
    setDetail(null);
    document.getElementById("image-prompt")?.focus();
  };

  const regenerate = async (generation: Generation) => {
    setDetail(null);
    try {
      await retry.mutateAsync(generation.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  useActiveGenerationPolling(items);
  const disabledReason = modelsQuery.isError ? "Models could not be loaded. Refresh to try again." : null;

  return (
    // Bottom padding clears the fixed composer so the last row is never hidden behind it.
    <div className="relative min-h-[calc(100vh-3.5rem)] pb-[22rem] sm:pb-60">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-subtle py-5">
          <div>
            <h1 className="editorial-label">Image Studio</h1>
            <p className="mt-1 text-[13px] text-foreground-muted">
              Create still imagery from a written prompt.
            </p>
          </div>
          {items.length > 0 ? (
            <Link
              href="/history"
              className="text-[13px] text-foreground-muted transition-colors hover:text-accent-text"
            >
              View archive
            </Link>
          ) : null}
        </header>

        <section className="py-6" aria-label="Generated images">
          {listQuery.isPending ? (
            <GridSkeleton />
          ) : listQuery.isError ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <p className="text-sm text-foreground-muted">Your recent generations could not be loaded.</p>
              <Button variant="outline" size="sm" className="mt-3 rounded-none" onClick={() => listQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <WorkspaceEmptyState />
          ) : (
            <div className="flex flex-col gap-8">
              {items.map((generation) => (
                <GenerationGroup
                  key={generation.id}
                  generation={generation}
                  model={modelById(generation.model_id)}
                  onOpen={(g, asset) => setDetail({ generation: g, assetIndex: Math.max(0, g.assets.findIndex((a) => a.id === asset.id)) })}
                  onReusePrompt={reusePrompt}
                  onRetry={regenerate}
                  retrying={retry.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <PromptDock
        prompt={prompt}
        onPromptChange={(value) => {
          setPrompt(value);
          if (error) setError(null);
        }}
        negativePrompt={negativePrompt}
        onNegativePromptChange={setNegativePrompt}
        models={models}
        model={model}
        onModelChange={selectModel}
        aspectRatio={effectiveAspectRatio}
        onAspectRatioChange={setAspectRatio}
        batchSize={effectiveBatchSize}
        onBatchSizeChange={setBatchSize}
        onGenerate={handleGenerate}
        submitting={create.isPending}
        error={error}
        disabledReason={disabledReason}
      />

      <GenerationDetailDialog
        generation={detailLive}
        initialAssetIndex={detail?.assetIndex}
        model={detailLive ? modelById(detailLive.model_id) : undefined}
        onClose={() => setDetail(null)}
        onReusePrompt={reusePrompt}
        onRegenerate={regenerate}
        regenerating={retry.isPending}
      />
    </div>
  );
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetwork) return "We couldn't reach the server. It may be starting up — please try again.";
    if (err.code === "validation_error" && err.details?.fields) {
      const fields = err.details.fields as { message: string }[];
      return fields[0]?.message ?? err.message;
    }
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

function GridSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading generations">
      {Array.from({ length: 2 }, (_, group) => (
        <div key={group} className="border-t border-border-subtle pt-4">
          <div className="h-3 w-56 skeleton-shimmer" />
          <div className="mt-4 grid max-w-[42rem] grid-cols-2 gap-3">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="aspect-square skeleton-shimmer" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
