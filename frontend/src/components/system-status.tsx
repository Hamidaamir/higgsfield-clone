"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getHealth } from "@/lib/api/health";
import { ApiError } from "@/lib/api/client";

export function SystemStatus() {
  const health = useQuery({ queryKey: ["health"], queryFn: getHealth, retry: false, staleTime: 0 });

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Backend API</h2>
        <Button variant="secondary" size="sm" onClick={() => health.refetch()} disabled={health.isFetching}>
          <RefreshCw className={health.isFetching ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden />
          Re-check
        </Button>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <Row label="API" state={health.isFetching ? "loading" : health.isError ? "error" : "ok"}>
          {health.isFetching
            ? "Starting server…"
            : health.isError
              ? describeError(health.error)
              : `Reachable · v${health.data?.version}`}
        </Row>
        <Row
          label="Database"
          state={health.isFetching ? "loading" : health.data?.database === "ok" ? "ok" : "error"}
        >
          {health.isFetching ? "Waiting…" : health.data?.database === "ok" ? "Connected" : "Unavailable"}
        </Row>
      </dl>
    </div>
  );
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.isNetwork ? `${error.message} Try again in a moment.` : error.message;
  return "Unexpected error.";
}

function Row({ label, state, children }: { label: string; state: "ok" | "error" | "loading"; children: React.ReactNode }) {
  const Icon = state === "ok" ? CheckCircle2 : state === "error" ? XCircle : Loader2;
  const tone = state === "ok" ? "text-success" : state === "error" ? "text-danger" : "text-text-secondary";
  return (
    <div className="flex items-center gap-3">
      <Icon className={`size-4 shrink-0 ${tone} ${state === "loading" ? "animate-spin" : ""}`} aria-hidden />
      <dt className="w-24 shrink-0 font-medium">{label}</dt>
      <dd className="text-text-secondary">{children}</dd>
    </div>
  );
}
