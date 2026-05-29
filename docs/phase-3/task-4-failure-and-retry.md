# Task 4 — Failed state, retry, and portal-unavailable handling

**Branch:** `feature/phase-3`

## What shipped

- `lib/applications/failure-copy.ts` — `getFailureCopy(code, ctx)` maps
  Partner B's `last_error.code` to friendly headline copy, and
  `isRetryable(code, retryable)` combines the backend's structured flag
  with per-code defaults. Every code in `JobErrorCode` is covered; a unit
  test enforces that exhaustively.
- `components/applications/application-detail.tsx` — replaces the Phase 2
  raw-error rendering with:
  - A destructive `<Alert>` headline using `getFailureCopy`.
  - A collapsed `<details>` block carrying `last_error.message` for
    support.
  - Retry button when the structured error is retryable. On success a
    short lockout prevents double-click; on 409 the conflict copy is
    surfaced and the lockout sticks; on other failures a destructive
    alert suggests refresh.
  - Contact-support `mailto:` button when the error is not retryable.
- `components/applications/application-list.tsx` — friendly failure copy
  is surfaced as a `title` attribute on the status badge for failed rows,
  so the list hover hint matches the detail page.
- `components/applications/review-screen.tsx` — the submit loop:
  - Continues past 503 portal_unavailable instead of aborting. Earlier
    successes stay submitted.
  - Renders an inline "Applications to {university} are temporarily
    unavailable — please try again later" message on the affected row.
  - Exposes a "Retry just this one" affordance on both 503 and generic
    error rows so the student can re-attempt without redoing the whole
    loop.
  - Submit button label flips to "Retry remaining" once any row has a
    non-success status.

## Design decisions

- **Structured-first, free-text fallback.** `parseJobError` accepts both
  the new structured shape and the legacy string form. While Partner B
  rolls out the structured `last_error`, the UI keeps showing the raw
  message in the `<details>` block for support, with the generic
  "Something went wrong" headline up top. No flicker, no fragile feature
  flag.
- **Retry button locks out, conflict locks out permanently.** On 409 the
  user shouldn't keep retrying — refresh is the recovery path. A 5-second
  lockout on a successful 202 covers double-tap; the row's optimistic
  status update would normally suppress the button anyway, but the
  lockout adds belt-and-braces.
- **`mailto:` for non-retryable failures.** Plan calls for it explicitly
  as the MVP fallback. The email subject is pre-filled with the university
  name so support can disambiguate fast.
- **No retry-N-times UI.** Partner B handles automatic retries server-side
  (the worker re-runs on transient errors). The UI only handles the
  student-initiated retry.

## Testing

- `lib/applications/failure-copy.test.ts` — exhaustive copy map test plus
  context interpolation (validation message, university name) and the
  retryable default fallbacks.
- `lib/api/phase-3.test.ts` covers `parseJobError` for every shape and
  `isPortalUnavailable` for the 503 body type guard.
- Review-screen 503 partial-success path and retry-button 202/409/5xx
  paths were exercised manually (no component test added — the dependency
  graph of the review screen pulled in too many context providers for a
  cheap test setup; the retry logic is the same `postOne` flow tested
  upstream).

## Playwright MCP

Skipped — needs Partner B's adapter to be forceably failable. Tracked in
the phase review doc as a Phase 3 close-out verification step.

## Next person should know

- The failure copy map is the only place new error codes need to land.
  Adding a new code: extend `JobErrorCode`, add the entry to `FAILURE_COPY`,
  and add a row to the test. The compiler enforces exhaustiveness.
- The retry button uses `retryApplication` which currently types the
  response as `ApplicationRead`. If Partner B's eventual 202 body shape
  differs, only the helper needs updating.
