"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Shared recoverable-error content for the App Router error boundaries. It never prints the
 * error itself — a stack trace helps nobody here — but it does log it so the message is not
 * swallowed, and `reset()` re-renders the segment rather than reloading the whole app.
 */
export function ErrorBody({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <p className="editorial-label text-accent-text">Something went wrong</p>
      <h1 className="editorial-display mt-4 text-4xl sm:text-5xl">This page stopped short</h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-foreground-muted">
        An unexpected error interrupted it. Nothing you have made is affected — your work is
        saved in the archive. Try again, or start from Create.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button className="rounded-none" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="secondary" className="rounded-none">
          <Link href="/">Back to Create</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-8 text-xs text-foreground-subtle">Reference: {error.digest}</p>
      ) : null}
    </>
  );
}
