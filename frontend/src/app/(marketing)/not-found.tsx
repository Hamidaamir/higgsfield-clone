import type { Metadata } from "next";

import { NotFoundBody } from "@/components/layout/not-found-body";

export const metadata: Metadata = { title: "Page not found" };

/** `notFound()` from a marketing segment (e.g. /tools/[slug]); the group layout supplies the shell. */
export default function MarketingNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <NotFoundBody />
    </div>
  );
}
