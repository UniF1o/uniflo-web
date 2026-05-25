// DateInput — thin wrapper around <Input type="date"> that normalises
// the onChange signature to (value: string) → void.
//
// The native date picker (calendar on desktop/Android, wheel on iOS) is the
// right UX for each platform. Pass `min` and `max` as YYYY-MM-DD strings to
// constrain the picker to a valid range — the browser greys out dates outside
// it so users can't select an invalid value.
import { Input } from "@/components/ui/input";

interface DateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable date — YYYY-MM-DD. Defaults to 1930-01-01. */
  min?: string;
  /** Latest selectable date — YYYY-MM-DD. Defaults to today. */
  max?: string;
  error?: string;
}

export function DateInput({
  onChange,
  min = "1930-01-01",
  max = new Date().toISOString().split("T")[0],
  ...props
}: DateInputProps) {
  return (
    <Input
      type="date"
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}
