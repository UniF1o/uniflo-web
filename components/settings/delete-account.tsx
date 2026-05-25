"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "idle" | "confirming" | "deleting";

export function DeleteAccountSection() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === "DELETE";

  async function handleDelete() {
    setError(null);
    setStep("deleting");

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setError("Your session has expired. Please sign in again.");
      setStep("confirming");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError("API URL is not configured. Contact support.");
      setStep("confirming");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body.detail === "string"
            ? body.detail
            : "Account deletion failed. Please try again or contact support.";
        setError(message);
        setStep("confirming");
        return;
      }

      // Deletion confirmed — sign out then send to landing page.
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setError(
        "Unable to connect. Check your internet connection and try again.",
      );
      setStep("confirming");
    }
  }

  if (step === "idle") {
    return (
      <div className="space-y-4 rounded-xl border border-destructive/30 p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle size={16} aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Delete account
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently deletes your account, profile, academic records,
              uploaded documents, and all applications. This cannot be undone.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep("confirming")}
          className="border border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete my account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle size={16} aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            Are you sure?
          </h2>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your account and all associated data.
            Type{" "}
            <span className="font-mono font-medium text-foreground">
              DELETE
            </span>{" "}
            below to confirm.
          </p>
        </div>
      </div>

      <Input
        id="delete-confirm"
        label="Confirmation"
        type="text"
        placeholder="Type DELETE to confirm"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />

      {error && <Alert tone="destructive">{error}</Alert>}

      <div className="flex gap-3">
        <Button
          type="button"
          fullWidth
          loading={step === "deleting"}
          disabled={!canDelete}
          onClick={handleDelete}
          className="border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Permanently delete account
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={step === "deleting"}
          onClick={() => {
            setStep("idle");
            setConfirmText("");
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
