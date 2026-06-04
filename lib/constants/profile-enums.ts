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

// Title / salutation accepted by the backend TitleEnum.
export const TITLE_OPTIONS: EnumOption[] = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Miss", label: "Miss" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
  { value: "Mx", label: "Mx" },
  { value: "Other", label: "Other" },
];

// What the student is currently doing — backend CurrentActivityEnum.
export const CURRENT_ACTIVITY_OPTIONS: EnumOption[] = [
  { value: "Currently in Grade 12", label: "Currently in Grade 12" },
  { value: "Upgrading matric", label: "Upgrading matric" },
  { value: "Gap year", label: "Gap year" },
  { value: "Employed", label: "Employed" },
  { value: "At university", label: "At university" },
  { value: "Other", label: "Other" },
];

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

export const RELIGION_OPTIONS: EnumOption[] = [
  { value: "None", label: "None / No religion" },
  { value: "Christianity", label: "Christianity" },
  { value: "Islam", label: "Islam" },
  { value: "Hinduism", label: "Hinduism" },
  { value: "Judaism", label: "Judaism" },
  {
    value: "African Traditional Religion",
    label: "African Traditional Religion",
  },
  { value: "Buddhism", label: "Buddhism" },
  { value: "Other", label: "Other" },
];

export const DISABILITY_OPTIONS: EnumOption[] = [
  { value: "None", label: "None" },
  { value: "Visual impairment", label: "Visual impairment" },
  { value: "Hearing impairment", label: "Hearing impairment" },
  {
    value: "Physical/mobility impairment",
    label: "Physical / mobility impairment",
  },
  { value: "Intellectual disability", label: "Intellectual disability" },
  {
    value: "Learning disability",
    label: "Learning disability (e.g. dyslexia)",
  },
  { value: "Mental health condition", label: "Mental health condition" },
  { value: "Other", label: "Other" },
];

export const MARITAL_STATUS_OPTIONS: EnumOption[] = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
  { value: "Other", label: "Other" },
];

export const ETHNICITY_OPTIONS: EnumOption[] = [
  { value: "African", label: "African" },
  { value: "Coloured", label: "Coloured" },
  { value: "Indian", label: "Indian" },
  { value: "Asian", label: "Asian" },
  { value: "White", label: "White" },
  { value: "Other", label: "Other" },
];

// South African provinces used in the address form.
export const SA_PROVINCE_OPTIONS: EnumOption[] = [
  { value: "Eastern Cape", label: "Eastern Cape" },
  { value: "Free State", label: "Free State" },
  { value: "Gauteng", label: "Gauteng" },
  { value: "KwaZulu-Natal", label: "KwaZulu-Natal" },
  { value: "Limpopo", label: "Limpopo" },
  { value: "Mpumalanga", label: "Mpumalanga" },
  { value: "North West", label: "North West" },
  { value: "Northern Cape", label: "Northern Cape" },
  { value: "Western Cape", label: "Western Cape" },
];

// Nationality options. South African is first; remainder alphabetical.
// Values are stored in student_profiles.nationality and used by Playwright
// to fill in nationality fields on university portals.
export const NATIONALITY_OPTIONS: EnumOption[] = [
  { value: "South African", label: "South African" },
  { value: "Angolan", label: "Angolan" },
  { value: "Batswana", label: "Batswana" },
  { value: "British", label: "British" },
  { value: "Cameroonian", label: "Cameroonian" },
  { value: "Chinese", label: "Chinese" },
  { value: "Congolese", label: "Congolese (DRC)" },
  { value: "Ethiopian", label: "Ethiopian" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Ghanaian", label: "Ghanaian" },
  { value: "Indian", label: "Indian" },
  { value: "Kenyan", label: "Kenyan" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Malawian", label: "Malawian" },
  { value: "Mozambican", label: "Mozambican" },
  { value: "Namibian", label: "Namibian" },
  { value: "Nigerian", label: "Nigerian" },
  { value: "Pakistani", label: "Pakistani" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Rwandan", label: "Rwandan" },
  { value: "Somali", label: "Somali" },
  { value: "Swazi", label: "Swazi" },
  { value: "Tanzanian", label: "Tanzanian" },
  { value: "Ugandan", label: "Ugandan" },
  { value: "Zambian", label: "Zambian" },
  { value: "Zimbabwean", label: "Zimbabwean" },
  { value: "Other", label: "Other" },
];

// Convenience lookups so consumers can convert a stored enum value back
// into its display label without scanning the options array.
export const GENDER_LABELS: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label]),
);

export const HOME_LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  HOME_LANGUAGE_OPTIONS.map((o) => [o.value, o.label]),
);
