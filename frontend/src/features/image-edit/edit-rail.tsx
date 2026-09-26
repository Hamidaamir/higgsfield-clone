"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AspectRatioPicker } from "@/components/generator/aspect-ratio-picker";
import { ReferenceDropzone } from "@/components/generator/reference-dropzone";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReferenceState } from "@/hooks/use-reference-upload";
import { toolHref, toolsByCategory } from "@/lib/config/tools";
import { PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "@/types/generation";

/** The five instruction shortcuts that already shipped; they fill the instruction field. */
export const QUICK_EDITS = [
  "Make it nighttime with neon lights",
  "Turn the sky into a dramatic sunset",
  "Make it snow",
  "Change the outfit to a red jacket",
  "Give it a 35mm film look",
];

/** Tools with no free provider yet; each links to its existing honest preview page. */
const EDIT_TOOL_SLUGS = ["relight", "inpaint", "image-upscale", "face-swap", "character-swap"];

export interface EditRailProps {
  reference: ReferenceState;
  instruction: string;
  onInstructionChange: (value: string) => void;
  model: ModelSpec | undefined;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  onGenerate: () => void;
  submitting: boolean;
  error: string | null;
  disabledReason?: string | null;
}

function Group({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-border-subtle pt-4", className)}>
      <h2 className="editorial-label">{label}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/**
 * Editing rail. Everything an edit needs sits in one column: the image it starts from, the
 * instruction, and the settings the model actually supports. The reference is first because
 * an edit cannot exist without one — it becomes the BEFORE half of every result.
 */
export function EditRail({
  reference,
  instruction,
  onInstructionChange,
  model,
  aspectRatio,
  onAspectRatioChange,
  onGenerate,
  submitting,
  error,
  disabledReason,
}: EditRailProps) {
  const trimmed = instruction.trim();
  const tooLong = instruction.length > PROMPT_MAX_LENGTH;
  const hasReference = Boolean(reference.asset);
  const canSubmit =
    Boolean(model) && hasReference && trimmed.length > 0 && !tooLong && !submitting && !reference.uploading && !disabledReason;
  const nearLimit = instruction.length > PROMPT_MAX_LENGTH - 200;
  const tools = toolsByCategory("image").filter((t) => EDIT_TOOL_SLUGS.includes(t.slug));

  return (
    <form
      aria-label="Image editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onGenerate();
      }}
      className="flex flex-col gap-4 border border-border-default bg-surface p-4"
    >
      <Group label="Reference" className="border-t-0 pt-0">
        <ReferenceDropzone
          previewUrl={reference.previewUrl}
          uploading={reference.uploading}
          error={reference.error}
          onSelect={reference.select}
          onClear={reference.clear}
          disabled={submitting}
          purpose="Before"
          title="Upload the image to edit"
          variant="editorial"
        />
        {!hasReference && !reference.uploading ? (
          <p className="mt-2 text-[11px] leading-snug text-foreground-subtle">
            Every edit starts from an image — this one becomes the before half of the result.
          </p>
        ) : null}
      </Group>

      <Group label="Instruction">
        <label htmlFor="edit-instruction" className="sr-only">
          Instruction
        </label>
        <textarea
          id="edit-instruction"
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) onGenerate();
          }}
          rows={4}
          maxLength={PROMPT_MAX_LENGTH + 200}
          placeholder="Describe what you want to change…"
          aria-invalid={tooLong || Boolean(error) || undefined}
          aria-describedby={error || tooLong || disabledReason ? "edit-instruction-error" : undefined}
          className="min-h-24 w-full resize-none border border-border-default bg-surface-raised px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle scrollbar-thin"
        />
        {nearLimit ? (
          <p className={cn("mt-1 text-right text-[11px] tabular-nums", tooLong ? "text-danger" : "text-foreground-subtle")}>
            {instruction.length}/{PROMPT_MAX_LENGTH}
          </p>
        ) : null}
      </Group>

      {/* Shortcuts, not separate tools: each one writes its sentence into the field above. */}
      <Group label="Quick edits">
        <ul className="-mt-1 divide-y divide-border-subtle border-y border-border-subtle">
          {QUICK_EDITS.map((quick) => (
            <li key={quick}>
              <button
                type="button"
                onClick={() => onInstructionChange(quick)}
                disabled={submitting}
                className="group flex w-full items-center gap-2 py-2 text-left text-[13px] leading-snug text-foreground-muted transition-colors hover:text-accent-text disabled:opacity-50"
              >
                <span className="min-w-0 flex-1">{quick}</span>
                <ArrowRight
                  className="size-3.5 shrink-0 text-foreground-subtle transition-colors group-hover:text-accent-text"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group label="Model">
        {/* One edit-capable model today, so a dropdown of one is pointless — but the name,
            description and aspect list all still come from the registry. */}
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-medium text-foreground">{model?.name ?? "Unavailable"}</p>
          {model?.description ? (
            <p className="min-w-0 flex-1 truncate text-right text-[11px] text-foreground-subtle">{model.description}</p>
          ) : null}
        </div>
      </Group>

      <Group label="Aspect">
        <AspectRatioPicker
          options={model?.aspect_ratios ?? ["1:1"]}
          value={aspectRatio}
          onChange={onAspectRatioChange}
          disabled={submitting}
          variant="editorial"
          hideLabel
        />
      </Group>

      {error || tooLong || disabledReason ? (
        <p
          id="edit-instruction-error"
          role="alert"
          className="border-l-2 border-danger bg-danger/5 py-2 pl-3 pr-2 text-[13px] leading-snug text-danger"
        >
          {tooLong ? `Instructions are limited to ${PROMPT_MAX_LENGTH} characters.` : (error ?? disabledReason)}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit} className="w-full rounded-none shadow-none">
        Generate edit
      </Button>
      <p className="text-[11px] leading-snug text-foreground-subtle">
        {model?.name ?? "This model"} re-renders the scene from your reference and instruction, so edits are creative
        rather than pixel-exact.
      </p>

      <Group label="Other tools">
        <ul className="-mt-1 divide-y divide-border-subtle border-y border-border-subtle">
          {tools.map((tool) => (
            <li key={tool.slug}>
              <Tooltip content="Preview surface — no free provider yet">
                <Link
                  href={toolHref(tool)}
                  className="group flex items-center gap-2 py-2 text-[13px] text-foreground-muted transition-colors hover:text-accent-text"
                >
                  <tool.icon className="size-3.5 shrink-0 text-foreground-subtle" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                  <span className="shrink-0 text-[11px] text-foreground-subtle">Preview</span>
                </Link>
              </Tooltip>
            </li>
          ))}
        </ul>
      </Group>
    </form>
  );
}
