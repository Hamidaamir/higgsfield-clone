import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogDetail } from "@/components/discovery/catalog-detail";
import { TOOLS, getTool, toolHref } from "@/lib/config/tools";
interface PageProps { params: Promise<{ slug: string }> }
export function generateStaticParams() { return TOOLS.filter((t) => t.status === 'preview').map((t) => ({ slug: t.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: getTool((await params).slug)?.name ?? 'Tool' };
}
export default async function ToolPage({ params }: PageProps) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const available = tool.status === 'available';
  const fallbackIsPreview = !/^\/(generate|edit)\//.test(tool.fallbackHref) && tool.fallbackHref !== '/history';
  return <CatalogDetail title={tool.name} category={tool.category} seed={tool.seed} description={tool.longDescription}
    status={tool.status} steps={tool.steps}
    note={available ? 'This workflow is available in the studio.' : `Preview only. This tool is not implemented here. ${fallbackIsPreview ? 'The related concept below is a separate discovery page.' : 'The link below opens a separate available workflow; it does not activate this tool.'}`}
    primary={{ label: available ? `Open ${tool.name}` : fallbackIsPreview ? 'Explore related concept' : tool.fallbackLabel, href: available ? toolHref(tool) : tool.fallbackHref }} />;
}
