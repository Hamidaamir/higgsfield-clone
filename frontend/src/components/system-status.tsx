"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getHealth } from "@/lib/api/health";
import { cn } from "@/lib/utils";

/**
 * A real check, not a status board: one request to /api/health, reported as it comes back.
 * There is no uptime history, latency series, incident log or provider status behind it.
 */
export function SystemStatus() {
  const health = useQuery({ queryKey: ["health"], queryFn: getHealth, retry: false, staleTime: 0 });
  const state = health.isFetching ? "loading" : health.isError ? "error" : "ok";

  return (
    <section className="mt-10 border-t border-border-default pt-6" aria-labelledby="live-check">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="live-check" className="editorial-label">
          Live check
        </h2>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-none"
          onClick={() => health.refetch()}
          disabled={health.isFetching}
        >
          <RefreshCw className={cn("size-3.5", health.isFetching && "animate-spin")} aria-hidden />
          Re-check
        </Button>
      </div>

      <dl className="mt-6 text-sm" aria-live="polite">
        <Row label="API" state={state}>
          {health.isFetching
            ? "Checking…"
            : health.isError
              ? describeError(health.error)
              : `Reachable · version ${health.data?.version}`}
        </Row>
        <Row label="Database" state={health.isFetching ? "loading" : health.data?.database === "ok" ? "ok" : "error"}>
          {health.isFetching ? "Waiting…" : health.data?.database === "ok" ? "Connected" : "Unavailable"}
        </Row>
      </dl>

      <p className="mt-6 max-w-xl text-[13px] leading-relaxed text-foreground-muted">
        Both rows come from a single request made when this page loads. Nothing is polled, stored
        or averaged, so this is the state of one check rather than a history.
      </p>
    </section>
  );
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.isNetwork ? `${error.message} Try again in a moment.` : error.message;
  return "Unexpected error.";
}

/** State is carried by a word, not only by colour. */
function Row({ label, state, children }: { label: string; state: "ok" | "error" | "loading"; children: React.ReactNode }) {
  const word = state === "ok" ? "OK" : state === "error" ? "Failing" : "Checking";
  return (
    <div className="grid grid-cols-[6rem_5rem_minmax(0,1fr)] items-baseline gap-3 border-t border-border-subtle py-3">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd
        className={cn(
          "editorial-label",
          state === "ok" ? "text-accent-text" : state === "error" ? "text-danger" : "text-foreground-subtle",
        )}
      >
        {word}
      </dd>
      <dd className="min-w-0 text-foreground-muted [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
