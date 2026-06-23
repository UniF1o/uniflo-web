"use client";

// ProgrammePicker — cascading faculty → course selects driven by the public
// catalogue endpoint (GET /universities/{id}/programmes). Falls back to a
// free-text Input when the catalogue is empty or the fetch fails so the apply
// path stays functional regardless of seeding state.

import { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgrammeCatalogue } from "@/lib/api/recommendations";
import type {
  FacultyGroup,
  ProgrammeCatalogueItem,
} from "@/lib/api/recommendations";

const QUALIFICATION_LABELS: Record<string, string> = {
  degree: "Degree",
  diploma: "Diploma",
  higher_certificate: "Higher Certificate",
};

function formatDeadline(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "short",
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}

export interface PickerValue {
  name: string;
  id: string | null;
}

interface ProgrammePickerProps {
  universityId: string;
  label: string;
  id: string;
  value: PickerValue;
  onChange: (value: PickerValue) => void;
  error?: string;
}

export function ProgrammePicker({
  universityId,
  label,
  id,
  value,
  onChange,
  error,
}: ProgrammePickerProps) {
  // Start loading immediately — no synchronous setState needed in the effect.
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [faculties, setFaculties] = useState<FacultyGroup[]>([]);
  // Tracks an explicit user faculty selection; empty string means "use derived".
  const [userSelectedFaculty, setUserSelectedFaculty] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    getProgrammeCatalogue(universityId)
      .then((res) => {
        if (!cancelled) {
          setFaculties(res.faculties ?? []);
          setFetchError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [universityId]);

  // Derive the active faculty: honour the user's explicit pick first; fall back
  // to the faculty that contains value.id (pre-selection from the Courses page).
  const selectedFaculty = useMemo(() => {
    if (userSelectedFaculty) return userSelectedFaculty;
    if (!value.id || faculties.length === 0) return "";
    for (const fac of faculties) {
      if (fac.programmes.some((p) => p.id === value.id)) {
        return fac.faculty_name;
      }
    }
    return "";
  }, [userSelectedFaculty, value.id, faculties]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[62px] w-full" />
        <Skeleton className="h-[62px] w-full" />
      </div>
    );
  }

  // Fallback: empty catalogue or persistent fetch error → free-text input.
  if (fetchError || faculties.length === 0) {
    return (
      <Input
        id={id}
        label={label}
        type="text"
        placeholder="e.g. BSc Computer Science"
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value, id: null })}
        error={error}
      />
    );
  }

  const facultyOptions = faculties.map((f) => ({
    value: f.faculty_name,
    label: f.faculty_name,
  }));

  const activeFaculty = faculties.find(
    (f) => f.faculty_name === selectedFaculty,
  );
  const programmes: ProgrammeCatalogueItem[] = activeFaculty?.programmes ?? [];
  const courseOptions = programmes.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const deadline = activeFaculty
    ? formatDeadline(activeFaculty.close_date)
    : null;
  const selectedProgramme = programmes.find((p) => p.id === value.id);
  const qualLabel = selectedProgramme?.qualification_type
    ? (QUALIFICATION_LABELS[selectedProgramme.qualification_type] ??
      selectedProgramme.qualification_type)
    : null;
  const durationLabel = selectedProgramme?.duration_years
    ? `${selectedProgramme.duration_years} ${selectedProgramme.duration_years === 1 ? "year" : "years"}`
    : null;

  function handleFacultyChange(facultyName: string) {
    setUserSelectedFaculty(facultyName);
    // Clear course selection when faculty changes.
    onChange({ name: "", id: null });
  }

  function handleCourseChange(programmeId: string) {
    const prog = programmes.find((p) => p.id === programmeId);
    if (prog) onChange({ name: prog.name, id: prog.id });
  }

  return (
    <div className="space-y-3">
      <Select
        id={`${id}-faculty`}
        label={label}
        placeholder="Select faculty"
        options={facultyOptions}
        value={selectedFaculty}
        onChange={(e) => handleFacultyChange(e.target.value)}
        error={!selectedFaculty ? error : undefined}
      />

      {selectedFaculty && (
        <div className="space-y-1">
          <Select
            id={`${id}-course`}
            label="Course"
            placeholder="Select course"
            options={courseOptions}
            value={value.id ?? ""}
            onChange={(e) => handleCourseChange(e.target.value)}
            error={selectedFaculty && !value.id ? error : undefined}
          />
          {/* Per-faculty deadline and course metadata */}
          {(deadline || qualLabel || durationLabel) && (
            <p className="text-xs text-muted-foreground">
              {[
                qualLabel,
                durationLabel,
                deadline ? `Closes ${deadline}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
