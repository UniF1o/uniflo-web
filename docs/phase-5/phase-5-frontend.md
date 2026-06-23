# Phase 5 Frontend

Single PR covering both tracks from `partner-a-phase-5-plan.md`.

## What was built

### Track 1 — Structured programme selection

**`lib/api/schema.d.ts`** — regenerated from the deployed spec. Picks up:
- `programme_id` (nullable UUID) on `ApplicationCreate`, `ApplicationRead`, `ApplicationChoiceRead`
- `additional_programme_ids` on `ApplicationCreate`
- `grade_12_final` added to `RecordType`

**`lib/api/recommendations.ts`** — added `programmeCataloguePath()` and `getProgrammeCatalogue()` thin wrappers over the existing `apiClient`. The catalogue endpoint is public (no JWT).

**`lib/state/selection.tsx`** — `SelectionEntry` gains `programmeId?: string | null` and `additionalProgrammeIds?: (string | null)[]`, index-aligned with the existing name fields. `UPDATE` patch type and the context value's `update` signature updated accordingly.

**`components/applications/programme-picker.tsx`** (new) — client component. Fetches the selected university's catalogue once on mount, renders a faculty `Select` then a course `Select` scoped to that faculty. Surfaces `qualification_type`, `duration_years`, and the faculty `close_date`. Graceful fallback: empty catalogue or fetch error → free-text `Input`. Pre-selection: when `value.id` is already set (e.g. from the Courses page Apply CTA), the active faculty is derived via `useMemo` so the right faculty starts selected.

**`components/applications/application-fieldset.tsx`** — replaced the primary and additional `Input`s with `ProgrammePicker` instances. Props changed from `string` / `string[]` to `PickerValue` / `PickerValue[]`.

**`components/applications/new-applications-form.tsx`** — internal state now uses `PickerValue` (name + id pair). On Review, writes both `programme`/`programmeId` and `additionalProgrammes`/`additionalProgrammeIds` into the selection context, index-aligned.

**`components/applications/review-screen.tsx`** — `postOne` now includes `programme_id` and `additional_programme_ids` in the `ApplicationCreate` body when the student picked from the catalogue; omits them on the free-text path. Block copy updated.

**`components/courses/courses-view.tsx`** — `handleApply` now also writes `programmeId: programme.id` into the selection entry so a student arriving from `/courses` lands on the picker pre-selected to that course.

### Track 2 — Applicant-type inclusivity

**`lib/api/academic-records.ts`** — `RECORD_TYPE_LABELS` gains `grade_12_final: "Grade 12 final"`.

**`app/(app)/academic-records/page.tsx`** — added a fourth section for `grade_12_final` ("Grade 12 final results", for students who have already completed matric). First-time saves of `grade_12_final` advance to `/documents` (same onboarding path as `grade_11_final`).

**`lib/constants/profile-enums.ts`** — `AUTOMATION_BLOCKED_ACTIVITIES` narrowed to `["Upgrading matric", "At university"]`. Gap-year and employed applicants are now permitted (the backend automation supports them from Phase 5).

**`app/(app)/applications/new/page.tsx`** — blocked-state copy updated to reflect only at-university/transfer being unsupported.

## Decisions

- **Single PR** as requested by the user — all five plan tasks in one branch.
- **Free-text fallback** is real and tested: the picker renders a plain `Input` when `faculties.length === 0` or the fetch errors. All four universities are seeded so this path is inactive today, but it ensures new universities never dead-end.
- **Faculty derivation via `useMemo`** instead of a second `useEffect` — avoids the `react-hooks/set-state-in-effect` lint rule and is cheaper (no extra render cycle).
- **`loading` starts as `true`** — no synchronous `setState` in the effect body; state transitions only happen in `.then()`/`.catch()`/`.finally()` callbacks.
- **`grade_12_final` first-save → `/documents`** — mirrors the Grade 11 onboarding flow so completed-matric students get the same guided path.

## Verification checklist

- [ ] On `/applications/new`, each university shows a faculty → course picker; choosing a course sets the name and id; Review and POST carry `programme_id`.
- [ ] Applying from a `/courses` card lands on the picker pre-selected to that faculty and course.
- [ ] A university with no catalogue (or a fetch error) falls back to the free-text input.
- [ ] A gap-year or employed student is not blocked on `/applications/new` or the review screen.
- [ ] "At university" / "Upgrading matric" are still blocked with updated copy.
- [ ] `/academic-records` shows a Grade 12 final section; saving it works and advances to `/documents` on first save.
- [ ] CI: ESLint (0 errors), Prettier (clean), tsc (0 errors), Vitest (34/34), build (clean).
