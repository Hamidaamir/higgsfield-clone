"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { VideoSidebar } from "@/features/video-generation/video-sidebar";
import { VideoWorkspace } from "@/features/video-generation/video-workspace";
import {
  useActiveGenerationPolling,
  useCreateVideoGeneration,
  useGenerationList,
  useModels,
  useRetryGeneration,
} from "@/hooks/use-generations";
import { useReferenceUpload } from "@/hooks/use-reference-upload";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { imagePromptSchema } from "@/lib/schemas/generation";
import type { Generation, ModelSpec } from "@/types/generation";

const LIST_PARAMS: ListGenerationsParams = { type: "video", limit: 24 };
const DEFAULT_MODEL_ID = "ltx-video";

interface VideoGeneratorProps {
  initialModelId?: string;
  initialPrompt?: string;
  initialAspectRatio?: string;
  initialDuration?: number;
}

export function VideoGenerator({ initialModelId, initialPrompt, initialAspectRatio, initialDuration }: VideoGeneratorProps) {
  const modelsQuery = useModels("video");
  const listQuery = useGenerationList(LIST_PARAMS);
  const create = useCreateVideoGeneration(LIST_PARAMS);
  const retry = useRetryGeneration(LIST_PARAMS);
  const reference = useReferenceUpload();

  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const [prompt, setPrompt] = useState(() => (initialPrompt ?? "").slice(0, 2000));
  const [modelId, setModelId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio ?? "16:9");
  const [duration, setDuration] = useState<number | null>(initialDuration ?? null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Generation | null>(null);
  const [submissions, setSubmissions] = useState(0);

  const model = useMemo(() => {
    const wanted = modelId ?? initialModelId ?? DEFAULT_MODEL_ID;
    return models.find((m) => m.id === wanted) ?? models.find((m) => m.id === DEFAULT_MODEL_ID) ?? models[0];
  }, [models, modelId, initialModelId]);
  const modelById = useCallback((id: string) => models.find((m) => m.id === id), [models]);

  // Derived so the effective settings always sit inside the selected model's capabilities.
  const effectiveAspectRatio = model && !model.aspect_ratios.includes(aspectRatio) ? model.aspect_ratios[0] : aspectRatio;
  const effectiveDuration =
    model && duration !== null && model.durations_s.includes(duration) ? duration : (model?.default_duration_s ?? 3);

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  useActiveGenerationPolling(items);
  const detailLive = detail ? (items.find((g) => g.id === detail.id) ?? detail) : null;

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
        duration_s: effectiveDuration,
        reference_asset_id: reference.asset?.id,
      });
      setSubmissions((n) => n + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(describeError(err));
    }
  };

  const reusePrompt = (generation: Generation) => {
    setPrompt(generation.prompt);
    if (modelById(generation.model_id)) setModelId(generation.model_id);
    if (generation.settings.aspect_ratio) setAspectRatio(generation.settings.aspect_ratio);
    if (generation.settings.duration_s) setDuration(generation.settings.duration_s);
    setDetail(null);
    document.getElementById("video-prompt")?.focus();
  };

  const regenerate = async (generation: Generation) => {
    setDetail(null);
    try {
      await retry.mutateAsync(generation.id);
      setSubmissions((n) => n + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const disabledReason = modelsQuery.isError
    ? "Models could not be loaded. Refresh to try again."
    : !modelsQuery.isPending && models.length === 0
      ? "Video generation is not available right now."
      : null;

  return (
    <div className="mx-auto grid max-w-[1500px] gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <VideoSidebar
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
        duration={effectiveDuration}
        onDurationChange={setDuration}
        reference={reference}
        onGenerate={handleGenerate}
        submitting={create.isPending}
        error={error}
        disabledReason={disabledReason}
      />

      <VideoWorkspace
        key={submissions}
        items={items}
        loading={listQuery.isPending}
        modelById={modelById}
        onOpen={setDetail}
        onRetry={regenerate}
        retrying={retry.isPending}
      />

      <GenerationDetailDialog
        generation={detailLive}
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
