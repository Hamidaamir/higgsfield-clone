"use client";

import { BookOpen, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GenerationCards } from "@/features/image-generation/generation-card";
import { PromptDock } from "@/features/image-generation/prompt-dock";
import { ResultLightbox } from "@/features/image-generation/result-lightbox";
import { WorkspaceHero } from "@/features/image-generation/workspace-hero";
import { useCreateImageGeneration, useGenerationList, useModels, useRetryGeneration } from "@/hooks/use-generations";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { imagePromptSchema } from "@/lib/schemas/generation";
import type { Asset, Generation, ModelSpec } from "@/types/generation";

const LIST_PARAMS: ListGenerationsParams = { type: "image", limit: 24 };
const DEFAULT_MODEL_ID = "flux-1-schnell";

interface ImageGeneratorProps {
  /** `?model=` from the URL (mega-menu links); ignored when it is not a runnable model. */
  initialModelId?: string;
}

export function ImageGenerator({ initialModelId }: ImageGeneratorProps) {
  const modelsQuery = useModels("image");
  const listQuery = useGenerationList(LIST_PARAMS);
  const create = useCreateImageGeneration(LIST_PARAMS);
  const retry = useRetryGeneration(LIST_PARAMS);

  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [batchSize, setBatchSize] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ generation: Generation; asset: Asset } | null>(null);

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
      await create.mutateAsync({
        prompt: parsed.data,
        model_id: model.id,
        aspect_ratio: effectiveAspectRatio,
        batch_size: effectiveBatchSize,
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
    setLightbox(null);
    document.getElementById("image-prompt")?.focus();
  };

  const regenerate = async (generation: Generation) => {
    setLightbox(null);
    try {
      await retry.mutateAsync(generation.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const items = listQuery.data?.items ?? [];
  const disabledReason = modelsQuery.isError ? "Models could not be loaded. Refresh to try again." : null;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] pb-64 sm:pb-52">
      <AcademyTip />

      <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6" aria-label="Generated images">
        {listQuery.isPending ? (
          <GridSkeleton />
        ) : listQuery.isError ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <p className="text-sm text-text-secondary">Your recent generations could not be loaded.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => listQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <WorkspaceHero />
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((generation) => (
              <GenerationCards
                key={generation.id}
                generation={generation}
                model={modelById(generation.model_id)}
                onOpen={(g, asset) => setLightbox({ generation: g, asset })}
                onReusePrompt={reusePrompt}
                onRetry={regenerate}
                retrying={retry.isPending}
              />
            ))}
          </div>
        )}
      </section>

      <PromptDock
        prompt={prompt}
        onPromptChange={(value) => {
          setPrompt(value);
          if (error) setError(null);
        }}
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

      <ResultLightbox
        item={lightbox}
        model={lightbox ? modelById(lightbox.generation.model_id) : undefined}
        onClose={() => setLightbox(null)}
        onReusePrompt={reusePrompt}
        onRetry={regenerate}
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
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading generations">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-square rounded-2xl skeleton-shimmer" />
      ))}
    </div>
  );
}

function AcademyTip() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="flex justify-center px-4 pt-4">
      <div className="flex items-center gap-3 rounded-full border border-border bg-surface-elevated py-1.5 pl-2 pr-1.5 text-sm shadow-card">
        <span className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <BookOpen className="size-4" aria-hidden />
        </span>
        <span className="hidden sm:block">
          <span className="font-semibold">Don&apos;t know where to start?</span>
          <span className="block text-xs text-text-secondary">Go to the Academy and start your journey</span>
        </span>
        <span className="font-semibold sm:hidden">New here?</span>
        <Button asChild variant="white" size="sm" className="rounded-full">
          <Link href="/academy">Learn now</Link>
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss tip"
          className="rounded-full p-1.5 text-text-secondary hover:bg-surface-muted hover:text-text-primary"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
