import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, Eye } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { MediaCard } from "@/components/discovery/media-card";
import { SectionHeader } from "@/components/discovery/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Artwork, themeForSeed } from "@/components/discovery/artwork";
import { cn } from "@/lib/utils";

export interface ProductFeature {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
}

export interface ProductPageProps {
  eyebrow?: string;
  badge?: "New" | "Free" | "TOP";
  title: ReactNode;
  description: string;
  /** `available` = backed by a real workflow; `preview` = representative product surface. */
  status: "available" | "preview";
  /** What the preview surface actually does today, in one honest sentence. */
  statusNote?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  seed: string;
  features?: ProductFeature[];
  steps?: string[];
  gallery?: { seed: string; href: string; alt: string }[];
  galleryTitle?: string;
  children?: ReactNode;
}

/** Shared layout for studios, tools, models and integrations: hero + features + steps + gallery. */
export function ProductPage({
  eyebrow,
  badge,
  title,
  description,
  status,
  statusNote,
  primary,
  secondary,
  seed,
  features,
  steps,
  gallery,
  galleryTitle = "Made with it",
  children,
}: ProductPageProps) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-border">
        <Artwork seed={`${seed}-hero`} theme={themeForSeed(seed)} fit="wide" />
        <div className="grain absolute inset-0" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" aria-hidden />
        <div className="relative flex min-h-[380px] flex-col justify-end gap-4 p-6 sm:p-10 lg:max-w-[60%]">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
                ✦ {eyebrow}
              </span>
            ) : null}
            {badge ? <Badge variant={badge === "New" ? "new" : badge === "Free" ? "free" : "top"}>{badge}</Badge> : null}
            <StatusChip status={status} />
          </div>
          <h1 className="display-heading text-4xl text-white sm:text-6xl">{title}</h1>
          <p className="max-w-xl text-base text-white/80 sm:text-lg">{description}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-accent">
              <Link href={primary.href}>
                {primary.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            {secondary ? (
              <Button asChild size="lg" variant="white">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {status === "preview" && statusNote ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
          <Eye className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span>
            <span className="font-semibold text-text-primary">Preview surface. </span>
            {statusNote}
          </span>
        </p>
      ) : null}

      {features?.length ? (
        <section className="mt-12" aria-label="Features">
          <div className={cn("grid gap-4 sm:grid-cols-2", features.length % 3 === 0 ? "lg:grid-cols-3" : features.length === 4 ? "xl:grid-cols-4" : features.length >= 5 && "lg:grid-cols-3")}>
            {features.map((feature) => {
              const body = (
                <>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-accent">
                    <feature.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-text-secondary">{feature.text}</p>
                </>
              );
              const classes = "rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong";
              return feature.href ? (
                <Link key={feature.title} href={feature.href} className={classes}>
                  {body}
                </Link>
              ) : (
                <div key={feature.title} className={classes}>
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {steps?.length ? (
        <section className="mt-12" aria-label="How it works">
          <SectionHeader title="How it works" tone="white" />
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step} className="rounded-2xl border border-border bg-surface-elevated p-5">
                <span className="display-heading text-3xl text-accent">0{i + 1}</span>
                <p className="mt-2 text-sm text-text-primary">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {children}

      {gallery?.length ? (
        <section className="mt-12" aria-label={galleryTitle}>
          <SectionHeader title={galleryTitle} />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {gallery.map((item) => (
              <MediaCard key={item.seed} href={item.href} seed={item.seed} alt={item.alt} ratio="4 / 5" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function StatusChip({ status, className }: { status: "available" | "preview"; className?: string }) {
  return status === "available" ? (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success", className)}>
      <CheckCircle2 className="size-3.5" aria-hidden />
      Available now
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-secondary", className)}>
      <Eye className="size-3.5" aria-hidden />
      Preview
    </span>
  );
}
