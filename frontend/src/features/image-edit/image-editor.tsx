"use client";

import { ArrowRight, MoveRight, Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { AspectRatioPicker } from "@/components/generator/aspect-ratio-picker";
import { ReferenceDropzone } from "@/components/generator/reference-dropzone";
import { GenerationDetailDialog } from "@/components/generation/generation-detail-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { GenerationCards } from "@/features/image-generation/generation-card";
import {
  useActiveGenerationPolling,
  useCreateImageGeneration,
  useGenerationList,
  useModels,
  useRetryGeneration,
} from "@/hooks/use-generations";
import { useAsset } from "@/hooks/use-asset";
import { useReferenceUpload } from "@/hooks/use-reference-upload";
import { ApiError } from "@/lib/api/client";
import type { ListGenerationsParams } from "@/lib/api/generations";
import { toolHref, toolsByCategory } from "@/lib/config/tools";
import { imagePromptSchema, PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { Generation } from "@/types/generation";

const LIST_PARAMS: ListGenerationsParams = { type: "image", limit: 24 };
const EDIT_MODEL_ID = "flux-2-klein";
const EDIT_TOOL_SLUGS = ["relight", "inpaint", "image-upscale", "face-swap", "character-swap"];

const QUICK_EDITS = [
  "Make it nighttime with neon lights",
  "Turn the sky into a dramatic sunset",
  "Make it snow",
  "Change the outfit to a red jacket",
  "Give it a 35mm film look",
];

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
  const tooLong = instruction.length > PROMPT_MAX_LENGTH;
  const canSubmit = Boolean(model && reference.asset && instruction.trim() && !tooLong && !create.isPending && !reference.uploading);

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

  return (
    <div className="mx-auto grid max-w-[1500px] gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <form
        aria-label="Image editor"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) handleGenerate();
        }}
        className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-3"
      >
        <div className="flex items-center gap-2 border-b border-border px-1 pb-2.5">
          <Wand2 className="size-4 text-accent" aria-hidden />
          <span className="text-[13px] font-semibold">Edit Image</span>
          <span className="ml-auto rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-semibold text-accent">FLUX.2 Klein</span>
        </div>

        <ReferenceDropzone
          previewUrl={reference.previewUrl}
          uploading={reference.uploading}
          error={reference.error}
          onSelect={reference.select}
          onClear={reference.clear}
          disabled={create.isPending}
          purpose="Reference"
          title="Upload the image to edit"
        />

        <div className="rounded-2xl border border-border bg-surface-elevated p-3">
          <label htmlFor="edit-instruction" className="text-xs font-medium text-text-secondary">
            Describe the change
          </label>
          <Textarea
            id="edit-instruction"
            value={instruction}
            onChange={(e) => {
              setInstruction(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. make it nighttime, add rain, change the jacket to red"
            maxLength={PROMPT_MAX_LENGTH + 200}
            aria-invalid={tooLong || Boolean(error) || undefined}
            className="mt-1.5 min-h-24 border-0 bg-transparent px-0 text-sm hover:border-0 focus:border-0"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_EDITS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setInstruction(quick)}
                className="rounded-lg bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AspectRatioPicker options={model?.aspect_ratios ?? ["1:1"]} value={effectiveAspect} onChange={setAspectRatio} disabled={create.isPending} />
        </div>

        {error || tooLong ? (
          <p role="alert" className="text-[13px] text-danger">
            {tooLong ? `Instructions are limited to ${PROMPT_MAX_LENGTH} characters.` : error}
          </p>
        ) : !reference.asset ? (
          <p className="text-xs text-text-secondary">Upload an image to enable editing.</p>
        ) : null}

        <Button type="submit" size="lg" loading={create.isPending} disabled={!canSubmit} className="h-12 w-full gap-2 rounded-2xl shadow-accent">
          Generate edit
          {model ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold opacity-80">
              <Sparkles className="size-3.5" aria-hidden />
              {model.credit_cost}
            </span>
          ) : null}
        </Button>
        <p className="text-[11px] text-text-muted">FLUX.2 Klein re-renders the scene from your reference and instruction, so edits are creative rather than pixel-exact.</p>

        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">More editing tools</p>
          <ul className="space-y-1">
            {toolsByCategory("image")
              .filter((t) => EDIT_TOOL_SLUGS.includes(t.slug))
              .map((tool) => (
                <li key={tool.slug}>
                  <Tooltip content="Preview surface — no free provider yet">
                    <Link href={toolHref(tool)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary">
                      <tool.icon className="size-4" aria-hidden />
                      {tool.name}
                      <ArrowRight className="ml-auto size-3.5" aria-hidden />
                    </Link>
                  </Tooltip>
                </li>
              ))}
          </ul>
        </div>
      </form>

      <section className="min-w-0 rounded-3xl border border-border bg-surface p-3 sm:p-4" aria-label="Edited images">
        {listQuery.isPending ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-square rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        ) : edits.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <h1 className="display-heading text-3xl sm:text-5xl">
              Edit with words
              <br />
              <span className="text-accent">keep the picture</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-text-secondary sm:text-base">Upload a photo or a previous generation, describe the change, and get a re-rendered version. Every edit is saved to History.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Relight", "Restyle", "Change weather", "Swap outfit"].map((chip) => (
                <span key={chip} className={cn("rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-semibold text-text-secondary")}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {edits.map((generation) => (
              <EditRow key={generation.id} generation={generation}>
                <GenerationCards
                  generation={generation}
                  model={modelById(generation.model_id)}
                  onOpen={(g, asset) => setDetail({ generation: g, assetIndex: Math.max(0, g.assets.findIndex((a) => a.id === asset.id)) })}
                  onReusePrompt={reuse}
                  onRetry={regenerate}
                  retrying={retry.isPending}
                />
              </EditRow>
            ))}
          </div>
        )}
      </section>

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

/** Before → after: the reference the edit started from beside the result (or its processing/failed state). */
function EditRow({ generation, children }: { generation: Generation; children: React.ReactNode }) {
  const referenceId = generation.settings.reference_asset_id;
  const reference = useAsset(referenceId);
  return (
    <article className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface-elevated p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center" aria-label={`Edit: ${generation.prompt}`}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface" style={{ aspectRatio: "1 / 1" }}>
        {reference.data ? (
          <Image src={reference.data.url} alt="Reference image" fill unoptimized={!reference.data.url.includes("res.cloudinary.com")} sizes="(max-width: 640px) 100vw, 30vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">Before</span>
      </div>
      <div className="hidden flex-col items-center gap-1 px-1 text-text-secondary sm:flex">
        <MoveRight className="size-5" aria-hidden />
        <span className="max-w-28 truncate text-center text-[11px]" title={generation.prompt}>
          {generation.prompt}
        </span>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">After</span>
        {children}
      </div>
    </article>
  );
}
