import type { ReactNode } from "react";

import { AuthHeader } from "@/components/auth/auth-header";

/** Authentication shell: a restrained header over a full-height two-pane page (single column on phones). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
