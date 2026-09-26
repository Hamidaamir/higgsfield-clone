import type { Metadata } from "next";

import { SystemStatus } from "@/components/system-status";

export const metadata: Metadata = { title: "System status" };

export default function SystemPage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 pb-16 sm:px-8">
      <header className="border-b border-border-subtle py-5">
        <h1 className="editorial-label">System status</h1>
        <p className="mt-1 text-[13px] text-foreground-muted">One live check, reported plainly.</p>
      </header>

      <p className="max-w-xl pt-6 text-[15px] leading-relaxed text-foreground-muted">
        This page checks the path from the browser to the API to the database, once, when you
        open it. The API runs on free hosting that sleeps when idle, so the first check after a
        quiet period can take up to a minute.
      </p>

      <SystemStatus />
    </div>
  );
}
