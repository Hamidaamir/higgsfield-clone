"use client";

import { ChevronRight } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SettingChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  label: ReactNode;
  /** Shows the trailing chevron used by pickers. */
  expandable?: boolean;
}

/** Compact control used in generator docks/sidebars (model, aspect ratio, quality…). */
export const SettingChip = forwardRef<HTMLButtonElement, SettingChipProps>(function SettingChip(
  { icon, label, expandable = false, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 text-[13px] font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-surface-hover",
        className,
      )}
      {...props}
    >
      {icon ? <span className="flex size-4 items-center justify-center text-text-secondary">{icon}</span> : null}
      <span className="truncate">{label}</span>
      {expandable ? <ChevronRight className="size-3.5 text-text-secondary" aria-hidden /> : null}
    </button>
  );
});
