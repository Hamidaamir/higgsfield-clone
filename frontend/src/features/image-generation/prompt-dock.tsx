"use client";

import { Plus, Sparkles } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";

import { AspectRatioPicker } from "@/components/generator/aspect-ratio-picker";
import { BatchStepper } from "@/components/generator/batch-stepper";
import { ModelPicker } from "@/components/generator/model-picker";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

export interface PromptDockProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  models: ModelSpec[];
  model: ModelSpec | undefined;
  onModelChange: (model: ModelSpec) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  onGenerate: () => void;
  submitting: boolean;
  error: string | null;
  /** Server-side reason generation is unavailable (e.g. models failed to load). */
  disabledReason?: string | null;
}

/** Bottom-docked composer reproducing the reference image generator bar (212424.png). */
export function PromptDock({
  prompt,
  onPromptChange,
  models,
  model,
  onModelChange,
  aspectRatio,
  onAspectRatioChange,
  batchSize,
  onBatchSizeChange,
  onGenerate,
  submitting,
  error,
  disabledReason,
}: PromptDockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = prompt.trim();
  const tooLong = prompt.length > PROMPT_MAX_LENGTH;
  const canSubmit = Boolean(model) && trimmed.length > 0 && !tooLong && !submitting && !disabledReason;
  const cost = (model?.credit_cost ?? 0) * batchSize;

  // Auto-grow up to ~5 lines, like the reference single-line dock that expands as you type.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [prompt]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) onGenerate();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-6 sm:pb-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onGenerate();
        }}
        aria-label="Image generator"
        className="pointer-events-auto mx-auto w-full max-w-[1120px] rounded-3xl border border-border bg-surface-elevated/95 p-2.5 shadow-menu backdrop-blur sm:p-3"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex items-start gap-2.5 px-1">
              <Tooltip content="Reference images arrive with Edit Image">
                <span
                  aria-disabled="true"
                  className="mt-0.5 flex size-8 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-border bg-surface-muted text-text-muted"
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="sr-only">Add reference (coming with Edit Image)</span>
                </span>
              </Tooltip>
              <label htmlFor="image-prompt" className="sr-only">
                Prompt
              </label>
              <textarea
                id="image-prompt"
                ref={textareaRef}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={PROMPT_MAX_LENGTH + 200}
                placeholder="Describe the scene you imagine"
                aria-invalid={tooLong || Boolean(error) || undefined}
                aria-describedby={error || tooLong ? "image-prompt-error" : undefined}
                className="min-h-9 w-full resize-none bg-transparent py-1.5 text-[15px] leading-6 text-text-primary outline-none placeholder:text-text-muted scrollbar-thin"
              />
              {prompt.length > PROMPT_MAX_LENGTH - 200 ? (
                <span className={cn("shrink-0 pt-2 text-[11px] tabular-nums", tooLong ? "text-danger" : "text-text-muted")}>
                  {prompt.length}/{PROMPT_MAX_LENGTH}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto px-0.5 pb-0.5 scrollbar-none">
              <ModelPicker models={models} value={model} onChange={onModelChange} disabled={submitting} />
              <AspectRatioPicker
                options={model?.aspect_ratios ?? ["1:1"]}
                value={aspectRatio}
                onChange={onAspectRatioChange}
                disabled={submitting}
              />
              <BatchStepper value={batchSize} max={model?.max_batch ?? 1} onChange={onBatchSizeChange} disabled={submitting} />
            </div>
          </div>

          <div className="flex shrink-0 items-end sm:items-stretch">
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={!canSubmit}
              className="h-12 w-full gap-2 rounded-2xl px-5 text-base shadow-accent sm:h-auto sm:min-h-[84px] sm:w-auto sm:px-7"
            >
              Generate
              {model ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold opacity-80">
                  <Sparkles className="size-3.5" aria-hidden />
                  {cost}
                </span>
              ) : null}
            </Button>
          </div>
        </div>

        {error || tooLong || disabledReason ? (
          <p id="image-prompt-error" role="alert" className="mt-2 px-2 text-[13px] text-danger">
            {tooLong ? `Prompts are limited to ${PROMPT_MAX_LENGTH} characters.` : (error ?? disabledReason)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
