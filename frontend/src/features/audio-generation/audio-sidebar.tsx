"use client";

import { AudioLines, Globe, Image as ImageIcon, Info, Mic, Music, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BatchStepper } from "@/components/generator/batch-stepper";
import { ModelPicker } from "@/components/generator/model-picker";
import { OptionPicker } from "@/components/generator/option-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { SCRIPT_MAX_LENGTH, STYLE_PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

export interface AudioSidebarProps {
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

const MODE_TABS = [
  // Voice Change / Translate have no free provider; their tabs open the honest preview pages.
  { id: "tts", label: "Text to Speech", href: null },
  { id: "voice-change", label: "Voice Change", href: "/tools/voice-change" },
  { id: "translate", label: "Translate", href: "/tools/translate" },
] as const;

/** Left control column of the audio workspace (reference/screenshots/212513.png). */
export function AudioSidebar({
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
}: AudioSidebarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const trimmed = script.trim();
  const tooLong = script.length > SCRIPT_MAX_LENGTH;
  const styleTooLong = stylePrompt.length > STYLE_PROMPT_MAX_LENGTH;
  const canSubmit = Boolean(model) && trimmed.length > 0 && !tooLong && !styleTooLong && !submitting && !disabledReason;
  const hasAdvanced = Boolean(model && model.languages.length > 0);

  return (
    <form
      aria-label="Speech generator"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onGenerate();
      }}
      className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-3"
    >
      <div role="tablist" aria-label="Audio mode" className="flex gap-1 border-b border-border pb-2">
        {MODE_TABS.map((tab) =>
          tab.href ? (
            <Tooltip key={tab.id} content="Preview surface — no free provider yet">
              <Link href={tab.href} role="tab" aria-selected={false} className="relative px-2 pb-1.5 pt-1 text-[13px] font-semibold text-text-muted hover:text-text-secondary">
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

      {/* Reference upload (voice cloning) exists in the product but no free provider supports it,
          so the block reads as a preview rather than a dropzone that silently ignores clicks. */}
      <Link
        href="/tools/voice-change"
        className="relative flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-4 py-5 text-center transition-colors hover:border-border-strong"
      >
        <span className="absolute right-3 top-3 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
          Preview
        </span>
        <div className="flex items-center gap-1.5">
          {[AudioLines, Music, ImageIcon].map((Icon, i) => (
            <span key={i} className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-muted text-text-secondary">
              <Icon className="size-4" aria-hidden />
            </span>
          ))}
        </div>
        <p className="text-sm font-semibold">Upload media</p>
        <p className="text-xs text-text-secondary">Voice cloning and audio references arrive with Voice Change</p>
      </Link>

      <div className="rounded-2xl border border-border bg-surface-elevated p-3">
        <div className="flex items-center justify-between">
          <label htmlFor="audio-script" className="text-xs font-medium text-text-secondary">
            Script
          </label>
          <Tooltip content="Write exactly what the voice will read out loud.">
            <Info className="size-3.5 text-text-muted" aria-hidden />
          </Tooltip>
        </div>
        <Textarea
          id="audio-script"
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          placeholder="Write exactly what the voice will read out loud."
          maxLength={SCRIPT_MAX_LENGTH + 200}
          aria-invalid={tooLong || Boolean(error) || undefined}
          aria-describedby={error || tooLong ? "audio-script-error" : undefined}
          className="mt-1.5 min-h-28 border-0 bg-transparent px-0 text-sm hover:border-0 focus:border-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) onGenerate();
          }}
        />
        <p className={cn("text-right text-[11px] tabular-nums", tooLong ? "text-danger" : "text-text-muted")}>
          {script.length}/{SCRIPT_MAX_LENGTH}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-3 py-2.5">
        <p className="text-xs text-text-secondary">Model</p>
        <ModelPicker models={models} value={model} onChange={onModelChange} disabled={submitting} />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-3 py-2.5">
        <p className="text-xs text-text-secondary">Batch size</p>
        <BatchStepper value={batchSize} max={model?.max_batch ?? 1} onChange={onBatchSizeChange} disabled={submitting} />
      </div>

      {model && model.voices.length > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-3 py-2.5">
          <p className="text-xs text-text-secondary">Voice</p>
          <OptionPicker
            label="Voice"
            icon={<Mic className="size-4" />}
            options={model.voices}
            value={voice}
            onChange={onVoiceChange}
            disabled={submitting}
          />
        </div>
      ) : null}

      {model?.supports_style_prompt ? (
        <div className="rounded-2xl border border-border bg-surface-elevated p-3">
          <div className="flex items-center justify-between">
            <label htmlFor="audio-style" className="text-xs font-medium text-text-secondary">
              Voice details
            </label>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-secondary">Optional</span>
          </div>
          <Textarea
            id="audio-style"
            value={stylePrompt}
            onChange={(e) => onStylePromptChange(e.target.value)}
            placeholder="e.g. Young female voice with a British accent, soft and warm. Excited, giggling."
            maxLength={STYLE_PROMPT_MAX_LENGTH + 100}
            aria-invalid={styleTooLong || undefined}
            className="mt-1.5 min-h-20 border-0 bg-transparent px-0 text-sm hover:border-0 focus:border-0"
          />
          <p className={cn("text-right text-[11px] tabular-nums", styleTooLong ? "text-danger" : "text-text-muted")}>
            {stylePrompt.length}/{STYLE_PROMPT_MAX_LENGTH}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface-elevated">
        <button
          type="button"
          onClick={() => hasAdvanced && setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          aria-disabled={!hasAdvanced || undefined}
          className={cn("flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold", !hasAdvanced && "cursor-not-allowed text-text-muted")}
        >
          <SlidersHorizontal className="size-4 text-text-secondary" aria-hidden />
          Advanced settings
          <span className="ml-auto text-xs font-normal text-text-secondary">
            {hasAdvanced ? (advancedOpen ? "Hide" : "Language") : "None for this model"}
          </span>
        </button>
        {advancedOpen && model && model.languages.length > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
            <p className="text-xs text-text-secondary">Language</p>
            <OptionPicker
              label="Language"
              icon={<Globe className="size-4" />}
              options={model.languages.map((l) => ({ id: l.code, name: l.name }))}
              value={language}
              onChange={onLanguageChange}
              disabled={submitting}
              variant="chips"
            />
          </div>
        ) : null}
      </div>

      {error || tooLong || disabledReason ? (
        <p id="audio-script-error" role="alert" className="text-[13px] text-danger">
          {tooLong ? `Scripts are limited to ${SCRIPT_MAX_LENGTH} characters.` : (error ?? disabledReason)}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit} className="h-12 w-full gap-2 rounded-2xl shadow-accent">
        Generate
        {model ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold opacity-80">
            <Sparkles className="size-3.5" aria-hidden />
            {model.credit_cost * batchSize}
          </span>
        ) : null}
      </Button>
    </form>
  );
}
