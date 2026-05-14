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

// Gender options accepted by the backend GenderEnum.
export const GENDER_OPTIONS: EnumOption[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

// All 11 South African official languages. Values match the backend
// HomeLanguageEnum exactly. Ordering follows census-frequency ranking.
export const HOME_LANGUAGE_OPTIONS: EnumOption[] = [
  { value: "isiZulu", label: "isiZulu" },
  { value: "isiXhosa", label: "isiXhosa" },
  { value: "Afrikaans", label: "Afrikaans" },
  { value: "English", label: "English" },
  { value: "Sepedi", label: "Sepedi" },
  { value: "Setswana", label: "Setswana" },
  { value: "Sesotho", label: "Sesotho" },
  { value: "Xitsonga", label: "Xitsonga" },
  { value: "siSwati", label: "siSwati" },
  { value: "Tshivenda", label: "Tshivenda" },
  { value: "isiNdebele", label: "isiNdebele" },
];

// Convenience lookups so consumers can convert a stored enum value back
// into its display label without scanning the options array.
export const GENDER_LABELS: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label]),
);

export const HOME_LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  HOME_LANGUAGE_OPTIONS.map((o) => [o.value, o.label]),
);
