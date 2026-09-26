"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/**
 * Client-side guard for signed-in pages. If the session cookie exists but the
 * API rejects it (expired/revoked), send the visitor to login with a return path.
 * A user that disappears *after* loading means a logout, which navigates itself.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, isError, refetch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hadUser = useRef(false);

  useEffect(() => {
    if (user) {
      hadUser.current = true;
      return;
    }
    if (!isLoading && !isError && !hadUser.current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, isError, router, pathname]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-8 sm:py-12" aria-busy="true" aria-label="Loading">
        <span className="block h-3 w-24 skeleton-shimmer" />
        <span className="mt-6 block h-10 w-56 skeleton-shimmer" />
        <span className="mt-10 block h-64 w-full skeleton-shimmer" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-8 sm:py-24">
        <p className="editorial-label text-accent-text">Session</p>
        <h1 className="editorial-display mt-4 text-4xl sm:text-5xl">We couldn&apos;t verify your session</h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-foreground-muted">
          Your account could not be confirmed, so nothing is shown here rather than something that
          might be wrong. The server may be starting up — try again, or sign in.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="rounded-none" onClick={() => refetch()}>
            Try again
          </Button>
          <Button asChild variant="secondary" className="rounded-none">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
