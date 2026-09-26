"use client";

import { Check, Scan } from "lucide-react";
import { useState } from "react";

import { SettingChip, type ControlVariant } from "@/components/generator/setting-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { ratioToStyle } from "@/lib/media";
import { cn } from "@/lib/utils";

interface AspectRatioPickerProps {
  options: string[];
  value: string;
  onChange: (ratio: string) => void;
  disabled?: boolean;
  variant?: ControlVariant;
  /** Editorial only: drop the inline "Aspect" caption when a group heading already says it. */
  hideLabel?: boolean;
}

/** Aspect ratio chip; only the ratios the selected model actually supports are offered. */
export function AspectRatioPicker({ options, value, onChange, disabled, variant = "default", hideLabel }: AspectRatioPickerProps) {
  const [open, setOpen] = useState(false);
  const locked = options.length <= 1;

  const chip = (
    <SettingChip
      aria-label="Aspect ratio"
      icon={variant === "editorial" ? undefined : <Scan className="size-4" />}
      label={
        variant === "editorial" && !hideLabel ? (
          <span className="flex items-baseline gap-2">
            <span className="editorial-label">Aspect</span>
            <span className="tabular-nums">{value}</span>
          </span>
        ) : variant === "editorial" ? (
          <span className="tabular-nums">{value}</span>
        ) : (
          value
        )
      }
      expandable={!locked}
      disabled={disabled || locked}
      variant={variant}
    />
  );

  if (locked) {
    return <Tooltip content="This model only generates square images">{chip}</Tooltip>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{chip}</PopoverTrigger>
      <PopoverContent className="w-64">
        <p className="px-2 pb-2 pt-1 text-xs font-medium text-text-secondary">Aspect ratio</p>
        <ul role="listbox" aria-label="Aspect ratio" className="grid grid-cols-4 gap-1.5">
          {options.map((ratio) => {
            const selected = ratio === value;
            return (
              <li key={ratio} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(ratio);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold hover:bg-surface-muted",
                    selected ? "border-accent bg-accent-muted text-accent" : "border-border text-text-primary",
                  )}
                >
                  <span className="flex h-8 w-full items-center justify-center">
                    <span
                      className={cn("max-h-8 max-w-8 rounded-sm border-2", selected ? "border-accent" : "border-text-secondary")}
                      style={{ ...ratioToStyle(ratio), width: "100%" }}
                    />
                  </span>
                  <span className="flex items-center gap-1">
                    {ratio}
                    {selected ? <Check className="size-3" aria-hidden /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
