import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductPage } from "@/components/discovery/product-page";
import { generatorHrefFor } from "@/lib/config/catalog-models";
import { TOOLS, getTool } from "@/lib/config/tools";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOLS.filter((t) => t.status === "preview").map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tool = getTool((await params).slug);
  return { title: tool?.name ?? "Tool" };
}

/** Representative page for a catalog tool that has no free backend yet. */
export default async function ToolPage({ params }: PageProps) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const label = { image: "Image", video: "Video", audio: "Audio" }[tool.category];
  return (
    <ProductPage
      eyebrow={label}
      badge={tool.badge}
      title={tool.name}
      description={tool.longDescription}
      status={tool.status}
      statusNote={`${tool.name} reproduces the product surface from the reference. There is no free provider for it in this build, so the button below takes you to the closest working workflow.`}
      primary={{ label: tool.fallbackLabel, href: tool.fallbackHref }}
      secondary={{ label: `All ${label} tools`, href: `/${tool.category}` }}
      seed={tool.seed}
      steps={[...tool.steps]}
      gallery={Array.from({ length: 4 }, (_, i) => ({ seed: `${tool.seed}-g${i}`, href: generatorHrefFor(tool.category), alt: `${tool.name} example ${i + 1}` }))}
      galleryTitle="Example results"
    />
  );
}
