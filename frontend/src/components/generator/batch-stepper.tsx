"use client";

import { Minus, Plus } from "lucide-react";

interface BatchStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** "− 1/4 +" control from the reference dock. */
export function BatchStepper({ value, max, onChange, disabled }: BatchStepperProps) {
  return (
    <div
      role="group"
      aria-label="Number of images"
      className="inline-flex h-9 shrink-0 items-center rounded-xl border border-border bg-surface-muted text-[13px] font-semibold"
    >
      <button
        type="button"
        aria-label="Fewer images"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="flex h-full w-8 items-center justify-center rounded-l-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-8 text-center tabular-nums" aria-live="polite">
        {value}/{max}
      </span>
      <button
        type="button"
        aria-label="More images"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="flex h-full w-8 items-center justify-center rounded-r-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
