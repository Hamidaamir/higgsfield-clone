"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PrintFrame } from "@/components/editorial/print-frame";
import type { ArtTheme } from "@/components/discovery/artwork";
import { Button } from "@/components/ui/button";
import { composerHref } from "@/lib/generation-links";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  kind: "Image" | "Video";
  seed: string;
  theme: ArtTheme;
  build: (product: string, brand: string) => string;
  aspect: string;
}

const TEMPLATES: Template[] = [
  { id: "product-shot", name: "Studio product shot", kind: "Image", seed: "mk-product", theme: "advertising", aspect: "1:1", build: (p, b) => `professional studio product photo of ${p}${b ? ` by ${b}` : ""}, seamless backdrop, soft key light, crisp reflections, advertising photography` },
  { id: "lifestyle", name: "Lifestyle scene", kind: "Image", seed: "mk-lifestyle", theme: "editorial", aspect: "4:3", build: (p, b) => `${p}${b ? ` from ${b}` : ""} in a bright lifestyle scene, natural light, editorial composition, shallow depth of field` },
  { id: "poster", name: "Bold poster", kind: "Image", seed: "mk-poster", theme: "editorial", aspect: "3:4", build: (p, b) => `bold graphic advertising poster for ${p}${b ? ` by ${b}` : ""}, strong typography-inspired composition, high contrast colors` },
  { id: "ugc", name: "UGC creator clip", kind: "Video", seed: "mk-ugc", theme: "character", aspect: "9:16", build: (p, b) => `young creator excitedly showing ${p}${b ? ` from ${b}` : ""} to the camera, handheld phone video, bright apartment, ugc style` },
  { id: "unboxing", name: "Unboxing", kind: "Video", seed: "mk-unboxing", theme: "advertising", aspect: "9:16", build: (p, b) => `hands unboxing ${p}${b ? ` by ${b}` : ""} on a wooden table, overhead shot, warm light, satisfying reveal` },
  { id: "hero-motion", name: "Hero motion", kind: "Video", seed: "mk-hero", theme: "advertising", aspect: "16:9", build: (p, b) => `${p}${b ? ` by ${b}` : ""} rotating slowly on a dark reflective surface, dramatic rim light, product hero shot` },
];

/** The model each template's destination studio runs; the studio itself owns the default. */
const MODEL_BY_KIND = { Image: "sdxl-lightning", Video: "ltx-video" } as const;

/**
 * Marketing Studio: product + brand + template compose a brief, which opens in the Image or
 * Video studio. No campaign is stored, published or measured — this page only writes text.
 */
export function MarketingComposer() {
  const [product, setProduct] = useState("matte black wireless earbuds");
  const [brand, setBrand] = useState("");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];

  const prompt = useMemo(
    () => template.build(product.trim() || "your product", brand.trim()),
    [template, product, brand],
  );
  const destination = template.kind === "Video" ? "video" : "image";
  const href = composerHref({
    type: destination,
    prompt,
    model: MODEL_BY_KIND[template.kind],
    aspect: template.aspect,
  });

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
      <section aria-label="Campaign brief">
        <h2 className="editorial-label border-b border-border-subtle pb-3">The brief</h2>

        <div className="mt-6">
          <label htmlFor="marketing-product" className="editorial-label">
            Product
          </label>
          <input
            id="marketing-product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            maxLength={120}
            placeholder="e.g. matte black wireless earbuds"
            className="mt-2.5 h-10 w-full border border-border-default bg-surface-raised px-3 text-[13px] text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="marketing-brand" className="editorial-label">
            Brand <span className="font-normal normal-case tracking-normal text-foreground-subtle">(optional)</span>
          </label>
          <input
            id="marketing-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={60}
            placeholder="e.g. Northstar"
            className="mt-2.5 h-10 w-full border border-border-default bg-surface-raised px-3 text-[13px] text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle"
          />
        </div>

        <fieldset className="mt-6 border-t border-border-subtle pt-4">
          <legend className="editorial-label">Format</legend>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                aria-pressed={t.id === templateId}
                className="group min-w-0 text-left outline-none"
              >
                <PrintFrame
                  seed={t.seed}
                  theme={t.theme}
                  ratio="4 / 5"
                  sizes="(max-width: 640px) 45vw, 16vw"
                  className={cn(
                    "shadow-none transition-colors",
                    t.id === templateId ? "border-accent-text" : "group-hover:border-border-strong",
                  )}
                />
                <span className="mt-2 block text-[11px] text-foreground-subtle">{t.kind}</span>
                <span
                  className={cn(
                    "block text-[13px] leading-snug",
                    t.id === templateId ? "text-accent-text" : "text-foreground",
                  )}
                >
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section aria-label="Creative direction" className="lg:sticky lg:top-20 lg:self-start">
        <h2 className="editorial-label border-b border-border-subtle pb-3">Creative direction</h2>

        <p className="mt-6 border-l-2 border-accent bg-surface-subtle py-4 pl-4 pr-3 text-[15px] leading-relaxed text-foreground">
          {prompt}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border-subtle pt-4 text-[13px]">
          <div>
            <dt className="editorial-label text-foreground-subtle">Generates in</dt>
            <dd className="mt-1 text-foreground">
              {template.kind === "Video" ? "Video Studio" : "Image Studio"}
            </dd>
          </div>
          <div>
            <dt className="editorial-label text-foreground-subtle">Aspect</dt>
            <dd className="mt-1 text-foreground">{template.aspect}</dd>
          </div>
        </dl>

        <p className="mt-6 text-[13px] leading-relaxed text-foreground-muted">
          Marketing Studio composes the brief; the studio it opens performs the generation and
          saves it to your archive. Nothing is stored, scheduled or published from this page.
        </p>

        <Button asChild size="lg" className="mt-6 rounded-none shadow-none">
          <Link href={href}>Open in {template.kind === "Video" ? "Video" : "Image"} Studio</Link>
        </Button>
      </section>
    </div>
  );
}
