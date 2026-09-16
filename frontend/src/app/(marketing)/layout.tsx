import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";

/** Public discovery pages share the lime sitemap footer; generator workspaces do not. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
