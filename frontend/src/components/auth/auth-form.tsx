"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin, useSignup } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/schemas/auth";

export type AuthMode = "signup" | "login";

interface AuthFormProps {
  mode: AuthMode;
  onBack: () => void;
  onSuccess: () => void;
  /** Query string (e.g. "?next=%2Fedit%2Fimage") carried across the login ↔ signup switch. */
  switchQuery?: string;
}

export function AuthForm({ mode, onBack, onSuccess, switchQuery = "" }: AuthFormProps) {
  return mode === "signup" ? (
    <SignupForm onBack={onBack} onSuccess={onSuccess} switchQuery={switchQuery} />
  ) : (
    <LoginForm onBack={onBack} onSuccess={onSuccess} switchQuery={switchQuery} />
  );
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetwork) return "We couldn't reach the server. It may be starting up — please try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function SignupForm({ onBack, onSuccess, switchQuery }: Omit<AuthFormProps, "mode">) {
  const signup = useSignup();
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", acceptTerms: undefined },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || signup.isPending;

  const submit = form.handleSubmit(async (values) => {
    try {
      await signup.mutateAsync(values);
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("email", { message: error.message });
        return;
      }
      form.setError("root", { message: describeError(error) });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="signup-name" label="Name" error={errors.name?.message}>
        <Input
          id="signup-name"
          autoComplete="name"
          placeholder="Your name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          {...form.register("name")}
        />
      </Field>
      <Field id="signup-email" label="Email" error={errors.email?.message}>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          {...form.register("email")}
        />
      </Field>
      <Field
        id="signup-password"
        label="Password"
        error={errors.password?.message}
        hint="At least 8 characters with a letter and a number."
      >
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "signup-password-error" : "signup-password-hint"}
          {...form.register("password")}
        />
      </Field>
      <Checkbox
        id="signup-terms"
        error={errors.acceptTerms?.message}
        label={
          <>
            I agree to the <span className="font-semibold text-text-primary underline">Terms of Use</span>, acknowledge
            the <span className="font-semibold text-text-primary underline">Privacy Policy</span>, and confirm I&apos;m at
            least 18 years old.
          </>
        }
        {...form.register("acceptTerms")}
      />
      {errors.root ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {errors.root.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        Create account
      </Button>
      <FormFooter onBack={onBack} switchHref={`/login${switchQuery}`} switchLabel="Already have an account?" switchCta="Log in" />
    </form>
  );
}

function LoginForm({ onBack, onSuccess, switchQuery }: Omit<AuthFormProps, "mode">) {
  const login = useLogin();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || login.isPending;

  const submit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      onSuccess();
    } catch (error) {
      form.setError("root", { message: describeError(error) });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="login-email" label="Email" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...form.register("email")}
        />
      </Field>
      <Field id="login-password" label="Password" error={errors.password?.message}>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...form.register("password")}
        />
      </Field>
      {errors.root ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {errors.root.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        Log in
      </Button>
      <FormFooter onBack={onBack} switchHref={`/signup${switchQuery}`} switchLabel="New to Higgsfield?" switchCta="Sign up" />
    </form>
  );
}

function FormFooter({
  onBack,
  switchHref,
  switchLabel,
  switchCta,
}: {
  onBack: () => void;
  switchHref: string;
  switchLabel: string;
  switchCta: string;
}) {
  return (
    <div className="flex items-center justify-between text-[13px] text-text-secondary">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 hover:text-text-primary">
        <ArrowLeft className="size-3.5" aria-hidden />
        Other options
      </button>
      <span>
        {switchLabel}{" "}
        <Link href={switchHref} className="font-semibold text-accent hover:underline">
          {switchCta}
        </Link>
      </span>
    </div>
  );
}
