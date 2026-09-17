"use client";

import { AtSign, Pencil, Sparkles, Volume2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AspectRatioPicker } from "@/components/generator/aspect-ratio-picker";
import { DurationPicker } from "@/components/generator/duration-picker";
import { ModelPicker } from "@/components/generator/model-picker";
import { ReferenceDropzone } from "@/components/generator/reference-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReferenceState } from "@/hooks/use-reference-upload";
import { PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

export interface VideoSidebarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  models: ModelSpec[];
  model: ModelSpec | undefined;
  onModelChange: (model: ModelSpec) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  duration: number;
  onDurationChange: (seconds: number) => void;
  reference: ReferenceState;
  onGenerate: () => void;
  submitting: boolean;
  error: string | null;
  disabledReason?: string | null;
}

// Edit Video has no free provider; its tab opens the honest preview page instead of a dead control.
const MODE_TABS = [
  { id: "create", label: "Create Video", href: null },
  { id: "edit", label: "Edit Video", href: "/tools/edit-video" },
  { id: "motion", label: "Motion Control", href: "/tools/cinema-studio" },
] as const;

/** Left control column of the video workspace (reference/screenshots/212453.png). */
export function VideoSidebar({
  prompt,
  onPromptChange,
  models,
  model,
  onModelChange,
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  reference,
  onGenerate,
  submitting,
  error,
  disabledReason,
}: VideoSidebarProps) {
  const [inputMode, setInputMode] = useState<"references" | "extend">("references");
  const trimmed = prompt.trim();
  const tooLong = prompt.length > PROMPT_MAX_LENGTH;
  const canSubmit =
    Boolean(model) && trimmed.length > 0 && !tooLong && !submitting && !reference.uploading && !disabledReason;

  return (
    <form
      aria-label="Video generator"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onGenerate();
      }}
      className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-3"
    >
      <div role="tablist" aria-label="Video mode" className="flex gap-1 border-b border-border pb-2">
        {MODE_TABS.map((tab) =>
          tab.href ? (
            <Tooltip key={tab.id} content="Preview surface — no free provider yet">
              <Link
                href={tab.href}
                role="tab"
                aria-selected={false}
                className="relative px-2 pb-1.5 pt-1 text-[13px] font-semibold text-text-muted hover:text-text-secondary"
              >
                {tab.label}
              </Link>
            </Tooltip>
          ) : (
            <button key={tab.id} type="button" role="tab" aria-selected className="relative px-2 pb-1.5 pt-1 text-[13px] font-semibold text-text-primary">
              {tab.label}
              <span className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-accent" aria-hidden />
            </button>
          ),
        )}
      </div>

      {/* Preset card: the reference shows the active preset + model; "Change" opens the model list. */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[radial-gradient(120%_100%_at_0%_0%,#3a0f18_0%,#12060a_60%,#0c0c0c_100%)] p-4">
        <p className="display-heading text-2xl text-accent">General</p>
        <p className="mt-0.5 text-xs text-text-secondary">{model?.name ?? "Choose a model"}</p>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
          <Pencil className="size-3" aria-hidden />
          Preset
        </span>
      </div>

      <div role="tablist" aria-label="Input type" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1">
        <button
          type="button"
          role="tab"
          aria-selected={inputMode === "references"}
          onClick={() => setInputMode("references")}
          className={cn("h-9 rounded-lg text-[13px] font-semibold", inputMode === "references" ? "bg-surface text-text-primary" : "text-text-secondary")}
        >
          References
        </button>
        <Tooltip content="Extend Video needs a source clip — coming with Edit Video">
          <button type="button" role="tab" aria-selected={false} aria-disabled="true" className="h-9 cursor-not-allowed rounded-lg text-[13px] font-semibold text-text-muted">
            Extend Video
          </button>
        </Tooltip>
      </div>

      <ReferenceDropzone
        previewUrl={reference.previewUrl}
        uploading={reference.uploading}
        error={reference.error}
        onSelect={reference.select}
        onClear={reference.clear}
        disabled={submitting || !model?.supports_reference_image}
      />

      <div className="rounded-2xl border border-border bg-surface-elevated p-3">
        <label htmlFor="video-prompt" className="text-xs font-medium text-text-secondary">
          Prompt
        </label>
        <Textarea
          id="video-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={
            reference.asset
              ? "Describe how the image should move, e.g. slow camera push-in, hair blowing in the wind"
              : "Describe the visual change you want, e.g. make it snow or make it nighttime"
          }
          maxLength={PROMPT_MAX_LENGTH + 200}
          aria-invalid={tooLong || Boolean(error) || undefined}
          aria-describedby={error || tooLong ? "video-prompt-error" : undefined}
          className="mt-1.5 min-h-24 border-0 bg-transparent px-0 text-sm hover:border-0 focus:border-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) onGenerate();
          }}
        />
        <div className="mt-1 flex items-center gap-2 text-[11px] text-text-secondary">
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-1.5 py-0.5">
            <AtSign className="size-3" aria-hidden />
            Elements
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-1.5 py-0.5">
            <Volume2 className="size-3" aria-hidden />
            Audio off
          </span>
          {prompt.length > PROMPT_MAX_LENGTH - 200 ? (
            <span className={cn("ml-auto tabular-nums", tooLong ? "text-danger" : "")}>
              {prompt.length}/{PROMPT_MAX_LENGTH}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-3 py-2.5">
        <p className="text-xs text-text-secondary">Model</p>
        <ModelPicker models={models} value={model} onChange={onModelChange} disabled={submitting} />
      </div>

      <div className="flex flex-wrap gap-2">
        <DurationPicker options={model?.durations_s ?? [3]} value={duration} onChange={onDurationChange} disabled={submitting} />
        <AspectRatioPicker options={model?.aspect_ratios ?? ["16:9"]} value={aspectRatio} onChange={onAspectRatioChange} disabled={submitting} />
      </div>

      {error || tooLong || disabledReason ? (
        <p id="video-prompt-error" role="alert" className="text-[13px] text-danger">
          {tooLong ? `Prompts are limited to ${PROMPT_MAX_LENGTH} characters.` : (error ?? disabledReason)}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit} className="h-12 w-full gap-2 rounded-2xl shadow-accent">
        Generate
        {model ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold opacity-80">
            <Sparkles className="size-3.5" aria-hidden />
            {model.credit_cost}
          </span>
        ) : null}
      </Button>
    </form>
  );
}
