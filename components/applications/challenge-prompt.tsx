// ChallengePrompt — the "Action needed" card on the application detail page.
//
// Rendered while an application is `action_required`: the automation run is
// paused on an email challenge (e.g. the portal emailed the student an OTP,
// or a temporary ID + password). The card shows one input per field the
// backend requests and POSTs the answers to /applications/{id}/challenge,
// after which the run resumes and the parent refreshes its state from the
// returned row.
"use client";

import { useState } from "react";
import { MailOpen } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { supplyChallenge, type PendingChallengeRead } from "@/lib/api/phase-3";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];

// Friendly labels for the field names portals commonly request. Anything
// unknown falls back to a prettified version of the raw name.
const FIELD_LABELS: Record<string, string> = {
  otp: "One-time PIN (OTP)",
  pin: "PIN",
  temp_id: "Temporary ID",
  password: "Password",
  reference: "Reference number",
};

function fieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const pretty = field.replace(/_/g, " ");
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

interface ChallengePromptProps {
  applicationId: string;
  universityName: string;
  challenge: PendingChallengeRead;
  // Receives the refreshed application row after a successful answer.
  onResolved: (updated: ApplicationRead) => void;
}

export function ChallengePrompt({
  applicationId,
  universityName,
  challenge,
  onResolved,
}: ChallengePromptProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(challenge.requested_fields.map((f) => [f, ""])),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setValue(field: string, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    // Every requested field must be filled — the backend 422s on missing keys.
    const errors: Record<string, string> = {};
    for (const field of challenge.requested_fields) {
      if (!values[field]?.trim()) {
        errors[field] = "Required.";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const trimmed = Object.fromEntries(
        challenge.requested_fields.map((f) => [f, values[f].trim()]),
      );
      const updated = await supplyChallenge(applicationId, trimmed);
      onResolved(updated);
    } catch (err) {
      setSubmitting(false);
      const detail =
        err instanceof ApiError &&
        typeof err.body === "object" &&
        err.body !== null &&
        "detail" in err.body &&
        typeof (err.body as { detail: unknown }).detail === "string"
          ? (err.body as { detail: string }).detail
          : null;
      setApiError(
        detail ??
          "Couldn't send that to the portal. Check the values and try again.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-warning/40 bg-warning/5 p-5"
    >
      <div className="flex items-start gap-3">
        <MailOpen
          size={18}
          className="mt-0.5 shrink-0 text-warning"
          aria-hidden
        />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            Check your email — the portal needs something from you
          </h2>
          <p className="text-sm text-muted-foreground">
            The {universityName} portal emailed you{" "}
            {challenge.requested_fields.length === 1
              ? `a ${fieldLabel(challenge.requested_fields[0]).toLowerCase()}`
              : "the details below"}
            . Enter {challenge.requested_fields.length === 1 ? "it" : "them"}{" "}
            here and your application continues automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {challenge.requested_fields.map((field) => (
          <Input
            key={field}
            id={`challenge-${field}`}
            label={fieldLabel(field)}
            type="text"
            autoComplete="off"
            value={values[field] ?? ""}
            onChange={(ev) => setValue(field, ev.target.value)}
            error={fieldErrors[field]}
          />
        ))}
      </div>

      {apiError && <Alert tone="destructive">{apiError}</Alert>}

      <Button type="submit" loading={submitting}>
        Send to the portal
      </Button>
    </form>
  );
}
