"use client";

/*
 * Plain anchors on purpose: the root layout has failed, so client-side routing would mount
 * the same broken tree again. A full document load is the recovery.
 */
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect } from "react";

import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-canvas text-foreground antialiased">
        <main className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-8 sm:py-24">
          <p className="editorial-label text-accent-text">Something went wrong</p>
          <h1 className="editorial-display mt-4 text-4xl sm:text-5xl">The app could not start</h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-foreground-muted">
            An unexpected error stopped the page before it could load. Try again, or reload from
            the home page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="min-h-11 bg-accent px-6 text-[15px] font-semibold text-accent-foreground"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex min-h-11 items-center border border-border-default px-6 text-[15px] font-semibold"
            >
              Back to Create
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
