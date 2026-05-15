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
import { GoogleIcon } from "@/components/auth/google-icon";

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
          <GoogleIcon className="h-4 w-4 shrink-0" />
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
