import Link from "next/link";

import { Button } from "@/components/ui/button";

interface PagePlaceholderProps {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Temporary destination for routes whose full surface is scheduled for a
 * later milestone. Keeps every navigation item routable and coherent.
 */
export function PagePlaceholder({ eyebrow, title, description, ctaLabel = "Start generating", ctaHref = "/generate/image" }: PagePlaceholderProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-accent/40 bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="display-heading mt-5 text-4xl text-accent sm:text-6xl">{title}</h1>
      <p className="mx-auto mt-5 max-w-xl text-base text-text-secondary">{description}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild size="lg">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
        <Button asChild size="lg" variant="white">
          <Link href="/">Back to Explore</Link>
        </Button>
      </div>
    </section>
  );
}
