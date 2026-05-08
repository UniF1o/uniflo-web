"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

type ApplicationWithJob = components["schemas"]["ApplicationWithJob"];
type ApplicationStatus = components["schemas"]["ApplicationStatus"];
type Application = components["schemas"]["Application"];

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-6">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-40">
        {label}
      </dt>
      <dd className="text-sm text-foreground sm:flex-1">{children}</dd>
    </div>
  );
}

export interface ApplicationDetailProps {
  application: ApplicationWithJob;
  universityName: string;
}

export function ApplicationDetail({
  application,
  universityName,
}: ApplicationDetailProps) {
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(
    application.status,
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function handleRetry() {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const updated = await apiClient.post<Application>(
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
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={14} />
        Back to applications
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            {universityName}
          </h1>
          <StatusBadge status={currentStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          {application.programme} · {application.application_year}
        </p>
      </div>

      {/* Application details */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Application details
        </h2>
        <dl className="divide-y divide-border rounded-lg border border-border">
          <DetailRow label="Programme">{application.programme}</DetailRow>
          <DetailRow label="Year">{application.application_year}</DetailRow>
          <DetailRow label="Submitted">
            {formatDate(application.submitted_at) ?? "—"}
          </DetailRow>
          <DetailRow label="Created">
            {formatDate(application.created_at) ?? "—"}
          </DetailRow>
        </dl>
      </div>

      {/* Latest automation job */}
      {job && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Automation status
          </h2>
          <dl className="divide-y divide-border rounded-lg border border-border">
            <DetailRow label="Status">
              <StatusBadge status={job.status} />
            </DetailRow>
            <DetailRow label="Attempts">{job.attempts}</DetailRow>
            {job.last_error && (
              <DetailRow label="Last error">
                <span className="text-destructive">{job.last_error}</span>
              </DetailRow>
            )}
            {/* screenshot_url is Phase 3 — only render when present */}
            {job.screenshot_url && (
              <DetailRow label="Screenshot">
                <a
                  href={job.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View screenshot
                </a>
              </DetailRow>
            )}
          </dl>
        </div>
      )}

      {/* Retry affordance for failed applications */}
      {currentStatus === "failed" && (
        <div className="space-y-3">
          {retryError && (
            <p role="alert" className="text-sm text-destructive">
              {retryError}
            </p>
          )}
          <Button variant="primary" loading={isRetrying} onClick={handleRetry}>
            Retry application
          </Button>
        </div>
      )}
    </div>
  );
}
