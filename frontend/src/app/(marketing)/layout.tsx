import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { TopNav } from "@/components/layout/top-nav";

/** Public discovery pages carry the editorial footer; application workspaces do not. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
