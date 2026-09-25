import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "new" | "free" | "top" | "promo" | "neutral" | "accent";

const variantClasses: Record<BadgeVariant, string> = {
  new: "bg-accent text-accent-foreground",
  free: "bg-accent-subtle text-accent-text",
  top: "bg-accent text-accent-foreground",
  promo: "bg-accent text-accent-foreground",
  neutral: "bg-surface-muted text-text-secondary",
  accent: "bg-accent-muted text-accent",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase leading-4 tracking-wide",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Maps the nav badge labels used in config to a badge variant. */
export function navBadgeVariant(label: "New" | "Free" | "TOP"): BadgeVariant {
  if (label === "New") return "new";
  if (label === "Free") return "free";
  return "top";
}
