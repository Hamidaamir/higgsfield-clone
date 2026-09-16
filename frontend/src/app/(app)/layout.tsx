import type { ReactNode } from "react";

import { RequireAuth } from "@/components/auth/require-auth";

/** Signed-in product surfaces. The proxy redirects anonymous visitors; this handles stale cookies. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
