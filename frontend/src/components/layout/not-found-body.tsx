import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Shared 404 content. The root not-found mounts it with its own shell (the URL matched no
 * route group); the marketing not-found renders it inside that group's existing shell, so
 * `notFound()` from a dynamic segment does not produce a second header.
 */
export function NotFoundBody() {
  return (
    <>
      <p className="editorial-label text-accent-text">404</p>
      <h1 className="editorial-display mt-4 text-4xl sm:text-5xl">Page not found</h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-foreground-muted">
        The link may be out of date, or it points at something this build does not have.
        Everything that works is reachable from Create.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="rounded-none">
          <Link href="/">Back to Create</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-none">
          <Link href="/history">Open Archive</Link>
        </Button>
      </div>
    </>
  );
}
