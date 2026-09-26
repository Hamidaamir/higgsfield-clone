"use client";

import { Check, Clock } from "lucide-react";
import { useState } from "react";

import { SettingChip, type ControlVariant } from "@/components/generator/setting-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DurationPickerProps {
  options: number[];
  value: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
  variant?: ControlVariant;
}

/** Clip-length chip; only the lengths the selected model supports are offered. */
export function DurationPicker({ options, value, onChange, disabled, variant = "default" }: DurationPickerProps) {
  const [open, setOpen] = useState(false);

  // With only a handful of lengths, a segmented row beats a dropdown: every option is one tap
  // away and the selected length is always visible.
  if (variant === "editorial") {
    return (
      <div role="radiogroup" aria-label="Duration" className="flex flex-wrap items-stretch gap-px border border-border-default bg-border-subtle">
        {options.map((seconds) => {
          const selected = seconds === value;
          return (
            <button
              key={seconds}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(seconds)}
              className={cn(
                "min-w-11 flex-1 px-3 py-2 text-[13px] tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface text-foreground-muted hover:bg-surface-hover hover:text-foreground",
              )}
            >
              {seconds}s
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SettingChip aria-label="Duration" icon={<Clock className="size-4" />} label={`${value}s`} expandable disabled={disabled} />
      </PopoverTrigger>
      <PopoverContent className="w-52">
        <p className="px-2 pb-2 pt-1 text-xs font-medium text-text-secondary">Duration</p>
        <ul role="listbox" aria-label="Duration" className="grid grid-cols-4 gap-1.5">
          {options.map((seconds) => {
            const selected = seconds === value;
            return (
              <li key={seconds} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(seconds);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-10 w-full items-center justify-center gap-1 rounded-xl border text-sm font-semibold hover:bg-surface-muted",
                    selected ? "border-accent bg-accent-muted text-accent" : "border-border text-text-primary",
                  )}
                >
                  {seconds}s{selected ? <Check className="size-3" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
