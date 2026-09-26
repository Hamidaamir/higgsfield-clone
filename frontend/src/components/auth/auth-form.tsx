"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin, useSignup } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

export type AuthMode = "signup" | "login";

interface AuthFormProps {
  mode: AuthMode;
  onSuccess: () => void;
}

/** Editorial field styling: square, hairline border, its own focus ring (the shared Input
 *  primitive removes the default outline, and generator surfaces keep their rounded look). */
const fieldClasses =
  "h-11 rounded-none border-border-default bg-surface-raised focus:border-accent focus:ring-2 focus:ring-accent/25";

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  return mode === "signup" ? <SignupForm onSuccess={onSuccess} /> : <LoginForm onSuccess={onSuccess} />;
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetwork) return "We couldn't reach the server. It may be starting up — please try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="border-l-2 border-danger bg-danger/5 py-2 pl-3 pr-2 text-[13px] leading-snug text-danger">
      {message}
    </p>
  );
}

/** Reveal toggle for a password field. Purely client-side; the input keeps its autocomplete. */
function PasswordField({
  id,
  label,
  error,
  hint,
  autoComplete,
  placeholder,
  register,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  autoComplete: "new-password" | "current-password";
  placeholder: string;
  register: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(fieldClasses, "pr-11")}
          {...register}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground-subtle transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </Field>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
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
          className={fieldClasses}
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
          className={fieldClasses}
          {...form.register("email")}
        />
      </Field>
      <PasswordField
        id="signup-password"
        label="Password"
        error={errors.password?.message}
        hint="At least 8 characters with a letter and a number."
        autoComplete="new-password"
        placeholder="Create a password"
        register={form.register("password")}
      />
      <Checkbox
        id="signup-terms"
        error={errors.acceptTerms?.message}
        label={
          <>
            I agree to the <span className="font-medium text-foreground">Terms of Use</span>, acknowledge the{" "}
            <span className="font-medium text-foreground">Privacy Policy</span>, and confirm I&apos;m at least 18 years
            old.
          </>
        }
        {...form.register("acceptTerms")}
      />
      <FormError message={errors.root?.message} />
      <Button type="submit" size="lg" className="w-full rounded-none shadow-none" loading={busy}>
        Create account
      </Button>
    </form>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
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
          className={fieldClasses}
          {...form.register("email")}
        />
      </Field>
      <PasswordField
        id="login-password"
        label="Password"
        error={errors.password?.message}
        autoComplete="current-password"
        placeholder="Your password"
        register={form.register("password")}
      />
      <FormError message={errors.root?.message} />
      <Button type="submit" size="lg" className="w-full rounded-none shadow-none" loading={busy}>
        Log in
      </Button>
    </form>
  );
}
