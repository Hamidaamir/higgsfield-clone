"use client";

import { Check, Clock } from "lucide-react";
import { useState } from "react";

import { SettingChip } from "@/components/generator/setting-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DurationPickerProps {
  options: number[];
  value: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
}

/** Clip-length chip; only the lengths the selected model supports are offered. */
export function DurationPicker({ options, value, onChange, disabled }: DurationPickerProps) {
  const [open, setOpen] = useState(false);
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
