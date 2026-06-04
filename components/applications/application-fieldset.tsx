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

// Ordinal labels for each choice slot so students see "1st / 2nd / 3rd choice".
const CHOICE_LABELS = ["1st choice", "2nd choice", "3rd choice"];

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
    <div className="space-y-4 rounded-lg border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground">
        {entry.universityName}
      </h3>

      <Input
        id={`programme-${entry.universityId}`}
        label={`Programme (${CHOICE_LABELS[0]})`}
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
              label={`Programme (${CHOICE_LABELS[i + 1]})`}
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
            aria-label={`Remove ${CHOICE_LABELS[i + 1]} programme`}
            className="mb-2.5 rounded p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      ))}

      {canAddMore && (
        <Button type="button" variant="ghost" onClick={onAddProgramme}>
          <Plus size={16} aria-hidden />
          Add another programme choice
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
