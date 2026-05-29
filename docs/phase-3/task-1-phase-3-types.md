# Task 1 — Phase 3 types and confidence constant

**Branch:** `feature/phase-3` (Phase 3 ships as a single PR — see the phase
review doc for the rationale)

## What shipped

- `lib/constants/confidence.ts` — `CONFIDENCE_THRESHOLD = 0.85` plus
  `isLowConfidence(score)` and `formatConfidencePercent(score)` helpers. The
  threshold is the single source of truth — components import from here, never
  literal-numbered.
- `lib/api/phase-3.ts` — type overlay + typed client helpers covering every
  contract the rest of Phase 3 renders:
  - `FieldMappingEntry`, `FieldMappingsResponse` — the per-field shape and
    envelope the review screen iterates over.
  - `JobErrorCode`, `JobError`, `parseJobError` — the structured failure
    taxonomy with a backwards-compatible parser that accepts both the new
    object shape and Partner B's legacy free-text strings.
  - `JobConfirmationFields`, `AugmentedApplicationJobRead` —
    `portal_reference` and `verified_at` are added as optional fields on top
    of the generated `ApplicationJobRead` so the detail page can read them
    without TypeScript fights.
  - `PortalUnavailableBody`, `isPortalUnavailable` — the 503 body shape and
    type guard the review screen branches on per row.
  - `getFieldMappings(applicationId)`, `previewFieldMappings(params)`,
    `retryApplication(applicationId)` — typed helpers wrapping `apiClient`.

## Design decisions

- **No `npm run types:api` run yet.** Partner B has not published the updated
  spec covering field mappings, the structured `last_error`, or the
  retry/portal-unavailable contracts. Regenerating from the current spec
  would only re-emit Phase 2 shapes and risk drifting the overlay. The
  overlay file is the only place these types live until the regen, at which
  point most of `phase-3.ts` becomes a single-line re-export.
- **Overlay file instead of editing `schema.d.ts`.** `schema.d.ts` carries a
  "do not edit" header and is overwritten on every regen. Keeping the new
  shapes in `phase-3.ts` makes the eventual regen a no-op merge.
- **`parseJobError` accepts strings.** During the rollout window Partner B's
  `application_jobs.last_error` may still arrive as free text. The parser
  normalises both forms into `JobError | null` so consumers only ever deal
  with one shape — the UI degrades to "Something went wrong" copy for
  unknown strings rather than blanking out.
- **`retryApplication` types the response as `ApplicationRead`.** Even though
  the existing schema types the endpoint's body as `unknown`, the helper
  asserts the documented contract (202 + refreshed row) so callers can
  read `.status` without manual casts.

## Testing

- `lib/constants/confidence.test.ts` — threshold edge cases, percent
  rounding.
- `lib/api/phase-3.test.ts` — `parseJobError` for every input shape;
  `isPortalUnavailable` for valid and invalid bodies.
- `lib/applications/failure-copy.test.ts` — every `JobErrorCode` has copy
  and the validation/unavailable interpolation works.

## Next person should know

- When Partner B's spec lands, the regen replaces the relevant types. Delete
  the duplicated declarations from `phase-3.ts` and re-export from
  `components/schemas/...` so the helpers carry the real schema types.
- The mapping preview endpoint (`/applications/preview/field-mappings`) is a
  Partner-A-suggested URL. If Partner B picks a different one, the only
  change needed is the URL inside `previewFieldMappings`.
