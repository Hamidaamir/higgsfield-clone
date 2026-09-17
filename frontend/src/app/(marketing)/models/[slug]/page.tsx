import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cpu, Gauge, Sparkles } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";
import { CATALOG_MODELS, catalogModelHref, generatorHrefFor, getCatalogModel } from "@/lib/config/catalog-models";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CATALOG_MODELS.filter((m) => !m.registryId).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const model = getCatalogModel((await params).slug);
  return { title: model?.name ?? "Model" };
}

const REAL_ALTERNATIVE = { image: "FLUX.1 Schnell", video: "LTX Video", audio: "Aura 1" } as const;

/** Representative page for a catalog model the free tier cannot run. */
export default async function ModelPage({ params }: PageProps) {
  const model = getCatalogModel((await params).slug);
  if (!model) notFound();
  const label = { image: "Image", video: "Video", audio: "Audio" }[model.category];
  const alternative = REAL_ALTERNATIVE[model.category];
  return (
    <ProductPage
      eyebrow={`${label} model · ${model.vendor}`}
      badge={model.badge}
      title={model.name}
      description={model.description}
      status={model.registryId ? "available" : "preview"}
      statusNote={`${model.name} is part of the reference catalog but has no zero-cost API. Generate with ${alternative} instead — the workflow is identical.`}
      primary={{ label: `Generate with ${alternative}`, href: model.registryId ? catalogModelHref(model) : generatorHrefFor(model.category) }}
      secondary={{ label: `All ${label} models`, href: `/${model.category}` }}
      seed={model.seed}
      features={[
        { icon: Sparkles, title: "Same workflow", text: "Prompt, settings, generation state, results and History behave exactly like the running models." },
        { icon: Cpu, title: "Provider-agnostic", text: "Models plug into one provider abstraction; adding this one is a registry entry plus a provider adapter." },
        { icon: Gauge, title: "Honest availability", text: "Nothing here pretends to run. Availability is shown per model across the whole product." },
      ]}
      gallery={Array.from({ length: 4 }, (_, i) => ({ seed: `${model.seed}-g${i}`, href: generatorHrefFor(model.category), alt: `${model.name} example ${i + 1}` }))}
      galleryTitle="Reference results"
    />
  );
}
