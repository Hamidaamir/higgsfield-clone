"use client";

import { Minus, Plus } from "lucide-react";

import type { ControlVariant } from "@/components/generator/setting-chip";
import { cn } from "@/lib/utils";

interface BatchStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  variant?: ControlVariant;
  /** What is being counted, for accessible names and the editorial caption. */
  unit?: "images" | "takes";
}

/** "− 1/4 +" control from the reference dock. */
export function BatchStepper({ value, max, onChange, disabled, variant = "default", unit = "images" }: BatchStepperProps) {
  const editorial = variant === "editorial";
  return (
    <div
      role="group"
      aria-label={`Number of ${unit}`}
      className={cn(
        "inline-flex h-9 shrink-0 items-center text-[13px]",
        editorial
          ? "border border-border-default bg-surface font-medium text-foreground"
          : "rounded-xl border border-border bg-surface-muted font-semibold",
      )}
    >
      {editorial ? <span className="editorial-label pl-3 pr-1">{unit}</span> : null}
      <button
        type="button"
        aria-label={`Fewer ${unit}`}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className={cn(
          "flex h-full w-8 items-center justify-center text-foreground-subtle hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent",
          !editorial && "rounded-l-xl",
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-8 text-center tabular-nums" aria-live="polite">
        {value}/{max}
      </span>
      <button
        type="button"
        aria-label={`More ${unit}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={cn(
          "flex h-full w-8 items-center justify-center text-foreground-subtle hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent",
          !editorial && "rounded-r-xl",
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
