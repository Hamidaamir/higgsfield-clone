"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

/**
 * Client-side guard for signed-in pages. If the session cookie exists but the
 * API rejects it (expired/revoked), send the visitor to login with a return path.
 * A user that disappears *after* loading means a logout, which navigates itself.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, isError } = useAuth();
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
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading">
        <div className="h-8 w-56 rounded-lg skeleton-shimmer" />
        <div className="mt-6 h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-semibold">We couldn&apos;t verify your session</h1>
        <p className="mt-2 text-sm text-text-secondary">
          The server may be starting up. Please refresh in a moment.
        </p>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
