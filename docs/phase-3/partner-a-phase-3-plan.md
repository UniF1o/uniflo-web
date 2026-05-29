# Uniflo — Partner A Detailed Phase 3 Plan (`uniflo-web`)

> Scoped strictly to Phase 3 work in `uniflo-web`. All decisions and constraints referenced here derive from `docs/architecture-designs.md`, `docs/build-action-plan.md`, and `docs/git-github-workflow.md`. Per-task write-ups go under `docs/phase-3/` following the pattern already set by `docs/phase-1/` and `docs/phase-2/`.
>
> **Note on existing `docs/phase-3/` files.** The three docs already in this folder (`task-1-redesign-foundations.md`, `task-2-phase-2-audit.md`, `task-3-academic-records-accommodation.md`) capture redesign and audit work that ran in parallel with Phase 3 prep but sit outside the build plan. Treat this plan as the authoritative Partner A scope for the phase. Tasks below restart numbering at 1 for clarity — feel free to rename the existing docs to `interim-*` if the dual numbering causes confusion.

---

## Phase 3 Goal

The frontend surfaces every signal the real automation layer now generates. Students see which fields Claude was unsure about and review them before approving. After submission, they see proof their application was actually submitted — the screenshot the adapter captured on the live portal's confirmation page. When something fails, they see a clear reason and can retry. When a portal is down for maintenance, they see that too — without anything being submitted.

Partner A's Phase 3 work is deliberately small. Per `docs/build-action-plan.md`, the automation, Claude integration, and adapter work belong entirely to Partner B. Partner A's role is the UI for confidence scoring, the submission proof screen, and the failed/retry states.

**Duration:** Weeks 9–14 (the same window as Partner B; Partner A starts later — Tasks 2–4 unblock once Partner B's API surface is live around week 11)
**Reference tag:** `[PHASE-3]`

---

## Before You Write a Single Line of Code

**Do this with Partner B first. Do not skip it.**

Partner B's plan (`docs/phase-3/partner-b-phase-3-plan.md`) introduces three new contracts that govern almost every Partner A task. None of the tasks below should start until the OpenAPI spec carries the shape Partner A renders.

### 1. Lock the field-mapping shape with Partner B

The review screen flags low-confidence fields. The endpoint that returns those flags is the single biggest contract this phase. Confirm with Partner B:

- **Endpoint location.** Most likely `GET /applications/{id}/field-mappings` returning a list of per-field entries. Partner A's recommendation: a dedicated endpoint, not inlined on `/applications/{id}` — the review screen fetches it separately and it grows over time as adapters re-run
- **Per-entry shape.** Aligned with Partner B's `FieldMappingEntry`:
  ```json
  {
    "field_id": "school-leaving-results",
    "label": "School-leaving results",
    "value": "Mathematics 78%, Physical Sciences 71%, ...",
    "confidence": 0.62,
    "reasoning": "Mapped from academic_records.subjects; portal expects free-text",
    "source_profile_field": "academic_records.subjects"
  }
  ```
- **Confidence threshold.** What counts as "low confidence"? Default: < 0.85 from Partner B's plan. Share the constant in `lib/constants/confidence.ts` so the visual threshold is single-sourced — never literal-numbered in components
- **Grouping.** Are field mappings grouped by portal section (personal, academic, documents) or returned flat? Flat is simpler for MVP; the UI groups by the entry's category if Partner B supplies one
- **Per-university or per-application?** A student applying to three universities sees three sets of mappings. Confirm the endpoint returns mappings for one application — Partner A iterates by `application_id`

### 2. Lock the screenshot and submission confirmation shape

The submission proof screen needs:

- The URL of the screenshot stored in Supabase Storage (`application_jobs.screenshot_url` from the schema)
- The portal's reference number (the thing the student would quote to the university)
- The exact `submitted_at` timestamp from the portal, not just our DB timestamp

Partner A's expected shape on `GET /applications/{id}`:
```json
{
  "id": "uuid",
  "status": "submitted",
  "submitted_at": "2026-10-12T14:23:00Z",
  "latest_job": {
    "id": "uuid",
    "status": "submitted",
    "screenshot_url": "https://supabase.example.com/storage/v1/object/public/...",
    "portal_reference": "UCT-2026-A12345",
    "verified_at": "2026-10-12T14:23:00Z",
    "last_error": null
  }
}
```

If Partner B isn't ready to expose `portal_reference` and `verified_at` separately, Partner A degrades gracefully — render only what's present. Guard every new field with a presence check.

### 3. Lock the failure taxonomy

Per Partner B's plan, `application_jobs.last_error` is either a free-text string or a structured `{ code, message, retryable }` object. Partner A strongly prefers structured:

- `code` lets the UI render friendly copy (e.g. `auth_failed` → "We couldn't sign in to the portal — please contact support")
- `retryable` toggles whether the "Retry" button shows on the detail page
- `message` is a developer-facing fallback rendered in a `<details>` block for support

Get the codes locked. Default set Partner A expects:

| `code` | UI message | Retryable |
| --- | --- | --- |
| `portal_changed` | "The university portal changed unexpectedly. Our team has been notified." | No (team must fix) |
| `auth_failed` | "We couldn't sign in to the portal. Please contact support." | No |
| `validation_failed` | "The portal rejected the application. {message}" | Yes |
| `timeout` | "The portal didn't respond in time. We'll try again automatically." | Yes |
| `portal_unavailable` | "Applications to {university} are temporarily unavailable." | Yes |
| `unknown` | "Something went wrong. Our team has been notified." | Yes |

### 4. Lock the retry endpoint

Per Partner B's plan, `POST /applications/{id}/retry` returns `202` + the refreshed application row. Confirm:

- 409 if the application is already `processing` or `submitted` — Partner A disables the retry button when this state would apply
- Idempotency — clicking Retry twice in 5s does not enqueue twice
- No body required

### 5. Lock the portal-unavailable signal on `POST /applications`

Per Partner B's Task 6, when an adapter is flagged unhealthy, `POST /applications` rejects with `503` + `{ "code": "portal_unavailable", "university": "UCT" }`. Partner A's review screen renders this per-row on the submit attempt — earlier-row successes stay submitted, the unavailable row gets a clear message. Same pattern as Phase 2 deadline rejections.

---

## How to Work Through This Plan

Same workflow rules as Phases 1 and 2 — see `docs/git-github-workflow.md`:

```bash
git fetch origin
git checkout main && git pull --ff-only origin main
git checkout -b feature/<task-branch-name>

# When done — open a PR to main, CI green, Squash and Merge
```

Opening a PR generates a **Vercel Preview URL**. Test every UI change there before merging. Test the failure paths against Partner B's dev backend with deliberately failed applications — Partner B can flag a test adapter to fail on demand.

CI must pass (ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest) before any PR merges.

At the end of each task branch, drop a write-up in `docs/phase-3/` as `task-<n>-<slug>.md`. Use the existing `task-N` files as the example.

**Playwright MCP after every UI change.** Per the project rule, exercise every new screen at desktop (1440), tablet (768), and mobile (375) viewports via the Playwright MCP server before committing. Confidence-flag UI and screenshot proof especially — both are visually load-bearing.

---

## Task 1 — Regenerate API types + extend the client for Phase 3
**Branch:** `feature/phase-3-types`

A small gating task — same shape as Phase 2 Task 1. Once Partner B has the new endpoints and fields published in the OpenAPI spec, regenerate types and add typed helpers for the new shapes.

- [ ] Run `npm run types:api` against Partner B's updated spec. Commit the regenerated `lib/api/schema.d.ts`
- [ ] Confirm `paths['/applications/{id}/field-mappings']`, the `screenshot_url`/`portal_reference`/`verified_at` fields on `latest_job`, and the `POST /applications/{id}/retry` endpoint all type-check
- [ ] Add a `lib/constants/confidence.ts` constant exporting the threshold (default `0.85`). Single source of truth — components import from here, never literal-numbered
- [ ] Extend `lib/api/client.ts` if any new helpers are needed (e.g. a typed `getFieldMappings(applicationId)` helper). Resist adding helpers for things that are one-line `client.get(...)` calls — the existing client is already generic
- [ ] Verify the existing review screen, applications list, and detail page still compile with the regenerated types
- [ ] Document the regen in `docs/phase-3/task-1-phase-3-types.md`

**Why:** Every Phase 3 task below depends on these types being current. Doing the regen in its own PR keeps the diffs on subsequent tasks focused on the actual feature work.

**Dependency on Partner B:** Partner B must have published the spec with field mappings, screenshot proof fields, retry endpoint, and the failure taxonomy. If any are missing, this task is blocked.

**Squash commit:** `chore(api): regenerate types for phase 3 endpoints`

---

## Task 2 — Confidence-flagging UI on the review screen
**Branch:** `feature/confidence-flagging`

The review screen already exists from Phase 2 (`components/applications/review-screen.tsx`). Phase 3 layers low-confidence field warnings on top — the student sees which fields Claude was unsure about and can manually verify before approving.

- [ ] Server-side on `app/(app)/applications/review/page.tsx`: for every selected university, fetch its `field-mappings` ahead of time. Run the fetches in parallel (`Promise.all`) — the review screen is the user's confirmation gate and shouldn't slow down further
- [ ] If `field-mappings` is unavailable for a given selection (e.g. Partner B's mapping job hasn't run yet), render the per-row state as "Mapping in progress — refresh shortly" without blocking the rest of the screen. Add a refresh affordance per row
- [ ] Build `components/applications/field-mapping-review.tsx`:
  - Renders per university, expandable section (default collapsed on mobile to keep the review screen scannable)
  - Inside: one row per low-confidence field (filtered using the shared threshold from `lib/constants/confidence.ts`)
  - Each row shows: field label, the value Claude will submit, the confidence as a percentage, the reasoning (in a `<details>` block — supporting copy, not load-bearing)
  - High-confidence fields are summarised as "N fields auto-filled" without individual rows. Students only need to look at what's flagged
- [ ] Add a per-row "Confirm" checkbox or a single "I've reviewed the flagged fields" checkbox at the section bottom. The Phase 2 consent checkbox stays — this is an additional gate, not a replacement
- [ ] The "Submit" button on the review screen now requires:
  - All Phase 2 gates (profile completeness, documents, consent checkbox)
  - The new "I've reviewed flagged fields" checkbox is ticked **per university with flagged fields**. Universities with zero flagged fields don't need the extra confirmation
- [ ] Empty / all-confident state: when a university's mappings come back with zero low-confidence fields, render a small "All fields auto-filled with high confidence" badge — students like positive reinforcement
- [ ] Edit-pivot: if the student wants to fix a flagged field, the row links back to wherever that profile field lives (`/profile` for personal fields, `/academic-records` for academic, `/documents` for document scans). They edit there and return to the review screen. No edit-in-place — the review screen stays read-only by design (continuing Phase 2's policy)
- [ ] Tests:
  - Unit tests for the confidence filter and the "all confident" reduction
  - Component test for `field-mapping-review.tsx` covering: low-confidence rows render, high-confidence rows don't, the "Confirm" checkbox toggles the submit-blocked state
- [ ] Playwright MCP — desktop, tablet, mobile screenshots of: a university with multiple flagged fields, a university with zero flagged fields, the "mapping in progress" state, the submit button correctly blocked until checkboxes are ticked

**Deliberate non-goals:** No edit-in-place. No "override Claude" controls — the student can only confirm or pivot to fix the source data. No bulk-confirm across universities — per-university confirmation is a deliberate friction point

**Squash commit:** `feat: confidence-flagging UI for low-confidence field mappings`

---

## Task 3 — Submission confirmation screen with screenshot proof
**Branch:** `feature/submission-proof`

When the adapter successfully submits, it captures a screenshot of the portal's confirmation page. The student sees this as proof on the application detail page — and ideally a celebration moment right after submission lands.

- [ ] Extend `app/(app)/applications/[id]/page.tsx` (the Phase 2 detail page) with a new "Submission confirmation" section that renders when `latest_job.status === "submitted"`:
  - The screenshot (lazy-loaded `<Image>` via Next.js, sized for the layout, with a "View full-size" link that opens in a new tab)
  - The portal reference number (when present), prominently displayed with a click-to-copy affordance
  - The portal's `verified_at` timestamp (when present) — "Submitted to UCT on 12 October 2026 at 14:23"
  - Guard every new field with a presence check. Phase 3 ships incrementally — `portal_reference` may not be available for every adapter on day one
- [ ] Build `components/applications/submission-confirmation.tsx` — the section above, isolated so it's testable and reusable for the celebration screen
- [ ] Build a one-shot celebration moment when the user lands on the detail page for the first time after submission (e.g. via `?just_submitted=true` query param the redirect from review sets). Use the design system's confetti `DotCluster` motif and a single-line "🎉 You're applied" Caveat note. Subtle — the screenshot is the hero
- [ ] Screenshot fallback: if `screenshot_url` is missing but `status === "submitted"`, render "Confirmation screenshot will appear here within a few minutes" — adapters upload after status updates and there's a small race window
- [ ] The applications list view (`components/applications/application-list.tsx`) doesn't change — the screenshot is too heavy for the list. Add a small icon indicator that a row has a confirmation screenshot available, linking through to the detail
- [ ] Tests:
  - Component test for `submission-confirmation.tsx` — renders all fields, renders the fallback, renders gracefully with missing optional fields
  - Snapshot the celebration banner so visual regressions in the motif are caught
- [ ] Playwright MCP — desktop and mobile screenshots of: a submitted application with full proof, a submitted application missing optional fields, the post-submission celebration state

**Deliberate non-goals:** No PDF export of the confirmation — students can save the screenshot themselves. No email-the-confirmation feature — Resend integration is Partner B's, and a "submitted" transactional email already covers this. No social-share buttons — too noisy for an MVP confirmation surface

**Squash commit:** `feat: submission confirmation screen with screenshot proof`

---

## Task 4 — Failed state, retry, and portal-unavailable handling
**Branch:** `feature/failure-and-retry`

Phase 2 ended with a placeholder "Contact support" path on failed applications. Phase 3 makes failures actionable — the student sees the reason, retries when it's safe to, or knows to wait when it isn't.

- [ ] Build `lib/applications/failure-copy.ts` — a typed map from Partner B's `last_error.code` to the user-facing copy (per the failure taxonomy table in the "Before you write code" section above). The map is the single source of truth — components reference it, never inline copy
- [ ] Extend `app/(app)/applications/[id]/page.tsx` for `status === "failed"`:
  - Headline state: tonal `<Alert tone="destructive">` summarising the failure (the friendly copy from the map)
  - Details block: a `<details>` collapsing the `last_error.message` for support. Students don't read this — support does
  - "Retry" button when `last_error.retryable === true`:
    - POSTs to `/applications/{id}/retry`
    - Shows a loading state during the request
    - On 202: optimistically updates the row to `pending`, shows a toast "Retrying — we'll update the status shortly"
    - On 409: surfaces the conflict ("Already retrying — please refresh shortly") and removes the button
    - On 5xx: shows a destructive alert with a refresh link
  - "Contact support" link when `last_error.retryable === false`. Use a `mailto:` for MVP — a real support form is post-MVP
- [ ] Update `components/applications/application-list.tsx` to use the same friendly copy on the failure status badge tooltip
- [ ] Extend `components/applications/review-screen.tsx` for the `503 portal_unavailable` rejection during the submit loop:
  - Earlier-row successes stay submitted (same pattern as Phase 2's deadline rejection)
  - The rejected row gets a clear "Applications to {university} are temporarily unavailable — please try again later" inline message
  - The student can re-submit only the unavailable row by clicking "Retry just this one"
- [ ] Tests:
  - Unit tests for the failure-copy map — every code in the taxonomy has copy, no missing keys
  - Component test for the retry button — 202 / 409 / 5xx paths
  - Component test for the review-screen 503 path — partial-success scenario
- [ ] Playwright MCP — desktop and mobile screenshots of: a failed application with retry available, a failed application without retry, the portal-unavailable rejection on the review screen, the post-retry "queued" state

**Deliberate non-goals:** No retry-N-times UI — Partner B handles automatic retries server-side. No persistent failure dashboard — Sentry is the team's alerting surface. No estimated wait time for portal-unavailable — Partner B's health checker runs daily and "try again later" is honest enough for MVP

**Squash commit:** `feat: failed state with retry, friendly copy, and portal-unavailable handling`

---

## Task 5 — Phase 3 polish, dashboard surfacing, runbook
**Branch:** `feature/phase-3-polish`

A polish branch at the end of Phase 3, mirroring `feature/phase-2-polish`. Use it for cross-cutting cleanups and the cross-phase review doc.

- [ ] End-to-end click-through on the Vercel preview against the real backend:
  - Submit two applications. Verify Claude's mappings render correctly on the review screen
  - Approve and submit. Watch the dashboard move `pending` → `processing` → `submitted`
  - Confirm the screenshot proof renders on the detail page within a few minutes
  - Force a failure (Partner B can flag an adapter). Verify the failed state, friendly copy, and retry flow
  - Force portal-unavailable. Verify the review screen handles it cleanly
- [ ] Update the dashboard (`app/(app)/dashboard/page.tsx`) to surface submission counts and any flagged failures requiring student action — one tinted card linking to `/applications`
- [ ] Confirm every new screen has proper `<title>` metadata via the App Router's `generateMetadata`
- [ ] Mobile sweep at 375px on every Phase 3 screen — review screen with field mappings expanded, detail page with screenshot, retry flow, portal-unavailable state
- [ ] Accessibility sweep — every confidence row exposes the score as text not just colour, every retry button has a clear `aria-label` during the loading state, the screenshot has alt text describing what it depicts
- [ ] Cross-phase review doc `docs/phase-3/phase-3-review.md` summarising what shipped, open risks, what unblocks Phase 4
- [ ] Confirm `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm run test`, and `npm run build` are all green locally

**Squash commit:** `chore: phase 3 polish, dashboard surfacing, and review doc`

---

## Phase 3 Checkpoint

Before signing Phase 3 off, verify the full flow manually on the Vercel preview against Partner B's live dev backend:

- [ ] Sign in as a test student with a complete profile and uploaded documents
- [ ] Select three universities (one per shipped adapter), provide programmes + years
- [ ] On the review screen, every university has its field mappings rendered. At least one shows low-confidence flags
- [ ] The submit button is blocked until the per-university "I've reviewed flagged fields" checkbox is ticked for every flagged section
- [ ] Submit. Dashboard moves through `pending` → `processing` → `submitted` (or `failed`) for each application
- [ ] Each submitted application's detail page shows the screenshot proof, the portal reference (if available), and the verified timestamp
- [ ] The first-visit celebration banner renders once and doesn't re-render on subsequent visits
- [ ] Force one application to fail via Partner B. The detail page shows friendly copy, a retry button (if retryable), and a `<details>` block with the raw error
- [ ] Click retry. The row returns to `pending`, the button locks out for a short interval to prevent double-clicks
- [ ] Trigger portal-unavailable on one university during the review submit loop. Earlier rows are submitted; the unavailable row shows the inline message and a "Retry just this one" link
- [ ] Full flow at 375px mobile viewport — no horizontal scroll, all controls reachable, screenshot proof responsive
- [ ] Sign out and back in. The detail pages still render correctly. Confirmation screenshots are still accessible

All CI checks green: ESLint + Prettier `format:check` + `tsc --noEmit` + Vitest.

---

## Environment Variables for Phase 3

No new runtime env vars are expected on the frontend. Confirm these remain in `.env.local` and `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
OPENAPI_SPEC_URL=http://localhost:8000/openapi.json
```

The screenshot proof images are served by Supabase Storage's public URL (no signed-URL flow in MVP — the bucket is public for confirmation screenshots, gated by the unguessable storage path).

If Partner B decides screenshots should be private with signed URLs, add a `NEXT_PUBLIC_SCREENSHOT_BUCKET` and switch to `supabase.storage.from(bucket).createSignedUrl(path, ttl)` on the server. Park that as a Phase 4 hardening task unless Partner B raises it earlier.

---

## What Is Explicitly Out of Scope for Phase 3

Per `docs/build-action-plan.md`, Partner A does **not** build:

- Playwright adapters or any portal automation — Partner B
- Claude API integration or field mapping logic — Partner B (Partner A only renders the output)
- Portal health monitoring or alerting — Partner B (Partner A only surfaces the `503` rejection)
- Supabase Realtime / live status updates — post-MVP. The dashboard refreshes on load and the manual "Refresh" button from Phase 2 stays
- Payments (PayFast), SMS notifications, essay AI assistance, PostHog analytics, React Native mobile — all post-MVP
- Edit-in-place on the review screen — Phase 2's edit-pivot pattern stays
- An admin dashboard for portal health — Sentry alerts cover the team's needs
- PDF export, email sharing, or social sharing of the confirmation screenshot

---

## Risks and Open Questions

Tracked here so they aren't lost between sync meetings. Resolve before or during the task they gate.

- **Resolve before Task 1:** Has Partner B published the new OpenAPI spec covering field mappings, screenshot proof fields, retry endpoint, and the failure taxonomy? If not, every Phase 3 task is blocked
- **Resolve before Task 2:** Final shape of the `field-mappings` endpoint — separate endpoint (recommended) vs inlined on `/applications/{id}`. The plan assumes separate
- **Resolve before Task 2:** Confidence threshold — defaulting to `0.85`. Confirm with Partner B and lock in `lib/constants/confidence.ts`
- **Resolve before Task 3:** Are submission screenshots stored in a public Supabase bucket or do they need signed URLs? The plan assumes public for MVP — flag if Partner B disagrees
- **Resolve before Task 4:** Final failure taxonomy. The default map in the "Before you write code" section is Partner A's recommendation — Partner B locks it
- **Ongoing risk:** Vercel cold starts on the review screen's `Promise.all` of field-mapping fetches. If perceived latency is bad, fall back to streaming the mappings in client-side after first paint — but optimise only if measured to be a problem
- **Ongoing risk:** Screenshot file sizes. If Partner B's screenshots are multi-MB PNGs, the detail page gets heavy on mobile. Confirm screenshots are JPEG-compressed or have a reasonable max width before Task 3
