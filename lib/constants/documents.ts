// Documents the application flow gates on. The student must upload all three
// before they can submit — the completeness check and review screen key off
// REQUIRED_DOC_TYPES.
export const REQUIRED_DOC_TYPES = [
  "ID_COPY",
  "MATRIC_RESULTS",
  "GRADE12_APRIL",
] as const;

export type RequiredDocType = (typeof REQUIRED_DOC_TYPES)[number];

// Documents accepted by some portals but not required to submit. UP accepts
// Grade 11 results in lieu of a Grade 12 certificate, so we let students upload
// them without making it part of the completeness gate.
export const OPTIONAL_DOC_TYPES = ["GRADE11_RESULTS"] as const;

export type OptionalDocType = (typeof OPTIONAL_DOC_TYPES)[number];

export const DOC_LABELS: Record<RequiredDocType | OptionalDocType, string> = {
  ID_COPY: "Certified SA ID document",
  MATRIC_RESULTS: "Grade 11 final results",
  GRADE12_APRIL: "Grade 12 April results",
  GRADE11_RESULTS: "Grade 11 results",
};
