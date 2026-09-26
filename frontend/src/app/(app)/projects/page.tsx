import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Projects" };
export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-12">
      <p className="editorial-label text-accent-text">Your workspace</p>
      <h1 className="editorial-display mt-3 text-5xl">Projects</h1>
      <p className="mt-4 text-sm text-foreground-muted">A future home for grouping related generations.</p>
      <div className="mt-10 grid gap-8 border-y border-border-default py-12 sm:grid-cols-[1fr_2fr] sm:py-20">
        <p className="editorial-label text-foreground-muted">On the roadmap</p>
        <div className="max-w-lg">
          <h2 className="editorial-display text-3xl sm:text-4xl">For now, your work lives in Archive.</h2>
          <p className="mt-5 text-sm leading-relaxed text-foreground-muted">Every generation is saved there automatically. Project creation, folders and sharing are not available yet.</p>
          <Button asChild className="mt-8 rounded-none"><Link href="/history">Open Archive <ArrowRight className="size-4" aria-hidden /></Link></Button>
        </div>
      </div>
    </section>
  );
}
