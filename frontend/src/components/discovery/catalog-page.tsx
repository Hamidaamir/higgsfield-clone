import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MediaCard } from "@/components/discovery/media-card";
import { SectionHeader } from "@/components/discovery/primitives";
import { StatusChip } from "@/components/discovery/product-page";
import { LogoMark } from "@/components/layout/logo";
import { Badge, navBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { catalogModelHref, catalogModelsFor } from "@/lib/config/catalog-models";
import { toolHref, toolsByCategory, type ToolCategory } from "@/lib/config/tools";
import { artFor } from "@/lib/photos";

const COPY: Record<ToolCategory, { title: string; subtitle: string; cta: string; href: string; seed: string }> = {
  image: {
    title: "AI Image",
    subtitle: "Generate, edit and stylize stills. Four real models today, a full catalog of tools and presets to explore.",
    cta: "Create Image",
    href: "/generate/image",
    seed: "catalog-image",
  },
  video: {
    title: "AI Video",
    subtitle: "Text and image to video with LTX Video, plus the studios and editing tools that surround it.",
    cta: "Create Video",
    href: "/generate/video",
    seed: "catalog-video",
  },
  audio: {
    title: "AI Audio",
    subtitle: "Lifelike speech from any script with Aura, MeloTTS and Gemini voices — voice change and translation to come.",
    cta: "Text to Speech",
    href: "/generate/audio",
    seed: "catalog-audio",
  },
};

/** Image / Video / Audio hub: the same Features + Models structure as the mega menus, as a page. */
export function CatalogPage({ category }: { category: ToolCategory }) {
  const copy = COPY[category];
  const tools = toolsByCategory(category);
  const models = catalogModelsFor(category);
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-border p-6 sm:p-10" style={{ backgroundImage: artFor(copy.seed) }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" aria-hidden />
        <div className="relative max-w-2xl">
          <h1 className="display-heading text-4xl sm:text-6xl">{copy.title}</h1>
          <p className="mt-3 text-base text-text-secondary sm:text-lg">{copy.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-accent">
              <Link href={copy.href}>
                {copy.cta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="white">
              <Link href="/history">Your History</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-label="Features">
        <SectionHeader title="Features" subtitle="Working tools are marked Available; the rest reproduce the product surface and point at the nearest working workflow." tone="white" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <Link key={tool.slug} href={toolHref(tool)} className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-elevated">
              <div className="flex items-start justify-between">
                <span className="relative flex size-11 items-center justify-center rounded-xl bg-surface-muted text-text-primary">
                  <tool.icon className="size-5" aria-hidden />
                  {tool.badge ? (
                    <Badge variant={navBadgeVariant(tool.badge)} className="absolute -left-1 -top-1.5">
                      {tool.badge}
                    </Badge>
                  ) : null}
                </span>
                <StatusChip status={tool.status} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold">{tool.name}</h3>
                <p className="mt-1 text-sm text-text-secondary">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-label="Models">
        <SectionHeader title="Models" subtitle="Models with a lime check run for real on the free tier; others are catalog entries from the reference product." tone="white" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {models.map((model) => (
            <MediaCard key={model.slug} href={catalogModelHref(model)} seed={model.seed} alt={model.name} ratio="16 / 10">
              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
                {model.badge ? <Badge variant={navBadgeVariant(model.badge)}>{model.badge}</Badge> : <span />}
                <StatusChip status={model.registryId ? "available" : "preview"} />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-white">
                  <LogoMark className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{model.name}</span>
                  <span className="block truncate text-xs text-white/70">{model.description}</span>
                </span>
              </div>
            </MediaCard>
          ))}
        </div>
      </section>
    </div>
  );
}
