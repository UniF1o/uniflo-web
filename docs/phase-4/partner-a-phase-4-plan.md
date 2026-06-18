# UniFlo — Partner A Detailed Phase 4 Plan (`uniflo-web`)

> Scoped strictly to Phase 4 frontend work in `uniflo-web`: the **"Courses you
> qualify for"** experience. All decisions and constraints referenced here derive
> from `docs/architecture-designs.md`, `docs/build-action-plan.md`,
> `docs/git-github-workflow.md`, the design lock in `docs/phase-3/app-redesign.md`,
> and `CLAUDE.md`. Per-task write-ups go under `docs/phase-4/` following the
> pattern set by `docs/phase-1/`–`docs/phase-3/`. The matching backend plan is
> `uniflo-api/docs/phase-4/partner-b-phase-4-plan.md`.

---

## Orientation for a fresh session (read these first)

Written so an agent starting cold (repo access, no chat history) can execute it.
Before coding, read:
- ⚠️ **`AGENTS.md`** — "This is NOT the Next.js you know." Next.js 16 has breaking
  changes; read the relevant guide in `node_modules/next/dist/docs/` before writing
  any Next code. Then **`CLAUDE.md`** — stack, commands, the design lock, the
  generated-types rule.
- **`lib/api/client.ts`** (client fetch, JWT at call time), **`lib/api/server.ts`**
  (server fetch, discriminated result), **`lib/api/schema.d.ts`** (generated — never
  hand-write; regenerate with `npm run types:api`).
- **`app/(app)/universities/page.tsx`** + **`components/universities/university-list.tsx`**
  + **`university-card.tsx`** — the closest template (SSR initial fetch + client list
  + card); copy this shape for `/courses`.
- **`lib/state/selection.tsx`** (the Apply-handoff target),
  **`app/(app)/applications/new/page.tsx`** (the flow the CTA feeds),
  **`components/ui/{card,badge,section}.tsx`**,
  **`components/layout/{page-header,sidebar}.tsx`**.
- **`docs/phase-3/app-redesign.md`** — the locked visual language.

Commands: `npm run dev` / `build` / `start` / `lint` / `format:check` / `test` /
`types:api`, and `npx tsc --noEmit`. Verify in a real browser on the **production
build** (`npm run start`) at desktop/tablet/mobile; log in at `/login` as
jane.doe.test26@gmail.com (do not submit applications).

Prerequisite: the backend `/recommendations` endpoint must be deployed before you
regen types (Task 1); build against the deployed spec and mark `// TODO(types:api)`
if you start before it lands.

---

## Phase 4 Goal

A student who has captured their subjects and marks (Phase 1 Academic Records) can
open a **Courses** page and see, for a university, every relevant programme tagged
**Qualifies / Borderline / Not yet**, with the exact gap on the ones they miss
("Needs Mathematics 65%, you have 58%"). From a qualifying course they can jump
straight into the existing apply flow with the programme pre-filled.

The backend (`uniflo-api`) owns the data and the matching; the frontend renders the
result and routes the student onward. We launch on **one university — University of
Pretoria (UP)** — to match the backend pilot, but the page is built so more
universities are just data appearing in the picker, not new code.

### Foundation note — this sets up Phase 5 structured selection

The recommendation cards already show faculty, and the backend exposes a course
catalogue endpoint (`GET /universities/{id}/programmes`). Those are the foundation
for **Phase 5 structured programme selection** — replacing the free-text programme
box in `/applications/new` with a uni → faculty → course picker. For Phase 4 the
Apply CTA still writes the programme *name* into the existing selection flow; in
Phase 5 it becomes a `programme_id`. Build Phase 4 to that grain (carry the
programme's id alongside its name where you can) so Phase 5 is a swap, not a rework.
Structured selection itself is out of scope here — see below.

**Reference tag:** `[PHASE-4]`

---

## Before You Write a Single Line of Code

**Do this with Partner B first. Do not skip it.** The new page is driven entirely
by one new endpoint; the frontend cannot be built until its shape is locked.

### 1. Consume the locked API contract

Partner B's plan (`uniflo-api/docs/phase-4/partner-b-phase-4-plan.md`, Appendix A)
defines the seam. Sign it off in a PR to the OpenAPI spec, then regenerate types.

- `GET /recommendations?university_id=<uuid>&record_type=<...>` (authenticated).
  `record_type` optional; backend defaults to the student's best available record.
- Response (consumed shape — the generated type is the source of truth, this is
  for orientation):
  ```jsonc
  {
    "university_id": "uuid",
    "record_type_used": "grade_12_june",
    "aps": 34,
    "aps_max": 42,
    "programmes": [
      {
        "id": "uuid",
        "name": "BEng (Civil Engineering) ENGAGE",
        "faculty": "Engineering, Built Environment and IT",
        "qualification_code": "12136017",
        "min_aps": 33,
        "status": "qualifies",        // "qualifies" | "borderline" | "not_yet"
        "unmet_rules": []             // each: { requirement, have, shortfall }
      }
    ]
  }
  ```
- **The backend pre-sorts** qualifies -> borderline -> not_yet, then by APS gap.
  Render in returned order; do not re-sort client-side.
- `unmet_rules[]` strings (`requirement`, `have`, `shortfall`) are written for the
  student — render them verbatim, do not reformat.
- **No-record case:** with no academic record the endpoint returns `409` with
  `{ "code": "no_academic_record" }`. Render an "Add your subjects first" state
  linking to `/academic-records` — not an empty list.

Confirm with Partner B before Task 2:

- **Status enum strings** are exactly `"qualifies" | "borderline" | "not_yet"`.
  Build the badge map as `Record<Status, …>` so a future enum change fails `tsc`
  after a types regen (the deliberate exhaustiveness pattern from `CLAUDE.md`).
- **University selection:** for the pilot only UP returns programmes. Confirm
  whether `/recommendations` 404s / empties for universities with no seeded
  programmes, so the picker can show "Course matching is not available yet for X".

### 2. Regenerate the API types

This work depends on an **unreleased backend change**. Per the workspace `CLAUDE.md`,
build against the deployed spec once Partner B deploys; if you start earlier, leave
a clearly marked `// TODO(types:api)` and regenerate in the same PR that consumes
it. Run `npm run types:api` to refresh `lib/api/schema.d.ts` — never hand-write the
`/recommendations` types.

### 3. Reuse, don't rebuild

Everything needed already exists:
- Data fetching: `lib/api/server.ts` (server components, discriminated
  `{ ok, data } | { ok:false, status }`) and `lib/api/client.ts` (client, attaches
  the Supabase JWT at call time).
- UI: `Card`, `Badge` (tones `success`/`warning`/`neutral`), `Section`,
  `PageHeader`, `Skeleton`, `Alert`, `Button` — same primitives the
  `/universities` page uses.
- Selection state: `lib/state/selection.tsx` (`useSelection()` with `add`/`update`)
  — the Apply CTA writes into this and reuses the existing apply flow.
- A close visual template already exists: `components/universities/university-card.tsx`
  and `university-list.tsx`.

### 4. Catalogue schema you're planning to (owned by `uniflo-api`)

Mirrored from the backend plan so you can plan the UI without running the backend;
the generated types from `npm run types:api` are the runtime source of truth.
- `faculties` (`id`, `university_id`, `name`, `close_date?`) — faculty is a real
  entity (a selectable level for Phase 5).
- `programmes` (`id`, `university_id`, `faculty_id`, `name`, `qualification_code?`,
  `intake_year`, `min_aps?`, `requirements`, `is_active`) — canonical key
  `(university_id, qualification_code, intake_year)`.
- The recommendation response (Appendix A in the backend plan) returns the faculty
  *name* denormalized per programme, so cards don't need a separate faculties lookup.
- **Phase 5 forward (don't build now, design for it):** the Apply CTA's programme
  will carry a `programme_id`; `academic_records` will gain a `grade_12_final` record
  type (gap-year / already-have-matric). Transfers / tertiary records are deferred to
  post-launch.

---

## How to Work Through This Plan

Every task is a separate feature branch — see `docs/git-github-workflow.md`:

```bash
git fetch origin
git checkout main && git pull --ff-only origin main
git checkout -b feature/<task-branch-name>
# Open a PR to main, wait for CI green, Squash and Merge, delete the branch
```

Opening a PR generates a **Vercel Preview URL** — test there before merging. CI
must pass (ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest). Per
`CLAUDE.md`, UI changes also require a **real-browser pass (Playwright MCP) at
desktop, tablet, and mobile widths on the production build (`npm run start`)**
before committing. Drop a per-task write-up in `docs/phase-4/` as
`task-<n>-<slug>.md`.

---

## Task 1 — Types + data wiring
**Branch:** `feature/phase-4-types`

Small gating task: get the contract into the codebase before building UI.

- [ ] `npm run types:api` against the deployed spec; commit the refreshed
  `lib/api/schema.d.ts`.
- [ ] Add a tiny typed helper or alias for the recommendations call (reuse
  `apiClient.get` / the server fetcher; do not introduce a new fetch abstraction).
- [ ] Define the `Status -> { tone, label }` map once
  (`lib/constants/` or alongside the badge component) as `Record<Status, …>`:
  - `qualifies` -> `success`, label "Qualifies"
  - `borderline` -> `warning`, label "Borderline"
  - `not_yet` -> `neutral`, label "Not yet"

**Squash commit:** `chore(api): regenerate types for recommendations endpoint`

---

## Task 2 — Courses page + match cards
**Branch:** `feature/courses-page`

The new screen at `/courses` (plain-noun title "Courses", per the design lock).

- [ ] `app/(app)/courses/page.tsx` (server component): server-fetch the universities
  list (reuse the existing fetch) to drive the picker, then server-fetch
  `GET /recommendations?university_id=<pilot UP>` for first paint without a loading
  flash. Pass results to a client component.
- [ ] `components/courses/courses-view.tsx` (client): owns the **university picker**
  (defaults to UP; for the pilot, universities without programmes show a
  "Course matching is not available yet" note) and re-fetches via `apiClient` on
  change. Optional small **record toggle** (Grade 11 / Grade 12) that sets
  `record_type`; default is the backend's best-available, surfaced as
  `record_type_used` (e.g. caption "Matched on your Grade 12 June results").
- [ ] `components/courses/course-card.tsx` (presentational): programme `name`,
  `faculty`, the status `Badge`, and — when `unmet_rules` is non-empty — a compact
  gap list ("Needs Mathematics 65%, you have 58%"). If the programme has a `notes`
  value (additional requirements, e.g. "Also requires: NBT"), show it as an
  informational line that does **not** affect the badge. Reuse `Card` (paper variant,
  hairline border, hover lift) to match `university-card.tsx`.
- [ ] Group with `Section` headers: **Qualifies**, **Borderline**, **Not yet**;
  preserve backend order within each. Show the student's APS in the `PageHeader`
  description or a `Section` kicker ("Your APS: 34 / 42").
- [ ] Show a brief **disclaimer** near the results: matching is based on published
  requirements and the student's current marks, and the university's portal makes the
  final decision (requirements change; provisional marks are provisional). Keep it
  low-key per the design lock.
- [ ] States, each with distinct copy:
  - `409 no_academic_record` -> "Add your subjects to see what you qualify for"
    with a link to `/academic-records`.
  - University with no programmes seeded -> "Course matching is not available yet
    for this university."
  - Error -> retry affordance (same pattern as `university-list.tsx`).
  - Loading on picker/toggle change -> `Skeleton`s shaped like the cards.

**Squash commit:** `feat: add courses page with qualification matching`

---

## Task 3 — Navigation + Apply handoff
**Branch:** `feature/courses-apply-handoff`

Make the page reachable and let a qualifying course feed the existing apply flow.

- [ ] Add **"Courses"** to the **Applying** group in `components/layout/sidebar.tsx`
  (next to Universities and Applications).
- [ ] On the dashboard completeness area, add a line/CTA pointing to `/courses`
  ("See what you qualify for") — consistent with how Phase 2 surfaced applications.
- [ ] On a `qualifies` (and optionally `borderline`) card, an **Apply** button that
  writes `{ universityId, programme: course.name, applicationYear }` into
  `useSelection()` (via `add`/`update`) and navigates to `/applications/new` — the
  existing form/review/submit flow takes over unchanged. Do not build a new apply
  path.
- [ ] `not_yet` cards have **no** Apply button — they are guidance, not a dead end;
  the gap list is the value.

**Squash commit:** `feat: link courses into nav and the apply flow`

---

## Task 4 — Polish, accessibility, verification
**Branch:** `feature/phase-4-polish`

Mirror the Phase 2/3 polish passes.

- [ ] Status is not conveyed by colour alone — the `Badge` exposes its label to
  screen readers; gap lists use real text, not icons only.
- [ ] No em dashes in any copy; short declarative sentences; cream/cobalt, lifted
  cards, hairline borders only (no glows/gradients) per the design lock.
- [ ] Dynamic `<title>` metadata on `/courses`.
- [ ] **Real-browser pass (Playwright MCP) on the production build
  (`npm run start`)** at desktop, tablet, and mobile (375px) widths: picker,
  record toggle, the three groups, gap rendering, the no-record state, and the
  Apply handoff into `/applications/new`. Authenticate as the test student
  (jane.doe.test26@gmail.com) — do **not** submit an application.
- [ ] Cross-task review doc `docs/phase-4/phase-4-review.md`.
- [ ] `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm run test`,
  `npm run build` all green.

**Squash commit:** `chore: phase 4 polish, a11y, and verification`

---

## Phase 4 Checkpoint (frontend)

Verify on the Vercel preview / production build:

- [ ] Sign in as a student with a `grade_12_june` record; open `/courses`.
- [ ] UP is selected by default; programmes render grouped Qualifies / Borderline /
  Not yet in backend order; APS shows in the header.
- [ ] A `not_yet` card shows the exact gap text from `unmet_rules`.
- [ ] Apply from a qualifying card lands on `/applications/new` with that programme
  pre-filled; the existing review/submit flow works.
- [ ] A profile with no academic record shows the "add your subjects" state, not an
  empty list.
- [ ] Full flow at 375px — no horizontal scroll, all controls reachable.
- [ ] CI green: ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest.

---

## Cross-repo sequencing (per workspace `CLAUDE.md`)

Backend ships first (model, migration, endpoint, seeded UP programmes) and deploys;
then `npm run types:api`; then this frontend PR. Reference the sibling backend PR in
each description. No `Co-Authored-By`, no Claude attribution on commits/PRs.

---

## Environment Variables for Phase 4

None new. The page uses the existing `NEXT_PUBLIC_API_URL` and Supabase config, and
`OPENAPI_SPEC_URL` for `npm run types:api`.

---

## What Is Explicitly Out of Scope for Phase 4

- Per-university frontend work — the page is university-agnostic, so other
  universities light up in the picker automatically as the backend seeds them (its
  Task 5). This is enabled, not excluded; no per-university frontend change is needed.
- Any matching/eligibility logic on the client — the backend computes status, APS,
  and gaps; the frontend only renders them.
- Subject-improvement simulators, saved/favourited courses, course search/filter
  beyond the university picker and record toggle — post-MVP.
- A new apply path — the Apply CTA reuses the existing `/applications/new` flow.
- **Structured programme selection (Phase 5):** the uni → faculty → course picker
  that replaces the free-text programme box. Phase 4 shows faculty on cards and
  passes the programme name into the existing flow; the picker + `programme_id` are
  Phase 5.
- **Applicant-type inclusivity (Phase 5):** the `grade_12_final` record type (gap-year
  / already-have-matric) and its form. The `/courses` page is applicant-type-agnostic —
  it matches on whatever NSC record exists — so this is academic-records + apply-flow
  work, not courses-page work. (Transfers / tertiary are deferred to post-launch.)
- Supabase Realtime / live re-matching — the page fetches on load and on
  picker/toggle change, consistent with the rest of the app.

---

## Risks and Open Questions

- **Resolve before Task 1:** is Partner B's `/recommendations` spec deployed? If
  not, build against the deployed spec and mark the regen `// TODO(types:api)`.
- **Resolve before Task 2:** the `status` enum strings and the `409 no_record`
  body, and how `/recommendations` behaves for a university with no programmes
  (empty vs 404) — drives the picker's "not available yet" copy.
- **Resolve before Task 3:** confirm the `applicationYear` the Apply CTA should
  pre-fill (reuse the same valid-year rule the Phase 2 application form enforces).
- **Pilot scope:** only UP has data at launch; make the single-university reality
  read as intentional ("More universities coming"), not broken.
