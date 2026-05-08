export const REQUIRED_DOC_TYPES = [
  "id_document",
  "matric_results",
  "transcripts",
] as const;

export type RequiredDocType = (typeof REQUIRED_DOC_TYPES)[number];

export const DOC_LABELS: Record<RequiredDocType, string> = {
  id_document: "ID Document",
  matric_results: "Matric Results",
  transcripts: "Transcripts",
};
