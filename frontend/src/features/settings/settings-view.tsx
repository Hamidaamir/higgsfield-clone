"use client";

import { LogOut, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { formatDateTime } from "@/lib/format";

/** Account settings: real profile/session data from the API; everything else is honestly labelled. */
export function SettingsView() {
  const { user } = useAuth();
  const logout = useLogout();
  if (!user) return null;
  const initials = user.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="display-heading text-3xl sm:text-4xl">Settings</h1>
      <p className="mt-1.5 text-sm text-text-secondary">Your account, session and plan.</p>

      <div className="mt-8 space-y-4">
        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-foreground">{initials}</span>
            <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-text-secondary">Name</dt>
              <dd className="font-medium">{user.name}</dd>
              <dt className="text-text-secondary">Email</dt>
              <dd className="font-medium">{user.email}</dd>
              <dt className="text-text-secondary">Member since</dt>
              <dd className="font-medium">{formatDateTime(user.created_at)}</dd>
            </dl>
          </div>
          <p className="mt-4 text-xs text-text-muted">Profile editing and avatars are not part of this build.</p>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Plan</h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-accent" aria-hidden />
              <span className="font-semibold">Free</span>
              <span className="text-text-secondary">· real generation on free-tier providers, no billing</span>
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link href="/pricing">View plans</Link>
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="session-heading">
          <h2 id="session-heading" className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Session</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            Signed in with a secure httpOnly session cookie (7 days). Logging out revokes it on the server.
          </p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => logout.mutate()} loading={logout.isPending}>
            <LogOut className="size-4" aria-hidden />
            Log out
          </Button>
        </section>
      </div>
    </section>
  );
}
