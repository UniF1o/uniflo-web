export const REQUIRED_DOC_TYPES = [
  "ID_COPY",
  "MATRIC_RESULTS",
  "TRANSCRIPT",
] as const;

export type RequiredDocType = (typeof REQUIRED_DOC_TYPES)[number];

export const DOC_LABELS: Record<RequiredDocType, string> = {
  ID_COPY: "ID Document",
  MATRIC_RESULTS: "Matric Results",
  TRANSCRIPT: "Transcripts",
};
