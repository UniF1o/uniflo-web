import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SelectionEntry } from "@/lib/state/selection";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
  { value: String(CURRENT_YEAR + 1), label: String(CURRENT_YEAR + 1) },
];

interface ApplicationFieldsetProps {
  entry: SelectionEntry;
  programme: string;
  year: string;
  errors: { programme?: string; year?: string };
  onProgrammeChange: (value: string) => void;
  onYearChange: (value: string) => void;
}

export function ApplicationFieldset({
  entry,
  programme,
  year,
  errors,
  onProgrammeChange,
  onYearChange,
}: ApplicationFieldsetProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground">
        {entry.universityName}
      </h3>

      <Input
        id={`programme-${entry.universityId}`}
        label="Programme"
        type="text"
        placeholder="e.g. BSc Computer Science"
        value={programme}
        onChange={(e) => onProgrammeChange(e.target.value)}
        error={errors.programme}
      />

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
