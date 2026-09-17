"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import { MediaCard } from "@/components/discovery/media-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EFFECT_CATEGORIES, EFFECTS, effectHref, type EffectCategory } from "@/lib/config/effects";

type Filter = "All" | EffectCategory;

/** Searchable, filterable effect grid. "Use effect" opens the video generator with the preset prompt. */
export function EffectsGallery() {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const items = EFFECTS.filter((e) => (filter === "All" || e.category === filter) && (!q || `${e.name} ${e.description}`.toLowerCase().includes(q)));

  return (
    <section className="mt-10" aria-label="Effects library">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList aria-label="Effect category" className="flex-wrap">
            {(["All", ...EFFECT_CATEGORIES] as Filter[]).map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search effects"
          aria-label="Search effects"
          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none placeholder:text-text-muted focus:border-accent sm:w-56"
        />
      </div>
      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-text-secondary">No effects match “{query}”.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {items.map((effect, i) => (
            <MediaCard key={effect.slug} href={effectHref(effect)} seed={effect.seed} alt={effect.name} ratio="3 / 4" badge={effect.badge} priority={i < 5}>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{effect.category}</p>
                <p className="text-sm font-semibold text-white">{effect.name}</p>
                <p className="line-clamp-2 text-xs text-white/70">{effect.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-black">
                  <Play className="size-3" aria-hidden />
                  Use effect
                </span>
              </div>
            </MediaCard>
          ))}
        </div>
      )}
    </section>
  );
}
