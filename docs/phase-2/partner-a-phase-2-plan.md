# Uniflo — Partner A Detailed Phase 2 Plan (`uniflo-web`)

> Scoped strictly to Phase 2 work in `uniflo-web`. All decisions and constraints referenced here derive from `docs/architecture-designs.md`, `docs/build-action-plan.md`, and `docs/git-github-workflow.md`. Per-task write-ups go under `docs/phase-2/` following the pattern already set by `docs/phase-1/`.

---

## Phase 2 Goal

A student who has completed Phase 1 (profile, academic records, documents) can browse universities, select which ones to apply to, provide a programme and application year per university, review exactly what will be submitted, trigger the applications, and watch their status on a dashboard. The automation layer is still fake at the end of Phase 2 — a background task that logs and updates a status is enough. The full user flow must feel real to an outside person using it.

**Duration:** Weeks 6–8
**Reference tag:** `[PHASE-2]`

---

## Before You Write a Single Line of Code

**Do this with Partner B first. Do not skip it.**

Phase 2 introduces three new tables (`universities`, `applications`, `application_jobs`) and several new endpoints. The frontend cannot be built in isolation — the contract must be locked before Task 2 starts.

### 1. Lock the API shape with Partner B

Agree on the exact response and request shapes for the endpoints Phase 2 adds. The frontend plan below assumes these shapes, but they are not locked unless both partners have signed off in a PR to the OpenAPI spec.

- `GET /universities` — list, with query params for search (`q`), filter by `is_active`, and pagination if needed. Response shape:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "University of Cape Town",
        "website": "https://uct.ac.za",
        "portal_url": "https://applyonline.uct.ac.za",
        "open_date": "2026-04-01",
        "close_date": "2026-09-30",
        "is_active": true
      }
    ]
  }
  ```
- `GET /universities/{id}` — single university detail (same fields as above).
- `POST /applications` — create a pending application. Request body:
  ```json
  {
    "university_id": "uuid",
    "programme": "BSc Computer Science",
    "application_year": 2026
  }
  ```
  Response: the full `application` row with `status: "pending"`.
- `GET /applications` — list all applications for the signed-in student. Expected to return the application plus a summary of its latest `application_job` (status, `updated_at`, `last_error` if any) so the dashboard can render without a second round-trip per row. Lock this join shape with Partner B — either the backend pre-joins or the frontend needs to fire N extra requests, and the latter is wrong for the dashboard's default view.
- `GET /applications/{id}` — single application detail, including the latest job record (and `screenshot_url` once Phase 3 wires it up).

Confirm with Partner B:

- **Application-year validation.** Which years are valid? Only the current intake year, or the next intake as well? The frontend needs the same rule the backend enforces so the student doesn't hit a 422 after submitting a review.
- **Programme input.** For MVP, a free-text input is assumed (any course the university offers). Confirm Partner B is not expecting a dropdown sourced from a programmes table — that would be Phase 3+.
- **Deadline handling.** `close_date` per university governs whether applications are still accepted. Confirm the backend enforces this on `POST /applications` — the frontend shows the closed state visually but the backend is the source of truth.
- **Status enum.** From `docs/architecture-designs.md`: `"pending" | "processing" | "submitted" | "failed"`. Lock the exact strings before building the badge component.
- **CORS and auth.** The JWT goes in `Authorization: Bearer <token>` on every request, same as Phase 1. No change expected, just confirm.

### 2. Wire the generated API types

Phase 1 shipped with a hand-written `ProfileResponse` type in `components/profile/overview.tsx` because the FastAPI OpenAPI spec wasn't published yet. Task 1 below replaces that stub with `openapi-typescript` output. Every new Phase 2 fetch uses the generated types from day one — no more hand-written request/response interfaces.

### 3. A note on draft state

Students select one or more universities and then fill in a programme + year per selection. The question is where that selection lives before the final "submit applications" click:

- **Option A — client-side state only.** Simpler. If the student closes the tab mid-flow, selections are lost.
- **Option B — persisted drafts on the backend.** Needs a drafts table or a "draft" status on `applications`. More moving parts for Partner B.

This plan assumes **Option A** for MVP. Keep it in React state scoped to the selection/review flow. Students on mobile rarely close a tab mid-task, and the review-then-submit sequence is short enough that drop-off recovery isn't worth the backend work. If user testing in Phase 4 shows drop-off is a problem, drafts become a Phase 5+ concern.

---

## How to Work Through This Plan

Every task below is a separate feature branch. The Git workflow is in `docs/git-github-workflow.md`. The short version:

```bash
# Start each task — always fetch first (squash-merged PRs leave local main stale)
git fetch origin
git checkout main && git pull --ff-only origin main
git checkout -b feature/<task-branch-name>

# When done — open a PR to main, wait for CI green, Squash and Merge
```

Opening a PR automatically generates a **Vercel Preview URL**. Test every UI change there before merging. Never merge without checking the preview.

CI must pass (ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest) before any PR merges. No exceptions — see `docs/git-github-workflow.md`.

At the end of each task branch, drop a write-up in `docs/phase-2/` as `task-<n>-<slug>.md` covering what was built, design decisions, deviations from this plan, and how to verify. This is the pattern established in `docs/phase-1/` and is mandatory per `CLAUDE.md`.

---

## Task 1 — OpenAPI type generation
**Branch:** `feature/openapi-types`

Before anything else, replace hand-written API types with generated ones. Every Phase 2 task depends on this being in place. It is a small task but gates all the others.

- [x] Add `openapi-typescript` as a devDependency
- [x] Add an npm script `types:api` that runs `openapi-typescript <spec-url> -o lib/api/schema.d.ts`, reading the URL from an env var (e.g. `OPENAPI_SPEC_URL`) with a sensible local default (`http://localhost:8000/openapi.json`)
- [x] Create `lib/api/client.ts` — a thin `fetch` wrapper that:
  - Reads `NEXT_PUBLIC_API_URL` as the base URL
  - Takes the Supabase JWT from `supabase.auth.getSession()` at call time (not at module load — long-open pages must not send expired tokens)
  - Attaches `Authorization: Bearer <token>`
  - Throws on non-2xx with the body included, so callers can render meaningful errors
  - Is typed against the generated `paths` from `lib/api/schema.d.ts`
- [x] Replace the hand-written `ProfileResponse` in `components/profile/overview.tsx` with the generated type — confirm the overview still compiles and behaves identically
- [x] Check `lib/api/schema.d.ts` into git. It is generated but stable between spec changes, and checking it in means Partner A can read it without running the backend locally
- [x] Document the regeneration command in the README under a new "Working with the API" section

**Why:** Every Phase 2 fetch (`/universities`, `/applications`, `/application-jobs`) is typed end to end against Partner B's schema. Drift between frontend expectations and backend reality shows up as a TypeScript error at build time instead of a runtime 4xx.

**Dependency on Partner B:** Partner B must have published the OpenAPI spec (either at a stable URL or checked into `uniflo-api`). Confirm before starting this task. If the spec isn't ready, Task 1 is blocked and no other Phase 2 task can start cleanly.

**Squash commit:** `chore(api): generate TypeScript types from OpenAPI spec`

---

## Task 2 — University browsing and search
**Branch:** `feature/universities-browse`

Build the page where students discover which universities Uniflo supports. This is the first screen in the Phase 2 flow — it lives at `/universities` and links from the sidebar and dashboard.

- [x] Create `app/(app)/universities/page.tsx` as a server component. Fetch the initial university list server-side using the server Supabase client + typed API client, so the list renders on first paint without a loading flash
- [x] Create `components/universities/university-list.tsx` — client component that receives the initial list as a prop, owns the search input state, and re-fetches on search input change (debounced ~300ms). The server fetch handles first paint; client-side handles interactivity
- [x] Create `components/universities/university-card.tsx` — presentational card showing:
  - Name
  - `open_date` – `close_date` range, formatted as "Applications open N April – 30 September" (use a single shared formatter)
  - A status pill: "Open now", "Opens N days", "Closed" — derive from `is_active`, `open_date`, `close_date`, and `new Date()` client-side
  - A "Select" button that adds the university to the selection (Task 3)
- [x] Handle empty states: no universities at all, no matches for the search query — distinct copy for each
- [x] Handle the loading state during debounced search — skeletons match the card shape, not a spinner
- [x] Handle the error state — a retry affordance, same pattern used by `components/profile/overview.tsx`
- [x] Add `/universities` to the sidebar (`components/layout/sidebar.tsx`). It is the new entry point for Phase 2
- [x] Mobile check: the card grid collapses to a single column on 375px viewports, the search input remains reachable above the fold

**Deliberate non-goals for this task:** No filters beyond free-text search. No sort options. No pagination UI (a `limit=50` on the query is enough for MVP — there are 3–5 seeded universities). Filtering by "accepting applications now" is implicit via the status pill but not a dedicated toggle.

**Squash commit:** `feat: add universities browsing and search page`

---

## Task 3 — University selection flow
**Branch:** `feature/university-selection`

A student picks one or more universities from the browse page and carries that selection into the application form (Task 4). This task introduces the session-scoped selection state.

- [x] Create `lib/state/selection.ts` — a simple React Context provider that holds an array of `{ universityId, programme?, applicationYear? }` entries and exposes `add`, `remove`, `clear`, and `update` helpers
  - Why Context over a store library (Zustand etc.): one screen-group, session-only, no persistence. Adding a store for one use-case is over-engineering; if Phase 3 needs broader cross-screen state we re-evaluate then
  - Why not URL state: the selection grows and shrinks and mobile deep-links aren't a requirement
- [x] Wire the provider into `app/(app)/layout.tsx` so the selection survives navigation between `/universities`, `/applications/new`, and the review screen
- [x] Update the `University` card's "Select" button (from Task 2) to toggle selection — visually reflect selected state (filled button, "Remove" label)
- [x] Build `components/universities/selection-bar.tsx` — a sticky bottom bar visible when the selection is non-empty, showing "N selected" and a "Continue" button that navigates to `/applications/new`
  - Sticky-bottom pattern is mobile-friendly. On desktop it can sit inline below the filters
- [x] On "Continue" with zero selections, the button is disabled (not hidden) so the student sees it's there waiting
- [x] Deep-link guard: if a student navigates directly to `/applications/new` with an empty selection, redirect them to `/universities` with a toast/inline message

**Deliberate non-goals:** No persistence across sessions (see "A note on draft state" above). No cross-tab sync. No undo for removes — "Select" toggles back and forth cleanly enough.

**Squash commit:** `feat: add university selection state and selection bar`

---

## Task 4 — Application form (programme + application year)
**Branch:** `feature/application-form`

For each selected university, the student provides a programme name and an application year. This is where the selection becomes concrete. The page lives at `/applications/new`.

- [x] Create `app/(app)/applications/new/page.tsx` as a server component. Redirect to `/universities` if the selection is empty (guard duplicated from Task 3 because deep-links bypass the selection bar)
  - Selection lives in client state, so the server component can't read it directly. Use a lightweight client wrapper that checks the context on mount and fires the redirect via `router.replace`
- [x] Create `components/applications/new-applications-form.tsx` — client component rendering one `<ApplicationFieldset>` per selected university
- [x] `<ApplicationFieldset>` — shows the university name (read-only), a `programme` text input, and an `applicationYear` number/select input
  - `programme` validation: required, 3–120 characters, no leading/trailing whitespace
  - `applicationYear` validation: integer, bounded by what Partner B accepts (see coordination section — lock the valid year range with Partner B, default to `[currentYear, currentYear + 1]` if ambiguous)
- [x] Errors clear on input change (same UX as the Phase 1 profile form)
- [x] A "Review" button at the bottom — disabled until every fieldset is valid. On click, writes the programme and year back into the selection context and navigates to `/applications/review`
- [x] A "Back to universities" link at the top for students who want to add or remove a university before filling in details
- [x] Handle a university being removed from the selection on this page (e.g. via the selection bar) — the corresponding fieldset unmounts cleanly with its state discarded

**Squash commit:** `feat: add application form for programme and year per selection`

---

## Task 5 — Review and approve screen
**Branch:** `feature/application-review`

The review screen is the data-integrity safeguard that `docs/architecture-designs.md` calls out as non-negotiable. Nothing is submitted until the student explicitly approves here. It lives at `/applications/review`.

- [x] Create `app/(app)/applications/review/page.tsx` as a server component. Server-side, fetch the student's profile, academic records, and document list using the typed API client — this is what will be submitted alongside each application. Redirect to `/applications/new` if the selection is missing programme/year fields
- [x] Create `components/applications/review-screen.tsx` — client component that renders:
  - **Profile section** — a read-only summary mirroring `components/profile/overview.tsx`. If any required field is missing, show a "Complete your profile" inline banner with a link to `/profile/setup`. Block the "Submit" button until fixed
  - **Academic records section** — subjects + marks + institution + year. Same completeness check and blocker pattern
  - **Documents section** — list of uploaded documents by type, with a check/cross per required slot. Same completeness check
  - **Applications list** — one row per selection showing university name, programme, application year, and an "Edit" link back to `/applications/new`
  - **Submit button** — disabled until every completeness check passes and the terms checkbox below is ticked
  - **Consent checkbox** — "I confirm the details above are correct and authorise Uniflo to submit applications on my behalf." Mandatory. POPIA-adjacent — see `docs/architecture-designs.md` section 13
- [x] On submit, POST each selection to `/applications` sequentially (not in parallel — sequential is simpler to report on and rate-limit-friendly). If one fails, stop and show the error with a retry affordance; earlier successes remain submitted
  - Partner B is the source of truth for deadlines. A 4xx from `POST /applications` with a deadline-related error code renders as a clear "Applications to X have closed" message per row
- [x] On all-success, clear the selection context and redirect to `/applications` (the dashboard from Task 6) with a success toast/inline banner

**Deliberate non-goals:** No edit-in-place on this screen — the "Edit" link sends them back to `/applications/new`. The review screen is read-only by design. Confidence scoring UI is Phase 3, not this task.

**Squash commit:** `feat: add application review and submit flow`

---

## Task 6 — Application status dashboard
**Branch:** `feature/applications-dashboard`

After submission, students need to see what happened to each application. The dashboard lives at `/applications` (the list) with optional detail at `/applications/[id]`.

- [x] Create `app/(app)/applications/page.tsx` as a server component. Server-side fetch `GET /applications` (see contract locked with Partner B — includes the latest job summary per row). Render the list immediately on first paint
- [x] Create `components/applications/application-list.tsx` — client component owning "refresh" behaviour (see below) and receiving the initial list as a prop
- [x] Create `components/applications/status-badge.tsx` — maps the four status strings to coloured pills:
  - `pending` — neutral (grey). Label: "Queued"
  - `processing` — info (blue). Label: "Submitting…"
  - `submitted` — success (green). Label: "Submitted"
  - `failed` — destructive (red). Label: "Failed"
  - Derive colours from the existing design tokens. Do not hardcode hex values
- [x] Each row shows: university name, programme, application year, status badge, `updated_at` (relative time, e.g. "2 minutes ago"), and a "View" link to the detail page
- [x] **No Supabase Realtime.** `CLAUDE.md` is explicit that realtime is post-MVP. The dashboard refreshes on page load. Add a visible "Refresh" button that re-fetches the list — this is the manual equivalent and is the intended MVP behaviour
- [x] Create `app/(app)/applications/[id]/page.tsx` — server-side fetch `GET /applications/{id}`. Show the application fields plus the latest job record's `status`, `attempts`, `last_error` (if any). Screenshot URL is rendered if present but is a Phase 3 deliverable — guard the code path
- [x] Failed-state handling: when a row is `failed`, the detail page shows the `last_error` clearly and offers a "Retry" button that POSTs to an endpoint Partner B exposes (confirm the shape — likely `POST /applications/{id}/retry` or similar). If retry isn't wired in Phase 2, show a "Contact support" placeholder that Partner B can swap in Phase 3
- [x] Empty state: no applications yet — show an illustration or icon with a "Browse universities" CTA to `/universities`
- [x] Add `/applications` to the sidebar. The dashboard profile-completeness card (from Phase 1) gains a new line: "Applications: N submitted" pointing to this page
- [x] Mobile: rows become cards, badge + university name remain on one line at 375px

**Squash commit:** `feat: add application status dashboard with list and detail views`

---

## Task 7 — Polish, error paths, and dashboard integration
**Branch:** `feature/phase-2-polish`

A dedicated polish branch at the end of Phase 2, mirroring the `feature/phase-0-1-review` pass that closed Phase 1. Use it for:

- [ ] End-to-end click-through on the Vercel preview: universities → selection → form → review → submit → dashboard → detail. Capture bugs as they surface, fix them in small commits
- [ ] Consolidate any duplicated constants (status-label maps, date formatters) into `lib/constants/` or `lib/utils/`
- [ ] Update the Phase 1 dashboard (`app/(app)/dashboard/page.tsx`) to surface the latest application statuses alongside profile completeness — one card per data domain
- [ ] Make sure every Phase 2 screen has proper `<title>` metadata (server components) — search engines should not see generic titles
- [ ] Mobile sweep: every new screen tested at 375px and 390px viewports on real devices if available, browser DevTools otherwise. Sidebar collapses, forms fit, sticky selection bar doesn't clip content
- [ ] Accessibility sweep: every new form field has a label, every interactive icon has an `aria-label`, the status badges expose the status text to screen readers not just colour
- [ ] Write the cross-task review doc `docs/phase-2/phase-2-review.md` summarising what shipped in Phase 2, open risks, and what unblocks Phase 3
- [ ] Confirm `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm run test`, and `npm run build` are all green locally

**Squash commit:** `chore: phase 2 polish, error paths, and dashboard integration`

---

## Phase 2 Checkpoint

Before signing Phase 2 off, verify the full flow manually on the Vercel preview:

- [ ] Sign in as a student with a complete Phase 1 profile (personal details, academic records, all three documents uploaded)
- [ ] Browse `/universities` — initial list paints without a loading flash, status pills show open/closed correctly
- [ ] Search: type a partial name, list filters correctly within ~300ms. Clear the search, full list returns
- [ ] Select two universities. Selection bar appears with "2 selected" and a "Continue" button
- [ ] Click "Continue" → `/applications/new` shows one fieldset per selected university
- [ ] Submit empty → validation errors per field. Fill in valid programme and year for both
- [ ] Click "Review" → `/applications/review` shows profile, academic records, documents, and both applications
- [ ] Try submit without consent checkbox — button stays disabled
- [ ] Delete one of the documents in Supabase Storage manually → refresh review → completeness fails, submit blocks, link to `/documents` appears
- [ ] Re-upload the document, return, submit — both applications POST sequentially, redirect to `/applications`
- [ ] Dashboard shows both rows with status `pending` → after the backend BackgroundTasks stub runs, status moves to `processing` then `submitted` or `failed`
- [ ] Click a row → detail page shows application fields and latest job status
- [ ] Force a failure (Partner B can flag one university in the fake adapter) — status shows `failed`, detail page shows the error
- [ ] Sign out → redirected to `/login`. Sign back in → land on dashboard with applications still listed
- [ ] Full flow at 375px viewport — no horizontal scroll on any screen, all buttons reachable
- [ ] Deep-link to `/applications/new` signed out → redirected to `/login`
- [ ] Deep-link to `/applications/new` signed in with empty selection → redirected to `/universities`

All of the above must work on a mobile viewport (375px width minimum). SA users are mobile-first — see `docs/architecture-designs.md` section 1.

All CI checks must be green: ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest.

---

## Environment Variables for Phase 2

No new runtime env vars are expected. Confirm these remain in `.env.local` and `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend API
NEXT_PUBLIC_API_URL=  # Render dev URL from Partner B
```

One dev-time variable is introduced in Task 1:

```bash
# Used by `npm run types:api` to locate the OpenAPI spec
OPENAPI_SPEC_URL=http://localhost:8000/openapi.json
```

This is only read by the type-generation script, not by the Next.js runtime, so it does not need the `NEXT_PUBLIC_` prefix. It must still be added to `.env.example` per the ongoing rule in `docs/build-action-plan.md`.

---

## What Is Explicitly Out of Scope for Phase 2

Do not build any of the following — they belong to later phases or are explicitly post-MVP:

- Confidence scoring UI for flagged low-confidence field mappings (Phase 3)
- Submission confirmation screen with screenshot proof (Phase 3)
- Real Playwright adapters or Claude field mapping — these are Partner B's Phase 3 work
- Portal health monitoring UI (Phase 3)
- Supabase Realtime / live status updates (post-MVP) — the dashboard refreshes on page load, with a manual "Refresh" button. See `CLAUDE.md`
- Payments / PayFast (post-MVP)
- SMS notifications (post-MVP)
- Draft persistence across sessions for in-progress selections — see "A note on draft state" above
- Essay / motivation letter AI assistance (post-MVP)
- PostHog analytics (post-MVP)
- React Native mobile app (post-MVP)

See `docs/build-action-plan.md` MVP scope for the full out-of-scope list.

---

## Risks and Open Questions

Tracked here so they aren't lost between sync meetings. Resolve before or during the task they gate.

- **Resolve before Task 1:** Is Partner B's OpenAPI spec published and stable? If not, Phase 2 is blocked.
- **Resolve before Task 2:** Does `GET /universities` return the full list or is pagination required? The plan assumes full list for MVP scale (3–5 seeded rows). Confirm.
- **Resolve before Task 4:** What is the valid range for `application_year`? The plan defaults to `[currentYear, currentYear + 1]` if ambiguous.
- **Resolve before Task 5:** What does a deadline-related `POST /applications` error look like (status code + body shape)? The review screen needs this to render a meaningful per-row error.
- **Resolve before Task 6:** What is the retry endpoint for `failed` applications? If not in Phase 2 scope, confirm the placeholder copy with Partner B.
- **Resolve before Task 6:** Does `GET /applications` include the latest job summary per application, or does the frontend need a second request per row? The plan assumes pre-joined; the alternative is much worse for dashboard performance.
