"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { EditRail } from "@/features/image-edit/edit-rail";
import { EditResults } from "@/features/image-edit/edit-results";
import {
  useActiveGenerationPolling,
  useCreateImageGeneration,
  useGenerationList,
  useModels,
  useRetryGeneration,
} from "@/hooks/use-generations";
import { useReferenceUpload } from "@/hooks/use-reference-upload";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { imagePromptSchema } from "@/lib/schemas/generation";
import type { Generation } from "@/types/generation";

const LIST_PARAMS: ListGenerationsParams = { type: "image", limit: 24 };
/** The one image model with a reference-guided edit contract; its spec still comes from the registry. */
const EDIT_MODEL_ID = "flux-2-klein";

/** Reference-guided image editing with FLUX.2 Klein: upload → instruction → edited image → History. */
export function ImageEditor() {
  const modelsQuery = useModels("image");
  const listQuery = useGenerationList(LIST_PARAMS);
  const create = useCreateImageGeneration(LIST_PARAMS);
  const retry = useRetryGeneration(LIST_PARAMS);
  const reference = useReferenceUpload();

  const model = useMemo(() => modelsQuery.data?.find((m) => m.id === EDIT_MODEL_ID), [modelsQuery.data]);
  const modelById = useCallback((id: string) => modelsQuery.data?.find((m) => m.id === id), [modelsQuery.data]);
  const [instruction, setInstruction] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ generation: Generation; assetIndex: number } | null>(null);

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  useActiveGenerationPolling(items);
  // Only edits (generations with a reference) belong to this workspace.
  const edits = useMemo(() => items.filter((g) => g.settings.reference_asset_id), [items]);
  const detailLive = detail ? (items.find((g) => g.id === detail.generation.id) ?? detail.generation) : null;

  const effectiveAspect = model && !model.aspect_ratios.includes(aspectRatio) ? model.aspect_ratios[0] : aspectRatio;

  const handleGenerate = async () => {
    if (!model || !reference.asset) return;
    const parsed = imagePromptSchema.safeParse(instruction);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Describe the change first.");
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({
        prompt: parsed.data,
        model_id: model.id,
        aspect_ratio: effectiveAspect,
        batch_size: 1,
        reference_asset_id: reference.asset.id,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  const regenerate = async (generation: Generation) => {
    setDetail(null);
    try {
      await retry.mutateAsync(generation.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start the edit.");
    }
  };

  const reuse = (generation: Generation) => {
    setInstruction(generation.prompt);
    setDetail(null);
    document.getElementById("edit-instruction")?.focus();
  };

  const disabledReason = modelsQuery.isError
    ? "Models could not be loaded. Refresh to try again."
    : !modelsQuery.isPending && !model
      ? "Image editing is not available right now."
      : null;

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-subtle py-5">
        <div>
          <h1 className="editorial-label">Edit &amp; Enhance</h1>
          <p className="mt-1 text-[13px] text-foreground-muted">Refine an image with natural-language direction.</p>
        </div>
        {edits.length > 0 ? (
          <Link href="/history" className="text-[13px] text-foreground-muted transition-colors hover:text-accent-text">
            View archive
          </Link>
        ) : null}
      </header>

      <div className="grid gap-6 py-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-10">
        {/* The comparison deserves the width, so the rail stays narrow and follows the page. */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <EditRail
            reference={reference}
            instruction={instruction}
            onInstructionChange={(value) => {
              setInstruction(value);
              if (error) setError(null);
            }}
            model={model}
            aspectRatio={effectiveAspect}
            onAspectRatioChange={setAspectRatio}
            onGenerate={handleGenerate}
            submitting={create.isPending}
            error={error}
            disabledReason={disabledReason}
          />
        </div>

        <EditResults
          items={edits}
          loading={listQuery.isPending}
          modelById={modelById}
          onOpen={(generation, assetIndex) => setDetail({ generation, assetIndex })}
          onReusePrompt={reuse}
          onRetry={regenerate}
          retrying={retry.isPending}
        />
      </div>

      <GenerationDetailDialog
        generation={detailLive}
        initialAssetIndex={detail?.assetIndex}
        model={detailLive ? modelById(detailLive.model_id) : undefined}
        onClose={() => setDetail(null)}
        onReusePrompt={reuse}
        onRegenerate={regenerate}
        regenerating={retry.isPending}
      />
    </div>
  );
}
