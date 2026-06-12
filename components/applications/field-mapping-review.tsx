"use client";

// Phase 3 — confidence-flagging UI for one application's field mappings.
//
// Renders an expandable section showing the fields the AI was unsure about
// and summarises the high-confidence ones. Lives on the application detail
// page (the backend computes mappings per application — there is no
// pre-submit preview endpoint). `readOnly` hides the "I've reviewed flagged
// fields" checkbox; without it the checkbox gates a parent action. Two
// non-happy states render here too: "mapping in progress" (the AI hasn't
// run yet) and "mapping failed to load" (transient error).
//
// Edit-pivot: rows link to wherever the source profile field lives so the
// student can fix the data and come back. No edit-in-place — consistent
// with the Phase 2 policy of keeping the review screen read-only.

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  CONFIDENCE_THRESHOLD,
  formatConfidencePercent,
  isLowConfidence,
} from "@/lib/constants/confidence";
import type { FieldMappingEntry } from "@/lib/api/phase-3";

// One of three states per university — the parent fetches mappings client-side
// after hydration; we render the appropriate UI for each.
export type MappingState =
  | { kind: "loading" }
  | { kind: "ready"; entries: FieldMappingEntry[] }
  | { kind: "unavailable" }
  | { kind: "error" };

interface FieldMappingReviewProps {
  universityId: string;
  universityName: string;
  state: MappingState;
  // Hides the confirm checkbox — used on the detail page where the mappings
  // are informational rather than a submit gate.
  readOnly?: boolean;
  confirmed?: boolean;
  onConfirmToggle?: (next: boolean) => void;
  onRefresh?: () => void;
}

// Map a profile-field path back to the page the student edits it on. Keys
// match the prefixes Partner B uses on `source_profile_field`. Unknown
// prefixes return null — the row still renders, just without a deep link.
function editHrefFor(sourceField: string | null): string | null {
  if (!sourceField) return null;
  if (
    sourceField.startsWith("student_profiles.") ||
    sourceField.startsWith("profile.")
  )
    return "/profile";
  if (sourceField.startsWith("academic_records.")) return "/academic-records";
  if (sourceField.startsWith("documents.")) return "/documents";
  return null;
}

export function FieldMappingReview({
  universityId,
  universityName,
  state,
  readOnly = false,
  confirmed = false,
  onConfirmToggle,
  onRefresh,
}: FieldMappingReviewProps) {
  // Default-collapsed on mobile to keep the review screen scannable.
  // Sections with flagged fields are arguably the most important thing on
  // the screen so we render expanded on desktop (`md:` default), letting
  // mobile users opt-in by tapping.
  const [open, setOpen] = useState(true);

  const sectionId = `field-mapping-${universityId}`;

  if (state.kind === "loading") {
    return (
      <SectionShell title={universityName}>
        <p className="text-sm text-muted-foreground">
          Checking field mappings…
        </p>
      </SectionShell>
    );
  }

  if (state.kind === "unavailable") {
    return (
      <SectionShell title={universityName}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mapping in progress — refresh shortly.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            aria-label={`Refresh field mappings for ${universityName}`}
          >
            <RefreshCw size={12} aria-hidden />
            Refresh
          </button>
        </div>
      </SectionShell>
    );
  }

  if (state.kind === "error") {
    return (
      <SectionShell title={universityName}>
        <Alert tone="destructive">
          Couldn&apos;t load field mappings for {universityName}.{" "}
          <button
            type="button"
            onClick={onRefresh}
            className="font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </Alert>
      </SectionShell>
    );
  }

  // ready
  const total = state.entries.length;
  const flagged = state.entries.filter((e) => isLowConfidence(e.confidence));
  const flaggedCount = flagged.length;
  const autoFilledCount = total - flaggedCount;

  // No flagged fields — render the positive-reinforcement state. No checkbox
  // because there's nothing to confirm.
  if (flaggedCount === 0) {
    return (
      <SectionShell title={universityName}>
        <div className="flex items-start gap-2 text-sm text-success">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>All fields auto-filled with high confidence.</span>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      title={universityName}
      trailing={
        <Badge tone="warning" dot>
          {flaggedCount} {flaggedCount === 1 ? "flag" : "flags"}
        </Badge>
      }
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={sectionId}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          <ChevronDown
            size={14}
            className={cn(
              "shrink-0 transition-transform duration-200",
              !open && "-rotate-90",
            )}
            aria-hidden
          />
          {open ? "Hide flagged fields" : "Show flagged fields"}
        </button>

        {open && (
          <ul
            id={sectionId}
            className="divide-y divide-border rounded-lg border border-border"
          >
            {flagged.map((entry) => (
              <FlaggedRow key={entry.field_id} entry={entry} />
            ))}
          </ul>
        )}

        {autoFilledCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {autoFilledCount} other{" "}
            {autoFilledCount === 1 ? "field was" : "fields were"} auto-filled
            with high confidence.
          </p>
        )}

        {!readOnly && (
          <label className="flex cursor-pointer items-start gap-3 pt-1">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => onConfirmToggle?.(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              aria-label={`I've reviewed the flagged fields for ${universityName}`}
            />
            <span className="text-sm text-foreground">
              I&apos;ve reviewed the flagged fields for{" "}
              <span className="font-medium">{universityName}</span>.
            </span>
          </label>
        )}
      </div>
    </SectionShell>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────────────

// Wrapper that gives each university card a consistent header + frame.
function SectionShell({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-[var(--shadow-paper)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function FlaggedRow({ entry }: { entry: FieldMappingEntry }) {
  const editHref = editHrefFor(entry.source_profile_field);
  const percent = formatConfidencePercent(entry.confidence);
  return (
    <li className="space-y-2 px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">{entry.label}</p>
          <p className="break-words text-xs text-muted-foreground">
            {entry.value === null || entry.value === "" ? (
              <span className="italic text-destructive">
                Not filled — please review.
              </span>
            ) : (
              entry.value
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ConfidenceTag percent={percent} />
          {editHref && (
            <Link
              href={editHref}
              className="text-xs font-medium text-primary hover:underline"
            >
              Edit
            </Link>
          )}
        </div>
      </div>
      {entry.reasoning && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer underline-offset-2 hover:underline">
            Why this was flagged
          </summary>
          <p className="mt-1 pl-3">{entry.reasoning}</p>
        </details>
      )}
    </li>
  );
}

// Pill that exposes the confidence both as colour and as text — accessibility
// rule from Task 5 ("expose the score as text not just colour").
function ConfidenceTag({ percent }: { percent: string }) {
  return (
    <span
      aria-label={`Confidence ${percent}`}
      className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
    >
      <AlertCircle size={11} aria-hidden />
      {percent}
    </span>
  );
}

// ─── Pure helpers (exported for unit tests) ───────────────────────────────────

// Counts of high vs low confidence rows. Pure function so it's easy to unit-test
// the threshold edge case without spinning up the component.
export function summariseConfidence(entries: FieldMappingEntry[]): {
  total: number;
  flagged: number;
  autoFilled: number;
} {
  let flagged = 0;
  for (const e of entries) {
    if (isLowConfidence(e.confidence)) flagged += 1;
  }
  return {
    total: entries.length,
    flagged,
    autoFilled: entries.length - flagged,
  };
}

// The threshold export exists so the test file can reference the constant
// without a second import path.
export { CONFIDENCE_THRESHOLD };
