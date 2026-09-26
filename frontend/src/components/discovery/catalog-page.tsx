import Link from "next/link";
import { CatalogPlate } from "@/components/discovery/catalog-plate";
import { Button } from "@/components/ui/button";
import { catalogModelHref, catalogModelsFor } from "@/lib/config/catalog-models";
import { SHOWCASE } from "@/lib/config/explore";
import { toolHref, toolsByCategory, type ToolCategory } from "@/lib/config/tools";

const COPY = {
  image: { title: 'Image', subtitle: 'Explore still-image models and reference-guided editing.', cta: 'Open Image Studio' },
  video: { title: 'Video', subtitle: 'Explore motion with LTX Video and a catalog of creative concepts.', cta: 'Open Video Studio' },
  audio: { title: 'Audio', subtitle: 'Explore speech with Aura, MeloTTS and Gemini voices.', cta: 'Open Audio Studio' },
};
export function CatalogPage({ category }: { category: ToolCategory }) {
  const copy = COPY[category];
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8 sm:py-12">
      <Link href="/community" className="text-sm text-foreground-muted hover:text-accent-text">← Explore</Link>
      <header className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div><p className="editorial-label text-accent-text">Discovery / Catalog</p>
          <h1 className="editorial-display mt-3 text-5xl sm:text-6xl">{copy.title}</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground-muted">{copy.subtitle}</p>
        </div>
        <Button asChild className="rounded-none"><Link href={`/generate/${category}`}>{copy.cta}</Link></Button>
      </header>
      <nav aria-label="Discovery catalogs" className="mt-8 flex gap-6 border-b border-border-default pb-4 text-sm">
        {(['image', 'video', 'audio'] as const).map((item) => <Link key={item} href={`/${item}`} aria-current={item === category ? 'page' : undefined} className="capitalize aria-[current=page]:text-accent-text">{item}</Link>)}
      </nav>
      {category === 'audio' && <figure className="mt-8 max-w-lg border-y border-border-subtle py-5">
        <figcaption className="mb-3 text-sm text-foreground-muted">Aura 1 · Studio speech sample</figcaption>
        <audio controls preload="none" src={SHOWCASE.auraWelcome} aria-label="Aura 1 speech sample" className="w-full" />
      </figure>}
      <section className="mt-12" aria-labelledby="models-heading">
        <h2 id="models-heading" className="editorial-display text-3xl">Models</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">Available models open in the studio. Preview entries are concepts and cannot generate here. Artwork illustrates a direction unless labelled as a studio sample.</p>
        <div className="mt-8 grid items-start gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {catalogModelsFor(category).map((model, i) => {
            const media = model.slug === 'flux-1-schnell' ? SHOWCASE.fluxLimeJacket : model.slug === 'ltx-video' ? SHOWCASE.ltxPaperBoat : undefined;
            return <article key={model.slug} data-status={model.registryId ? 'available' : 'preview'} className="min-w-0 border-b border-border-subtle pb-5">
              <CatalogPlate seed={model.seed} theme={category === 'audio' ? 'audio' : category === 'video' ? 'cinematic' : 'editorial'} media={media} alt={model.name} priority={i === 0} />
              <p className="mt-4 text-xs text-foreground-muted">{model.registryId ? 'Available' : 'Preview'} · {media ? 'Studio sample' : 'Concept artwork'}</p>
              <h3 className="editorial-display mt-2 text-2xl">{model.name}</h3>
              <p className="mt-2 text-sm text-foreground-muted">{model.description}</p>
              <p className="mt-1 text-xs text-foreground-subtle">{model.vendor}</p>
              <Link href={catalogModelHref(model)} aria-label={`${model.registryId ? 'Try model' : 'Explore preview'}: ${model.name}`} className="mt-4 inline-flex min-h-10 items-center text-sm text-accent-text underline underline-offset-4">{model.registryId ? 'Try model' : 'Explore preview'} ↗</Link>
            </article>;
          })}
        </div>
      </section>
      <section className="mt-16" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="editorial-display text-3xl">Tools & workflows</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">Available workflows open a studio that works today. Preview entries describe an intended workflow that has no provider here.</p>
        <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
          {toolsByCategory(category).map((tool) => <article key={tool.slug} data-status={tool.status} className="border-t border-border-default py-6">
            <p className="text-xs text-foreground-muted">{tool.status === 'available' ? 'Available' : 'Preview'}</p>
            <h3 className="editorial-display mt-2 text-2xl">{tool.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{tool.description}</p>
            <Link href={toolHref(tool)} aria-label={`${tool.status === 'available' ? 'Open studio' : 'Explore preview'}: ${tool.name}`} className="mt-3 inline-flex min-h-10 items-center text-sm text-accent-text underline underline-offset-4">{tool.status === 'available' ? 'Open studio' : 'Explore preview'} ↗</Link>
          </article>)}
        </div>
      </section>
    </div>
  );
}
