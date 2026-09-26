"use client";

import Link from "next/link";

import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { formatDateTime } from "@/lib/format";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** System first: the default a new account starts on. Labels are real text, not CSS-capitalised. */
const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SECTION = "grid gap-5 border-t border-border-default py-8 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-10";

/** Account folio: real session data from the API, the shared theme store, and logout. */
export function SettingsView() {
  const { user } = useAuth();
  const logout = useLogout();
  const { preference, setPreference } = useTheme();

  // Loading and session-failure states belong to <RequireAuth>, the guard every (app) page
  // renders inside; duplicating them here would create a second surface that can drift.
  if (!user) return null;

  const rows: [string, string][] = [
    ["Name", user.name || "Not provided"],
    ["Email", user.email || "Not provided"],
    ["Sign-in", user.has_password ? "Email & password" : "Google account"],
    ["Member since", user.created_at ? formatDateTime(user.created_at) : "Not available"],
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-12">
      <p className="editorial-label text-accent-text">Your account</p>
      <h1 className="editorial-display mt-3 text-5xl">Settings</h1>
      <p className="mt-4 text-sm text-foreground-muted">Account details, appearance and session.</p>

      <div className="mt-10">
        <section className={SECTION} aria-labelledby="account-heading">
          <h2 id="account-heading" className="editorial-label text-foreground-muted">
            Account
          </h2>
          <div className="min-w-0">
            {/* A description list, not a form: these values cannot be edited anywhere in this build. */}
            <dl className="space-y-5 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="grid gap-1.5 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-foreground-muted">{label}</dt>
                  <dd className="min-w-0 font-medium [overflow-wrap:anywhere]">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-xs text-foreground-muted">
              Account details are read-only. Profile editing is not available.
            </p>
          </div>
        </section>

        <section className={SECTION} aria-labelledby="appearance-heading">
          <h2 id="appearance-heading" className="editorial-label text-foreground-muted">
            Appearance
          </h2>
          <div>
            {/* The same store the header control writes to — one preference, one storage key. */}
            <div role="group" aria-label="Theme preference" className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={preference === value}
                  onClick={() => setPreference(value)}
                  className={cn(
                    "min-h-10 border px-4 text-sm transition-colors",
                    preference === value
                      ? "border-accent-text bg-accent-subtle text-accent-text"
                      : "border-border-default hover:bg-surface-subtle",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
              Saved in this browser. System follows your device&rsquo;s appearance.
            </p>
          </div>
        </section>

        <section className={SECTION} aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="editorial-label text-foreground-muted">
            Plan
          </h2>
          <div>
            <p className="editorial-display text-3xl">Free</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Generation uses free-tier providers. Billing and paid subscriptions are not available.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex min-h-10 items-center text-sm text-accent-text underline underline-offset-4"
            >
              View plan information
            </Link>
            <p className="mt-1 text-xs text-foreground-muted">Paid plans on the pricing page are previews.</p>
          </div>
        </section>

        <section className={`${SECTION} border-b`} aria-labelledby="session-heading">
          <h2 id="session-heading" className="editorial-label text-foreground-muted">
            Session
          </h2>
          <div>
            <p className="text-sm text-foreground-muted">Log out of your account on this browser.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-5 rounded-none"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              Log out
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}
