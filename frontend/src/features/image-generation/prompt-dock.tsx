"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { AspectRatioPicker } from "@/components/generator/aspect-ratio-picker";
import { BatchStepper } from "@/components/generator/batch-stepper";
import { ModelPicker } from "@/components/generator/model-picker";
import { Button } from "@/components/ui/button";
import { NEGATIVE_PROMPT_MAX_LENGTH, PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

export interface PromptDockProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
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

/**
 * Bottom-docked composer: a hairline editorial bar the width of the workspace. The prompt is
 * the visual priority; model, aspect and batch sit on one restrained row beneath it, and
 * Advanced reveals only controls the selected model genuinely supports.
 */
export function PromptDock({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedId = useId();
  const trimmed = prompt.trim();
  const tooLong = prompt.length > PROMPT_MAX_LENGTH;
  const canSubmit = Boolean(model) && trimmed.length > 0 && !tooLong && !submitting && !disabledReason;
  const supportsNegative = model?.supports_negative_prompt ?? false;

  // Auto-grow up to ~5 lines, so the composer stays compact until the prompt needs room.
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
        className="pointer-events-auto mx-auto w-full max-w-[1120px] border border-border-default bg-surface-raised/97 shadow-float backdrop-blur"
      >
        <div className="flex items-start gap-3 px-3 pt-3 sm:px-4 sm:pt-4">
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
            placeholder="Describe the image you want to make"
            aria-invalid={tooLong || Boolean(error) || undefined}
            aria-describedby={error || tooLong || disabledReason ? "image-prompt-error" : undefined}
            className="min-h-9 w-full resize-none bg-transparent py-1 text-[15px] leading-6 text-foreground outline-none placeholder:text-foreground-subtle scrollbar-thin"
          />
          {prompt.length > PROMPT_MAX_LENGTH - 200 ? (
            <span className={cn("shrink-0 pt-1.5 text-[11px] tabular-nums", tooLong ? "text-danger" : "text-foreground-subtle")}>
              {prompt.length}/{PROMPT_MAX_LENGTH}
            </span>
          ) : null}
        </div>

        {advancedOpen ? (
          <div id={advancedId} className="border-t border-border-subtle px-3 py-3 sm:px-4">
            {supportsNegative ? (
              <>
                <label htmlFor="image-negative-prompt" className="editorial-label">
                  Negative prompt
                </label>
                <textarea
                  id="image-negative-prompt"
                  value={negativePrompt}
                  onChange={(e) => onNegativePromptChange(e.target.value)}
                  rows={2}
                  maxLength={NEGATIVE_PROMPT_MAX_LENGTH}
                  placeholder="What the image should avoid"
                  className="mt-1.5 w-full resize-none border border-border-default bg-surface px-3 py-2 text-[13px] leading-5 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle"
                />
              </>
            ) : (
              <p className="text-[13px] text-foreground-muted">
                {model?.name ?? "This model"} has no advanced options. SDXL Lightning supports a negative prompt.
              </p>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle px-3 py-2.5 sm:px-4">
          <ModelPicker models={models} value={model} onChange={onModelChange} disabled={submitting} variant="editorial" />
          <AspectRatioPicker
            options={model?.aspect_ratios ?? ["1:1"]}
            value={aspectRatio}
            onChange={onAspectRatioChange}
            disabled={submitting}
            variant="editorial"
          />
          <BatchStepper
            value={batchSize}
            max={model?.max_batch ?? 1}
            onChange={onBatchSizeChange}
            disabled={submitting}
            variant="editorial"
          />
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-expanded={advancedOpen}
            aria-controls={advancedOpen ? advancedId : undefined}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 px-2 text-[13px] text-foreground-muted transition-colors hover:text-foreground"
          >
            Advanced
            <ChevronDown className={cn("size-3.5 transition-transform", advancedOpen && "rotate-180")} aria-hidden />
          </button>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={!canSubmit}
            className="ml-auto h-10 rounded-none px-6 shadow-none"
          >
            Generate
          </Button>
        </div>

        {error || tooLong || disabledReason ? (
          <p
            id="image-prompt-error"
            role="alert"
            className="border-t border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger sm:px-4"
          >
            {tooLong ? `Prompts are limited to ${PROMPT_MAX_LENGTH} characters.` : (error ?? disabledReason)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
