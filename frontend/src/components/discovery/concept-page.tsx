import Link from "next/link";
import type { ReactNode } from "react";

import { PrintFrame } from "@/components/editorial/print-frame";
import { Button } from "@/components/ui/button";

export interface ConceptPoint {
  title: string;
  text: string;
}

export interface ConceptPageProps {
  /** Small-caps category line above the title. */
  eyebrow: string;
  title: string;
  /** What the product concept is, in the product's own words. */
  description: string;
  /**
   * Where the boundary sits: what this surface does and does not do today. Every preview
   * page states it in prose, not only through a chip, so it survives without colour.
   */
  note: string;
  /** Deterministic artwork seed; the plate is always captioned as concept artwork. */
  seed: string;
  /** A destination that genuinely works today. */
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** The idea, broken into parts. Rendered as an index, not as a grid of feature cards. */
  points?: ConceptPoint[];
  pointsTitle?: string;
  children?: ReactNode;
}

/**
 * Shared presentation for the secondary product concepts — the surfaces that reproduce a
 * product idea but have no implementation behind them. It carries no controls at all: the
 * only interactive elements are links to work that really runs.
 */
export function ConceptPage({
  eyebrow,
  title,
  description,
  note,
  seed,
  primary,
  secondary,
  points,
  pointsTitle = "The concept",
  children,
}: ConceptPageProps) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8 sm:py-12">
      <p className="editorial-label text-foreground-muted">{eyebrow}</p>

      <div className="mt-8 grid items-start gap-10 border-y border-border-default py-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:py-12">
        <div>
          <p className="editorial-label text-accent-text">Preview</p>
          <h1 className="editorial-display mt-4 text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">{description}</p>
          <p className="mt-8 max-w-xl border-l-2 border-border-default pl-4 text-sm leading-relaxed text-foreground-muted">
            {note}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-none">
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
            {secondary ? (
              <Button asChild variant="secondary" className="rounded-none">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Deliberately small on a phone: a preview page should not spend the whole first
            screen on decoration before saying what it is. */}
        <div className="max-w-sm lg:max-w-none">
          <PrintFrame seed={seed} ratio="4 / 3" sizes="(max-width: 1023px) 60vw, 45vw" className="shadow-none" />
          <p className="mt-3 text-xs text-foreground-muted">Concept artwork · not a generated result</p>
        </div>
      </div>

      {points?.length ? (
        <section className="mt-12" aria-labelledby="concept-points">
          <h2 id="concept-points" className="editorial-display text-3xl">
            {pointsTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
            An intended product, described. None of it is implemented here.
          </p>
          <div className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {points.map((point) => (
              <article key={point.title} className="border-t border-border-default py-6">
                <h3 className="editorial-display text-2xl">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{point.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {children}
    </div>
  );
}
