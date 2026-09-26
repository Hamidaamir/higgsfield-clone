"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { useTheme } from "@/components/theme/theme-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Compact header presentation of the R0 theme store: one button that opens a three-option
 * menu. The store, persistence and pre-paint script are untouched — only the control changed,
 * so the header keeps its editorial proportions instead of carrying three permanent buttons.
 */
export function ThemeMenu({ className }: { className?: string }) {
  const { preference, resolved, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  // The trigger shows what is actually rendering; the menu shows which option is selected.
  const TriggerIcon = resolved === "dark" ? Moon : Sun;
  const current = OPTIONS.find((option) => option.value === preference);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Color theme: ${current?.label ?? "System"}`}
          className={cn(
            "inline-flex size-8 items-center justify-center text-foreground-muted transition-colors hover:text-foreground data-[state=open]:text-foreground",
            className,
          )}
        >
          <TriggerIcon className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-44 rounded-none border-border-default p-1.5">
        <p className="editorial-label px-2.5 pb-1.5 pt-1">Theme</p>
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPreference(value);
                setOpen(false);
              }}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-sm transition-colors",
                selected ? "text-foreground" : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {selected ? <Check className="size-3.5 text-accent-text" aria-hidden /> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
