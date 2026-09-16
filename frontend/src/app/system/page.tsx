import type { Metadata } from "next";

import { SystemStatus } from "@/components/system-status";

export const metadata: Metadata = { title: "System status" };

export default function SystemPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="display-heading text-4xl">System status</h1>
      <p className="mt-3 text-text-secondary">
        Live check of the frontend → API → database path. The API runs on free hosting that sleeps when idle,
        so the first check after a quiet period can take up to a minute.
      </p>
      <SystemStatus />
    </section>
  );
}
