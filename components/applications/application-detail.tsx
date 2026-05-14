"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];
type ApplicationStatus = components["schemas"]["ApplicationStatus"];

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

// Tiny helper kept inline so DetailRow stays a one-shot component.
function cnRow(isLast?: boolean): string {
  const base =
    "flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-6";
  return isLast ? base : `${base} border-b border-border`;
}

export interface ApplicationDetailProps {
  application: ApplicationRead;
  universityName: string;
}

export function ApplicationDetail({
  application,
  universityName,
}: ApplicationDetailProps) {
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus | null>(
    application.status,
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function handleRetry() {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const updated = await apiClient.post<ApplicationRead>(
        `/applications/${application.id}/retry`,
      );
      setCurrentStatus(updated.status);
    } catch (err) {
      const body = err instanceof ApiError ? err.body : null;
      const message =
        body && typeof body === "object" && "detail" in body
          ? String((body as { detail: string }).detail)
          : "Retry failed. Please try again.";
      setRetryError(message);
    } finally {
      setIsRetrying(false);
    }
  }

  const job = application.latest_job;

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

      {/* Latest automation job */}
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
            {job.last_error && (
              <DetailRow label="Last error">
                <span className="text-destructive">{job.last_error}</span>
              </DetailRow>
            )}
            {/* screenshot_url is Phase 3 — only render when present */}
            {job.screenshot_url && (
              <DetailRow label="Screenshot" isLast>
                <a
                  href={job.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  View screenshot
                </a>
              </DetailRow>
            )}
            {/* Render an isLast marker on whichever row ended up last so the
             * Card doesn't show a hairline below the final item. */}
            {!job.screenshot_url && !job.last_error && (
              <DetailRow label="Updated" isLast>
                {formatDate(job.updated_at) ?? "—"}
              </DetailRow>
            )}
          </Card>
        </div>
      )}

      {/* Retry affordance for failed applications */}
      {currentStatus === "failed" && (
        <div className="space-y-3">
          {retryError && <Alert tone="destructive">{retryError}</Alert>}
          <Button variant="primary" loading={isRetrying} onClick={handleRetry}>
            Retry application
          </Button>
        </div>
      )}
    </div>
  );
}
