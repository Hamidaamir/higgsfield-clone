import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "white" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover disabled:bg-accent/40 disabled:text-accent-foreground/70",
  secondary:
    "bg-surface-muted text-text-primary hover:bg-surface-hover border border-border disabled:opacity-50",
  outline:
    "border border-border-strong bg-transparent text-text-primary hover:bg-surface-muted disabled:opacity-50",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-muted disabled:opacity-50",
  // "white" predates theming: it means "inverse of the canvas", not literally white.
  white:
    "bg-surface-inverse text-foreground-inverse hover:opacity-90 disabled:opacity-50",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Render as the child element (e.g. a Next `Link`) while keeping button styles. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, asChild = false, disabled, children, ...props },
  ref,
) {
  const classes = cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  // Slot requires exactly one child, so the loading indicator only applies to real buttons.
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
