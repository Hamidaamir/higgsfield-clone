import Image from "next/image";
import type { ReactNode } from "react";

import { Artwork, type ArtTheme } from "@/components/discovery/artwork";
import { cn } from "@/lib/utils";

/**
 * A photographic print: thin paper border, restrained shadow, optional slight rotation.
 * The frame itself carries the editorial language, so the media inside stays untouched —
 * a real generated image, or a locally rendered Artwork composition.
 */
interface PrintFrameProps {
  /** A real image shipped with the app. Omit to render generated artwork instead. */
  src?: string;
  alt?: string;
  seed?: string;
  theme?: ArtTheme;
  /** CSS aspect ratio for the plate, e.g. "4 / 5". */
  ratio?: string;
  /** Degrees of rotation; kept small on purpose. */
  rotate?: number;
  caption?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  children?: ReactNode;
}

export function PrintFrame({
  src,
  alt = "",
  seed = "print",
  theme,
  ratio = "4 / 5",
  rotate = 0,
  caption,
  priority,
  sizes = "(max-width: 768px) 45vw, 320px",
  className,
  children,
}: PrintFrameProps) {
  return (
    <figure
      className={cn(
        "border border-border-subtle bg-surface-raised p-2 shadow-print transition-transform duration-500",
        caption ? "pb-2" : "",
        className,
      )}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <div className="relative overflow-hidden bg-surface-subtle" style={{ aspectRatio: ratio }}>
        {src ? (
          <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
        ) : (
          <Artwork seed={seed} theme={theme} />
        )}
        <span className="grain pointer-events-none absolute inset-0" aria-hidden />
        {children}
      </div>
      {caption ? (
        <figcaption className="px-0.5 pt-2 text-[11px] leading-tight text-foreground-subtle">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
