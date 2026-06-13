# Grade 12 June — record-type sync

**Branch:** `feature/grade12-june-sync`
**Status:** complete — types regenerated, record type wired, browser-verified

## Why this exists

The backend added a third academic record type, `grade_12_june`, in
`uniflo-api` #49 (cross-portal review). It is UCT's optional mid-year mark,
captured alongside the required April mark. The change was live in the
deployed OpenAPI spec, but `lib/api/schema.d.ts` was last regenerated after
the UP work (`nsc_level`) deployed and **before** #49 deployed, so the
frontend's `RecordType` was stale at `"grade_11_final" | "grade_12_april"`.

The drift was flagged in the code itself: `RECORD_TYPE_LABELS` is a
`Record<RecordType, string>` specifically so `tsc` forces a new entry when the
enum grows, and both it and the academic-records page carried explicit
"regenerate once #49 deploys" notes. This branch closes that out.

## What changed

| File | Change |
| --- | --- |
| `lib/api/schema.d.ts` | Regenerated from the live spec. Only real delta: `RecordType` gains `"grade_12_june"` (plus a doc-comment #49 added to the `ContactCreate` schema). |
| `lib/api/academic-records.ts` | `RECORD_TYPE_LABELS` gains `grade_12_june: "Grade 12 June"`; stale "coming in #49" comment removed. |
| `app/(app)/academic-records/page.tsx` | New `grade_12_june` section ("Grade 12 June results", UCT mid-year copy); resolved the `TODO`. |
| `scripts/generate-types.mjs` | Now runs `prettier --write` on the output. See below. |

## Generate script now formats its own output

`schema.d.ts` is not prettier-ignored, so an unformatted regen fails CI's
`format:check`. The fix was always a manual `prettier --write` after
`npm run types:api` (documented in `task-3-academic-records-accommodation.md`),
but the script never enforced it, so a raw regen looked like a ~3,800-line
diff (single-line unions + indentation) hiding the one real line. The script
now runs the format step itself, so `npm run types:api` always leaves the tree
CI-clean and any future regen diff is purely semantic.

## Contacts schema description (no action)

The regen also pulled in a description #49 added to the contacts schema:
collect one parent/guardian, offer a fee payer as an opt-in, never ask for an
emergency contact (the automation resolves every portal role from the
guardian). The frontend's `contacts-manager.tsx` already implements exactly
this (`MANAGED_TYPES = ["guardian", "fee_payer"]`). Already aligned; noted so
the next person knows it was checked.

## Not needed this cycle: "completed matric"

A "completed matric" / final Grade 12 record type was raised as a possible
fourth type. Matric only completes in Nov/Dec, so it is irrelevant to the 2026
application cycle and was not added. `grade_11_final`, `grade_12_april`, and
`grade_12_june` cover every portal in scope.

## Verification

`tsc --noEmit`, `eslint .` (0 errors; 2 pre-existing warnings in untouched
files), `prettier --check`, `vitest run` (34/34), and `next build` all pass.
Browser pass against a real authenticated session (production build) at
desktop (1280), tablet (768), and mobile (375): all three record sections
render and stay responsive, the new June section matching the April section.
