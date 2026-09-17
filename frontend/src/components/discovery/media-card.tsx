import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Artwork, type ArtTheme } from "@/components/discovery/artwork";
import { Badge, navBadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** A real generation shipped with the app (see `public/showcase`), used instead of artwork. */
export interface ShowcaseMedia {
  kind: "image" | "video";
  src: string;
  /** Poster frame for videos; images reuse `src`. */
  poster?: string;
}

interface MediaCardProps {
  href: string;
  seed: string;
  alt: string;
  theme?: ArtTheme;
  media?: ShowcaseMedia;
  /** CSS aspect ratio, e.g. "16 / 9". */
  ratio?: string;
  /** Poster-style text drawn onto the image (like "KEEP", "/INCLINE" in the reference). */
  overlay?: string;
  overlayPosition?: "bottom-right" | "top-left" | "center";
  /** Caption below the image (feature-card style). */
  title?: string;
  subtitle?: string;
  badge?: "New" | "Free" | "TOP";
  /** Extra content rendered inside the image frame (e.g. a status chip). */
  children?: ReactNode;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/** Discovery card: locally rendered artwork (or a shipped real generation), poster text, caption. */
export function MediaCard({
  href,
  seed,
  alt,
  theme,
  media,
  ratio = "16 / 9",
  overlay,
  overlayPosition = "bottom-right",
  title,
  subtitle,
  badge,
  children,
  className,
  priority,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw",
}: MediaCardProps) {
  return (
    <Link href={href} aria-label={title ? undefined : alt} className={cn("group block min-w-0", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated" style={{ aspectRatio: ratio }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          <MediaFrame seed={seed} alt={alt} theme={theme} media={media} priority={priority} sizes={sizes} />
        </div>
        <div className="grain pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" aria-hidden />
        {overlay ? (
          <span
            className={cn(
              "display-heading pointer-events-none absolute text-2xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-4xl",
              overlayPosition === "bottom-right" && "bottom-4 right-4 text-right",
              overlayPosition === "top-left" && "left-4 top-4",
              overlayPosition === "center" && "inset-0 flex items-center justify-center text-center",
            )}
          >
            {overlay}
          </span>
        ) : null}
        {badge ? (
          <Badge variant={navBadgeVariant(badge)} className="absolute left-3 top-3">
            {badge}
          </Badge>
        ) : null}
        {children}
      </div>
      {title ? (
        <div className="mt-3">
          <h3 className="display-heading text-[15px] tracking-normal">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
        </div>
      ) : null}
    </Link>
  );
}

/** The visual inside a card frame: shipped real media when we have it, generated artwork otherwise. */
export function MediaFrame({
  seed,
  alt,
  theme,
  media,
  priority,
  sizes,
}: {
  seed: string;
  alt: string;
  theme?: ArtTheme;
  media?: ShowcaseMedia;
  priority?: boolean;
  sizes?: string;
}) {
  if (media?.kind === "image") {
    return <Image src={media.src} alt={alt} fill priority={priority} sizes={sizes ?? "50vw"} className="object-cover" />;
  }
  if (media?.kind === "video") {
    return (
      <video src={media.src} poster={media.poster} muted loop autoPlay playsInline preload="metadata" aria-label={alt} className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return <Artwork seed={seed} theme={theme} />;
}
