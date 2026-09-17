import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Lime uppercase section title + subtitle, optional right-aligned CTA (reference: "VISUAL EFFECTS"). */
export function SectionHeader({
  title,
  subtitle,
  action,
  tone = "accent",
  as = "h2",
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: "accent" | "white";
  /** Pages whose header is the SectionHeader pass "h1" so every route has exactly one. */
  as?: "h1" | "h2";
  className?: string;
}) {
  const Heading = as;
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <Heading className={cn("display-heading text-2xl sm:text-3xl", tone === "accent" ? "text-accent" : "text-text-primary")}>{title}</Heading>
        {subtitle ? <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Centered dark-lime "View all of … ↗" pill from the reference sections. */
export function ViewAllButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mt-5 flex justify-center">
      <Link
        href={href}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-accent/25 bg-[#20260b] px-5 text-[15px] font-semibold text-accent transition-colors hover:bg-[#2a3210]"
      >
        {children}
        <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** Perspective grid hero (reference: "Higgsfield MCP with GPT-6 ASTRA", Supercomputer). */
export function HeroPanel({
  eyebrow,
  title,
  subtitle,
  primary,
  secondary,
  tone = "dark",
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  tone?: "dark" | "lime";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border px-6 py-14 text-center sm:py-20",
        tone === "dark" ? "border-border bg-[#0f0f0f]" : "border-accent/40 bg-[radial-gradient(70%_80%_at_50%_40%,#2b3a05_0%,#0e1303_60%,#0b0b0b_100%)] shadow-[0_0_80px_rgba(214,255,0,0.18)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_60%,black,transparent)] [transform:perspective(600px)_rotateX(55deg)_translateY(-10%)]"
      />
      <div className="relative">
        {eyebrow ? <p className="text-lg text-text-secondary sm:text-xl">{eyebrow}</p> : null}
        <h2 className={cn("display-heading mt-2 text-4xl sm:text-6xl lg:text-7xl", tone === "lime" ? "text-accent" : "text-text-primary")}>{title}</h2>
        {subtitle ? <p className="mx-auto mt-4 max-w-md text-sm text-text-secondary sm:text-base">{subtitle}</p> : null}
        {primary || secondary ? (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {primary ? (
              <Link href={primary.href} className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-[15px] font-semibold text-accent-foreground hover:bg-accent-hover">
                {primary.label}
              </Link>
            ) : null}
            {secondary ? (
              <Link href={secondary.href} className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-surface-elevated px-5 text-[15px] font-semibold text-text-primary hover:bg-surface-muted">
                {secondary.label}
              </Link>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** Full-width gradient banner (reference: Canvas, Photodump). */
export function WideBanner({
  eyebrow,
  title,
  subtitle,
  cta,
  gradient,
  seed,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  cta: { label: string; href: string };
  gradient: string;
  seed?: string;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl border border-border", className)} style={{ backgroundImage: gradient }}>
      {seed ? <BannerArt seed={seed} /> : null}
      <div className="relative flex min-h-[260px] flex-col justify-center gap-4 p-8 sm:p-10 lg:max-w-[55%]">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/85">{eyebrow}</p> : null}
        <h2 className="display-heading text-3xl text-white sm:text-5xl">{title}</h2>
        {subtitle ? <p className="max-w-md text-sm text-white/80 sm:text-base">{subtitle}</p> : null}
        <div>
          <Link href={cta.href} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black hover:bg-neutral-200">
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

function BannerArt({ seed }: { seed: string }) {
  const tilts = [-12, -4, 6, 14];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] items-center justify-end gap-3 pr-8 lg:flex">
      {tilts.map((tilt, i) => (
        <div
          key={i}
          className="h-44 w-32 shrink-0 rounded-2xl border border-white/20 bg-cover bg-center shadow-card"
          style={{ transform: `rotate(${tilt}deg) translateY(${(i % 2) * 18 - 9}px)`, backgroundImage: `url(https://picsum.photos/seed/${seed}-${i}/320/440)` }}
        />
      ))}
    </div>
  );
}

/** Wrapped pill chips (reference: "Explore more AI features"). */
export function ChipCloud({ items, title }: { items: { label: string; href: string }[]; title: string }) {
  return (
    <section className="py-10 text-center">
      <h2 className="display-heading text-3xl sm:text-5xl">{title}</h2>
      <ul className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="inline-flex h-9 items-center rounded-lg bg-surface-muted px-3.5 text-sm font-medium text-text-primary hover:bg-surface-hover">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Icon + type chip + name + subtitle tile (reference quick-link tiles under the hero). */
export function QuickLinkTile({
  href,
  icon,
  kind,
  name,
  subtitle,
  badge,
}: {
  href: string;
  icon: ReactNode;
  kind?: "Video" | "Image" | "Audio";
  name: string;
  subtitle: string;
  badge?: ReactNode;
}) {
  return (
    <Link href={href} className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-elevated">
      <div className="flex items-start justify-between">
        <span className="flex size-8 items-center justify-center text-text-primary">{icon}</span>
        {kind ? <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-text-secondary">{kind}</span> : null}
      </div>
      <div>
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          {name}
          {badge}
        </p>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>
    </Link>
  );
}
