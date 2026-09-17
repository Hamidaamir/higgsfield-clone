import type { Metadata } from "next";
import { FolderPlus, History } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="display-heading text-3xl sm:text-4xl">Projects</h1>
      <p className="mt-1.5 text-sm text-text-secondary">Group generations into projects to share and iterate with your team.</p>
      <EmptyState
        className="mt-8"
        icon={FolderPlus}
        title="Projects are on the roadmap"
        description="This build keeps every generation in History. Projects — folders with shared access — are not implemented yet, so nothing here is pretending to be."
        action={
          <Button asChild variant="secondary">
            <Link href="/history">
              <History className="size-4" aria-hidden />
              Open History
            </Link>
          </Button>
        }
      />
    </section>
  );
}
