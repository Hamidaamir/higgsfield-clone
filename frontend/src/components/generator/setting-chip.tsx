"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** `editorial` is the R4 workspace styling; `default` keeps the pre-redesign look for the
 *  studios that have not been migrated yet (video, audio). */
export type ControlVariant = "default" | "editorial";

interface SettingChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  label: ReactNode;
  /** Shows the trailing chevron used by pickers. */
  expandable?: boolean;
  variant?: ControlVariant;
}

/** Compact control used in generator docks/sidebars (model, aspect ratio, quality…). */
export const SettingChip = forwardRef<HTMLButtonElement, SettingChipProps>(function SettingChip(
  { icon, label, expandable = false, variant = "default", className, ...props },
  ref,
) {
  const editorial = variant === "editorial";
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        editorial
          ? "border border-border-default bg-surface px-3 font-medium text-foreground hover:border-border-strong data-[state=open]:border-accent"
          : "rounded-xl border border-border bg-surface-muted px-3 font-semibold text-text-primary hover:bg-surface-hover data-[state=open]:bg-surface-hover",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className={cn("flex size-4 items-center justify-center", editorial ? "text-foreground-subtle" : "text-text-secondary")}>
          {icon}
        </span>
      ) : null}
      <span className="truncate">{label}</span>
      {expandable ? (
        editorial ? (
          <ChevronDown className="size-3.5 text-foreground-subtle" aria-hidden />
        ) : (
          <ChevronRight className="size-3.5 text-text-secondary" aria-hidden />
        )
      ) : null}
    </button>
  );
});
