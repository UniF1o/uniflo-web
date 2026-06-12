import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SelectionEntry } from "@/lib/state/selection";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
  { value: String(CURRENT_YEAR + 1), label: String(CURRENT_YEAR + 1) },
];

// The backend caps total choices at 3 — one primary + at most two additional.
export const MAX_ADDITIONAL_PROGRAMMES = 2;

// Per-slot labels for the additional choices. Choices 2–3 genuinely reach the
// portals now: UP and UCT fill two, Wits up to three (UJ's second choice is
// still backend-pending), hence the per-portal hints in the copy.
const ADDITIONAL_LABELS = [
  "Second choice (recommended)",
  "Third choice (Wits only)",
];
const ADD_BUTTON_LABELS = [
  "Add a second choice (recommended)",
  "Add a third choice (Wits only)",
];

interface ApplicationFieldsetProps {
  entry: SelectionEntry;
  programme: string;
  additionalProgrammes: string[];
  year: string;
  errors: {
    programme?: string;
    year?: string;
    // Parallel to additionalProgrammes — errors[i] is the error for slot i.
    additionalProgrammes?: (string | undefined)[];
  };
  onProgrammeChange: (value: string) => void;
  onAdditionalChange: (index: number, value: string) => void;
  onAddProgramme: () => void;
  onRemoveProgramme: (index: number) => void;
  onYearChange: (value: string) => void;
}

export function ApplicationFieldset({
  entry,
  programme,
  additionalProgrammes,
  year,
  errors,
  onProgrammeChange,
  onAdditionalChange,
  onAddProgramme,
  onRemoveProgramme,
  onYearChange,
}: ApplicationFieldsetProps) {
  const canAddMore = additionalProgrammes.length < MAX_ADDITIONAL_PROGRAMMES;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)]">
      <h3 className="text-sm font-semibold text-foreground">
        {entry.universityName}
      </h3>

      <Input
        id={`programme-${entry.universityId}`}
        label="Programme (1st choice)"
        type="text"
        placeholder="e.g. BSc Computer Science"
        value={programme}
        onChange={(e) => onProgrammeChange(e.target.value)}
        error={errors.programme}
      />

      {/* Additional programme choices — each removable. The portal automation
       * applies for these in order if the primary choice isn't offered. */}
      {additionalProgrammes.map((value, i) => (
        <div
          key={i}
          className="flex items-end gap-2"
          // Align the trash button baseline with the input (label adds height).
        >
          <div className="flex-1">
            <Input
              id={`programme-${entry.universityId}-additional-${i}`}
              label={ADDITIONAL_LABELS[i]}
              type="text"
              placeholder="e.g. BCom Accounting"
              value={value}
              onChange={(e) => onAdditionalChange(i, e.target.value)}
              error={errors.additionalProgrammes?.[i]}
            />
          </div>
          <button
            type="button"
            onClick={() => onRemoveProgramme(i)}
            aria-label={`Remove ${i === 0 ? "second" : "third"} choice`}
            className="mb-2.5 rounded p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      ))}

      {canAddMore && (
        <Button type="button" variant="ghost" onClick={onAddProgramme}>
          <Plus size={16} aria-hidden />
          {ADD_BUTTON_LABELS[additionalProgrammes.length]}
        </Button>
      )}

      <Select
        id={`year-${entry.universityId}`}
        label="Application year"
        placeholder="Select year"
        options={YEAR_OPTIONS}
        value={year}
        onChange={(e) => onYearChange(e.target.value)}
        error={errors.year}
      />
    </div>
  );
}
