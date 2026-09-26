"use client";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { googleStartHref } from "@/lib/api/auth";

/**
 * Google sign-in: a plain link into the existing FastAPI OpenID Connect flow, which returns
 * with the normal session cookie. Apple and Microsoft were removed rather than shown as inert
 * options — this build does not implement them.
 */
export function SocialButton({ next, available = true }: { next?: string; available?: boolean }) {
  if (!available) {
    return (
      <Tooltip content="Google sign-in needs OAuth credentials on this deployment">
        <span className="block">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2.5 rounded-none"
            disabled
            aria-disabled
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button asChild variant="outline" size="lg" className="w-full gap-2.5 rounded-none">
      {/* A real navigation (not a router push) so the cookie set by the callback applies cleanly. */}
      <a href={googleStartHref(next)} rel="nofollow">
        <GoogleIcon />
        Continue with Google
      </a>
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3c-.5-1.5-.5-3.1 0-4.6V6.6H1.3c-1.7 3.4-1.7 7.4 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.7c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.1 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-5 6.7-5z" />
    </svg>
  );
}
