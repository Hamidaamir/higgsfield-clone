"use client";

import { ArrowRight, Megaphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { MediaCard } from "@/components/discovery/media-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  kind: "Image" | "Video";
  seed: string;
  build: (product: string, brand: string) => string;
  aspect: string;
}

const TEMPLATES: Template[] = [
  { id: "product-shot", name: "Studio product shot", kind: "Image", seed: "mk-product", aspect: "1:1", build: (p, b) => `professional studio product photo of ${p}${b ? ` by ${b}` : ""}, seamless backdrop, soft key light, crisp reflections, advertising photography` },
  { id: "lifestyle", name: "Lifestyle scene", kind: "Image", seed: "mk-lifestyle", aspect: "4:3", build: (p, b) => `${p}${b ? ` from ${b}` : ""} in a bright lifestyle scene, natural light, editorial composition, shallow depth of field` },
  { id: "poster", name: "Bold poster", kind: "Image", seed: "mk-poster", aspect: "3:4", build: (p, b) => `bold graphic advertising poster for ${p}${b ? ` by ${b}` : ""}, strong typography-inspired composition, high contrast colors` },
  { id: "ugc", name: "UGC creator clip", kind: "Video", seed: "mk-ugc", aspect: "9:16", build: (p, b) => `young creator excitedly showing ${p}${b ? ` from ${b}` : ""} to the camera, handheld phone video, bright apartment, ugc style` },
  { id: "unboxing", name: "Unboxing", kind: "Video", seed: "mk-unboxing", aspect: "9:16", build: (p, b) => `hands unboxing ${p}${b ? ` by ${b}` : ""} on a wooden table, overhead shot, warm light, satisfying reveal` },
  { id: "hero-motion", name: "Hero motion", kind: "Video", seed: "mk-hero", aspect: "16:9", build: (p, b) => `${p}${b ? ` by ${b}` : ""} rotating slowly on a dark reflective surface, dramatic rim light, product hero shot` },
];

/** Marketing Studio: product + template → prompt → real image/video generator. */
export function MarketingComposer() {
  const [product, setProduct] = useState("matte black wireless earbuds");
  const [brand, setBrand] = useState("");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];

  const href = useMemo(() => {
    const prompt = template.build(product.trim() || "your product", brand.trim());
    const params = new URLSearchParams({ prompt, aspect: template.aspect });
    if (template.kind === "Video") params.set("model", "ltx-video");
    else params.set("model", "sdxl-lightning");
    return `/generate/${template.kind === "Video" ? "video" : "image"}?${params}`;
  }, [template, product, brand]);

  return (
    <section className="mt-12" aria-label="Marketing composer">
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-4">
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Product</span>
            <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. matte black wireless earbuds" className="mt-1.5" maxLength={120} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Brand (optional)</span>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Higgsfield" className="mt-1.5" maxLength={60} />
          </label>
          <div className="rounded-2xl border border-border bg-surface-elevated p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Megaphone className="size-4 text-accent" aria-hidden />
              {template.name} · {template.kind}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{template.build(product.trim() || "your product", brand.trim())}</p>
          </div>
          <Button asChild size="lg" className="shadow-accent">
            <Link href={href}>
              Generate {template.kind.toLowerCase()}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <p className="text-xs text-text-secondary">Templates compose the brief; generation runs through the real Image and Video workflows and lands in History.</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">Templates</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                aria-pressed={t.id === templateId}
                className={cn("rounded-2xl text-left outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-accent", t.id === templateId && "ring-2 ring-accent")}
              >
                <MediaCard href={href} seed={t.seed} alt={t.name} ratio="4 / 5" className="pointer-events-none">
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{t.kind}</p>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                  </div>
                </MediaCard>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
