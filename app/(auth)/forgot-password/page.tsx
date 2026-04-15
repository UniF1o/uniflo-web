// Forgot password screen — triggers a Supabase password reset email.
//
// Security: the success message is identical whether the email has an account
// or not. This prevents user enumeration — an attacker cannot discover which
// addresses are registered by watching for different responses.
//
// The reset link in the email points to /auth/reset-password where the user
// sets their new password (built in a later task).
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // True after the request completes — switches the view to a success message.
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Basic email validation before hitting the network.
    if (!email) {
      setEmailError("Email is required.");
      return;
    }
    if (!email.includes("@")) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(undefined);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // The reset link in the email lands here so the user can set a new
      // password. This page is built in a later task.
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      // Treat errors generically — don't expose whether the email exists.
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Always show success, even if the email doesn't match an account.
    setSubmitted(true);
    setLoading(false);
  }

  // Success state — shown after the form is submitted regardless of outcome.
  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            Check your inbox
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>,
            you&apos;ll receive a password reset link shortly. Check your spam
            folder if it doesn&apos;t arrive within a few minutes.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
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
            if (emailError) setEmailError(undefined);
          }}
          error={emailError}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Send reset link
        </Button>
      </form>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </div>
  );
}
