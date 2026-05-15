// LoginForm — email/password + Google OAuth sign-in form.
//
// Two sign-in paths:
//   1. Email + password — calls supabase.auth.signInWithPassword().
//      On success, redirects to /dashboard. The dashboard (Task 7) then
//      checks profile completeness and redirects to setup if needed.
//   2. Google OAuth — same flow as signup; callback route at /auth/callback.
//
// Reads an optional `?error=auth_callback_error` search param so it can
// surface a friendly message when the OAuth callback route fails (e.g. the
// user cancelled or the code expired). useSearchParams requires a Suspense
// boundary — the parent page.tsx wraps this form in one.
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/auth/google-icon";

function getAuthErrorMessage(error: AuthError): string {
  const msg = error.message.toLowerCase();
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid credentials")
  ) {
    return "Incorrect email or password.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
  }
  if (msg.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}

function validate(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  if (!email) errors.email = "Email is required.";
  else if (!email.includes("@")) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Check if we arrived here from a failed OAuth callback.
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(
    callbackError === "auth_callback_error"
      ? "Sign in with Google failed. Please try again or use email and password."
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setFormError(getAuthErrorMessage(error));
  }

  return (
    <Card variant="elevated" className="p-7 md:p-9">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            Welcome back.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sign in and we&rsquo;ll pick up where you left off.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email)
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={fieldErrors.email}
          />

          <div className="space-y-1">
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: undefined,
                  }));
              }}
              error={fieldErrors.password}
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {formError && <Alert tone="destructive">{formError}</Alert>}

          <Button type="submit" fullWidth loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="relative flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon className="h-4 w-4 shrink-0" />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&rsquo;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </Card>
  );
}
