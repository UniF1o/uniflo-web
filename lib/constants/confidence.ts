// Confidence threshold for the review screen's field-mapping warnings.
//
// Single source of truth. Components and the filter helper import from here
// — never literal-numbered in JSX or elsewhere. Confirmed with Partner B in
// `docs/phase-3/partner-b-phase-3-plan.md` (Task 3, Confidence threshold).
//
// Anything strictly below this score is flagged as "low confidence" and:
//   - Renders as its own row on the review screen
//   - Counts toward the per-university "I've reviewed flagged fields" gate
//
// Tune in a single PR if the AI layer settles on a different operating range.
export const CONFIDENCE_THRESHOLD = 0.85;

export function isLowConfidence(score: number): boolean {
  return score < CONFIDENCE_THRESHOLD;
}

// Render percentage for display. Always rounded to a whole number — the
// student doesn't need decimal precision, and 87% reads cleaner than 86.7%.
export function formatConfidencePercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}
