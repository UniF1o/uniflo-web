// Reset password page — the landing target for the Supabase password-reset email.
//
// Supabase appends #access_token=...&type=recovery to the URL. The browser
// client picks up the fragment, exchanges it for a session, and fires
// onAuthStateChange with event PASSWORD_RECOVERY. We wait for that event
// before showing the form so the user never interacts with a stale state.
//
// If the event doesn't arrive within a few seconds the link is treated as
// invalid or expired, and we surface a clear message with a path back to
// /forgot-password.
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DotCluster } from "@/components/ui/motifs";

type Step = "loading" | "ready" | "updating" | "done" | "invalid";

function validate(password: string, confirm: string) {
  const errors: { password?: string; confirm?: string } = {};
  if (!password) {
    errors.password = "New password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!confirm) {
    errors.confirm = "Please confirm your new password.";
  } else if (password !== confirm) {
    errors.confirm = "Passwords do not match.";
  }
  return errors;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep("ready");
      }
    });

    // If the recovery event never fires the link is invalid or expired.
    const timer = setTimeout(() => {
      setStep((prev) => (prev === "loading" ? "invalid" : prev));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validate(password, confirm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep("updating");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(
        "Failed to update your password. The link may have expired. Request a new one.",
      );
      setStep("ready");
      return;
    }

    setStep("done");
    redirectTimer.current = setTimeout(() => router.push("/dashboard"), 2500);
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <Card variant="elevated" className="p-7 md:p-9">
        <div className="space-y-7">
          <div className="space-y-2">
            <Skeleton className="h-9 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[62px] w-full" />
            <Skeleton className="h-[62px] w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  // ── Invalid / expired link ────────────────────────────────────────────────
  if (step === "invalid") {
    return (
      <Card variant="elevated" className="p-7 md:p-9">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl tracking-tight text-foreground">
              Link expired.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This password reset link is invalid or has expired. Reset links
              are single-use and expire after one hour.
            </p>
          </div>

          <Alert tone="destructive">
            Request a new link and use it immediately after it arrives.
          </Alert>

          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </Card>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <Card variant="elevated" className="p-7 md:p-9">
        <div className="space-y-6 text-center">
          <DotCluster className="mx-auto h-8 w-12 text-primary" />
          <div className="space-y-2">
            <h1 className="font-display text-3xl tracking-tight text-foreground">
              Password updated.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your password has been changed. Taking you to your dashboard…
            </p>
          </div>
          <span className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={16} aria-hidden />
            All done
          </span>
        </div>
      </Card>
    );
  }

  // ── Password form (ready | updating) ─────────────────────────────────────
  return (
    <Card variant="elevated" className="p-7 md:p-9">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            Set a new password.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Choose a strong password of at least 8 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
          />

          <Input
            id="confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (fieldErrors.confirm)
                setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            error={fieldErrors.confirm}
          />

          {formError && <Alert tone="destructive">{formError}</Alert>}

          <Button type="submit" fullWidth loading={step === "updating"}>
            Update password
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
