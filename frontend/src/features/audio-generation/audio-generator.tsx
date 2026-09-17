"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { AudioSidebar } from "@/features/audio-generation/audio-sidebar";
import { AudioWorkspace } from "@/features/audio-generation/audio-workspace";
import {
  useActiveGenerationPolling,
  useCreateAudioGeneration,
  useGenerationList,
  useModels,
  useRetryGeneration,
} from "@/hooks/use-generations";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { scriptSchema } from "@/lib/schemas/generation";
import type { Generation, ModelSpec } from "@/types/generation";

const LIST_PARAMS: ListGenerationsParams = { type: "audio", limit: 24 };
const DEFAULT_MODEL_ID = "aura-1";

interface AudioGeneratorProps {
  initialModelId?: string;
  initialScript?: string;
  initialVoice?: string;
  initialLanguage?: string;
}

export function AudioGenerator({ initialModelId, initialScript, initialVoice, initialLanguage }: AudioGeneratorProps) {
  const modelsQuery = useModels("audio");
  const listQuery = useGenerationList(LIST_PARAMS);
  const create = useCreateAudioGeneration(LIST_PARAMS);
  const retry = useRetryGeneration(LIST_PARAMS);

  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const [script, setScript] = useState(() => (initialScript ?? "").slice(0, 2000));
  const [modelId, setModelId] = useState<string | null>(null);
  const [voice, setVoice] = useState<string | null>(initialVoice ?? null);
  const [language, setLanguage] = useState<string | null>(initialLanguage ?? null);
  const [stylePrompt, setStylePrompt] = useState("");
  const [batchSize, setBatchSize] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Generation | null>(null);
  const [submissions, setSubmissions] = useState(0);

  const model = useMemo(() => {
    const wanted = modelId ?? initialModelId ?? DEFAULT_MODEL_ID;
    return models.find((m) => m.id === wanted) ?? models.find((m) => m.id === DEFAULT_MODEL_ID) ?? models[0];
  }, [models, modelId, initialModelId]);
  const modelById = useCallback((id: string) => models.find((m) => m.id === id), [models]);

  // Effective settings always come from the selected model's controlled lists.
  const effectiveVoice = model?.voices.length
    ? (model.voices.some((v) => v.id === voice) ? voice : model.default_voice)
    : null;
  const effectiveLanguage = model?.languages.length
    ? (model.languages.some((l) => l.code === language) ? language : model.default_language)
    : null;
  const effectiveBatchSize = model ? Math.min(batchSize, model.max_batch) : batchSize;

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  useActiveGenerationPolling(items);
  const detailLive = detail ? (items.find((g) => g.id === detail.id) ?? detail) : null;

  const selectModel = (next: ModelSpec) => {
    setModelId(next.id);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!model) return;
    const parsed = scriptSchema.safeParse(script);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid script.");
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({
        text: parsed.data,
        model_id: model.id,
        voice: effectiveVoice ?? undefined,
        language: effectiveLanguage ?? undefined,
        style_prompt: model.supports_style_prompt && stylePrompt.trim() ? stylePrompt.trim() : undefined,
        batch_size: effectiveBatchSize,
      });
      setSubmissions((n) => n + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(describeError(err));
    }
  };

  const reusePrompt = (generation: Generation) => {
    setScript(generation.prompt);
    if (modelById(generation.model_id)) setModelId(generation.model_id);
    if (generation.settings.voice) setVoice(generation.settings.voice);
    if (generation.settings.language) setLanguage(generation.settings.language);
    if (generation.settings.style_prompt) setStylePrompt(generation.settings.style_prompt);
    if (generation.settings.batch_size) setBatchSize(generation.settings.batch_size);
    setDetail(null);
    document.getElementById("audio-script")?.focus();
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
      ? "Speech generation is not available right now."
      : null;

  return (
    <div className="mx-auto grid max-w-[1500px] gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <AudioSidebar
        script={script}
        onScriptChange={(value) => {
          setScript(value);
          if (error) setError(null);
        }}
        models={models}
        model={model}
        onModelChange={selectModel}
        voice={effectiveVoice}
        onVoiceChange={setVoice}
        language={effectiveLanguage}
        onLanguageChange={setLanguage}
        stylePrompt={stylePrompt}
        onStylePromptChange={setStylePrompt}
        batchSize={effectiveBatchSize}
        onBatchSizeChange={setBatchSize}
        onGenerate={handleGenerate}
        submitting={create.isPending}
        error={error}
        disabledReason={disabledReason}
      />

      <AudioWorkspace
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
