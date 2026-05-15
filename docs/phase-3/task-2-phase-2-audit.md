# Phase 2 Audit

A targeted sweep across the Phase 2 surface (auth flow, dashboard, universities, applications) and the Phase 3 redesign foundations. Branch: `audit/phase-2`. The goal was to close out latent issues a reviewer should never have to find — invalid HTML, design-token leaks, missing 404/error screens, duplicated helpers — without expanding scope into new features.

## What was wrong

### Error / 404 / loading screens

- **No global `app/not-found.tsx`.** Unknown URLs rendered the framework default (white page, system font). Off-brand and inconsistent with the polished `(app)/error.tsx`.
- **No root `app/error.tsx`.** Throws on the marketing landing or auth flow had no recovery boundary.
- **No `(auth)/loading.tsx`.** Sign-in transitions flashed blank.
- **`app/(app)/applications/[id]/page.tsx`** rendered raw destructive text on load failure; everywhere else uses `<Alert>`.

### Invalid HTML / accessibility

- **`<Link><Button>...</Button></Link>` in 6 places** (`app/page.tsx` × 5, `(app)/error.tsx` × 1) puts a `<button>` inside an `<a>` — invalid HTML and bad for keyboard / screen-reader behaviour.

### Design-token leaks

- **`text-emerald-600`** in `review-screen.tsx` (Uploaded / Submitted indicators).
- **`text-green-600`** in `documents/upload-form.tsx` (uploaded checkmark).

Both should resolve to the cobalt-aligned `text-success` token so a future palette swap stays clean.

### Dead code / DRY

- **`formatRelativeTime`** was inlined inside `application-list.tsx` while `lib/utils/format.ts` was the shared home for date helpers.
- **Six near-identical server-side fetch wrappers** across the dashboard, universities, applications, [id], and review pages — same try/catch + `if (!res.ok)` + parse-json shape.
- **`InlineAlert` in `review-screen.tsx`** re-implemented the `Alert` component with raw classes.
- **The Google "G" SVG (24 lines)** was duplicated verbatim in `login-form.tsx` and `signup-form.tsx`.
- **Stale dashboard copy:** "Complete the three sections below" — only two sections render (profile + documents).

## What changed

### New shared modules

- **`lib/api/server.ts`** — `serverApiGet<T>(path, token)` returns a `ServerFetch<T>` discriminated result so callers can branch on 404 vs other failures (the application detail page uses this to render `notFound()` only for true 404s).
- **`lib/utils/format.ts`** — `formatRelativeTime` joins `formatDate` as the second shared date helper.
- **`components/auth/google-icon.tsx`** — single source of truth for the OAuth brand mark.
- **`components/ui/button.tsx`** — extracted `buttonClasses({ variant, fullWidth, className })` helper. The `<Button>` component still owns the actual button semantics (spinner, disabled, etc.); the helper exists so a Next `<Link>` can carry the same visual treatment without nesting a `<button>` inside an `<a>`.

### New screens

- **`app/not-found.tsx`** — branded 404 with sprout motif, two recovery CTAs.
- **`app/error.tsx`** — root error boundary mirroring the `(app)` boundary's tone.
- **`app/(auth)/loading.tsx`** — skeleton sized to the auth Card (heading + lead + two inputs + CTA).

### Refactors

- All six server pages (`dashboard`, `universities`, `applications`, `applications/[id]`, `applications/review`) now route through `serverApiGet`. The detail page keeps its `cache(...)` wrapper for metadata/page deduplication.
- `review-screen.tsx::InlineAlert` is now a thin wrapper around the shared `<Alert>` that adds the optional inline action link.
- `application-list.tsx` imports `formatRelativeTime` from `lib/utils/format`.
- `login-form.tsx` and `signup-form.tsx` both use `<GoogleIcon />`.
- `app/(app)/loading.tsx` skeleton is now a 2-card grid (matches what the dashboard actually renders).
- Dashboard intro copy: "the three sections" → "the sections".
- Application detail and applications-list error states use `<Alert tone="destructive">` instead of raw text.

## What was deliberately left alone

- **`seed-universities.ts`** — kept as the offline-dev fallback for `/universities` when the backend is unreachable. The "remove once seeded" comment predated the live API but the fallback is still useful locally.
- **`getAuthErrorMessage` duplication** in `login-form.tsx` and `signup-form.tsx` — the message sets diverge intentionally per surface (sign-in vs sign-up have different error vocabularies).
- **`Card variant="elevated" className="p-7 md:p-9"` repeated** in the auth screens — clearer kept inline than DRY'd into a wrapper.
- **The `application-list.tsx` "0 applications" line** — only reachable as a safety net (the parent only mounts the list when length > 0). Left for defence in depth.

## Verification

- `npm run lint` — clean
- `npx prettier --check .` — clean
- `npx tsc --noEmit` — clean
- `npm run test` — 4/4 passed
- `npm run build` — 17 routes including `/_not-found` prerendered
- Playwright at desktop (1280×800) + mobile (390×844): the new 404 renders cleanly on both, landing CTA fixes are visually identical to before, login form's shared GoogleIcon matches the previous inline SVG.

## Files touched

**New (5):** `app/not-found.tsx`, `app/error.tsx`, `app/(auth)/loading.tsx`, `lib/api/server.ts`, `components/auth/google-icon.tsx`.

**Modified (15):** `app/page.tsx`, `app/(app)/error.tsx`, `app/(app)/loading.tsx`, `app/(app)/dashboard/page.tsx`, `app/(app)/universities/page.tsx`, `app/(app)/applications/page.tsx`, `app/(app)/applications/[id]/page.tsx`, `app/(app)/applications/review/page.tsx`, `components/ui/button.tsx`, `components/applications/application-list.tsx`, `components/applications/review-screen.tsx`, `components/documents/upload-form.tsx`, `components/auth/login-form.tsx`, `components/auth/signup-form.tsx`, `lib/utils/format.ts`.
