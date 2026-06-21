# UniFlo — Partner A Detailed Phase 5 Plan (`uniflo-web`)

> Scoped strictly to Phase 5 frontend work in `uniflo-web`: **structured programme
> selection** (replace the free-text programme box in `/applications/new` with a
> uni → faculty → course picker, and carry a `programme_id`) and **applicant-type
> inclusivity** (let gap-year / already-have-matric students enter a `grade_12_final`
> record and apply, de-assuming "current learner" through the flow). Both were locked
> as Phase 5 forward work in the Phase 4 plans; this plan builds the frontend half. All
> decisions derive from `docs/architecture-designs.md`, `docs/build-action-plan.md`,
> `docs/git-github-workflow.md`, the design lock in `docs/phase-3/app-redesign.md`, and
> `CLAUDE.md`. Per-task write-ups go under `docs/phase-5/` following the Phase 1–4
> pattern. The matching backend plan is
> `uniflo-api/docs/phase-5/partner-b-phase-5-plan.md`.

---

## Phase-track note (read first)

`docs/build-action-plan.md`'s table labels "Phase 4" as *beta hardening*; the team's
**executed** track instead shipped the courses page as Phase 4. This plan continues the
executed track — "Phase 5" here is the structured-selection + inclusivity work the
Phase 4 plans forward-reference, not the build-plan's beta-hardening phase. Beta
hardening is a separate later effort, out of scope here.

---

## What landed in Phase 4 (the foundation this builds on)

Phase 4 (`uniflo-web` #33–#34) shipped the `/courses` page on top of the backend's
catalogue + matcher. Relevant for Phase 5:

- **`/courses`** (`app/(app)/courses/page.tsx`, `components/courses/*`) renders
  recommendation cards with faculty, qualification type, duration, gap lists, and an
  **Apply CTA that already writes the programme *name* into `useSelection()`** and
  routes to `/applications/new`. Phase 5 makes that CTA also carry `programme_id`.
- **`lib/api/recommendations.ts`** + the generated `lib/api/schema.d.ts` already type
  the catalogue endpoint (`ProgrammeCatalogueItem`, `FacultyGroup`,
  `ProgrammesCatalogueResponse`) and `qualification_type` / `duration_years`. The
  catalogue endpoint (`GET /universities/{id}/programmes`) exists **specifically as this
  picker's data source**.
- **`lib/state/selection.tsx`** (`SelectionEntry` with `programme` +
  `additionalProgrammes` names, `applicationYear`) — the structure that gains
  `programmeId` + `additionalProgrammeIds`.
- **`components/applications/application-fieldset.tsx`** — the free-text `Input`s
  (primary + up to 2 additional choices) the picker replaces.
- **`components/academic-records/records-form.tsx`** + `lib/api/academic-records.ts`
  (`RECORD_TYPE_LABELS` keyed on the full `RecordType` enum — tsc forces a new entry
  after a regen) — where `grade_12_final` surfaces.
- **`lib/constants/profile-enums.ts`** (`isAutomationBlocked`,
  `AUTOMATION_BLOCKED_ACTIVITIES`) + the gate in
  `app/(app)/applications/new/page.tsx` — the "current learner" assumption to relax.

All four universities (UP, UJ, Wits, UCT) are seeded and active, so every catalogue is
populated today.

---

## Orientation for a fresh session (read these first)

Written so an agent starting cold (repo access, no chat history) can execute it.
Before coding, read:
- ⚠️ **`AGENTS.md`** — "This is NOT the Next.js you know." Next.js 16 has breaking
  changes; read the relevant guide in `node_modules/next/dist/docs/` before writing any
  Next code. Then **`CLAUDE.md`** — stack, commands, the design lock, the
  generated-types rule.
- **`lib/api/client.ts`** (client fetch, JWT at call time), **`lib/api/server.ts`**
  (server fetch, discriminated result), **`lib/api/schema.d.ts`** (generated — never
  hand-write; regenerate with `npm run types:api`), **`lib/api/recommendations.ts`**
  (the catalogue + match aliases already defined).
- **`components/applications/application-fieldset.tsx`** +
  **`components/applications/new-applications-form.tsx`** +
  **`components/applications/review-screen.tsx`** — the apply flow the picker plugs into
  and the POST that must send `programme_id`.
- **`components/courses/course-card.tsx`** — where the Apply CTA already builds the
  selection write; Phase 5 adds the id there.
- **`components/academic-records/records-form.tsx`** + **`lib/api/academic-records.ts`**
  — the record-type work (Track 2).
- **`lib/constants/profile-enums.ts`** + **`app/(app)/applications/new/page.tsx`** —
  the apply gate (Track 2).
- **`components/ui/{select,input,card,badge,section}.tsx`** — primitives to reuse; the
  `/courses` and `/universities` pages are the closest templates for a catalogue-driven
  UI.
- **`docs/phase-3/app-redesign.md`** — the locked visual language.

Commands: `npm run dev` / `build` / `start` / `lint` / `format:check` / `test` /
`types:api`, and `npx tsc --noEmit`. Verify in a real browser on the **production
build** (`npm run start`) at desktop/tablet/mobile; log in at `/login` as
jane.doe.test26@gmail.com. ⚠️ **Do not submit an application** from the test account —
`POST /applications` feeds the live automation worker.

Prerequisite: the backend Phase 5 contract (`programme_id` on applications;
`grade_12_final` record type) must be **deployed** before you regen types. Build against
the deployed spec; if you start earlier, leave a `// TODO(types:api)` and regenerate in
the same PR that consumes it.

---

## Phase 5 Goal

Two independent tracks, mirroring the backend plan. **Track 1 first** (lower-risk,
self-contained), then Track 2.

**Track 1 — Structured programme selection.** Replace the free-text programme `Input` in
`/applications/new` with a **uni → faculty → course picker** driven by
`GET /universities/{id}/programmes`. The application records a real `programme_id`
alongside the name. The Courses Apply CTA carries the id straight through, so a student
who came from `/courses` lands pre-selected, not retyping. Free text remains a graceful
fallback for any university whose catalogue is empty.

**Track 2 — Applicant-type inclusivity.** Let a gap-year / already-have-matric student
record a **`grade_12_final`** academic record and apply, instead of being blocked. Add a
record-type selector to the academic-records form and relax the apply gate so the
applicant types the backend now supports get through (coordinated with Partner B).

The backend owns the data, the matching, and the automation; the frontend renders the
picker, carries the id, and stops assuming everyone is currently in Grade 12.

**Reference tag:** `[PHASE-5]`

---

## Before You Write a Single Line of Code

**Do this with Partner B first. Do not skip it.** Both tracks consume contract changes.

### 1. Consume the locked contract deltas (then regenerate types)

Partner B's plan (`uniflo-api/docs/phase-5/partner-b-phase-5-plan.md`, Appendix A) is
the seam. After the backend deploys, run `npm run types:api` to refresh
`lib/api/schema.d.ts` — never hand-write these types.

- **`programme_id` (Track 1):** `ApplicationCreate` accepts optional `programme_id` +
  `additional_programme_ids`; `ApplicationRead` / `ApplicationChoiceRead` return
  `programme_id`. **The id is authoritative** — when you send it, the backend derives
  the stored `programme` name from the catalogue and ignores the free-text name for that
  slot. So always send the name *and* the id when the student picks from the catalogue;
  send name-only (id `null`) for the free-text fallback.
- **`grade_12_final` (Track 2):** the `RecordType` enum gains `grade_12_final`. After
  regen, `RECORD_TYPE_LABELS` in `lib/api/academic-records.ts` will fail `tsc` until you
  add its entry (the deliberate exhaustiveness pattern). Best-available preference on the
  backend is `grade_12_final > grade_12_june > grade_12_april > grade_11_final` — match
  any copy ("Matched on your …") to that.
- **Apply gate set:** confirm with Partner B the exact `current_activity` values the
  server now permits, so `isAutomationBlocked` lists the **same** types. A mismatch lets
  a student pass the frontend gate and fail the run (or vice versa).

### 2. Reuse, don't rebuild

Everything needed already exists:
- Data fetching: `lib/api/server.ts` (server, discriminated `{ ok, data } | { ok:false,
  status }`) and `lib/api/client.ts` (client, attaches the Supabase JWT). The catalogue
  endpoint is **public** — fetch it like the universities list, no JWT required.
- Catalogue types: already in `schema.d.ts` (`ProgrammesCatalogueResponse` →
  `FacultyGroup[]` → `ProgrammeCatalogueItem[]`, with `close_date`, `qualification_type`,
  `duration_years`, `notes`).
- UI: `Select`, `Input`, `Card`, `Badge`, `Section`, `Skeleton`, `Alert`, `Button` —
  the same primitives `/courses` uses. The cascading picker is two/three `Select`s, not
  a new design system.
- Selection state + apply flow: `lib/state/selection.tsx`,
  `components/applications/new-applications-form.tsx`, `review-screen.tsx` — extend, do
  not replace.

---

## How to Work Through This Plan

Every task is a separate feature branch — see `docs/git-github-workflow.md`:

```bash
git fetch origin
git checkout main && git pull --ff-only origin main
git checkout -b feature/<task-branch-name>
# Open a PR to main, wait for CI green, Squash and Merge, delete the branch
```

Opening a PR generates a **Vercel Preview URL** — test there before merging. CI must pass
(ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest). Per `CLAUDE.md`, UI changes
also require a **real-browser pass (Playwright MCP) at desktop, tablet, and mobile widths
on the production build (`npm run start`)** before committing. Drop a per-task write-up in
`docs/phase-5/` as `task-<n>-<slug>.md`.

---

## Track 1 — Structured programme selection

### Task 1 — Types + catalogue data wiring
**Branch:** `feature/phase-5-types`

Gating task: get the new contract into the codebase before building the picker.

- [ ] `npm run types:api` against the deployed spec; commit the refreshed
  `lib/api/schema.d.ts` (picks up `programme_id` on the application types and
  `grade_12_final` on `RecordType`).
- [ ] Add a tiny typed catalogue fetch helper in `lib/api/recommendations.ts` (or a
  sibling) — `getProgrammeCatalogue(universityId)` reusing the existing client/server
  fetchers; do **not** introduce a new fetch abstraction. The response type already
  exists (`ProgrammesCatalogueResponse`).
- [ ] Add `grade_12_final: "Grade 12 final"` to `RECORD_TYPE_LABELS` (tsc will demand it
  after the regen). This unblocks Track 2's Task 4 too.

**Squash commit:** `chore(api): regenerate types for programme_id and grade_12_final`

---

### Task 2 — Structured programme picker
**Branch:** `feature/programme-picker`

Replace the free-text programme box with a catalogue-driven picker.

- [ ] `components/applications/programme-picker.tsx` (client): fetches the selected
  university's catalogue once, renders a **faculty `Select`** then a **course `Select`**
  scoped to that faculty (cascading). Show `qualification_type` + `duration_years` on the
  chosen course (e.g. "Degree · 4 years") and the faculty `close_date` when present
  ("Closes 31 May") so per-faculty deadlines surface. Loading → `Skeleton`; fetch error →
  inline retry.
- [ ] **Graceful free-text fallback:** if a university's catalogue is empty (none
  seeded), fall back to the existing free-text `Input` for that university so the apply
  path still works. All four are seeded today, but new universities light up without a
  code change and must not dead-end.
- [ ] Wire the picker into `application-fieldset.tsx` for the **primary and each
  additional choice** (still capped at `MAX_ADDITIONAL_PROGRAMMES = 2`; same add/remove
  UX). Each slot picks from the same university's catalogue.
- [ ] Extend `SelectionEntry` (`lib/state/selection.tsx`) with `programmeId?: string` and
  `additionalProgrammeIds?: string[]`, kept **parallel** to the existing name fields
  (name + id move together). Update the reducer's `UPDATE` patch type and the
  `new-applications-form` write-back accordingly.

**Squash commit:** `feat: structured uni-faculty-course picker on the apply form`

---

### Task 3 — Carry `programme_id` end-to-end (Courses CTA → review → POST)
**Branch:** `feature/programme-id-handoff`

Make the id flow from selection through submission.

- [ ] **Courses Apply CTA** (`components/courses/course-card.tsx`): write
  `{ programmeId: course.id, programme: course.name }` (and the same for any additional
  choice) into `useSelection()`. A student arriving from `/courses` lands on the apply
  form with the picker **pre-selected to that programme**, not retyping.
- [ ] **Review + POST** (`review-screen.tsx` / `new-applications-form.tsx`): include
  `programme_id` and `additional_programme_ids` in the `ApplicationCreate` body when the
  student picked from the catalogue; omit them (name-only) for the free-text fallback.
- [ ] **Review display:** unchanged visually — it already shows the programme name; the
  id rides along invisibly. Confirm a free-text fallback application still reviews and
  posts (id `null`).

**Squash commit:** `feat: carry programme_id from courses through to submission`

---

## Track 2 — Applicant-type inclusivity

### Task 4 — `grade_12_final` record + relax the apply gate
**Branch:** `feature/applicant-type-inclusivity`

Let gap-year / already-have-matric students record their final NSC and apply.

- [ ] **Records form** (`components/academic-records/records-form.tsx`): add a
  **record-type selector** including `grade_12_final` (label "Grade 12 final"), so a
  gap-year / already-have-matric student can enter their completed NSC record. Keep the
  existing types selectable. Use `RECORD_TYPE_LABELS` for copy. Posting a
  `grade_12_final` record uses the existing `/academic-records` POST unchanged.
- [ ] **Apply gate** (`lib/constants/profile-enums.ts` +
  `app/(app)/applications/new/page.tsx`): narrow `AUTOMATION_BLOCKED_ACTIVITIES` to only
  the genuinely-unsupported types (e.g. "At university" / transfer), **matching the
  server's permitted set exactly** (confirmed with Partner B). Gap-year / completed-matric
  applicants now pass the gate. Reword the block copy so it only speaks to the types that
  are still unsupported.
- [ ] **Copy pass:** the apply flow no longer assumes "currently in Grade 12". Audit
  user-facing strings in the apply + records flow for that assumption and neutralise
  them (design lock: short declarative sentences, no em dashes).

**Squash commit:** `feat: support gap-year and completed-matric applicants`

---

### Task 5 — Polish, accessibility, verification
**Branch:** `feature/phase-5-polish`

Mirror the Phase 2/3/4 polish passes.

- [ ] Picker `Select`s have labels, error states, and keyboard reachability; the
  cascading faculty→course relationship is announced (course select is disabled/empty
  until a faculty is chosen, with helper text, not a silent dead select).
- [ ] No em dashes in any copy; short declarative sentences; cream/cobalt, lifted cards,
  hairline borders only (no glows/gradients) per the design lock. Plain-noun titles.
- [ ] **Real-browser pass (Playwright MCP) on the production build (`npm run start`)** at
  desktop, tablet, and mobile (375px): the uni→faculty→course picker on the apply form,
  the Courses→apply pre-selection handoff, the free-text fallback path, the
  `grade_12_final` record entry, and the relaxed apply gate for a gap-year profile.
  Authenticate as jane.doe.test26@gmail.com — **do not submit an application.**
- [ ] Cross-task review doc `docs/phase-5/phase-5-review.md`.
- [ ] `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm run test`,
  `npm run build` all green.

**Squash commit:** `chore: phase 5 polish, a11y, and verification`

---

## Phase 5 Checkpoint (frontend)

Verify on the Vercel preview / production build:

- [ ] On `/applications/new`, each selected university shows a uni→faculty→course picker;
  choosing a course sets `programme_id`; review and the POST carry it.
- [ ] Applying from a `/courses` card lands on the apply form **pre-selected** to that
  programme (faculty + course resolved), not a blank box.
- [ ] A university with no catalogue falls back to the free-text box and still applies
  (id `null`).
- [ ] A gap-year / completed-matric profile can record a `grade_12_final` record and is
  **not** blocked from the apply flow; "At university" / transfer is still blocked with
  clear copy.
- [ ] Full flow at 375px — cascading selects usable, no horizontal scroll.
- [ ] CI green: ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest.

---

## Cross-repo sequencing (per workspace `CLAUDE.md`)

Per track: backend ships first (FK/contract or record type), deploys, then
`npm run types:api`, then this frontend PR. Reference the sibling backend PR in each
description. No `Co-Authored-By`, no Claude attribution on commits/PRs. Ship Track 1 first
(no live-portal risk), then Track 2.

---

## Environment Variables for Phase 5

None new. The picker uses the existing `NEXT_PUBLIC_API_URL` and the public catalogue
endpoint; `OPENAPI_SPEC_URL` for `npm run types:api`.

---

## What Is Explicitly Out of Scope for Phase 5

- **Transfers / tertiary records and postgraduate applications** — deferred to
  post-launch (backend out-of-scope). The records form does not add a tertiary record
  type.
- **Course search/filter on the apply picker beyond faculty→course** — the picker is two
  cascading selects; a full search/typeahead over the catalogue is post-MVP.
- **Re-running recommendations inside the apply flow** — the picker is the plain
  catalogue (all programmes), not the matched/`qualifies` subset. Matching stays on
  `/courses`; the apply picker lets the student pick anything (the portal makes the final
  call).
- **Per-faculty deadline *enforcement*** — the picker *surfaces* `faculties.close_date`,
  but blocking submission on a faculty deadline (vs the university deadline) is a backend
  follow-on, not frontend work.
- **Beta hardening** (POPIA copy, analytics, paid-tier UI) — separate later effort.

---

## Risks and Open Questions

- **Resolve before Task 1:** is Partner B's Phase 5 contract (`programme_id`,
  `grade_12_final`) deployed? If not, build against the deployed spec and mark the regen
  `// TODO(types:api)`.
- **Resolve before Task 2:** the catalogue can be large (UJ 177, UP 120). Confirm two
  cascading `Select`s scale acceptably; if a single faculty's course list is unwieldy,
  consider a searchable select — but only if a real list forces it, not pre-emptively.
- **Resolve before Task 3:** when both an id and a free-text name are present, the backend
  derives the name from the id. Ensure the frontend still *sends* a name (for optimistic
  display) and never relies on the client name surviving the round-trip.
- **Resolve before Task 4 (shared with Partner B):** the exact permitted
  `current_activity` set. `isAutomationBlocked` and the server guard must list the **same**
  types or a student passes one gate and fails the other.
- **Selection state shape:** `programmeId` must stay parallel to `programme` (and the
  additional arrays aligned by index) through add/remove/reorder. A drifted index pairs a
  name with the wrong id — cover it in the picker's add/remove handlers and a unit test.
- **Empty-catalogue fallback must be real, not theoretical:** all four universities are
  seeded today, so the fallback is easy to leave untested. Force an empty catalogue in dev
  (or a unit test) so the free-text path is verified before it's the only thing standing
  between a new university and a dead apply form.
