"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AuthCreativePane, AuthCreativeStrip } from "@/components/auth/auth-creative-pane";
import { AuthForm, type AuthMode } from "@/components/auth/auth-form";
import { SocialButton } from "@/components/auth/social-button";
import { safeNextPath } from "@/hooks/use-auth";
import { fetchAuthProviders } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";

const COPY: Record<
  AuthMode,
  { eyebrow: string; heading: string; accent: string; support: string; switchLabel: string; switchCta: string; switchHref: string }
> = {
  login: {
    eyebrow: "Welcome back",
    heading: "Continue your",
    accent: "work.",
    support: "Sign in to return to your studio and recent creations.",
    switchLabel: "New here?",
    switchCta: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    eyebrow: "Create your account",
    heading: "Start",
    accent: "making.",
    support: "Create an account to generate, edit and keep your work in one place.",
    switchLabel: "Already have an account?",
    switchCta: "Sign in",
    switchHref: "/login",
  },
};

/** Short codes the Google callback redirects back with; anything else is ignored. */
const OAUTH_ERRORS: Record<string, string> = {
  google: "Google sign-in didn't complete. Try again, or continue with email.",
  google_unverified: "That Google account's email isn't verified, so it can't be used here. Continue with email instead.",
};

interface AuthViewProps {
  mode: AuthMode;
  /** Raw `?next=` value from the URL; validated before use. */
  nextPath?: string;
}

/** Editorial two-pane authentication page: creative pane on the left, the form on the right. */
export function AuthView({ mode, nextPath }: AuthViewProps) {
  const text = COPY[mode];
  // The live URL wins: after a client-side navigation the server prop can lag behind the query string.
  const params = useSearchParams();
  const next = safeNextPath(params.get("next") ?? nextPath);
  // Keep the deep link when the visitor switches between login and signup.
  const switchQuery = params.get("next") || nextPath ? `?next=${encodeURIComponent(next)}` : "";
  const providers = useQuery({ queryKey: queryKeys.auth.providers, queryFn: fetchAuthProviders, staleTime: 5 * 60_000 });
  const oauthError = OAUTH_ERRORS[params.get("error") ?? ""];

  const onSuccess = () => {
    toast.success(mode === "signup" ? "Account created. Welcome to Higgsfield!" : "Welcome back!");
    // A full navigation, not router.replace(): if the visitor reached us by clicking a gated page, the
    // client router has cached that page as "redirect to login" and would replay it despite the new session.
    window.location.assign(next);
  };

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1.05fr_minmax(0,0.95fr)] xl:grid-cols-[1.15fr_minmax(0,0.85fr)]">
      <AuthCreativePane />

      <div className="flex items-center justify-center px-4 py-12 sm:px-8 lg:px-14">
        <div className="w-full max-w-[26rem]">
          <AuthCreativeStrip />

          <p className="editorial-label">{text.eyebrow}</p>
          <h1 className="editorial-display mt-4 text-[2.25rem] leading-[1.05] sm:text-[2.625rem]">
            {text.heading} <em className="editorial-emphasis">{text.accent}</em>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{text.support}</p>

          {oauthError ? (
            <p
              role="alert"
              className="mt-6 border-l-2 border-danger bg-danger/5 py-2 pl-3 pr-2 text-[13px] leading-snug text-danger"
            >
              {oauthError}
            </p>
          ) : null}

          {/* Google stays hidden rather than disabled when the deployment has no OAuth client. */}
          {providers.data?.google !== false ? (
            <>
              <div className="mt-7">
                <SocialButton next={next} available={providers.data?.google ?? true} />
              </div>
              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-border-subtle" />
                <span className="editorial-label">or</span>
                <span className="h-px flex-1 bg-border-subtle" />
              </div>
            </>
          ) : (
            <div className="mt-7" />
          )}

          <AuthForm mode={mode} onSuccess={onSuccess} />

          <p className="mt-8 border-t border-border-subtle pt-5 text-[13px] text-foreground-muted">
            {text.switchLabel}{" "}
            <Link
              href={`${text.switchHref}${switchQuery}`}
              className="border-b border-accent/40 pb-px font-medium text-accent-text transition-colors hover:border-accent"
            >
              {text.switchCta}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
