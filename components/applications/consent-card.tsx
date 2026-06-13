// ConsentCard — records the student's POPI / application-agreement acceptance
// for one application via POST /applications/{id}/consent.
//
// Portals show a POPI (privacy) notice and an application agreement during
// submission; recording acceptance here lets the automation tick those boxes
// on the student's behalf. Each consent is independent: already-recorded ones
// render as a timestamped check row, missing ones as a checkbox. The backend
// requires at least one true flag per POST, so the button stays disabled
// until something new is ticked.
"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { recordConsent } from "@/lib/api/phase-3";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];

interface ConsentCardProps {
  applicationId: string;
  universityName: string;
  popiConsentAt: string | null;
  agreementConsentAt: string | null;
  // Receives the refreshed application row after a successful POST.
  onUpdated: (updated: ApplicationRead) => void;
}

function RecordedRow({ label, at }: { label: string; at: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-foreground">
      <CheckCircle2
        size={15}
        className="mt-0.5 shrink-0 text-success"
        aria-hidden
      />
      <span>
        {label}{" "}
        <span className="text-xs text-muted-foreground">
          · Recorded {formatDate(at)}
        </span>
      </span>
    </p>
  );
}

export function ConsentCard({
  applicationId,
  universityName,
  popiConsentAt,
  agreementConsentAt,
  onUpdated,
}: ConsentCardProps) {
  const [popiChecked, setPopiChecked] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const popiDone = popiConsentAt != null;
  const agreementDone = agreementConsentAt != null;
  const allDone = popiDone && agreementDone;
  const hasNewTick =
    (!popiDone && popiChecked) || (!agreementDone && agreementChecked);

  async function handleRecord() {
    setApiError(null);
    setSubmitting(true);
    try {
      // Only flag the consents being newly granted — recorded ones keep
      // their original timestamp.
      const updated = await recordConsent(applicationId, {
        popi: !popiDone && popiChecked,
        agreement: !agreementDone && agreementChecked,
      });
      onUpdated(updated);
      setPopiChecked(false);
      setAgreementChecked(false);
    } catch {
      setApiError("Couldn't record your consent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Portal consents
      </h2>
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)]">
        {!allDone && (
          <p className="text-sm text-muted-foreground">
            The {universityName} portal asks for these during submission.
            Recording them here lets UniFlo accept on your behalf.
          </p>
        )}

        {popiDone ? (
          <RecordedRow
            label="Privacy (POPI) notice accepted"
            at={popiConsentAt}
          />
        ) : (
          <Checkbox
            id="consent-popi"
            label={`I've read ${universityName}'s privacy (POPI) notice and consent to my personal information being submitted.`}
            checked={popiChecked}
            onChange={(ev) => setPopiChecked(ev.target.checked)}
            disabled={submitting}
          />
        )}

        {agreementDone ? (
          <RecordedRow
            label="Application agreement accepted"
            at={agreementConsentAt}
          />
        ) : (
          <Checkbox
            id="consent-agreement"
            label={`I accept ${universityName}'s application terms and agreement.`}
            checked={agreementChecked}
            onChange={(ev) => setAgreementChecked(ev.target.checked)}
            disabled={submitting}
          />
        )}

        {apiError && <Alert tone="destructive">{apiError}</Alert>}

        {!allDone && (
          <Button
            type="button"
            onClick={() => void handleRecord()}
            loading={submitting}
            disabled={!hasNewTick || submitting}
          >
            Record consent
          </Button>
        )}
      </div>
    </div>
  );
}
