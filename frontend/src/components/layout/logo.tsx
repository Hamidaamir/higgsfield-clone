import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Lime tile variant used in the auth modal. */
  tone?: "dark" | "accent";
}

export function Logo({ className, tone = "dark" }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Higgsfield home"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
        tone === "dark" ? "bg-surface-muted text-text-primary" : "bg-accent text-accent-foreground",
        className,
      )}
    >
      <LogoMark className="size-5" />
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 9.5c0-2.8 2.2-5 5-5 1.9 0 3.5 1 4.4 2.5L12 9.5a2.5 2.5 0 1 0 0 5l1.9 2.5A5 5 0 0 1 4.5 14.5v-5Z"
        fill="currentColor"
      />
      <path
        d="M19.5 14.5c0 2.8-2.2 5-5 5-1.9 0-3.5-1-4.4-2.5L12 14.5a2.5 2.5 0 1 0 0-5l-1.9-2.5A5 5 0 0 1 19.5 9.5v5Z"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}
