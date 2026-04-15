// Login screen — signs an existing user into Uniflo.
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
// boundary — the inner LoginContent component is wrapped in one below.
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

// Separated from the page export so it can be wrapped in Suspense
// (required by Next.js when useSearchParams is used in a client component).
function LoginContent() {
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
    // Surface the callback error immediately if present.
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

    // Signed in — go to the dashboard. Task 7 handles the profile-completeness
    // check and redirects to setup if the profile is missing.
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
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue your applications.
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
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
          />
          {/* Forgot password — right-aligned under the password field. */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>

      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="ghost"
        fullWidth
        onClick={handleGoogleSignIn}
      >
        <svg
          aria-hidden
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

// Suspense wrapper required by Next.js when a client component calls
// useSearchParams. The boundary prevents the whole page tree from being
// treated as dynamic just because of the search-param read.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
