import type { Metadata } from "next";

import { NotFoundBody } from "@/components/layout/not-found-body";
import { TopNav } from "@/components/layout/top-nav";

export const metadata: Metadata = { title: "Page not found" };

/** Unmatched URL: no route group applies, so this mounts the product shell itself. */
export default function NotFound() {
  return (
    <>
      <TopNav />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <NotFoundBody />
      </main>
    </>
  );
}
