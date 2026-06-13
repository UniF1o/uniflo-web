"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useSelection } from "@/lib/state/selection";
import { Button } from "@/components/ui/button";
import {
  ApplicationFieldset,
  MAX_ADDITIONAL_PROGRAMMES,
} from "@/components/applications/application-fieldset";

type FieldValues = {
  programme: string;
  additionalProgrammes: string[];
  year: string;
};
type FieldErrors = {
  programme?: string;
  year?: string;
  additionalProgrammes?: (string | undefined)[];
};

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

// A single FieldValues passes when the primary programme + year are valid and
// every additional slot the student added is itself a valid programme.
function isEntryValid(f: FieldValues): boolean {
  if (validateProgramme(f.programme) !== null) return false;
  if (!f.year) return false;
  return f.additionalProgrammes.every((p) => validateProgramme(p) === null);
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
          additionalProgrammes: e.additionalProgrammes ?? [],
          year: e.applicationYear ? String(e.applicationYear) : "",
        },
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({});

  // Review button is enabled only when every visible fieldset passes validation.
  const isAllValid =
    entries.length > 0 &&
    entries.every((e) =>
      isEntryValid(
        fields[e.universityId] ?? {
          programme: "",
          additionalProgrammes: [],
          year: "",
        },
      ),
    );

  function getField(universityId: string): FieldValues {
    return (
      fields[universityId] ?? {
        programme: "",
        additionalProgrammes: [],
        year: "",
      }
    );
  }

  function patchField(universityId: string, patch: Partial<FieldValues>) {
    setFields((prev) => ({
      ...prev,
      [universityId]: { ...getField(universityId), ...patch },
    }));
  }

  function setPrimaryField(
    universityId: string,
    field: "programme" | "year",
    value: string,
  ) {
    patchField(universityId, { [field]: value });
    // Clear only the changed field's error, leaving other errors intact.
    setErrors((prev) => {
      const uErrors = prev[universityId];
      if (!uErrors?.[field]) return prev;
      const remaining = { ...uErrors };
      delete remaining[field];
      return { ...prev, [universityId]: remaining };
    });
  }

  function handleAdditionalChange(
    universityId: string,
    index: number,
    value: string,
  ) {
    const current = getField(universityId).additionalProgrammes;
    const next = current.map((p, i) => (i === index ? value : p));
    patchField(universityId, { additionalProgrammes: next });
    // Clear the inline error for just this slot.
    setErrors((prev) => {
      const slotErrors = prev[universityId]?.additionalProgrammes;
      if (!slotErrors?.[index]) return prev;
      const nextSlots = slotErrors.map((e, i) => (i === index ? undefined : e));
      return {
        ...prev,
        [universityId]: {
          ...prev[universityId],
          additionalProgrammes: nextSlots,
        },
      };
    });
  }

  function handleAddProgramme(universityId: string) {
    const current = getField(universityId).additionalProgrammes;
    if (current.length >= MAX_ADDITIONAL_PROGRAMMES) return;
    patchField(universityId, { additionalProgrammes: [...current, ""] });
  }

  function handleRemoveProgramme(universityId: string, index: number) {
    const current = getField(universityId).additionalProgrammes;
    patchField(universityId, {
      additionalProgrammes: current.filter((_, i) => i !== index),
    });
    // Drop the matching error slot so indices stay aligned.
    setErrors((prev) => {
      const slotErrors = prev[universityId]?.additionalProgrammes;
      if (!slotErrors) return prev;
      return {
        ...prev,
        [universityId]: {
          ...prev[universityId],
          additionalProgrammes: slotErrors.filter((_, i) => i !== index),
        },
      };
    });
  }

  function handleReview() {
    const nextErrors: Record<string, FieldErrors> = {};
    let hasErrors = false;

    for (const e of entries) {
      const f = getField(e.universityId);
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
      const additionalErrs = f.additionalProgrammes.map((p) =>
        validateProgramme(p),
      );
      if (additionalErrs.some((x) => x !== null)) {
        errs.additionalProgrammes = additionalErrs.map((x) => x ?? undefined);
        hasErrors = true;
      }
      if (Object.keys(errs).length > 0) nextErrors[e.universityId] = errs;
    }

    if (hasErrors) {
      setErrors(nextErrors);
      return;
    }

    for (const e of entries) {
      const f = getField(e.universityId);
      update(e.universityId, {
        programme: f.programme.trim(),
        // Trim each additional choice; drop empties defensively (validation
        // already guarantees non-empty, but this keeps the payload clean).
        additionalProgrammes: f.additionalProgrammes
          .map((p) => p.trim())
          .filter(Boolean),
        applicationYear: Number(f.year),
      });
    }

    router.push("/applications/review");
  }

  return (
    <div className="max-w-2xl space-y-8">
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
          Add programme details for each selected university. You can list up to
          three programme choices per university.
        </p>
      </div>

      <div className="space-y-6">
        {entries.map((entry) => {
          const f = getField(entry.universityId);
          const errs = errors[entry.universityId] ?? {};
          return (
            <ApplicationFieldset
              key={entry.universityId}
              entry={entry}
              programme={f.programme}
              additionalProgrammes={f.additionalProgrammes}
              year={f.year}
              errors={errs}
              onProgrammeChange={(v) =>
                setPrimaryField(entry.universityId, "programme", v)
              }
              onAdditionalChange={(i, v) =>
                handleAdditionalChange(entry.universityId, i, v)
              }
              onAddProgramme={() => handleAddProgramme(entry.universityId)}
              onRemoveProgramme={(i) =>
                handleRemoveProgramme(entry.universityId, i)
              }
              onYearChange={(v) =>
                setPrimaryField(entry.universityId, "year", v)
              }
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
