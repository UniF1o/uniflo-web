# Task 3 — Academic-records endpoint integration

**Branch:** `feature/academic-records-endpoint`
**Status:** complete — endpoint shipped, types generated, consumers wired

## Why this exists

`/academic-records` was the only Phase 1/2 data flow never added to the
backend OpenAPI spec. Because the spec drives `lib/api/schema.d.ts`, the
endpoint's types could never be generated, so commit `d46d7d8`
("sync frontend ... to real backend spec") **removed** academic records from
the dashboard completeness checklist (it was the 3rd card) and the
application review screen (a gated section), even though the Phase 2 plan
still required both.

This branch landed in two stages:

1. **Accommodation (commit `1101eac`).** Restored both integration points
   behind a single interim type file (`lib/api/academic-records.ts`) so the
   eventual switch to generated types would be a one-file change. At that
   point the endpoint didn't exist yet, so the interim contract assumed a
   bare array (mirroring `GET /documents`) as the safe placeholder.
2. **Integration (this commit).** The backend shipped the endpoint. Ran
   `npm run types:api`; `schema.d.ts` now carries the real contract. Swapped
   the interim file to re-export the generated types and adapted the two
   consumers to the actual shape.

## The contract the backend chose

One matric record per student, mirroring `/profile` (not the array the
interim placeholder assumed):

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/academic-records` | — | `AcademicRecordResponse \| null` (200; `null` when none — not a 404) |
| `POST` | `/academic-records` | `AcademicRecordCreate` | `AcademicRecordResponse` (201) |
| `PATCH` | `/academic-records` | `AcademicRecordPatch` | `AcademicRecordResponse` |

- `AcademicRecordCreate` has **no `aggregate`** — the backend computes it
  server-side from the marks. The form still shows a live aggregate for the
  student's own reference; it is no longer sent.
- Subjects are flat: `{ name, mark, custom_name?: string | null }`
  (`SubjectIn`/`SubjectOut`), not a discriminated union. `custom_name` is
  populated only for `"Other"` subjects.

This single-record model is what the backend brief recommended; see
"Effect on the workflow" below for why it's the right call.

## Files

| File | Final state |
| --- | --- |
| `lib/api/academic-records.ts` | Re-exports `AcademicRecordPayload = AcademicRecordCreate` and `AcademicRecordResponse` from the generated schema. The single swap point. |
| `lib/api/schema.d.ts` | Regenerated from the live spec, then `prettier --write` (matches the established post-generation step; it is not prettier-ignored). |
| `components/academic-records/records-form.tsx` | Imports the shared payload type; **no longer sends `aggregate`**. |
| `components/dashboard/completeness.tsx` | 3rd "Academic records" card; gated on a record object being present (not array length). |
| `app/(app)/applications/review/page.tsx` | `serverApiGet<AcademicRecordResponse \| null>`; passes `undefined` on fetch failure vs `null` for "no record" so the screen can message them differently. |
| `components/applications/review-screen.tsx` | Single-record section + `recordsOk` submit gate; `undefined`/`null`/object three-state render; subject label via `custom_name ?? name`; aggregate display null-guarded. |
| `app/(app)/loading.tsx` | 3-card skeleton grid. |

## Effect on the workflow

The backend's single-record choice **improves** the flow over the interim
array and matches the backend brief's recommendation:

- A student has exactly one matric result set. An array implied "many
  records" — which the records form never supported (it posts one and routes
  to `/documents`) and which would force "which record / add another?" UI.
- `GET`-one / `POST`-create / `PATCH`-update mirrors `/profile`, an
  already-built and reviewed pattern.
- `POST` appending into an array would duplicate on resubmit; single-record
  + `PATCH` avoids that.

The only thing the array gave us was distinguishing "load failed" from
"none yet" via `null` vs `[]`. That's preserved: the review page passes
`undefined` for a failed fetch and `null` for a loaded-but-empty record.

**Resolved — POST is an idempotent upsert.** The backend confirmed
`POST /academic-records` is create-or-replace keyed on the student (DB
`UNIQUE(student_id)`), always `201`, for both first submit and edit. So the
form's "always POST" is correct; no GET-then-PATCH dance is needed. `PATCH`
exists but the frontend doesn't use it. (`POST`/`PATCH` `403` with
`profile_not_found` if no profile exists yet — not normally reachable since
the flow routes through profile setup first.)

## Backend contract confirmations

- **GET no record →** `200` with literal JSON `null` (not `404`/`{}`). Code
  branches on `=== null` / presence — correct.
- **`aggregate` →** server-authoritative; client value silently dropped. It's
  a **float** (e.g. `81.7`); `number` typing already covers this. Effectively
  never `null` for an existing record (typed `Optional` only because the
  column is nullable) — the review screen's null-guard is harmless and stays.
- **`422` errors →** domain-rule violations return `detail` as a plain
  string (surfaced directly); malformed-payload errors use FastAPI's default
  array form (generic fallback). The form's existing
  `typeof detail === "string"` branch handles both correctly.
- **Server-enforced subject rules →** `custom_name` required iff
  `name === "Other"` (and forbidden otherwise); duplicate non-`"Other"`
  names rejected; `name` non-empty; `mark` int 0–100; `year`
  2000..now+1; ≥1 subject. The form already met all but the duplicate rule,
  which is now mirrored client-side so the student gets an inline error
  instead of a round-trip 422.

## Decided — NSC subject-name authority: frontend-only for MVP

The backend flagged a deliberate mismatch: **the server does *not* validate
that a subject `name` is a canonical NSC subject.** The frozen list lives
only in the frontend (`lib/constants/nsc-subjects.ts`); there is no backend
mirror, and off-list names are accepted and stored.

**Decision (Partner A, MVP): accept frontend-as-sole-authority.** The form
constrains `name` to a `<select>` of the canonical list + `"Other"`, so a
normal user cannot submit an off-list name — the realistic exposure is closed
for the MVP user flow. No code change; backend stays as-is.

**Accepted risk:** a non-FE caller, a future client, or an FE bug could
persist an off-list name, which would silently break Partner B's Playwright
field-mapping (no validation error — it just fails to map). Mitigation is
deferred.

**Post-MVP follow-up:** revisit by extracting the NSC list into a single
shared source both repos consume (the drift-free option), or a backend
mirror. Tracked here; not scheduled.

## Verification

`prettier --check` (incl. regenerated `schema.d.ts`), `tsc --noEmit`,
`eslint .`, `vitest run` (4/4), and `next build` (17 routes) all pass. Live
browser verification of the 3-card dashboard and the review section against a
real authenticated session is the remaining manual step before merge.
