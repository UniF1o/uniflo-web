// SignUpForm — creates a new Uniflo account.
//
// Two paths to sign up:
//   1. Email + password — calls supabase.auth.signUp().
//      If Supabase requires email confirmation, a "check your email" message
//      is shown. If confirmation is disabled, the user is immediately signed
//      in and redirected to the profile setup flow.
//   2. Google OAuth — calls supabase.auth.signInWithOAuth(), which redirects
//      the browser to Google. After consent, Google calls our callback route
//      at /auth/callback?next=/profile/setup which then sets the session and
//      forwards the user to profile setup.
//
// Error messages are mapped from raw Supabase strings to friendly copy so
// users never see internal error codes.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DotCluster } from "@/components/ui/motifs";

// Three short benefit statements rendered as a tick-list above the CTAs.
// Anchors the form so visitors see what they're signing up for.
const BENEFITS = [
  "Apply to multiple universities with one profile.",
  "Review every application before we submit.",
  "Free to start. No card required.",
];

function getAuthErrorMessage(error: AuthError): string {
  const msg = error.message.toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (msg.includes("password") && msg.includes("characters")) {
    return "Password must be at least 6 characters.";
  }
  if (msg.includes("invalid email") || msg.includes("unable to validate")) {
    return "Please enter a valid email address.";
  }
  return "Something went wrong. Please try again.";
}

function validate(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  if (!email) errors.email = "Email is required.";
  else if (!email.includes("@")) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6)
    errors.password = "Password must be at least 6 characters.";
  return errors;
}

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/profile/setup");
      router.refresh();
    } else {
      setEmailSent(true);
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile/setup`,
      },
    });
    if (error) setFormError(getAuthErrorMessage(error));
  }

  // Post-signup confirmation screen — shown when email verification is enabled.
  if (emailSent) {
    return (
      <Card variant="elevated" className="p-7 md:p-9">
        <div className="space-y-6 text-center">
          <DotCluster className="mx-auto h-8 w-12 text-primary" />
          <div className="space-y-2">
            <h1 className="font-display text-3xl tracking-tight text-foreground">
              Check your inbox.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click it to activate your account and start your application.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-7 md:p-9">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            Start your application.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            One profile. Every university you choose.
          </p>
        </div>

        {/* Benefits — tiny check-list anchoring the value before the form. */}
        <ul className="flex flex-col gap-1.5">
          {BENEFITS.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Check size={11} strokeWidth={3} aria-hidden />
              </span>
              {b}
            </li>
          ))}
        </ul>

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

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
          />

          {formError && <Alert tone="destructive">{formError}</Alert>}

          <Button type="submit" fullWidth loading={loading}>
            Create account
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
          onClick={handleGoogleSignUp}
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
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
