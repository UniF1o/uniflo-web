"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "idle" | "saving" | "done";

function validate(current: string, next: string, confirm: string) {
  const errors: { current?: string; next?: string; confirm?: string } = {};
  if (!current) errors.current = "Current password is required.";
  if (!next) {
    errors.next = "New password is required.";
  } else if (next.length < 8) {
    errors.next = "Password must be at least 8 characters.";
  } else if (next === current) {
    errors.next = "New password must differ from your current password.";
  }
  if (!confirm) {
    errors.confirm = "Please confirm your new password.";
  } else if (next !== confirm) {
    errors.confirm = "Passwords do not match.";
  }
  return errors;
}

export function ChangePasswordSection() {
  const [step, setStep] = useState<Step>("idle");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  // null = loading, true = has email+password identity, false = OAuth-only
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkIdentity() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const identities = user?.identities ?? [];
      setHasPassword(identities.some((id) => id.provider === "email"));
    }
    checkIdentity();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate(current, next, confirm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep("saving");

    const supabase = createClient();

    // Re-authenticate with current password first so we can surface a clear
    // "wrong password" error rather than a generic Supabase failure.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email;

    if (!email) {
      setError("Your session has expired. Please sign in again.");
      setStep("idle");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });

    if (signInError) {
      setFieldErrors({ current: "Incorrect password." });
      setStep("idle");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: next,
    });

    if (updateError) {
      setError("Failed to update password. Please try again.");
      setStep("idle");
      return;
    }

    setStep("done");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  function handleReset() {
    setStep("idle");
    setCurrent("");
    setNext("");
    setConfirm("");
    setFieldErrors({});
    setError(null);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <KeyRound size={16} aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            Change password
          </h2>
          <p className="text-sm text-muted-foreground">
            Update the password you use to sign in to UniFlo.
          </p>
        </div>
      </div>

      {hasPassword === false ? (
        <p className="text-sm text-muted-foreground">
          Your account uses Google sign-in, so there is no password to change.
          To set a password, sign out and use &ldquo;Forgot password?&rdquo; on
          the login page.
        </p>
      ) : step === "done" ? (
        <div className="space-y-4">
          <Alert tone="success">Password updated successfully.</Alert>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Change it again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            placeholder="Your current password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              if (fieldErrors.current)
                setFieldErrors((prev) => ({ ...prev, current: undefined }));
            }}
            error={fieldErrors.current}
          />

          <Input
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              if (fieldErrors.next)
                setFieldErrors((prev) => ({ ...prev, next: undefined }));
            }}
            error={fieldErrors.next}
          />

          <Input
            id="confirm-new-password"
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

          {error && <Alert tone="destructive">{error}</Alert>}

          <Button type="submit" loading={step === "saving"}>
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}
