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
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DotCluster } from "@/components/ui/motifs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

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
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <Card variant="elevated" className="p-7 md:p-9">
        <div className="space-y-6 text-center">
          <DotCluster className="mx-auto h-8 w-12 text-primary" />
          <div className="space-y-2">
            <h1 className="font-display text-3xl tracking-tight text-foreground">
              Check your inbox.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{email}</span>,
              you&rsquo;ll receive a password reset link shortly. Check your
              spam folder if it doesn&rsquo;t arrive within a few minutes.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <ArrowLeft size={14} />
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
            Reset your password.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter your email and we&rsquo;ll send you a reset link.
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

          {formError && <Alert tone="destructive">{formError}</Alert>}

          <Button type="submit" fullWidth loading={loading}>
            Send reset link
          </Button>
        </form>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}
