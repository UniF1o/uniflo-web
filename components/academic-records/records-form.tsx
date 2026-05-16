// AcademicRecordsForm — single-step form that collects a student's matric results.
//
// Fields:
//   - Institution  — the school where the results were obtained
//   - Year         — the academic year (e.g. 2024)
//   - Subjects     — dynamic list of subject rows, each with:
//                      name (from the canonical NSC list), mark (0–100),
//                      and an optional custom_name when "Other" is selected
//   - Aggregate    — auto-calculated from entered marks, displayed live
//
// Data contract:
//   On submit, a POST is made to /academic-records with the JWT in the
//   Authorization header. The subjects array must match the locked JSON
//   contract agreed with Partner B:
//     { name: "Mathematics", mark: 78 }
//     { name: "Other", custom_name: "Dramatic Arts", mark: 82 }
//   Do not change this structure without coordinating with Partner B — it is
//   consumed directly by the backend field-mapping service.
//
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NSC_SUBJECTS } from "@/lib/constants/nsc-subjects";
import { cn } from "@/lib/utils/cn";
import type { AcademicRecordPayload } from "@/lib/api/academic-records";
// ─── Types ────────────────────────────────────────────────────────────────────

// Represents one row in the subject list while the form is being filled in.
// `mark` is a string so we can represent an empty or partially-typed value
// without forcing "0" as a default. It is parsed to an integer on submit.
type SubjectRow = {
  id: string; // Stable React key — generated once, never changes.
  name: string; // Value from NSC_SUBJECTS, "Other", or "" (not yet set).
  customName: string; // Free-text name — only relevant when name === "Other".
  mark: string; // Raw input value, e.g. "78" or "". Parsed on submit.
};

// ─── Constants ───────────────────────────────────────────────────────────────

// Subject options for the <select>: full NSC list followed by "Other".
// "Other" must stay at the bottom so it doesn't get confused with a real NSC
// subject name when the backend maps it.
const SUBJECT_OPTIONS = [
  ...NSC_SUBJECTS.map((s) => ({ value: s, label: s })),
  { value: "Other", label: "Other (specify below)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Generates a unique ID for new subject rows. crypto.randomUUID() is available
// in all modern browsers. The fallback is good enough for a client-side list key.
function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

// Returns the simple average of all valid marks (0–100 integers), rounded to
// one decimal place. Rows with empty or out-of-range marks are skipped so the
// display stays correct while the form is partially filled.
// Returns null when no valid marks exist yet — used to hide the aggregate stat.
function calculateAggregate(subjects: SubjectRow[]): number | null {
  const valid = subjects
    .map((s) => parseInt(s.mark, 10))
    .filter((m) => !isNaN(m) && m >= 0 && m <= 100);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  // Round to one decimal place for display.
  return Math.round(avg * 10) / 10;
}

// ─── Validation ───────────────────────────────────────────────────────────────
//
// Each validator returns a Record<fieldKey, errorMessage>. An empty object
// means the inputs are valid. Errors are shown inline beneath each field.

// Validates the top-level fields: institution name, year range, and that at
// least one subject row exists.
function validate(
  institution: string,
  year: string,
  subjects: SubjectRow[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!institution.trim())
    errors.institution = "School or institution name is required.";
  if (!year) {
    errors.year = "Year is required.";
  } else {
    const y = parseInt(year, 10);
    const max = new Date().getFullYear() + 1;
    if (isNaN(y) || y < 2000 || y > max) {
      errors.year = `Enter a year between 2000 and ${max}.`;
    }
  }
  if (subjects.length === 0) errors.subjects = "Add at least one subject.";
  return errors;
}

// Validates one subject row. Errors are keyed by field name:
// "name", "customName" (only required when name === "Other"), "mark".
function validateSubject(row: SubjectRow): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!row.name) {
    errors.name = "Select a subject.";
  }
  // custom_name is only required when the student picks "Other".
  if (row.name === "Other" && !row.customName.trim()) {
    errors.customName = "Enter the subject name.";
  }
  if (!row.mark) {
    errors.mark = "Mark is required.";
  } else {
    const m = parseInt(row.mark, 10);
    if (isNaN(m) || m < 0 || m > 100) {
      errors.mark = "Must be 0–100.";
    }
  }
  return errors;
}

// ─── SubjectRowEditor ────────────────────────────────────────────────────────
//
// Renders one subject row as a bordered card. Contains:
//   - Subject name <Select> (from NSC list + "Other")
//   - Mark <Input> (compact, 0–100 integer)
//   - Optional custom name <Input> (visible only when "Other" is selected)
//   - Trash button at the top-right (hidden when the row is the only one left)

interface SubjectRowEditorProps {
  row: SubjectRow;
  // Validation errors for this row's fields.
  errors: { name?: string; customName?: string; mark?: string };
  // Called whenever the user edits any field in this row.
  onChange: (patch: Partial<SubjectRow>) => void;
  onRemove: () => void;
  // When false, the trash button is hidden (prevents removing the last row).
  removable: boolean;
}

function SubjectRowEditor({
  row,
  errors,
  onChange,
  onRemove,
  removable,
}: SubjectRowEditorProps) {
  return (
    // `relative` allows the trash button to be absolutely positioned at
    // the top-right corner without affecting the flow of the form fields.
    <div className="relative rounded-lg border border-border p-4 space-y-3">
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove this subject"
          className={cn(
            "absolute right-3 top-3 rounded p-1",
            "text-muted-foreground transition-colors hover:text-destructive",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      )}

      {/* pr-7 on the wrapper shifts the Select's right edge away from the
       * card's right edge, giving the absolutely-positioned trash button room
       * so it doesn't sit on top of Select's ChevronDown icon. Only applied
       * when the trash button is visible (removable). */}
      <div className={cn(removable && "pr-7")}>
        <Select
          id={`subject-name-${row.id}`}
          label="Subject"
          placeholder="Select subject"
          options={SUBJECT_OPTIONS}
          value={row.name}
          onChange={(e) => {
            // Reset customName when switching away from "Other" so stale
            // free-text doesn't end up in the payload.
            onChange({ name: e.target.value, customName: "" });
          }}
          error={errors.name}
        />
      </div>

      {/* Mark input — constrained to a narrow width since it only holds 0–3 digits.
       * step={1} restricts the browser's number spinner and native validation
       * to integers only, preventing decimal entries like "78.5". */}
      <div className="w-32">
        <Input
          id={`subject-mark-${row.id}`}
          label="Mark (%)"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          placeholder="0–100"
          value={row.mark}
          onChange={(e) => onChange({ mark: e.target.value })}
          error={errors.mark}
        />
      </div>

      {/* Custom name — conditionally rendered when "Other" is selected.
       * Mounts/unmounts with the subject name change via the controlled select. */}
      {row.name === "Other" && (
        <Input
          id={`subject-custom-${row.id}`}
          label="Subject name"
          type="text"
          placeholder="e.g. Dramatic Arts"
          value={row.customName}
          onChange={(e) => onChange({ customName: e.target.value })}
          error={errors.customName}
        />
      )}
    </div>
  );
}

// ─── AcademicRecordsForm ──────────────────────────────────────────────────────

export function AcademicRecordsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // apiError holds network or server error messages shown above the submit button.
  const [apiError, setApiError] = useState<string | null>(null);
  // fieldErrors covers institution, year, and the subjects-list-level error.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // rowErrors keys are "${rowId}.${field}" — e.g. "abc123.mark".
  // This flat structure avoids nested objects while still scoping errors to rows.
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const [institution, setInstitution] = useState("");
  const [year, setYear] = useState("");
  // Start with one blank row so the form doesn't look empty on first load.
  const [subjects, setSubjects] = useState<SubjectRow[]>([
    { id: newId(), name: "", customName: "", mark: "" },
  ]);

  // Removes one top-level field error (institution, year, subjects) the moment
  // the user starts correcting it. Early-return skips a re-render when there
  // is no error to clear for that key.
  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Removes one error entry from rowErrors. Keys follow the pattern
  // "${rowId}.${field}" (e.g. "abc123.mark") to scope errors to their row.
  function clearRowError(rowId: string, field: string) {
    const key = `${rowId}.${field}`;
    setRowErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Merges a partial update into a single subject row by its id.
  function updateRow(id: string, patch: Partial<SubjectRow>) {
    setSubjects((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setSubjects((prev) => [
      ...prev,
      { id: newId(), name: "", customName: "", mark: "" },
    ]);
    // Clear the subjects-level error since there's now at least one row.
    clearError("subjects");
  }

  function removeRow(id: string) {
    setSubjects((prev) => prev.filter((row) => row.id !== id));
    // Remove all rowErrors entries for the deleted row. Keys are prefixed with
    // the row's id (e.g. "abc123.mark"), so a startsWith check clears them all.
    setRowErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${id}.`)) delete next[key];
      }
      return next;
    });
  }

  // Validates all fields, builds the payload, and POSTs to the backend.
  // Top-level fields (institution, year) and every subject row are validated
  // together before any network request is made.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    // Run top-level validation first.
    const topErrors = validate(institution, year, subjects);

    // Validate each subject row and build the flat rowErrors map.
    const newRowErrors: Record<string, string> = {};
    for (const row of subjects) {
      const rowErrs = validateSubject(row);
      for (const [field, msg] of Object.entries(rowErrs)) {
        newRowErrors[`${row.id}.${field}`] = msg;
      }
    }

    if (
      Object.keys(topErrors).length > 0 ||
      Object.keys(newRowErrors).length > 0
    ) {
      setFieldErrors(topErrors);
      setRowErrors(newRowErrors);
      return;
    }
    setFieldErrors({});
    setRowErrors({});
    setLoading(true);

    // Build the payload. calculateAggregate() can't return null here because
    // validateSubject() has already confirmed all marks are valid 0–100 ints.
    const aggregate = calculateAggregate(subjects) ?? 0;

    const payload: AcademicRecordPayload = {
      institution,
      year: parseInt(year, 10),
      aggregate,
      subjects: subjects.map((row) => {
        const mark = parseInt(row.mark, 10);
        // "Other" entries carry custom_name per the locked JSON contract.
        if (row.name === "Other") {
          return { name: "Other" as const, custom_name: row.customName, mark };
        }
        return { name: row.name, mark };
      }),
    };

    // Attach the Supabase JWT so the backend can identify the student.
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setApiError("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setApiError("API URL is not configured. Contact support.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/academic-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // FastAPI validation errors (422) surface under a `detail` string key.
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body.detail === "string"
            ? body.detail
            : "Failed to save. Please try again.";
        setApiError(message);
        setLoading(false);
        return;
      }

      // Academic records saved — move on to document upload (Task 6).
      router.push("/documents");
    } catch {
      // Network-level failure (offline, DNS, timeout, etc.).
      setApiError(
        "Unable to connect. Check your internet connection and try again.",
      );
      setLoading(false);
    }
  }

  // Derived from subjects state — recalculates on every render so the header
  // aggregate stat stays in sync as the user types or removes marks.
  const aggregate = calculateAggregate(subjects);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* ── Institution and year ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="institution"
          label="School / institution"
          type="text"
          autoComplete="organization"
          placeholder="Northview High School"
          value={institution}
          onChange={(e) => {
            setInstitution(e.target.value);
            clearError("institution");
          }}
          error={fieldErrors.institution}
        />
        <Input
          id="year"
          label="Year"
          type="number"
          inputMode="numeric"
          placeholder="2024"
          min={2000}
          max={new Date().getFullYear() + 1}
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            clearError("year");
          }}
          error={fieldErrors.year}
        />
      </div>

      {/* ── Subject list ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Section header — shows the aggregate once at least one valid mark exists. */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Subjects</h2>
          {aggregate !== null && (
            <span className="text-sm text-muted-foreground">
              Aggregate:{" "}
              <span className="font-medium text-foreground">{aggregate}%</span>
            </span>
          )}
        </div>

        {/* subjects-level error — shown when the list is empty on submit. */}
        {fieldErrors.subjects && (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.subjects}
          </p>
        )}

        {/* One SubjectRowEditor card per subject. */}
        <div className="space-y-3">
          {subjects.map((row) => (
            <SubjectRowEditor
              key={row.id}
              row={row}
              errors={{
                name: rowErrors[`${row.id}.name`],
                customName: rowErrors[`${row.id}.customName`],
                mark: rowErrors[`${row.id}.mark`],
              }}
              onChange={(patch) => {
                updateRow(row.id, patch);
                // Clear errors for every field that changed so they disappear
                // as soon as the user starts correcting them.
                for (const field of Object.keys(patch)) {
                  clearRowError(row.id, field);
                }
              }}
              onRemove={() => removeRow(row.id)}
              // Hide the trash button when there's only one row — the form
              // must always have at least one subject.
              removable={subjects.length > 1}
            />
          ))}
        </div>

        {/* "Add subject" button — ghost variant so it doesn't compete with the
         * primary submit button below. */}
        <Button type="button" variant="ghost" onClick={addRow}>
          <Plus size={16} aria-hidden />
          Add subject
        </Button>
      </div>

      {/* API-level error — session expired, network failure, server 4xx/5xx.
       * Alert handles the role="alert" announcement and tonal styling. */}
      {apiError && <Alert tone="destructive">{apiError}</Alert>}

      <Button type="submit" fullWidth loading={loading}>
        Save records
      </Button>
    </form>
  );
}
