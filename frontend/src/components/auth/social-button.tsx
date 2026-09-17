"use client";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { googleStartHref } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

type Provider = "google" | "apple" | "microsoft";

const providerLabels: Record<Provider, string> = {
  google: "Continue with Google",
  apple: "Continue with Apple",
  microsoft: "Continue with Microsoft",
};

interface SocialButtonProps {
  provider: Provider;
  /** Same-origin path to return to after sign-in (validated again server-side). */
  next?: string;
  /** Google only: false while the deployment has no OAuth client configured. */
  available?: boolean;
}

/**
 * Google is a real OpenID Connect sign-in: a plain link into the FastAPI flow, which comes back
 * with the normal session cookie. Apple and Microsoft are not built; they read as such.
 */
export function SocialButton({ provider, next, available = true }: SocialButtonProps) {
  if (provider === "google") {
    if (!available) {
      return (
        <Tooltip content="Google sign-in needs OAuth credentials on this deployment">
          <span className="block">
            <Button type="button" variant="outline" size="lg" className="w-full gap-2.5 bg-surface" disabled aria-disabled>
              <ProviderIcon provider="google" />
              {providerLabels.google}
            </Button>
          </span>
        </Tooltip>
      );
    }
    return (
      <Button asChild variant="outline" size="lg" className="w-full gap-2.5 bg-surface">
        {/* A real navigation (not a router push) so the cookie set by the callback applies cleanly. */}
        <a href={googleStartHref(next)} rel="nofollow">
          <ProviderIcon provider="google" />
          {providerLabels.google}
        </a>
      </Button>
    );
  }
  return (
    <Tooltip content={`${provider === "apple" ? "Apple" : "Microsoft"} sign-in isn't part of this build`}>
      <span className="block">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={cn("w-full gap-2.5 bg-surface", "text-text-secondary disabled:opacity-100")}
          disabled
          aria-disabled
        >
          <ProviderIcon provider={provider} />
          {providerLabels[provider]}
          <span className="ml-auto rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Not in this build
          </span>
        </Button>
      </span>
    </Tooltip>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.3c-.5-1.5-.5-3.1 0-4.6V6.6H1.3c-1.7 3.4-1.7 7.4 0 10.8l4-3.1z" />
        <path fill="#EA4335" d="M12 4.7c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.1 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-5 6.7-5z" />
      </svg>
    );
  }
  if (provider === "apple") {
    return (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
        <path d="M16.4 12.7c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.8-1.7 0-3.2 1-4.1 2.5-1.8 3-.5 7.6 1.3 10.1.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.9-4.2zM14 5.4c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1.1 3 1.1.1 2.3-.6 3-1.4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}
