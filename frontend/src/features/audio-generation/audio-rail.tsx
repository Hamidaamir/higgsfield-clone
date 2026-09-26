"use client";

import { Globe, Mic } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BatchStepper } from "@/components/generator/batch-stepper";
import { ModelPicker } from "@/components/generator/model-picker";
import { OptionPicker } from "@/components/generator/option-picker";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { SCRIPT_MAX_LENGTH, STYLE_PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

export interface AudioRailProps {
  script: string;
  onScriptChange: (value: string) => void;
  models: ModelSpec[];
  model: ModelSpec | undefined;
  onModelChange: (model: ModelSpec) => void;
  voice: string | null;
  onVoiceChange: (voice: string) => void;
  language: string | null;
  onLanguageChange: (code: string) => void;
  stylePrompt: string;
  onStylePromptChange: (value: string) => void;
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  onGenerate: () => void;
  submitting: boolean;
  error: string | null;
  disabledReason?: string | null;
}

// Voice Change / Translate have no free provider; their links open the honest preview pages.
const MODE_TABS = [
  { id: "tts", label: "Text to Speech", href: null },
  { id: "voice-change", label: "Voice Change", href: "/tools/voice-change" },
  { id: "translate", label: "Translate", href: "/tools/translate" },
] as const;

function Group({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-border-subtle pt-4", className)}>
      <h2 className="editorial-label">{label}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/**
 * Audio creation rail. Which controls appear is driven entirely by the selected model's
 * registry capabilities — `voices`, `languages`, `supports_style_prompt` and `max_batch` —
 * so nothing is offered that the model cannot actually do.
 */
export function AudioRail({
  script,
  onScriptChange,
  models,
  model,
  onModelChange,
  voice,
  onVoiceChange,
  language,
  onLanguageChange,
  stylePrompt,
  onStylePromptChange,
  batchSize,
  onBatchSizeChange,
  onGenerate,
  submitting,
  error,
  disabledReason,
}: AudioRailProps) {
  const trimmed = script.trim();
  const tooLong = script.length > SCRIPT_MAX_LENGTH;
  const styleTooLong = stylePrompt.length > STYLE_PROMPT_MAX_LENGTH;
  const canSubmit = Boolean(model) && trimmed.length > 0 && !tooLong && !styleTooLong && !submitting && !disabledReason;
  const hasVoices = (model?.voices.length ?? 0) > 0;
  const hasLanguages = (model?.languages.length ?? 0) > 0;
  const supportsStyle = model?.supports_style_prompt ?? false;
  const nearLimit = script.length > SCRIPT_MAX_LENGTH - 200;

  return (
    <form
      aria-label="Speech generator"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onGenerate();
      }}
      className="flex flex-col gap-4 border border-border-default bg-surface p-4"
    >
      <nav aria-label="Audio mode" className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-1">
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

      <Group label="Script" className="border-t-0 pt-0">
        <label htmlFor="audio-script" className="sr-only">
          Script
        </label>
        <textarea
          id="audio-script"
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) onGenerate();
          }}
          rows={6}
          maxLength={SCRIPT_MAX_LENGTH + 200}
          placeholder="Write what you want to hear — exactly the words the voice will read."
          aria-invalid={tooLong || Boolean(error) || undefined}
          aria-describedby={error || tooLong || disabledReason ? "audio-script-error" : undefined}
          className="min-h-32 w-full resize-none border border-border-default bg-surface-raised px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle scrollbar-thin"
        />
        {/* The counter stays quiet until the limit is actually in sight. */}
        {nearLimit ? (
          <p className={cn("mt-1 text-right text-[11px] tabular-nums", tooLong ? "text-danger" : "text-foreground-subtle")}>
            {script.length}/{SCRIPT_MAX_LENGTH}
          </p>
        ) : null}
      </Group>

      <Group label="Model">
        <ModelPicker models={models} value={model} onChange={onModelChange} disabled={submitting} variant="editorial" />
        {model?.description ? (
          <p className="mt-2 text-[11px] leading-snug text-foreground-subtle">{model.description}</p>
        ) : null}
      </Group>

      {hasVoices ? (
        <Group label="Voice">
          <OptionPicker
            label="Voice"
            icon={<Mic className="size-4" />}
            options={model!.voices}
            value={voice}
            onChange={onVoiceChange}
            disabled={submitting}
            control="editorial"
          />
        </Group>
      ) : null}

      {hasLanguages ? (
        <Group label="Language">
          <OptionPicker
            label="Language"
            icon={<Globe className="size-4" />}
            options={model!.languages.map((l) => ({ id: l.code, name: l.name }))}
            value={language}
            onChange={onLanguageChange}
            disabled={submitting}
            variant="chips"
            control="editorial"
          />
        </Group>
      ) : null}

      {supportsStyle ? (
        <Group label="Style">
          <label htmlFor="audio-style" className="sr-only">
            Style
          </label>
          <textarea
            id="audio-style"
            value={stylePrompt}
            onChange={(e) => onStylePromptChange(e.target.value)}
            rows={3}
            maxLength={STYLE_PROMPT_MAX_LENGTH + 100}
            placeholder="Describe the delivery — for example: warm and unhurried, like a late-night narrator."
            aria-invalid={styleTooLong || undefined}
            className="w-full resize-none border border-border-default bg-surface-raised px-3 py-2 text-[13px] leading-5 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle"
          />
          {stylePrompt.length > STYLE_PROMPT_MAX_LENGTH - 100 ? (
            <p className={cn("mt-1 text-right text-[11px] tabular-nums", styleTooLong ? "text-danger" : "text-foreground-subtle")}>
              {stylePrompt.length}/{STYLE_PROMPT_MAX_LENGTH}
            </p>
          ) : null}
        </Group>
      ) : null}

      <Group label="Takes">
        <BatchStepper
          value={batchSize}
          max={model?.max_batch ?? 1}
          onChange={onBatchSizeChange}
          disabled={submitting}
          variant="editorial"
          unit="takes"
        />
      </Group>

      {error || tooLong || disabledReason ? (
        <p
          id="audio-script-error"
          role="alert"
          className="border-l-2 border-danger bg-danger/5 py-2 pl-3 pr-2 text-[13px] leading-snug text-danger"
        >
          {tooLong ? `Scripts are limited to ${SCRIPT_MAX_LENGTH} characters.` : (error ?? disabledReason)}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit} className="w-full rounded-none shadow-none">
        Generate audio
      </Button>
    </form>
  );
}
