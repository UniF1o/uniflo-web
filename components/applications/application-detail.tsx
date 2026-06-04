"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  parseJobError,
  retryApplication,
  type AugmentedApplicationJobRead,
  type JobError,
} from "@/lib/api/phase-3";
import { getFailureCopy, isRetryable } from "@/lib/applications/failure-copy";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { CelebrationBanner } from "./celebration-banner";
import { SubmissionConfirmation } from "./submission-confirmation";
import { formatDate } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];
type ApplicationStatus = components["schemas"]["ApplicationStatus"];
type ApplicationChoice = components["schemas"]["ApplicationChoiceRead"];

// Eligibility is filled in by the automation later — null means "not yet
// assessed". Render a quiet pending state until the worker reports back.
function EligibilityTag({ eligible }: { eligible?: boolean | null }) {
  if (eligible == null) {
    return <span className="text-xs text-muted-foreground">Pending</span>;
  }
  return eligible ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
      <CheckCircle2 size={12} aria-hidden />
      Eligible
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
      <XCircle size={12} aria-hidden />
      Not eligible
    </span>
  );
}

function DetailRow({
  label,
  children,
  isLast,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className={cnRow(isLast)}>
      <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-40">
        {label}
      </dt>
      <dd className="text-sm text-foreground sm:flex-1">{children}</dd>
    </div>
  );
}

function cnRow(isLast?: boolean): string {
  const base =
    "flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-6";
  return isLast ? base : `${base} border-b border-border`;
}

export interface ApplicationDetailProps {
  application: ApplicationRead;
  universityName: string;
  // Email address rendered on the "Contact support" link for non-retryable
  // failures. Resolved on the server side so the component doesn't reach
  // for the env var directly.
  supportEmail: string;
}

// Outcome of a retry POST. Drives the toast / alert below the button.
type RetryFeedback =
  | { kind: "queued"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "error"; message: string };

export function ApplicationDetail({
  application,
  universityName,
  supportEmail,
}: ApplicationDetailProps) {
  // Ordered programme choices (primary first). Defaults to [] on older rows
  // that predate the multi-choice contract.
  const choices: ApplicationChoice[] = application.choices ?? [];

  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus | null>(
    application.status,
  );
  const [isRetrying, setIsRetrying] = useState(false);
  // After a successful retry we lock the button briefly so a double-tap
  // doesn't fire a second request before the optimistic status update lands
  // and the row would otherwise re-enable.
  const [retryDisabled, setRetryDisabled] = useState(false);
  const [feedback, setFeedback] = useState<RetryFeedback | null>(null);

  // Treat latest_job as the augmented shape — Phase 3 adds optional
  // portal_reference / verified_at fields. Existing readers like the
  // `attempts` and `screenshot_url` fields continue to work.
  const job = application.latest_job as
    | AugmentedApplicationJobRead
    | null
    | undefined;
  const structuredError: JobError | null = parseJobError(job?.last_error);
  const failureCopy = structuredError
    ? getFailureCopy(structuredError.code, {
        message: structuredError.message,
        universityName,
      })
    : null;
  const canRetry =
    currentStatus === "failed" &&
    structuredError != null &&
    isRetryable(structuredError.code, structuredError.retryable);

  async function handleRetry() {
    setIsRetrying(true);
    setFeedback(null);
    try {
      const updated = await retryApplication(application.id);
      // Optimistically reflect "queued" — the backend returns the refreshed
      // row from POST /applications/{id}/retry, but on 202 the status often
      // hasn't moved off `pending` yet.
      setCurrentStatus(updated.status ?? "pending");
      setFeedback({
        kind: "queued",
        message: "Retrying — we'll update the status shortly.",
      });
      // Brief lockout to prevent double-tap retries.
      setRetryDisabled(true);
      window.setTimeout(() => setRetryDisabled(false), 5000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFeedback({
            kind: "conflict",
            message: "Already retrying — please refresh shortly.",
          });
          // Lock out subsequent attempts — refresh is the recovery path.
          setRetryDisabled(true);
        } else {
          setFeedback({
            kind: "error",
            message: "Retry failed. Refresh the page and try again.",
          });
        }
      } else {
        setFeedback({
          kind: "error",
          message: "Retry failed. Refresh the page and try again.",
        });
      }
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-10">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft size={14} />
        Back to applications
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            {universityName}
          </h1>
          {currentStatus && <StatusBadge status={currentStatus} />}
        </div>
        <p className="text-sm text-muted-foreground">
          {application.programme} · {application.application_year}
        </p>
      </div>

      {/* Suspense wraps useSearchParams — required by Next.js even though
       * this subtree renders client-side. */}
      <Suspense fallback={null}>
        <CelebrationBanner />
      </Suspense>

      {/* Submission proof — Phase 3. Renders when the latest job has
       * landed at status "submitted". `latest_job.status` is the source of
       * truth (not `application.status`) because the application row may
       * still be in `pending` for a beat before the job catches up. */}
      {job?.status === "submitted" && (
        <SubmissionConfirmation job={job} universityName={universityName} />
      )}

      {/* Failure surface — Phase 3. Friendly headline up top, a `<details>`
       * with the raw message tucked away for support, and the retry /
       * contact-support affordance based on the taxonomy. */}
      {currentStatus === "failed" && structuredError && failureCopy && (
        <div className="space-y-3">
          <Alert tone="destructive">{failureCopy.headline}</Alert>

          {structuredError.message && (
            <details className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Show technical details (for support)
              </summary>
              <p className="mt-2 break-all font-mono text-foreground">
                {structuredError.message}
              </p>
            </details>
          )}

          {feedback && (
            <Alert
              tone={
                feedback.kind === "queued"
                  ? "info"
                  : feedback.kind === "conflict"
                    ? "warning"
                    : "destructive"
              }
            >
              {feedback.message}
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {canRetry ? (
              <Button
                variant="primary"
                loading={isRetrying}
                disabled={retryDisabled}
                onClick={handleRetry}
                aria-label={
                  isRetrying ? "Retrying application" : "Retry application"
                }
              >
                <RefreshCw size={14} aria-hidden />
                Retry application
              </Button>
            ) : (
              <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                  `Help with my ${universityName} application`,
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail size={14} aria-hidden />
                Contact support
              </a>
            )}
          </div>
        </div>
      )}

      {/* Application details */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Application
        </h2>
        <Card variant="paper" as="dl" className="overflow-hidden">
          <DetailRow label="Programme">{application.programme}</DetailRow>
          <DetailRow label="Year">{application.application_year}</DetailRow>
          <DetailRow label="Submitted">
            {formatDate(application.submitted_at) ?? "—"}
          </DetailRow>
          <DetailRow label="Created" isLast>
            {formatDate(application.created_at) ?? "—"}
          </DetailRow>
        </Card>
      </div>

      {/* Programme choices — rendered when the student listed more than the
       * primary. Each choice carries its own eligibility once the automation
       * assesses it. */}
      {choices.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Programme choices
          </h2>
          <Card variant="paper" as="ul" className="overflow-hidden">
            {choices.map((choice, i) => (
              <li
                key={choice.choice_number}
                className={cnRow(i === choices.length - 1)}
              >
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-40">
                  Choice {choice.choice_number}
                </span>
                <span className="flex flex-1 items-center justify-between gap-3">
                  <span className="text-sm text-foreground">
                    {choice.programme}
                  </span>
                  <EligibilityTag eligible={choice.eligible} />
                </span>
              </li>
            ))}
          </Card>
        </div>
      )}

      {/* Latest automation job — keep the structured view so support can see
       * attempts and update times at a glance. The failure summary above
       * surfaces the friendly version; this card is the raw data. */}
      {job && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Automation
          </h2>
          <Card variant="paper" as="dl" className="overflow-hidden">
            {job.status && (
              <DetailRow label="Status">
                <StatusBadge status={job.status} />
              </DetailRow>
            )}
            <DetailRow label="Attempts">{job.attempts}</DetailRow>
            <DetailRow label="Updated" isLast>
              {formatDate(job.updated_at) ?? "—"}
            </DetailRow>
          </Card>
        </div>
      )}
    </div>
  );
}
