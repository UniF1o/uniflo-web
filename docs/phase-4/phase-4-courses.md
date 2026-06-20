# Phase 4 — Courses page

**Branch:** `feature/courses-page` — merged as PR #34 (squash).
**Backend sibling:** `uniflo-api` PR #61 (`feature/expose-scoring-method`).

---

## What was built

All four Phase 4 tasks delivered as a single PR:

### Types (Task 1 follow-up)
`lib/api/schema.d.ts` regenerated against the deployed spec. Picks up `qualification_type` and `duration_years` on `ProgrammeMatch` / `ProgrammeCatalogueItem`, and `scoring_method` on `UniversityRead` — none of which existed in the Task 1 regen (PR #33, 2026-06-18).

### Courses page (Task 2)
- `app/(app)/courses/page.tsx` — server component. Fetches the university list to drive the picker and server-fetches UP recommendations for the first paint (avoids a loading flash). UP is matched by name (`"university of pretoria"`) so no hardcoded IDs.
- `components/courses/courses-view.tsx` — client component. Owns the university `<select>` picker, re-fetches on change, and manages all result states: loading skeletons, error + retry, no-record (409), no-programmes-seeded, and the grouped results.
- `components/courses/course-card.tsx` — presentational. Shows programme name, faculty, qualification type + duration (`Higher Certificate · 1 year`), the gap list from `unmet_rules`, notes, and the Apply CTA for `qualifies`/`borderline` cards.

### Navigation + Apply handoff (Task 3)
- `components/layout/sidebar.tsx` — "Courses" added to the Applying group between Universities and Applications, with a `BookOpen` icon.
- `components/dashboard/home.tsx` — `CoursesCta` card added in the post-setup view ("See what you qualify for / View courses").
- Apply CTA: calls `update()` if the university is already in selection, otherwise `add()`, then pushes to `/applications/new`. Uses `data.intake_year` from the recommendations response as the application year.

### Score label (contract addition)
`scoring_method` on `UniversityRead` maps to display label in `courses-view.tsx`:
- `"uct_fps"` → `"FPS"`
- anything else → `"APS"`

Header reads: `Your APS: 34 / 42` (UP) or `Your FPS: 450 / 600` (UCT), always from the response — denominator never hardcoded.

---

## Key decisions

**No per-university hardcoding.** UP defaulted by name match; score label derived from `scoring_method`; no `if universityId === "..."` anywhere.

**`intake_year` for Apply year.** The recommendations response carries `intake_year`; that's what's written into `SelectionEntry.applicationYear` so the apply form is pre-filled correctly.

**`not_yet` cards have no Apply button.** Consistent with the plan: gap list is the value, not a dead-end CTA.

**Backend order preserved.** `STATUS_ORDER` groups qualifies → borderline → not_yet, but within each group programmes render in the order the backend returns them (sorted by APS gap server-side).

---

## States and edge cases

| State | Trigger | UI |
|---|---|---|
| Loading | Picker change | Skeleton cards in 2 labelled sections |
| No academic record | 409 `no_academic_record` | Card with link to `/academic-records` |
| No programmes seeded | `programmes.length === 0` | Card: "Course matching is not available yet" (UCT exercises this today) |
| Error | Any other fetch failure | Alert + retry button |
| Results | Normal | Grouped sections: Qualifies / Borderline / Not yet |

---

## Verification (2026-06-20)

Production build (`npm run build` + `npm run start`), authenticated as jane.doe.test26@gmail.com.

- `/courses` loads with UP selected, APS 13 / 42, "Matched on your grade 11 final results"
- Programmes grouped under NOT YET (APS 13 qualifies for nothing at UP — expected)
- Cards render name + faculty + qualification type + duration + gap list
- Sidebar "Courses" active state highlights correctly
- CI: ESLint (0 errors) + Prettier + `tsc --noEmit` + Vitest 34/34 + build all green

Playwright MCP was unavailable for UCT empty state, mobile (375px), and Apply CTA walkthrough due to the MCP process disconnecting on server restart. The Vercel preview on this PR is the substitute for those passes.

---

## Follow-ups (Phase 5 scope)

- Replace the Apply CTA's free-text programme write with a `programme_id` once Phase 5 structured selection lands.
- UCT programmes seed (backend data task) — once seeded, `/courses` lights up UCT with no frontend change.
