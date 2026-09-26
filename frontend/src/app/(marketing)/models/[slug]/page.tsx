import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogDetail } from "@/components/discovery/catalog-detail";
import { CATALOG_MODELS, catalogModelHref, generatorHrefFor, getCatalogModel } from "@/lib/config/catalog-models";
interface PageProps { params: Promise<{ slug: string }> }
export function generateStaticParams() { return CATALOG_MODELS.filter((m) => !m.registryId).map((m) => ({ slug: m.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: getCatalogModel((await params).slug)?.name ?? 'Model' };
}
export default async function ModelPage({ params }: PageProps) {
  const model = getCatalogModel((await params).slug);
  if (!model) notFound();
  const available = Boolean(model.registryId);
  return <CatalogDetail title={model.name} category={model.category} seed={model.seed}
    description={model.description} vendor={model.vendor}
    status={available ? 'available' : 'preview'}
    note={available ? 'This model is available in the studio. Open it to see its supported settings.' : 'Preview only. This model is not connected to generation here. The studio offers other available models; opening it will not run this model.'}
    primary={{ label: available ? `Try ${model.name}` : `Explore available ${model.category} models`, href: available ? catalogModelHref(model) : generatorHrefFor(model.category) }} />;
}
