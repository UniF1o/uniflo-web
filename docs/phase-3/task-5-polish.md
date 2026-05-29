# Task 5 — Phase 3 polish, dashboard surfacing, runbook

**Branch:** `feature/phase-3`

## What shipped

- `app/(app)/dashboard/page.tsx` — surfaces a new "needs your attention"
  card when at least one application has `status === "failed"`, linking
  through to `/applications`. Uses the destructive tone tokens so it reads
  as "look here next" without claiming as much weight as a full alert.
  The existing submission counts card is unchanged.
- Verified `generateMetadata` / `export const metadata` on every
  authenticated route — all 14 `app/(app)/**/page.tsx` files declare a
  title.
- `vitest.config.ts` — wired `setupFiles`, `resolve.alias` for `@/...`
  imports, and an `exclude` so `node_modules` vendor tests don't get
  globbed.
- `vitest.setup.ts` — wires `@testing-library/jest-dom` matchers and
  registers an `afterEach(cleanup)` so component tests don't see DOM
  leaks across tests.
- Added `@testing-library/react` and `@testing-library/jest-dom` to
  devDependencies — the CLAUDE.md note ("added when component tests begin")
  was overdue.
- `.env.example` — adds `NEXT_PUBLIC_SUPPORT_EMAIL` (defaults to
  `support@uniflo.co.za` in code when unset).

## CI verification

All five gates pass locally:

- `npm run lint` — no warnings or errors.
- `npm run format:check` — no formatting drift.
- `npx tsc --noEmit` — clean.
- `npm run test` — 33 tests across 5 files, all green.
- `npm run build` — Next.js build completes; all 20 routes generated.

## End-to-end click-through

Deferred — Partner B's dev backend hasn't shipped the Phase 3 surface
(`/applications/{id}/field-mappings`, structured `last_error`,
`portal_reference`/`verified_at`, the retry endpoint's 202/409 semantics,
or the 503 portal-unavailable rejection). The frontend degrades gracefully
to "mapping in progress" for the review screen and the existing Phase 2
behaviour for the detail/list views — see the cross-phase review doc for
the full list of verification steps to run once the backend catches up.

## A11y sweep

- Confidence percentages render as text (`87%`) inside the warning pill —
  not just colour. `aria-label="Confidence 87%"` on the pill so screen
  readers announce the number.
- Refresh affordances on the mapping-in-progress card use explicit
  `aria-label="Refresh field mappings for {university}"`.
- Retry button on the detail page swaps its `aria-label` between
  "Retry application" and "Retrying application" so screen readers
  reflect the loading state. Underlying `<Button loading>` also disables
  the click target.
- The screenshot `<img>` has alt text describing what it depicts (rather
  than e.g. just "Confirmation").

## Mobile sweep

Reviewed all new screens at 375px on the Vercel preview against the
Phase 2 backend (where field mappings degrade to "mapping in progress"
and the failure surface is still string-error). No horizontal scroll;
the field-mapping card collapses gracefully on small screens; the
screenshot proof image scales 100% width.
