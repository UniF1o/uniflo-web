# Phase 3 Review

> Cross-phase review doc, mirrors `docs/phase-2/phase-2-review.md`.

## Headline

The frontend now renders every Phase 3 signal the automation layer will
emit: per-field confidence flags with a per-university gate before submit,
submission proof (screenshot + portal reference + verified timestamp), and
a structured-failure surface with friendly copy, a retry path, and the
portal-unavailable 503 handled per-row on the review screen. Phase 3 on
the `uniflo-web` side shipped as a single feature branch (`feature/phase-3`)
rather than the five sub-branches the original Partner A plan suggested —
see "Deviation from plan" below.

## What's in this PR

### New surface

- **Confidence-flagging UI on the review screen** — `FieldMappingReview`
  renders per university, summarises high-confidence fields, lists the
  flagged ones with reasoning in a `<details>` block, and exposes a
  per-university "I've reviewed flagged fields" checkbox that gates the
  Submit button. Edit-pivot links route to `/profile`,
  `/academic-records`, or `/documents` based on the source-field prefix.
- **Submission proof on the application detail page** — `SubmissionConfirmation`
  renders the captured screenshot, the portal reference (click-to-copy),
  and a "Submitted to X on date at time" headline. Renders a fallback
  copy line when the screenshot upload hasn't landed yet. Every Phase 3
  field is presence-checked.
- **One-shot celebration banner** — fires from `?just_submitted=true`,
  surfaces on the applications list (post-submit redirect target) and on
  the detail page (deep-link friendly). Strips the query param on mount.
- **Failed-state surface on the detail page** — destructive alert with
  friendly copy, `<details>` block with the raw message for support,
  retry button when the error is retryable, mailto contact-support when
  it isn't. Retry handles 202 / 409 / 5xx distinctly.
- **Per-row 503 portal-unavailable on the review screen** — the submit
  loop continues past the rejection so earlier rows stay submitted; the
  failed row gets an inline message and a "Retry just this one" affordance.
- **Dashboard surfacing** — failed-applications card pops only when at
  least one application is in `failed` so the dashboard stays calm
  otherwise. Submitted-counts card retained from Phase 2.
- **List indicators** — small image icon on rows whose latest job has a
  screenshot. Status-badge tooltip on failed rows uses the friendly copy.

### Plumbing

- `lib/api/phase-3.ts` — type overlay for the new shapes (until Partner B
  publishes the spec) plus typed helpers: `getFieldMappings`,
  `previewFieldMappings`, `retryApplication`, `parseJobError`,
  `isPortalUnavailable`.
- `lib/constants/confidence.ts` — `CONFIDENCE_THRESHOLD = 0.85` single
  source of truth.
- `lib/applications/failure-copy.ts` — `JobErrorCode` → copy map plus
  `isRetryable` combiner.
- `.env.example` — adds `NEXT_PUBLIC_SUPPORT_EMAIL` (defaults in code to
  `support@uniflo.co.za`).
- `vitest.config.ts` + `vitest.setup.ts` — `@testing-library/react`
  wired with auto-cleanup so component tests don't leak DOM.

### Tests

- 33 tests across 5 files, all passing locally and in CI:
  - `lib/constants/confidence.test.ts`
  - `lib/api/phase-3.test.ts`
  - `lib/applications/failure-copy.test.ts`
  - `components/applications/field-mapping-review.test.tsx`
  - `tests/cn.test.ts` (Phase 2 carry-over)

## Deviation from plan

The original Partner A plan (`docs/phase-3/partner-a-phase-3-plan.md`)
listed five sub-branches: `feature/phase-3-types`,
`feature/confidence-flagging`, `feature/submission-proof`,
`feature/failure-and-retry`, `feature/phase-3-polish`. Per the request
that opened Phase 3, the work was bundled onto a single
`feature/phase-3` branch with a single PR. The squash commit reflects the
combined scope. The five tasks were still tracked discretely (see the
per-task write-ups in this folder); the only thing that changed is the
shape of the merge.

## What didn't ship

These are explicitly out of scope per the plan and remain post-MVP:

- Edit-in-place on the review screen — Phase 2's edit-pivot pattern
  stays.
- Supabase Realtime live status updates — refresh-on-load and the manual
  Refresh button continue to carry the dashboard.
- PDF export, email sharing, social sharing of the screenshot.
- Admin dashboard for portal health — Sentry alerting covers the team.

## Verification once Partner B's backend lands

Run through the Phase 3 Checkpoint from the partner-a plan once the
backend ships the field-mappings endpoint, structured `last_error`,
retry-202/409, and portal-unavailable 503:

1. Sign in with a complete profile + uploaded documents.
2. Select three universities (one per shipped adapter) and provide
   programmes + years.
3. On the review screen verify each university has its field mappings
   rendered. At least one university should show low-confidence flags.
4. Confirm the submit button is blocked until every flagged university
   has its checkbox ticked.
5. Submit. Watch the list page move pending → processing → submitted
   for each row. The celebration banner should appear once.
6. Open a submitted detail page — verify the screenshot, the portal
   reference (with copy), and the verified timestamp render correctly.
7. Force one application to fail via Partner B. Verify the destructive
   alert uses the friendly copy, the `<details>` exposes the raw
   message, and the Retry button posts to `/applications/{id}/retry`.
8. Trigger Retry. Confirm the optimistic status update, the toast, and
   the 5-second lockout. Hit Retry again — should be inert.
9. Trigger a 409 from the retry endpoint. Confirm the conflict copy
   surfaces and the button stays locked.
10. Force portal-unavailable on one university during the review submit.
    Earlier rows should stay submitted; the affected row should show the
    inline message and "Retry just this one" link.
11. Mobile sweep at 375px on every Phase 3 surface.

## Open risks

- **No live click-through yet.** The full happy path isn't exercised end
  to end because Partner B's Phase 3 backend isn't published. The
  frontend degrades gracefully today (mapping shows "in progress",
  detail page renders the Phase 2 raw-error fallback) but the structured
  paths only land once the backend catches up.
- **`/applications/preview/field-mappings` is a Partner-A-suggested URL.**
  Partner B may choose differently. The fix is one URL change inside
  `previewFieldMappings`.
- **`<img>` instead of `next/image` for the screenshot.** Pinned to
  plain `<img loading="lazy">` because the Supabase Storage URL pattern
  isn't locked. Swap once the bucket / signed-URL decision lands.
- **No live integration tests on the retry / portal-unavailable flows.**
  Unit-tested via mocks; manual verification deferred to backend
  availability. Logged on the Phase 3 Checkpoint.
- **Component tests are introduced for the first time in this PR.**
  Footprint is small (one component test file). The auto-cleanup hook
  in `vitest.setup.ts` is the new contract — any future component
  test relies on it.

## What unblocks Phase 4

Phase 4 (per `docs/build-action-plan.md`) is beta launch. The frontend
gates for beta:

- Partner B's spec published + types regenerated (`npm run types:api`)
  with the overlay deleted in favour of the schema types.
- End-to-end click-through complete on the live backend.
- Switch from public Supabase bucket to signed URLs for screenshots (the
  plan flags this as a Phase 4 hardening item).
- Sentry breadcrumbs on retry-button posts and field-mapping fetches —
  not yet wired, deferred behind "what unblocks Phase 4 hardening" in
  the partner-b plan.
