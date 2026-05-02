"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useSelection } from "@/lib/state/selection";
import { Button } from "@/components/ui/button";
import { ApplicationFieldset } from "@/components/applications/application-fieldset";

type FieldValues = { programme: string; year: string };
type FieldErrors = { programme?: string; year?: string };

function validateProgramme(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Programme is required.";
  if (trimmed.length < 3) return "Programme must be at least 3 characters.";
  if (trimmed.length > 120) return "Programme must be at most 120 characters.";
  return null;
}

function validateYear(value: string): string | null {
  if (!value) return "Application year is required.";
  return null;
}

export function NewApplicationsForm() {
  const router = useRouter();
  const { entries, update } = useSelection();

  // Pre-fill from context in case the student navigated back from the review page.
  const [fields, setFields] = useState<Record<string, FieldValues>>(() =>
    Object.fromEntries(
      entries.map((e) => [
        e.universityId,
        {
          programme: e.programme ?? "",
          year: e.applicationYear ? String(e.applicationYear) : "",
        },
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({});

  // Review button is enabled only when every visible fieldset passes validation.
  const isAllValid =
    entries.length > 0 &&
    entries.every((e) => {
      const f = fields[e.universityId] ?? { programme: "", year: "" };
      const prog = f.programme.trim();
      return prog.length >= 3 && prog.length <= 120 && !!f.year;
    });

  function setFieldValue(
    universityId: string,
    field: keyof FieldValues,
    value: string,
  ) {
    setFields((prev) => ({
      ...prev,
      [universityId]: {
        ...(prev[universityId] ?? { programme: "", year: "" }),
        [field]: value,
      },
    }));
    // Clear only the changed field's error, leaving other errors intact.
    setErrors((prev) => {
      const uErrors = prev[universityId];
      if (!uErrors?.[field]) return prev;
      const remaining = { ...uErrors };
      delete remaining[field];
      const next = { ...prev };
      if (Object.keys(remaining).length === 0) {
        delete next[universityId];
      } else {
        next[universityId] = remaining;
      }
      return next;
    });
  }

  function handleReview() {
    const nextErrors: Record<string, FieldErrors> = {};
    let hasErrors = false;

    for (const e of entries) {
      const f = fields[e.universityId] ?? { programme: "", year: "" };
      const errs: FieldErrors = {};
      const progErr = validateProgramme(f.programme);
      const yearErr = validateYear(f.year);
      if (progErr) {
        errs.programme = progErr;
        hasErrors = true;
      }
      if (yearErr) {
        errs.year = yearErr;
        hasErrors = true;
      }
      if (Object.keys(errs).length > 0) nextErrors[e.universityId] = errs;
    }

    if (hasErrors) {
      setErrors(nextErrors);
      return;
    }

    for (const e of entries) {
      const f = fields[e.universityId]!;
      update(e.universityId, {
        programme: f.programme.trim(),
        applicationYear: Number(f.year),
      });
    }

    router.push("/applications/review");
  }

  return (
    <div className="max-w-2xl space-y-8 pb-24">
      <Link
        href="/universities"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={14} />
        Back to universities
      </Link>

      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Apply
        </h1>
        <p className="text-sm text-muted-foreground">
          Add programme details for each selected university.
        </p>
      </div>

      <div className="space-y-6">
        {entries.map((entry) => {
          const f = fields[entry.universityId] ?? { programme: "", year: "" };
          const errs = errors[entry.universityId] ?? {};
          return (
            <ApplicationFieldset
              key={entry.universityId}
              entry={entry}
              programme={f.programme}
              year={f.year}
              errors={errs}
              onProgrammeChange={(v) =>
                setFieldValue(entry.universityId, "programme", v)
              }
              onYearChange={(v) => setFieldValue(entry.universityId, "year", v)}
            />
          );
        })}
      </div>

      <Button
        variant="primary"
        fullWidth
        disabled={!isAllValid}
        onClick={handleReview}
      >
        Review
      </Button>
    </div>
  );
}
