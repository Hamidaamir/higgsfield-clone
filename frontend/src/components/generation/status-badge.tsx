import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GenerationStatus } from "@/types/generation";

const config: Record<GenerationStatus, { label: string; icon: typeof Clock; className: string; spin?: boolean }> = {
  queued: { label: "Queued", icon: Clock, className: "bg-surface-muted text-text-secondary" },
  processing: { label: "Generating", icon: Loader2, className: "bg-accent-muted text-accent", spin: true },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-success/15 text-success" },
  failed: { label: "Failed", icon: AlertTriangle, className: "bg-danger/15 text-danger" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-surface-muted text-text-secondary" },
};

export function StatusBadge({ status, className }: { status: GenerationStatus; className?: string }) {
  const { label, icon: Icon, className: tone, spin } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tone, className)}>
      <Icon className={cn("size-3", spin && "animate-spin")} aria-hidden />
      {label}
    </span>
  );
}
