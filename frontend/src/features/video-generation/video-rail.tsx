"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { AspectRatioPicker } from "@/components/generator/aspect-ratio-picker";
import { DurationPicker } from "@/components/generator/duration-picker";
import { ModelPicker } from "@/components/generator/model-picker";
import { ReferenceDropzone } from "@/components/generator/reference-dropzone";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReferenceState } from "@/hooks/use-reference-upload";
import { NEGATIVE_PROMPT_MAX_LENGTH, PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

export interface VideoRailProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
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

// Edit Video and Motion Control have no free provider; their tabs open the honest preview pages.
const MODE_TABS = [
  { id: "create", label: "Create", href: null },
  { id: "edit", label: "Edit", href: "/tools/edit-video" },
  { id: "motion", label: "Motion", href: "/tools/cinema-studio" },
] as const;

function Group({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-border-subtle pt-4", className)}>
      <h2 className="editorial-label">{label}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/**
 * Persistent creation rail. Video carries far more standing configuration than Image — mode,
 * reference frame, prompt, model, aspect, duration and a negative prompt — which is why this
 * studio keeps a rail rather than a bottom dock.
 */
export function VideoRail({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
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
}: VideoRailProps) {
  // Opens on mount when a negative prompt arrived with the URL, so a restored value is
  // never hidden behind a collapsed panel.
  const [advancedOpen, setAdvancedOpen] = useState(() => Boolean(negativePrompt));
  const advancedId = useId();
  const trimmed = prompt.trim();
  const tooLong = prompt.length > PROMPT_MAX_LENGTH;
  const canSubmit =
    Boolean(model) && trimmed.length > 0 && !tooLong && !submitting && !reference.uploading && !disabledReason;
  const usingReference = Boolean(reference.asset || reference.previewUrl);
  const supportsReference = model?.supports_reference_image ?? false;
  const supportsNegative = model?.supports_negative_prompt ?? false;

  return (
    <form
      aria-label="Video generator"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onGenerate();
      }}
      className="flex flex-col gap-4 border border-border-default bg-surface p-4"
    >
      <nav aria-label="Video mode" className="flex items-center gap-4 pb-1">
        {MODE_TABS.map((tab) =>
          tab.href ? (
            <Tooltip key={tab.id} content="Preview surface — no free provider yet">
              <Link
                href={tab.href}
                className="text-[13px] text-foreground-subtle transition-colors hover:text-foreground-muted"
              >
                {tab.label}
              </Link>
            </Tooltip>
          ) : (
            <span key={tab.id} aria-current="page" className="text-[13px] font-medium text-accent-text">
              {tab.label}
            </span>
          ),
        )}
      </nav>

      {/* The mode is derived from whether a reference frame is attached — no separate state, so
          the UI can never claim image-to-video without an actual uploaded asset. */}
      <div className="flex items-center justify-between gap-3 border border-border-subtle bg-surface-subtle px-3 py-2">
        <span className="editorial-label">Mode</span>
        <span className="text-[13px] font-medium text-foreground">
          {usingReference ? "Image → Video" : "Text → Video"}
        </span>
      </div>

      <Group label="Reference frame" className="border-t-0 pt-0">
        {supportsReference ? (
          <>
            <ReferenceDropzone
              previewUrl={reference.previewUrl}
              uploading={reference.uploading}
              error={reference.error}
              onSelect={reference.select}
              onClear={reference.clear}
              disabled={submitting}
              variant="editorial"
              purpose="Reference"
              title="Animate an image"
            />
            {!usingReference ? (
              <p className="mt-2 text-[11px] leading-snug text-foreground-subtle">
                Optional. Without one, the clip is generated from the prompt alone.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-foreground-muted">{model?.name ?? "This model"} generates from text only.</p>
        )}
      </Group>

      <Group label="Prompt">
        <label htmlFor="video-prompt" className="sr-only">
          Prompt
        </label>
        <textarea
          id="video-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) onGenerate();
          }}
          rows={4}
          maxLength={PROMPT_MAX_LENGTH + 200}
          placeholder={
            usingReference
              ? "Describe how the image should move — slow camera push-in, hair in the wind"
              : "Describe the shot — a paper boat drifting at golden hour, slow dolly in"
          }
          aria-invalid={tooLong || Boolean(error) || undefined}
          aria-describedby={error || tooLong || disabledReason ? "video-prompt-error" : undefined}
          className="min-h-24 w-full resize-none border border-border-default bg-surface-raised px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle scrollbar-thin"
        />
        {prompt.length > PROMPT_MAX_LENGTH - 200 ? (
          <p className={cn("mt-1 text-right text-[11px] tabular-nums", tooLong ? "text-danger" : "text-foreground-subtle")}>
            {prompt.length}/{PROMPT_MAX_LENGTH}
          </p>
        ) : null}
      </Group>

      <Group label="Model">
        {/* One usable model today, so a dropdown of one is pointless — but the value still comes
            from the registry, and extra models automatically restore the picker. */}
        {models.length > 1 ? (
          <ModelPicker models={models} value={model} onChange={onModelChange} disabled={submitting} variant="editorial" />
        ) : (
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-medium text-foreground">{model?.name ?? "Unavailable"}</p>
            {model?.description ? (
              <p className="min-w-0 flex-1 truncate text-right text-[11px] text-foreground-subtle">{model.description}</p>
            ) : null}
          </div>
        )}
      </Group>

      <Group label="Aspect">
        <AspectRatioPicker
          options={model?.aspect_ratios ?? ["16:9"]}
          value={aspectRatio}
          onChange={onAspectRatioChange}
          disabled={submitting}
          variant="editorial"
          hideLabel
        />
      </Group>

      <Group label="Duration">
        <DurationPicker
          options={model?.durations_s ?? [3]}
          value={duration}
          onChange={onDurationChange}
          disabled={submitting}
          variant="editorial"
        />
      </Group>

      <section className="border-t border-border-subtle pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
          aria-controls={advancedOpen ? advancedId : undefined}
          className="flex w-full items-center justify-between text-[13px] text-foreground-muted transition-colors hover:text-foreground"
        >
          Advanced
          <ChevronDown className={cn("size-3.5 transition-transform", advancedOpen && "rotate-180")} aria-hidden />
        </button>
        {advancedOpen ? (
          <div id={advancedId} className="mt-3">
            {supportsNegative ? (
              <>
                <label htmlFor="video-negative-prompt" className="editorial-label">
                  Negative prompt
                </label>
                <textarea
                  id="video-negative-prompt"
                  value={negativePrompt}
                  onChange={(e) => onNegativePromptChange(e.target.value)}
                  rows={2}
                  maxLength={NEGATIVE_PROMPT_MAX_LENGTH}
                  placeholder="What the clip should avoid"
                  className="mt-1.5 w-full resize-none border border-border-default bg-surface-raised px-3 py-2 text-[13px] leading-5 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle"
                />
              </>
            ) : (
              <p className="text-[13px] text-foreground-muted">
                {model?.name ?? "This model"} has no advanced options.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {error || tooLong || disabledReason ? (
        <p
          id="video-prompt-error"
          role="alert"
          className="border-l-2 border-danger bg-danger/5 py-2 pl-3 pr-2 text-[13px] leading-snug text-danger"
        >
          {tooLong ? `Prompts are limited to ${PROMPT_MAX_LENGTH} characters.` : (error ?? disabledReason)}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit} className="w-full rounded-none shadow-none">
        Generate video
      </Button>
      <p className="text-[11px] leading-snug text-foreground-subtle">
        Clips render on a free GPU tier, so one generation runs at a time and daily capacity is limited.
      </p>
    </form>
  );
}
