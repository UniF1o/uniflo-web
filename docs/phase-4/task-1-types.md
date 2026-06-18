# Phase 4 — Task 1: Types + data wiring

Branch: `feature/phase-4-types` · Squash commit: `chore(api): regenerate types for recommendations endpoint`

The gating contract-only task: get the Phase 4 backend seam into the codebase
before any UI is built. No screens here.

## What was built

- **Regenerated `lib/api/schema.d.ts`** (`npm run types:api`) against the deployed
  spec. The backend has deployed Tasks 1–3, so the regen pulled in the new
  `/recommendations` and `/universities/{id}/programmes` paths and their schemas:
  `MatchStatus`, `ProgrammeMatch`, `UnmetRule`, `RecommendationsResponse`,
  `ProgrammeCatalogueItem`, `FacultyGroup`, `ProgrammesCatalogueResponse`.
- **`lib/api/recommendations.ts`** — the Phase 4 contract module, mirroring
  `lib/api/academic-records.ts`:
  - Type re-exports for the recommendation shapes (and the catalogue shapes, as
    the Phase 5 foundation — no fetch helper for the catalogue yet).
  - `MATCH_STATUS_BADGE: Record<MatchStatus, { tone, label }>` — the single
    status → `Badge` map (`qualifies` → success "Qualifies", `borderline` →
    warning "Borderline", `not_yet` → neutral "Not yet"). Keyed on the full enum
    so a backend enum change fails `tsc` after a regen.
  - `recommendationsPath()` + `getRecommendations()` — thin typed wrappers over
    the existing `apiClient`; no new fetch abstraction. `recommendationsPath()`
    is shared so the Task 2 server page can build the same query for
    `serverApiGet`.

## Decisions / notes

- **`BadgeTone` redeclared** in the module rather than imported — `badge.tsx`
  keeps the type local. This matches `components/applications/status-badge.tsx`.
- **`record_type` typed as `RecordType`** (the existing enum alias) even though
  the generated query types it as a free `string | null`, to give callers a
  constrained, autocompleted API. The backend defaults to best-available and
  echoes the choice back as `record_type_used`.
- **409 `no_academic_record`** handling is intentionally not here — it is an
  empty-state concern for where results render (Task 2).

## Verification

`npx tsc --noEmit`, `npm run lint` (0 errors; 2 pre-existing warnings in
untouched files), `npm run format:check`, `npm run test` (34 passing), and
`npm run build` all green. No UI change, so the real-browser pass does not apply
to this task.

## Next

Task 2 (`feature/courses-page`) consumes this: server-fetch via
`recommendationsPath()` for first paint, `getRecommendations()` for picker /
record-toggle re-fetches, and `MATCH_STATUS_BADGE` for the card badges.
