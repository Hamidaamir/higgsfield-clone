import type { Metadata } from "next";
import { Compass, History, Sparkles } from "lucide-react";
import Link from "next/link";

import { Artwork } from "@/components/discovery/artwork";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

/** Branded 404 inside the product shell, with the two places a lost reviewer most likely wants. */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[1400px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="relative mb-8 h-40 w-64 overflow-hidden rounded-3xl border border-border" aria-hidden>
        <Artwork seed="not-found" theme="scenic" />
        <div className="grain absolute inset-0" />
        <span className="display-heading absolute inset-0 flex items-center justify-center text-6xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">404</span>
      </div>
      <h1 className="display-heading text-3xl sm:text-5xl">This page doesn&apos;t exist</h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary sm:text-base">
        The link may be out of date, or the page is one we haven&apos;t built. Everything that works is reachable from Explore.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">
            <Compass className="size-4" aria-hidden />
            Back to Explore
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/generate/image">
            <Sparkles className="size-4" aria-hidden />
            Create an image
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/history">
            <History className="size-4" aria-hidden />
            Your History
          </Link>
        </Button>
      </div>
    </main>
  );
}
