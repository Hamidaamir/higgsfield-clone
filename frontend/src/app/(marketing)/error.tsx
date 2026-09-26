"use client";

import { ErrorBody } from "@/components/layout/error-body";

export default function MarketingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-8 sm:py-24">
      <ErrorBody error={error} reset={reset} />
    </div>
  );
}
