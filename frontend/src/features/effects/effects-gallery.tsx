"use client";

import Link from "next/link";
import { useState } from "react";

import { PrintFrame } from "@/components/editorial/print-frame";
import { EFFECT_CATEGORIES, EFFECTS, effectHref, type EffectCategory } from "@/lib/config/effects";
import { cn } from "@/lib/utils";

type Filter = "All" | EffectCategory;
const FILTERS: Filter[] = ["All", ...EFFECT_CATEGORIES];

/**
 * Preset index. Every entry is real configuration from the effects library, and "Use effect"
 * opens the video generator with that preset's prompt — nothing is generated here.
 */
export function EffectsGallery() {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const items = EFFECTS.filter(
    (e) => (filter === "All" || e.category === filter) && (!q || `${e.name} ${e.description}`.toLowerCase().includes(q)),
  );

  return (
    <section className="mt-10" aria-label="Effects library">
      <div className="flex flex-col gap-3 border-y border-border-default py-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Effect category" className="-mx-1 flex flex-wrap items-center">
          {FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              aria-pressed={filter === category}
              className={cn(
                "mx-1 min-h-9 px-3 text-[13px] uppercase tracking-wider transition-colors",
                filter === category
                  ? "bg-accent-subtle text-accent-text"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search effects"
          aria-label="Search effects"
          className="h-9 w-full border border-border-default bg-surface px-3 text-[13px] text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle sm:w-56"
        />
      </div>

      <p className="mt-3 text-[11px] text-foreground-subtle" role="status">
        {items.length} of {EFFECTS.length} presets
      </p>

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground-muted">No effects match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-6 grid items-start gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((effect, i) => (
            <article key={effect.slug} data-category={effect.category} className="min-w-0 border-b border-border-subtle pb-5">
              <PrintFrame
                seed={effect.seed}
                ratio="3 / 4"
                alt={`${effect.name} concept artwork`}
                priority={i < 4}
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                className="shadow-none"
              />
              <p className="mt-4 text-xs text-foreground-muted">
                {effect.category} · Concept artwork
              </p>
              <h3 className="editorial-display mt-2 text-2xl">{effect.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{effect.description}</p>
              <Link
                href={effectHref(effect)}
                aria-label={`Use effect ${effect.name}`}
                className="mt-3 inline-flex min-h-10 items-center text-sm text-accent-text underline decoration-border-default underline-offset-4 hover:decoration-current"
              >
                Use effect ↗
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
