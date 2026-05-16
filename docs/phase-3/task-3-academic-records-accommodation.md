# Task 3 — Academic-records endpoint accommodation

**Branch:** `feature/academic-records-endpoint`
**Status:** frontend ready; depends on the backend shipping `/academic-records`

## Why this exists

`/academic-records` is the only Phase 1/2 data flow that was never added to the
backend OpenAPI spec. Because the spec drives `lib/api/schema.d.ts`, the
endpoint's types could never be generated, so commit `d46d7d8`
("sync frontend ... to real backend spec") **removed** academic records from
the two places it had been wired into:

- the dashboard completeness checklist (it was the 3rd card), and
- the application review screen (it was a gated review section).

The Phase 2 plan (`docs/phase-2/partner-a-phase-2-plan.md`, lines 194–197,
265) still calls for academic records in both places. With the backend agent
now building the endpoint, this branch restores that integration and routes
the whole thing through a single interim type file so the eventual switch to
generated types is a one-file change.

## What was built

### `lib/api/academic-records.ts` (new) — the swap point

The single source of truth for the academic-records request/response shapes
while the endpoint is absent from the generated spec:

- `AcademicRecordSubject` — the locked subjects union (`"Other"` carries
  `custom_name`; everything else is a canonical NSC name).
- `AcademicRecordPayload` — `POST /academic-records` body.
- `AcademicRecordResponse` — `GET /academic-records` item; the endpoint
  returns a **bare array** (mirroring `GET /documents`).

When the backend ships the endpoint and `npm run types:api` regenerates
`schema.d.ts`, delete the hand-written interfaces and re-export the generated
ones from this file. Every consumer keeps compiling — only this file changes.
The header comment in the file spells out the exact swap.

### Consumers updated

| File | Change |
| --- | --- |
| `components/academic-records/records-form.tsx` | Dropped its private `AcademicRecordsPayload`; imports `AcademicRecordPayload` from the shared file. Fetch/UX logic unchanged. |
| `components/dashboard/completeness.tsx` | Restored the 3rd "Academic records" card (`GraduationCap`, links to `/academic-records`). Skeleton + section grids back to `md:grid-cols-3`. |
| `app/(app)/applications/review/page.tsx` | Re-added the server-side `serverApiGet<AcademicRecordResponse[]>("/academic-records")` fetch; passes `academicRecords` to `ReviewScreen`. |
| `components/applications/review-screen.tsx` | Restored the "Academic records" review section and the `recordsOk` submit gate (`canSubmit` now also requires a non-empty records list). |
| `app/(app)/loading.tsx` | Skeleton back to a 3-card grid to match the dashboard. |

## Design decisions / deviations

- **Empty array = incomplete, not "done".** The pre-removal dashboard code
  marked academic records complete on any `res.ok`, which would wrongly pass a
  `200 []`. The restore gates on a **non-empty array**, matching the review
  screen's `recordsOk` and the `[]`-not-404 contract requested of the backend.
  This is the one intentional behavioural improvement over the original.
- **"Add your results" link fixed.** The original review-screen empty state
  linked to `/profile/setup`; the records form lives at `/academic-records`.
  The restored section links there (consistent with the dashboard card).
- **No new fetch layer in the records form.** The form keeps its existing raw
  `fetch` + bespoke error messaging; only the payload type was unified. A full
  migration to `apiClient` was out of scope and would risk regressing a form
  that can't be exercised end to end until the endpoint exists.
- **`/profile` overview untouched.** The Phase 2 plan scopes that page to
  personal details only; academic records is its own page/section, so it was
  deliberately left out of the read-only profile overview.

## Behaviour until the endpoint lands

`GET /academic-records` will fail (no route), so:

- Dashboard: the academic-records card shows **incomplete** with a "Complete
  this section" link — correct, and no redirect (only a `/profile` 404
  redirects).
- Review screen: the section shows "Couldn't load…" and **Submit is blocked**
  until records exist. This matches the intended Phase 2 gate; it becomes
  functional the moment the backend endpoint + regenerated types land.

## When the backend endpoint is ready

1. Regenerate types: `npm run types:api` against the live OpenAPI doc.
2. In `lib/api/academic-records.ts`, replace the hand-written interfaces with
   re-exports of the generated `components["schemas"][...]` types.
3. If the backend returns a single object instead of a bare array, adjust this
   one file plus its two consumers (dashboard check, review screen) — both are
   flagged in the swap-point comment.
4. Re-run the CI suite and exercise the dashboard + review flow in a browser
   (desktop + mobile) with a real authenticated session.

## Verification

`prettier --check`, `tsc --noEmit`, `eslint .`, `vitest run` (4/4), and
`next build` (17 routes) all pass on this branch. Live browser verification of
the 3-card dashboard and the review section is deferred until the endpoint is
reachable, since both require an authenticated session against a backend that
serves `/academic-records`.
