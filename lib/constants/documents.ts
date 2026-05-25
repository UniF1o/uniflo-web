export const REQUIRED_DOC_TYPES = ["ID_COPY", "MATRIC_RESULTS"] as const;

export type RequiredDocType = (typeof REQUIRED_DOC_TYPES)[number];

export const DOC_LABELS: Record<RequiredDocType, string> = {
  ID_COPY: "Certified SA ID document",
  MATRIC_RESULTS: "Grade 11 final results",
};
