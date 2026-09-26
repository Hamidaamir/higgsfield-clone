import type { ReactNode } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { TopNav } from "@/components/layout/top-nav";

/** Signed-in product surfaces. The proxy redirects anonymous visitors; this handles stale cookies. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="flex-1">
        <RequireAuth>{children}</RequireAuth>
      </main>
    </>
  );
}
