"use client";

// Submission proof block on the application detail page.
//
// Renders the screenshot the adapter captured on the portal's confirmation
// page, the portal's reference number (click-to-copy), and the portal's
// verified timestamp. Every Phase 3 field is presence-checked — adapters
// roll out incrementally and some may land before they emit a reference.
//
// Why plain <img> instead of next/image: the screenshot host is the project's
// Supabase Storage bucket. The exact URL pattern isn't locked yet (signed URLs
// remain an option per the Phase 3 plan), so we avoid pinning a remotePattern
// to a host that may move. Plain <img loading="lazy"> behaves the same way
// next/image does with `unoptimized`.

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import type { AugmentedApplicationJobRead } from "@/lib/api/phase-3";

interface SubmissionConfirmationProps {
  job: AugmentedApplicationJobRead;
  universityName: string;
}

export function SubmissionConfirmation({
  job,
  universityName,
}: SubmissionConfirmationProps) {
  const verifiedDate = formatDate(job.verified_at ?? null);
  const verifiedTime = formatTime(job.verified_at ?? null);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-success">
            Submitted
          </p>
          {verifiedDate ? (
            <p className="text-sm text-foreground">
              Submitted to <span className="font-medium">{universityName}</span>{" "}
              on <span className="font-medium">{verifiedDate}</span>
              {verifiedTime && (
                <>
                  {" "}
                  at <span className="font-medium">{verifiedTime}</span>
                </>
              )}
              .
            </p>
          ) : (
            <p className="text-sm text-foreground">
              Submitted to <span className="font-medium">{universityName}</span>
              .
            </p>
          )}
        </div>

        {job.portal_reference && (
          <PortalReferenceRow reference={job.portal_reference} />
        )}

        {job.screenshot_url ? (
          <ScreenshotProof
            url={job.screenshot_url}
            universityName={universityName}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Confirmation screenshot will appear here within a few minutes.
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────────────

function PortalReferenceRow({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      // 2s feedback window — long enough to register, short enough not to
      // feel sticky if the student copies again.
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers, secure-context failures — silently no-op. The
      // reference itself is still visible and selectable.
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-soft/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Portal reference
        </p>
        <p className="break-all font-mono text-sm text-foreground">
          {reference}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Reference copied" : "Copy portal reference"}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:self-auto"
      >
        {copied ? (
          <>
            <Check size={12} aria-hidden /> Copied
          </>
        ) : (
          <>
            <Copy size={12} aria-hidden /> Copy
          </>
        )}
      </button>
    </div>
  );
}

function ScreenshotProof({
  url,
  universityName,
}: {
  url: string;
  universityName: string;
}) {
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`Confirmation page from the ${universityName} portal showing the application was submitted.`}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        View full-size
        <ExternalLink size={11} aria-hidden />
      </a>
    </div>
  );
}

// Stripped-down "HH:MM" formatter for the verified-at timestamp.
function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
