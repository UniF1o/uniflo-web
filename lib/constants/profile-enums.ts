// Profile enum values shared between the setup form and the read-only
// overview. Values are the strings the backend stores in student_profiles;
// labels are the human-readable copy shown in the UI.
//
// Confirm any change here against the backend enum with Partner B — these
// strings are written straight into Postgres and also drive the Playwright
// automation that fills out university portal forms in Phase 2.

export interface EnumOption {
  value: string;
  label: string;
}

// Four gender options the backend accepts on student_profiles.
export const GENDER_OPTIONS: EnumOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

// All 11 South African official languages. Ordering is deliberately the same
// as the census-frequency ranking so the most-spoken languages appear first.
export const HOME_LANGUAGE_OPTIONS: EnumOption[] = [
  { value: "zulu", label: "isiZulu" },
  { value: "xhosa", label: "isiXhosa" },
  { value: "afrikaans", label: "Afrikaans" },
  { value: "english", label: "English" },
  { value: "sepedi", label: "Sepedi" },
  { value: "tswana", label: "Setswana" },
  { value: "sesotho", label: "Sesotho" },
  { value: "tsonga", label: "Xitsonga" },
  { value: "swati", label: "siSwati" },
  { value: "venda", label: "Tshivenda" },
  { value: "ndebele", label: "isiNdebele" },
];

// Convenience lookups so consumers can convert a stored enum value back
// into its display label without scanning the options array.
export const GENDER_LABELS: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label]),
);

export const HOME_LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  HOME_LANGUAGE_OPTIONS.map((o) => [o.value, o.label]),
);
