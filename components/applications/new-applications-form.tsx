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
import type { PickerValue } from "@/components/applications/programme-picker";

type FieldValues = {
  programme: PickerValue;
  additionalProgrammes: PickerValue[];
  year: string;
};
type FieldErrors = {
  programme?: string;
  year?: string;
  additionalProgrammes?: (string | undefined)[];
};

function validateProgramme(value: PickerValue): string | null {
  const name = value.name.trim();
  if (!name) return "Programme is required.";
  if (name.length < 3) return "Programme must be at least 3 characters.";
  if (name.length > 120) return "Programme must be at most 120 characters.";
  return null;
}

function validateYear(value: string): string | null {
  if (!value) return "Application year is required.";
  return null;
}

function isEntryValid(f: FieldValues): boolean {
  if (validateProgramme(f.programme) !== null) return false;
  if (!f.year) return false;
  return f.additionalProgrammes.every((p) => validateProgramme(p) === null);
}

export function NewApplicationsForm() {
  const router = useRouter();
  const { entries, update } = useSelection();

  const [fields, setFields] = useState<Record<string, FieldValues>>(() =>
    Object.fromEntries(
      entries.map((e) => [
        e.universityId,
        {
          programme: { name: e.programme ?? "", id: e.programmeId ?? null },
          additionalProgrammes: (e.additionalProgrammes ?? []).map(
            (name, i) => ({
              name,
              id: e.additionalProgrammeIds?.[i] ?? null,
            }),
          ),
          year: e.applicationYear ? String(e.applicationYear) : "",
        },
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({});

  const isAllValid =
    entries.length > 0 &&
    entries.every((e) =>
      isEntryValid(
        fields[e.universityId] ?? {
          programme: { name: "", id: null },
          additionalProgrammes: [],
          year: "",
        },
      ),
    );

  function getField(universityId: string): FieldValues {
    return (
      fields[universityId] ?? {
        programme: { name: "", id: null },
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

  function handleProgrammeChange(universityId: string, value: PickerValue) {
    patchField(universityId, { programme: value });
    setErrors((prev) => {
      const uErrors = prev[universityId];
      if (!uErrors?.programme) return prev;
      const remaining = { ...uErrors };
      delete remaining.programme;
      return { ...prev, [universityId]: remaining };
    });
  }

  function handleYearChange(universityId: string, value: string) {
    patchField(universityId, { year: value });
    setErrors((prev) => {
      const uErrors = prev[universityId];
      if (!uErrors?.year) return prev;
      const remaining = { ...uErrors };
      delete remaining.year;
      return { ...prev, [universityId]: remaining };
    });
  }

  function handleAdditionalChange(
    universityId: string,
    index: number,
    value: PickerValue,
  ) {
    const current = getField(universityId).additionalProgrammes;
    const next = current.map((p, i) => (i === index ? value : p));
    patchField(universityId, { additionalProgrammes: next });
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
    patchField(universityId, {
      additionalProgrammes: [...current, { name: "", id: null }],
    });
  }

  function handleRemoveProgramme(universityId: string, index: number) {
    const current = getField(universityId).additionalProgrammes;
    patchField(universityId, {
      additionalProgrammes: current.filter((_, i) => i !== index),
    });
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
        programme: f.programme.name.trim(),
        programmeId: f.programme.id ?? null,
        additionalProgrammes: f.additionalProgrammes
          .map((p) => p.name.trim())
          .filter(Boolean),
        additionalProgrammeIds: f.additionalProgrammes.map((p) => p.id ?? null),
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

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
          Applying
        </p>
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Programme choices
        </h1>
        <p className="text-sm text-muted-foreground">
          Select programmes for each university. You can choose up to three per
          university.
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
                handleProgrammeChange(entry.universityId, v)
              }
              onAdditionalChange={(i, v) =>
                handleAdditionalChange(entry.universityId, i, v)
              }
              onAddProgramme={() => handleAddProgramme(entry.universityId)}
              onRemoveProgramme={(i) =>
                handleRemoveProgramme(entry.universityId, i)
              }
              onYearChange={(v) => handleYearChange(entry.universityId, v)}
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
