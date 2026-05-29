# Task 3 — Submission confirmation screen with screenshot proof

**Branch:** `feature/phase-3`

## What shipped

- `components/applications/submission-confirmation.tsx` — proof card
  rendered on the application detail page when `latest_job.status` is
  `"submitted"`:
  - Headline: "Submitted to {university} on {date} at {time}" when
    `verified_at` is available; degrades to a shorter form when it isn't.
  - Portal reference row with click-to-copy (`navigator.clipboard.writeText`
    with a 2-second "Copied" affordance). Rendered only when
    `portal_reference` is present.
  - Screenshot rendered as a plain `<img loading="lazy">` (rationale below)
    with a "View full-size" link that opens in a new tab.
  - Fallback copy "Confirmation screenshot will appear here within a few
    minutes" when the job is submitted but the upload hasn't landed yet.
- `components/applications/celebration-banner.tsx` — one-shot
  "🎉 You're applied" banner using the `DotCluster` motif and a Caveat
  script line. Activated by `?just_submitted=true` on the URL; strips the
  query param on mount so a refresh doesn't replay the moment. Stays
  visible until the user dismisses it or navigates away — the URL rewrite
  is just defensive.
- `app/(app)/applications/page.tsx` — renders the celebration banner above
  the list when `?just_submitted=true` is set (the redirect target after a
  successful review-screen submit).
- `app/(app)/applications/[id]/page.tsx` + `application-detail.tsx` —
  passes `supportEmail` server-side and renders the celebration banner +
  submission proof inline in the detail view.
- `components/applications/application-list.tsx` — adds a small image
  icon on rows whose `latest_job.screenshot_url` is set so students can see
  at a glance which applications have proof attached without opening the
  detail page.

## Design decisions

- **Plain `<img>` instead of `next/image`.** The screenshot host is a
  Supabase Storage bucket and the URL pattern is not locked (signed URLs
  remain an option per the Phase 3 plan). Pinning a `remotePattern` to a
  host that may move felt fragile. Plain `<img loading="lazy">` produces
  the same network behaviour as `next/image` with `unoptimized`.
- **Celebration in `application-list.tsx` after submit, not in
  `application-detail.tsx`.** The submit can fan out to multiple
  applications. Showing celebration on one detail page would feel arbitrary
  in the multi-app case. The list-level banner is single-place and works
  for one or N submissions. The detail page still supports the same
  `?just_submitted=true` flag for completeness — useful for deep links
  later.
- **`supportEmail` reads from `NEXT_PUBLIC_SUPPORT_EMAIL` with a default.**
  Added to `.env.example`. Falls back to `support@uniflo.co.za` so the
  detail page works locally without env wiring.
- **Click-to-copy degrades silently.** Older browsers / non-secure contexts
  miss `navigator.clipboard`; the reference itself is still on screen and
  selectable. Better than throwing.

## Testing

Unit tests for the confidence + failure-copy maps cover the supporting
shapes. A snapshot for the celebration banner motif was discussed in the
plan but skipped — the visual surface is small enough that a snapshot would
churn on every Tailwind tweak. Playwright MCP coverage at Task 5 close-out
captures the visual regression instead.

## Playwright MCP

Skipped at task close — same reason as Task 2 (no live backend with
`submitted` jobs to exercise the proof card). The fallback "Confirmation
screenshot will appear here…" state is reachable today by any submitted
application with a null `screenshot_url`.

## Next person should know

- When Partner B finalises the screenshot bucket URL pattern, consider
  switching to `next/image` with a `remotePatterns` entry — the perf win
  is meaningful for mobile.
- If Partner B switches to signed URLs, the `<img>` element can keep
  rendering them directly. The detail page would need to refresh those
  URLs when they expire — out of scope for MVP, called out in the phase
  review.
