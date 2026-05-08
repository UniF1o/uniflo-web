"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";
import { useSelection } from "@/lib/state/selection";
import { apiClient, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  GENDER_LABELS,
  HOME_LANGUAGE_LABELS,
} from "@/lib/constants/profile-enums";
import { formatDate } from "@/lib/utils/format";
import { REQUIRED_DOC_TYPES, DOC_LABELS } from "@/lib/constants/documents";
import type { components } from "@/lib/api/schema";

type ProfileResponse = components["schemas"]["ProfileResponse"];
type AcademicRecord = components["schemas"]["AcademicRecord"];
type Document = components["schemas"]["Document"];

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

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export interface ReviewScreenProps {
  profile: ProfileResponse | null;
  academicRecords: AcademicRecord[] | null;
  documents: Document[] | null;
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
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
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
    </div>
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

  const guardInvalid =
    entries.length === 0 ||
    entries.some((e) => !e.programme || !e.applicationYear);
  if (guardInvalid) return null;

  // ── Completeness checks ──────────────────────────────────────────────────────

  const profileComplete =
    !!profile &&
    REQUIRED_PROFILE_FIELDS.every((f) => !!profile[f as keyof ProfileResponse]);

  const recordsOk = academicRecords !== null && academicRecords.length > 0;

  const uploadedTypes = new Set(documents?.map((d) => d.type) ?? []);
  const docsOk =
    documents !== null && REQUIRED_DOC_TYPES.every((t) => uploadedTypes.has(t));

  // ── Submit state ─────────────────────────────────────────────────────────────

  const hasAttempted = Object.keys(statuses).length > 0;
  const hasPartialFailure = entries.some(
    (e) => statuses[e.universityId] === "error",
  );
  const canSubmit =
    profileComplete && recordsOk && docsOk && consent && !isSubmitting;

  async function handleSubmit() {
    setIsSubmitting(true);

    for (const entry of entries) {
      if (statuses[entry.universityId] === "success") continue;

      setStatuses((prev) => ({
        ...prev,
        [entry.universityId]: "submitting",
      }));

      try {
        await apiClient.post("/applications", {
          university_id: entry.universityId,
          programme: entry.programme!,
          application_year: entry.applicationYear!,
        });
        setStatuses((prev) => ({
          ...prev,
          [entry.universityId]: "success",
        }));
      } catch (err) {
        const body = err instanceof ApiError ? err.body : null;
        const message =
          body && typeof body === "object" && "detail" in body
            ? String((body as { detail: string }).detail)
            : "Submission failed. Please try again.";
        setStatuses((prev) => ({ ...prev, [entry.universityId]: "error" }));
        setSubmitErrors((prev) => ({
          ...prev,
          [entry.universityId]: message,
        }));
        setIsSubmitting(false);
        return;
      }
    }

    clear();
    router.push("/applications");
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
        { label: "Address", value: profile.address ?? null },
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
          Confirm your details before Uniflo submits on your behalf.
        </p>
      </div>

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
        {academicRecords === null ? (
          <InlineAlert>
            Couldn&apos;t load your academic records. Refresh the page and try
            again.
          </InlineAlert>
        ) : academicRecords.length === 0 ? (
          <InlineAlert href="/profile/setup" linkLabel="Add your results">
            No academic records found.
          </InlineAlert>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {academicRecords.map((record) => (
              <div key={record.id} className="space-y-3 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {record.institution}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {record.year} · Aggregate: {record.aggregate}%
                  </span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {record.subjects.map((subject, i) => {
                    const name =
                      "custom_name" in subject
                        ? subject.custom_name
                        : subject.name;
                    return (
                      <li
                        key={i}
                        className="rounded-md bg-muted px-2 py-1 text-xs text-foreground"
                      >
                        {name}: {subject.mark}%
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
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
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
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
                  {status === "error" && (
                    <p role="alert" className="text-xs text-destructive">
                      {submitErrors[entry.universityId]}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {status === "success" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={12} aria-hidden />
                      Submitted
                    </span>
                  )}
                  {status === "submitting" && (
                    <span className="text-xs text-muted-foreground">
                      Submitting…
                    </span>
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
          I confirm the details above are correct and authorise Uniflo to submit
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
          : hasAttempted && hasPartialFailure
            ? "Retry"
            : "Submit applications"}
      </Button>
    </div>
  );
}
