import Link from "next/link";
import { PrintFrame } from "@/components/editorial/print-frame";
import { Button } from "@/components/ui/button";

/** Model/tool detail only. Secondary product pages retain their separate presentation. */
export function CatalogDetail({ title, category, description, vendor, status, note, seed, primary, steps }: {
  title: string; category: string; description: string; vendor?: string; status: 'available' | 'preview'; note: string;
  seed: string; primary: { label: string; href: string }; steps?: string[];
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8 sm:py-12">
      <Link href={`/${category}`} className="text-sm text-foreground-muted hover:text-accent-text">
        ← <span className="capitalize">{category}</span> catalog
      </Link>
      <div className="mt-8 grid items-start gap-10 border-y border-border-default py-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:py-12">
        <div>
          <p className="editorial-label text-accent-text">{status === 'available' ? 'Available' : 'Preview'}</p>
          <h1 className="editorial-display mt-4 break-words text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">{description}</p>
          {vendor ? <p className="mt-2 text-sm text-foreground-subtle">{vendor}</p> : null}
          <p className="mt-8 max-w-xl border-l-2 border-border-default pl-4 text-sm leading-relaxed text-foreground-muted">{note}</p>
          <Button asChild className="mt-8 h-auto min-h-11 whitespace-normal rounded-none text-left"><Link href={primary.href}>{primary.label} ↗</Link></Button>
        </div>
        <div>
          <PrintFrame seed={seed} ratio="4 / 3" sizes="(max-width: 1023px) 100vw, 45vw" className="shadow-none" />
          <p className="mt-3 text-xs text-foreground-muted">Concept artwork · not a generated result from {title}</p>
        </div>
      </div>
      {steps?.length ? <section className="mt-10" aria-labelledby="workflow-heading">
        <h2 id="workflow-heading" className="editorial-display text-3xl">{status === 'preview' ? 'The concept' : 'In the studio'}</h2>
        {status === 'preview' && <p className="mt-3 text-sm text-foreground-muted">An intended workflow, not an available set of controls.</p>}
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">{steps.map((step, i) => <li key={step} className="border-t border-border-default pt-4"><span className="editorial-label text-foreground-muted">0{i + 1}</span><p className="mt-3 text-sm">{step}</p></li>)}</ol>
      </section> : null}
    </div>
  );
}
