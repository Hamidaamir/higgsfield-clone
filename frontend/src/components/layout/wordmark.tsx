import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

/**
 * Editorial wordmark: the name set in the display serif with an accent full stop, the way a
 * creative publication signs a masthead. Text rather than an image asset, so it inherits the
 * theme, scales cleanly and stays legible at mobile sizes.
 */
export function Wordmark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "group inline-flex shrink-0 items-baseline rounded-sm text-foreground transition-colors hover:text-accent-text",
        className,
      )}
    >
      <span className="editorial-display text-[19px] leading-none tracking-[-0.01em] sm:text-[21px]">
        {siteConfig.name}
      </span>
      <span aria-hidden className="editorial-display ml-px text-[19px] leading-none text-accent sm:text-[21px]">
        .
      </span>
    </Link>
  );
}
