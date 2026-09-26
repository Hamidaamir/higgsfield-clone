"use client";

import { ErrorBody } from "@/components/layout/error-body";
import { TopNav } from "@/components/layout/top-nav";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <TopNav />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 py-16 sm:px-8 sm:py-24">
        <ErrorBody error={error} reset={reset} />
      </main>
    </>
  );
}
