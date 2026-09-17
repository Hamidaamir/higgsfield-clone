"use client";

import { Check } from "lucide-react";
import { useState, type ReactNode } from "react";

import { SettingChip } from "@/components/generator/setting-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface PickerOption {
  id: string;
  name: string;
  description?: string;
}

interface OptionPickerProps {
  label: string;
  icon: ReactNode;
  options: PickerOption[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** Full-width list rows (voices) vs compact chips (languages). */
  variant?: "list" | "chips";
}

/** Generic controlled-list chip used for voices and languages; options come from the model registry. */
export function OptionPicker({ label, icon, options, value, onChange, disabled, variant = "list" }: OptionPickerProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SettingChip aria-label={label} icon={icon} label={current?.name ?? label} expandable disabled={disabled} />
      </PopoverTrigger>
      <PopoverContent className={variant === "list" ? "w-72 p-1.5" : "w-64"}>
        <p className="px-2 pb-1.5 pt-1 text-xs font-medium text-text-secondary">{label}</p>
        <ul
          role="listbox"
          aria-label={label}
          className={cn(variant === "list" ? "max-h-72 space-y-0.5 overflow-y-auto scrollbar-thin" : "grid grid-cols-2 gap-1.5")}
        >
          {options.map((option) => {
            const selected = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl text-left text-sm hover:bg-surface-muted",
                    variant === "list" ? "px-2.5 py-2" : "justify-center border px-2 py-2 font-semibold",
                    selected && (variant === "list" ? "bg-surface-muted" : "border-accent bg-accent-muted text-accent"),
                    variant === "chips" && !selected && "border-border",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{option.name}</span>
                    {option.description && variant === "list" ? (
                      <span className="block truncate text-xs text-text-secondary">{option.description}</span>
                    ) : null}
                  </span>
                  {selected ? <Check className="size-3.5 shrink-0 text-accent" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
