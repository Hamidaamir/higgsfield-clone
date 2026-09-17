"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Badge, navBadgeVariant } from "@/components/ui/badge";
import { artFor, photoUrl } from "@/lib/photos";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  href: string;
  seed: string;
  alt: string;
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

/** Discovery card: seeded photo with graceful gradient fallback, optional poster text and caption. */
export function MediaCard({
  href,
  seed,
  alt,
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
  const [failed, setFailed] = useState(false);
  return (
    <Link href={href} className={cn("group block min-w-0", className)}>
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated"
        style={{ aspectRatio: ratio, backgroundImage: failed ? artFor(seed) : undefined }}
      >
        {!failed ? (
          <Image
            src={photoUrl(seed, 960, 640)}
            alt={alt}
            fill
            unoptimized
            priority={priority}
            sizes={sizes}
            onError={() => setFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" aria-hidden />
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
