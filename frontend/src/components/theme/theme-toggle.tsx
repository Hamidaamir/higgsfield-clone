"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Light / Dark / System as three real buttons: each is reachable by Tab, toggled with
 * Enter or Space, and exposes its state through aria-pressed. The server renders "System"
 * as active and React swaps in the stored preference on hydration.
 */
export function ThemeToggle({ className, size = "sm" }: { className?: string; size?: "sm" | "md" }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            title={`${label} theme`}
            className={cn(
              "inline-flex items-center justify-center rounded-md transition-colors",
              size === "sm" ? "size-7" : "size-9",
              active
                ? "bg-accent-subtle text-accent-text"
                : "text-foreground-subtle hover:bg-surface-hover hover:text-foreground",
            )}
          >
            <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
            <span className="sr-only">{label} theme</span>
          </button>
        );
      })}
    </div>
  );
}
