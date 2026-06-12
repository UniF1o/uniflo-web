"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useSelection, type SelectionEntry } from "@/lib/state/selection";
import { apiClient, ApiError } from "@/lib/api/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  GENDER_LABELS,
  HOME_LANGUAGE_LABELS,
  isAutomationBlocked,
} from "@/lib/constants/profile-enums";
import { formatDate } from "@/lib/utils/format";
import { REQUIRED_DOC_TYPES, DOC_LABELS } from "@/lib/constants/documents";
import { previewFieldMappings, isPortalUnavailable } from "@/lib/api/phase-3";
import { isLowConfidence } from "@/lib/constants/confidence";
import { FieldMappingReview, type MappingState } from "./field-mapping-review";
import type { components } from "@/lib/api/schema";
import type { AcademicRecordResponse } from "@/lib/api/academic-records";

type StudentProfileResponse = components["schemas"]["StudentProfileResponse"];
type DocumentResponse = components["schemas"]["DocumentResponse"];

const REQUIRED_PROFILE_FIELDS = [
  "first_name",
  "last_name",
  "id_number",
  "date_of_birth",
  "phone",
  "address",
  "nationality",
  "gender",
  "home_language",
] as const;

// Per-row status during and after the submit loop.
//   submitting        — POST in flight
//   success           — application created
//   error             — backend rejected for an unrecognised reason
//   portal_unavailable — backend returned 503 + code:"portal_unavailable"
type SubmitStatus = "submitting" | "success" | "error" | "portal_unavailable";

export interface ReviewScreenProps {
  profile: StudentProfileResponse | null;
  // The student has at most one record. `undefined` = the fetch failed;
  // `null` = loaded but none entered yet; an object = the record.
  academicRecords: AcademicRecordResponse | null | undefined;
  documents: DocumentResponse[] | null;
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

// Wrapper around the shared Alert that adds an optional inline action link.
// Used to point students at /profile/setup or /documents when their data is
// incomplete on the review screen.
function InlineAlert({
  href,
  linkLabel = "Fix now",
  children,
}: {
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Alert tone="destructive">
      {children}
      {href && (
        <>
          {" "}
          <Link
            href={href}
            className="font-medium underline underline-offset-2"
          >
            {linkLabel}
          </Link>
        </>
      )}
    </Alert>
  );
}

export function ReviewScreen({
  profile,
  academicRecords,
  documents,
}: ReviewScreenProps) {
  const router = useRouter();
  const { entries, clear } = useSelection();

  // Redirect back to the form if the student arrives with an incomplete selection.
  useEffect(() => {
    const invalid =
      entries.length === 0 ||
      entries.some((e) => !e.programme || !e.applicationYear);
    if (invalid) router.replace("/applications/new");
  }, [entries, router]);

  const [consent, setConsent] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, SubmitStatus>>({});
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-university field-mapping state. Fetched client-side after hydration
  // because the selection lives in client context (not URL params).
  const [mappings, setMappings] = useState<Record<string, MappingState>>({});
  // Per-university "I've reviewed flagged fields" gate.
  const [confirmedFlags, setConfirmedFlags] = useState<Record<string, boolean>>(
    {},
  );

  // De-dupe the kick-off effect so re-renders don't refetch every cycle.
  const fetchedRef = useRef<Set<string>>(new Set());

  const loadMapping = useCallback(async (entry: SelectionEntry) => {
    setMappings((prev) => ({
      ...prev,
      [entry.universityId]: { kind: "loading" },
    }));
    try {
      const data = await previewFieldMappings({
        university_id: entry.universityId,
        programme: entry.programme!,
        application_year: entry.applicationYear!,
      });
      setMappings((prev) => ({
        ...prev,
        [entry.universityId]: { kind: "ready", entries: data.entries },
      }));
    } catch (err) {
      // 404 or 202 = the mapping job hasn't produced output yet. Treat as
      // "mapping in progress" so the student gets the refresh affordance.
      if (
        err instanceof ApiError &&
        (err.status === 404 || err.status === 202)
      ) {
        setMappings((prev) => ({
          ...prev,
          [entry.universityId]: { kind: "unavailable" },
        }));
        return;
      }
      setMappings((prev) => ({
        ...prev,
        [entry.universityId]: { kind: "error" },
      }));
    }
  }, []);

  useEffect(() => {
    for (const entry of entries) {
      if (fetchedRef.current.has(entry.universityId)) continue;
      if (!entry.programme || !entry.applicationYear) continue;
      fetchedRef.current.add(entry.universityId);
      // queueMicrotask defers the first setState inside loadMapping out of
      // the effect body — keeps lint happy and avoids a cascading render.
      queueMicrotask(() => {
        void loadMapping(entry);
      });
    }
  }, [entries, loadMapping]);

  const refreshMapping = useCallback(
    (universityId: string) => {
      const entry = entries.find((e) => e.universityId === universityId);
      if (!entry) return;
      // Clear the de-dupe marker so a manual refresh always re-fires.
      fetchedRef.current.delete(universityId);
      fetchedRef.current.add(universityId);
      void loadMapping(entry);
    },
    [entries, loadMapping],
  );

  // Posts one entry and returns the status it landed on. Failures update
  // statuses + submitErrors in place; the caller threads the returned value
  // back into its local mirror so the "all done" check sees fresh values
  // (setState hasn't flushed yet inside an async loop).
  const postOne = useCallback(
    async (
      entry: SelectionEntry,
    ): Promise<"success" | "error" | "portal_unavailable"> => {
      setStatuses((prev) => ({
        ...prev,
        [entry.universityId]: "submitting",
      }));
      setSubmitErrors((prev) => {
        const next = { ...prev };
        delete next[entry.universityId];
        return next;
      });
      try {
        await apiClient.post("/applications", {
          university_id: entry.universityId,
          programme: entry.programme!,
          // Only send additional choices when the student added any.
          ...(entry.additionalProgrammes?.length
            ? { additional_programmes: entry.additionalProgrammes }
            : {}),
          application_year: entry.applicationYear!,
        });
        setStatuses((prev) => ({
          ...prev,
          [entry.universityId]: "success",
        }));
        return "success";
      } catch (err) {
        if (err instanceof ApiError) {
          // 503 + portal_unavailable — mark this row distinctly so the UI
          // can show "Retry just this one" and continue the loop.
          if (err.status === 503 && isPortalUnavailable(err.body)) {
            setStatuses((prev) => ({
              ...prev,
              [entry.universityId]: "portal_unavailable",
            }));
            return "portal_unavailable";
          }
          const body = err.body;
          const message =
            body && typeof body === "object" && "detail" in body
              ? String((body as { detail: string }).detail)
              : "Submission failed. Please try again.";
          setStatuses((prev) => ({
            ...prev,
            [entry.universityId]: "error",
          }));
          setSubmitErrors((prev) => ({
            ...prev,
            [entry.universityId]: message,
          }));
          return "error";
        }
        setStatuses((prev) => ({
          ...prev,
          [entry.universityId]: "error",
        }));
        setSubmitErrors((prev) => ({
          ...prev,
          [entry.universityId]: "Submission failed. Please try again.",
        }));
        return "error";
      }
    },
    [],
  );

  // After any submit attempt — full loop or single-row retry — check whether
  // every entry is now success and, if so, clear + redirect to the dashboard
  // with the celebration flag set.
  const finishIfAllDone = useCallback(
    (nextStatuses: Record<string, SubmitStatus>) => {
      const allDone = entries.every(
        (e) => nextStatuses[e.universityId] === "success",
      );
      if (!allDone) return;
      clear();
      router.push("/applications?just_submitted=true");
    },
    [entries, clear, router],
  );

  // Guard for direct deep-link to /applications/review with no selection or
  // an incomplete row. The redirect itself happens in the effect above; this
  // bails out of rendering anything until the navigation lands. All hooks
  // must run before this early return — keep new hooks above this line.
  const guardInvalid =
    entries.length === 0 ||
    entries.some((e) => !e.programme || !e.applicationYear);
  if (guardInvalid) return null;

  // ── Completeness checks ──────────────────────────────────────────────────────

  const profileComplete =
    !!profile &&
    REQUIRED_PROFILE_FIELDS.every(
      (f) => !!profile[f as keyof StudentProfileResponse],
    );

  const recordsOk = academicRecords != null;

  // Mirrors the gate on /applications/new — the automation refuses to run for
  // non-Grade-12 activities, so don't let the POST happen here either.
  const automationBlocked = isAutomationBlocked(profile?.current_activity);

  const uploadedTypes = new Set(documents?.map((d) => d.type) ?? []);
  const docsOk =
    documents !== null && REQUIRED_DOC_TYPES.every((t) => uploadedTypes.has(t));

  // ── Confidence gate ──────────────────────────────────────────────────────────

  // A university needs an "I've reviewed flagged fields" check only if its
  // mapping payload includes at least one low-confidence entry. Universities
  // whose mappings are loading / unavailable / errored don't block submit
  // (the student can still go — the worker will do the right thing at run
  // time and a failure surfaces on the detail page).
  function hasFlaggedFields(universityId: string): boolean {
    const m = mappings[universityId];
    if (!m || m.kind !== "ready") return false;
    return m.entries.some((e) => isLowConfidence(e.confidence));
  }

  const allFlagsConfirmed = entries.every((e) =>
    hasFlaggedFields(e.universityId) ? !!confirmedFlags[e.universityId] : true,
  );

  // ── Submit state ─────────────────────────────────────────────────────────────

  const hasAttempted = Object.keys(statuses).length > 0;
  const hasUnresolved = entries.some(
    (e) =>
      statuses[e.universityId] === "error" ||
      statuses[e.universityId] === "portal_unavailable",
  );
  const canSubmit =
    profileComplete &&
    recordsOk &&
    docsOk &&
    !automationBlocked &&
    consent &&
    allFlagsConfirmed &&
    !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    // postOne updates React state asynchronously; we also mirror the result
    // locally so finishIfAllDone sees the freshest values without waiting
    // for a render flush.
    const nextStatuses: Record<string, SubmitStatus> = { ...statuses };
    for (const entry of entries) {
      if (nextStatuses[entry.universityId] === "success") continue;
      nextStatuses[entry.universityId] = await postOne(entry);
    }
    setIsSubmitting(false);
    finishIfAllDone(nextStatuses);
  }

  // Single-row retry — used for both "error" and "portal_unavailable" rows.
  async function handleRetryOne(entry: SelectionEntry) {
    const result = await postOne(entry);
    if (result !== "success") return;
    const nextStatuses: Record<string, SubmitStatus> = {
      ...statuses,
      [entry.universityId]: "success",
    };
    finishIfAllDone(nextStatuses);
  }

  // ── Profile rows ─────────────────────────────────────────────────────────────

  const profileRows = profile
    ? [
        {
          label: "Full name",
          value:
            [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
            null,
        },
        {
          label: "Date of birth",
          value: formatDate(profile.date_of_birth),
        },
        { label: "ID number", value: profile.id_number ?? null },
        { label: "Phone", value: profile.phone ?? null },
        { label: "Street address", value: profile.street_address ?? null },
        { label: "Suburb", value: profile.suburb ?? null },
        { label: "City", value: profile.city ?? null },
        { label: "Province", value: profile.province ?? null },
        { label: "Postal code", value: profile.postal_code ?? null },
        { label: "Nationality", value: profile.nationality ?? null },
        {
          label: "Gender",
          value: profile.gender
            ? (GENDER_LABELS[profile.gender] ?? profile.gender)
            : null,
        },
        {
          label: "Home language",
          value: profile.home_language
            ? (HOME_LANGUAGE_LABELS[profile.home_language] ??
              profile.home_language)
            : null,
        },
      ]
    : [];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-10">
      <Link
        href="/applications/new"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={14} />
        Back to form
      </Link>

      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Review your application
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm your details before UniFlo submits on your behalf.
        </p>
      </div>

      {automationBlocked && (
        <Alert
          tone="warning"
          title="Automated applications aren't available for your situation yet"
        >
          UniFlo currently only submits on behalf of students in Grade 12, and
          your profile says you&apos;re &ldquo;{profile?.current_activity}
          &rdquo;. Please apply directly on each university&apos;s portal, or{" "}
          <Link
            href="/profile/edit"
            className="font-medium underline underline-offset-2"
          >
            update your profile
          </Link>{" "}
          if this has changed.
        </Alert>
      )}

      {/* Personal details */}
      <ReviewSection title="Personal details">
        {!profile ? (
          <InlineAlert>
            Couldn&apos;t load your profile. Refresh the page and try again.
          </InlineAlert>
        ) : (
          <>
            <dl className="divide-y divide-border rounded-lg border border-border">
              {profileRows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-6"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-40">
                    {row.label}
                  </dt>
                  <dd className="text-sm text-foreground sm:flex-1">
                    {row.value ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {!profileComplete && (
              <InlineAlert
                href="/profile/setup"
                linkLabel="Complete your profile"
              >
                Some required details are missing.
              </InlineAlert>
            )}
          </>
        )}
      </ReviewSection>

      {/* Academic records */}
      <ReviewSection title="Academic records">
        {academicRecords === undefined ? (
          <InlineAlert>
            Couldn&apos;t load your academic records. Refresh the page and try
            again.
          </InlineAlert>
        ) : academicRecords === null ? (
          <InlineAlert href="/academic-records" linkLabel="Add your results">
            No academic records found.
          </InlineAlert>
        ) : (
          <div className="rounded-lg border border-border">
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {academicRecords.institution}
                </p>
                <span className="text-xs text-muted-foreground">
                  {academicRecords.year}
                  {academicRecords.aggregate != null &&
                    ` · Aggregate: ${academicRecords.aggregate}%`}
                </span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {academicRecords.subjects.map((subject, i) => {
                  // `custom_name` is set only for "Other" subjects; fall back
                  // to the canonical name for everything else.
                  const name = subject.custom_name ?? subject.name;
                  return (
                    <li
                      key={i}
                      className="rounded-md bg-muted px-2 py-1 text-xs text-foreground"
                    >
                      {name}: {subject.mark}%
                      {subject.nsc_level != null && ` · L${subject.nsc_level}`}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </ReviewSection>

      {/* Documents */}
      <ReviewSection title="Documents">
        {documents === null ? (
          <InlineAlert>
            Couldn&apos;t load your documents. Refresh the page and try again.
          </InlineAlert>
        ) : (
          <div className="space-y-3">
            <ul className="divide-y divide-border rounded-lg border border-border">
              {REQUIRED_DOC_TYPES.map((type) => {
                const uploaded = uploadedTypes.has(type);
                return (
                  <li
                    key={type}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="text-sm text-foreground">
                      {DOC_LABELS[type]}
                    </span>
                    {uploaded ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                        <CheckCircle2 size={14} aria-hidden />
                        Uploaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                        <XCircle size={14} aria-hidden />
                        Not uploaded
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {!docsOk && (
              <InlineAlert href="/documents" linkLabel="Upload now">
                Some required documents are missing.
              </InlineAlert>
            )}
          </div>
        )}
      </ReviewSection>

      {/* Field-mapping confidence — Phase 3 */}
      <ReviewSection title="Field mappings">
        <p className="-mt-1 text-xs text-muted-foreground">
          We&apos;ll flag anything Claude was unsure about. Review each flagged
          field before submitting.
        </p>
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <FieldMappingReview
              key={entry.universityId}
              universityId={entry.universityId}
              universityName={entry.universityName}
              state={mappings[entry.universityId] ?? { kind: "loading" }}
              confirmed={!!confirmedFlags[entry.universityId]}
              onConfirmToggle={(next) =>
                setConfirmedFlags((prev) => ({
                  ...prev,
                  [entry.universityId]: next,
                }))
              }
              onRefresh={() => refreshMapping(entry.universityId)}
            />
          ))}
        </div>
      </ReviewSection>

      {/* Applications list */}
      <ReviewSection title="Your applications">
        <div className="divide-y divide-border rounded-lg border border-border">
          {entries.map((entry) => {
            const status = statuses[entry.universityId];
            return (
              <div
                key={entry.universityId}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {entry.universityName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.programme} · {entry.applicationYear}
                  </p>
                  {entry.additionalProgrammes &&
                    entry.additionalProgrammes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Also:{" "}
                        {entry.additionalProgrammes.map((p, i) => (
                          <span key={i}>
                            {i > 0 && ", "}
                            {p}
                          </span>
                        ))}
                      </p>
                    )}
                  {status === "error" && (
                    <p role="alert" className="text-xs text-destructive">
                      {submitErrors[entry.universityId]}
                    </p>
                  )}
                  {status === "portal_unavailable" && (
                    <p role="alert" className="text-xs text-warning">
                      Applications to {entry.universityName} are temporarily
                      unavailable — please try again later.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {status === "success" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <CheckCircle2 size={12} aria-hidden />
                      Submitted
                    </span>
                  )}
                  {status === "submitting" && (
                    <span className="text-xs text-muted-foreground">
                      Submitting…
                    </span>
                  )}
                  {(status === "error" || status === "portal_unavailable") &&
                    !isSubmitting && (
                      <button
                        type="button"
                        onClick={() => void handleRetryOne(entry)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        aria-label={`Retry submitting to ${entry.universityName}`}
                      >
                        <RefreshCw size={12} aria-hidden />
                        Retry just this one
                      </button>
                    )}
                  {status !== "success" && !isSubmitting && (
                    <Link
                      href="/applications/new"
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ReviewSection>

      {/* Consent */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
          disabled={isSubmitting}
        />
        <span className="text-sm text-foreground">
          I confirm the details above are correct and authorise UniFlo to submit
          applications on my behalf.
        </span>
      </label>

      {/* Submit */}
      <Button
        variant="primary"
        fullWidth
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {isSubmitting
          ? "Submitting…"
          : hasAttempted && hasUnresolved
            ? "Retry remaining"
            : "Submit applications"}
      </Button>
    </div>
  );
}
