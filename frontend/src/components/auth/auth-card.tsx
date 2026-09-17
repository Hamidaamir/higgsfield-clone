"use client";

import { Cloud, Gift, Mail, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AuthForm, type AuthMode } from "@/components/auth/auth-form";
import { AuthPromoPane } from "@/components/auth/auth-promo-pane";
import { SocialButton } from "@/components/auth/social-button";
import { fetchAuthProviders } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";
import { LogoMark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/hooks/use-auth";

const copy: Record<AuthMode, { title: string; subtitle: string; switchLabel: string; switchCta: string; switchHref: string }> = {
  signup: {
    title: "Welcome to Higgsfield",
    subtitle: "Sign up and generate for free",
    switchLabel: "Already have an account?",
    switchCta: "Log in",
    switchHref: "/login",
  },
  login: {
    title: "Welcome back",
    subtitle: "Log in to continue creating",
    switchLabel: "New to Higgsfield?",
    switchCta: "Sign up",
    switchHref: "/signup",
  },
};

/** Two-pane authentication card reproducing reference/screenshots/signup.png. */
interface AuthCardProps {
  mode: AuthMode;
  /** Raw `?next=` value from the URL; validated before use. */
  nextPath?: string;
}

/** Short codes the Google callback redirects back with; anything else is ignored. */
const OAUTH_ERRORS: Record<string, string> = {
  google: "Google sign-in didn't complete. Try again, or continue with email.",
  google_unverified: "That Google account's email isn't verified, so it can't be used here. Continue with email instead.",
};

export function AuthCard({ mode, nextPath }: AuthCardProps) {
  const [step, setStep] = useState<"methods" | "email">("methods");
  const text = copy[mode];
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
    <div className="relative mx-auto grid w-full max-w-[1100px] overflow-hidden rounded-3xl border border-border bg-surface shadow-menu md:grid-cols-[1fr_1.05fr] md:min-h-[640px]">
      <AuthPromoPane className="hidden md:block" />

      <div className="relative flex flex-col px-6 py-10 sm:px-12">
        <Button asChild variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full" aria-label="Close">
          <Link href="/">
            <X className="size-4" />
          </Link>
        </Button>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
          <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <LogoMark className="size-5" />
          </span>
          <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight sm:text-[28px]">{text.title}</h1>
          <p className="mt-1.5 text-center text-sm text-text-secondary">{text.subtitle}</p>

          <div className="mt-8">
            {step === "methods" ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-accent/40 bg-accent-muted text-[15px] font-semibold text-accent transition-colors hover:bg-accent/20"
                >
                  <Gift className="size-4" aria-hidden />
                  {mode === "signup" ? "Sign in with business email & Get 50 credits" : "Log in with business email"}
                </button>
                {oauthError ? (
                  <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger">
                    {oauthError}
                  </p>
                ) : null}
                <SocialButton provider="google" next={next} available={providers.data?.google ?? true} />
                <SocialButton provider="apple" />
                <SocialButton provider="microsoft" />
                <div className="flex items-center gap-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button type="button" variant="outline" size="lg" className="w-full gap-2.5 bg-surface" onClick={() => setStep("email")}>
                  <Mail className="size-4" aria-hidden />
                  Continue with Email
                </Button>
                <p className="pt-2 text-center text-[13px] text-text-secondary">
                  {text.switchLabel}{" "}
                  <Link href={`${text.switchHref}${switchQuery}`} className="font-semibold text-accent hover:underline">
                    {text.switchCta}
                  </Link>
                </p>
              </div>
            ) : (
              <AuthForm mode={mode} onBack={() => setStep("methods")} onSuccess={onSuccess} switchQuery={switchQuery} />
            )}
          </div>

          <p className="mt-8 border-t border-border pt-5 text-center text-[13px] text-text-secondary">
            <Cloud className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden />
            SSO available on <span className="underline">Scale and Enterprise</span> plans
          </p>
        </div>
      </div>
    </div>
  );
}
