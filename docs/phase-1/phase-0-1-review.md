# Phase 0 + 1 review

**Branch:** `feature/phase-0-1-review`
**Phase:** Cross-phase audit (after Task 7 merged)
**Status:** Complete — awaiting PR

This document captures the review pass across everything shipped in Phase 0 and Phase 1 so far. Nothing in the Phase 1 plan was skipped or re-scoped — the branch is purely about catching bugs, closing a security gap, removing duplication, and tightening the tooling.

---

## Why this branch exists

Phase 1 delivered seven feature tasks (auth SDK setup, app shell, auth screens, profile setup, academic records, document upload, dashboard). Each landed individually. A dedicated review pass:

- Exercises the app as a whole, which catches integration bugs that a task-at-a-time review can miss (e.g. the `/profile` dead-link below).
- Tightens things that aren't scoped to any one task — Prettier config, CI coverage, duplicated constants.
- Fixes issues that slipped through code review but don't block anything else (Skeleton radius, placeholder test).

---

## Files changed

| File                                   | Change                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `app/auth/callback/route.ts`           | Added `safeNextPath()` to validate the `next` param (open-redirect fix) |
| `app/(auth)/login/page.tsx`            | Now a server component — session check + redirect, wraps `<LoginForm>` in `<Suspense>` |
| `app/(auth)/signup/page.tsx`           | Now a server component — session check + redirect, renders `<SignUpForm>` |
| `app/(app)/profile/page.tsx`           | New — server page hosting `<ProfileOverview>` with an "Edit" link     |
| `components/auth/login-form.tsx`       | New — client form extracted from the old login page                    |
| `components/auth/signup-form.tsx`      | New — client form extracted from the old signup page                   |
| `components/profile/overview.tsx`      | New — client component rendering a read-only profile summary           |
| `components/profile/setup-form.tsx`    | Import enums from `lib/constants/profile-enums.ts` instead of declaring inline |
| `components/ui/skeleton.tsx`           | `rounded-[--radius-md]` → `rounded-md` (invalid arbitrary-value syntax) |
| `lib/constants/profile-enums.ts`       | New — single source for gender and home-language options + labels      |
| `tests/cn.test.ts`                     | New — unit test for the `cn()` class-joining utility                   |
| `tests/placeholder.test.ts`            | Deleted — replaced by `cn.test.ts`                                     |
| `.prettierrc`                          | Fixed config to match actual codebase style + added `endOfLine: auto`  |
| `.prettierignore`                      | New — excludes lockfiles, build output, env files, docs, generated types |
| `.github/workflows/frontend.yml`       | Added `format:check` and `tsc --noEmit` CI steps                       |
| `package.json`                         | Added `format` and `format:check` npm scripts                          |
| `README.md`                            | Rewrote from create-next-app boilerplate to Uniflo-specific setup      |
| _13 other files_                       | Whitespace-only reformats from the Prettier sweep                      |

---

## Bug fixes

### 1. `/profile` returned 404

**Symptom.** Both the sidebar (`components/layout/sidebar.tsx`) and the user menu (`components/layout/user-menu.tsx`) linked to `/profile`, but only `/profile/setup` existed. Clicking "Profile" from anywhere in the app returned a 404.

**Fix.** Added `/profile` as a server page that hosts a new `<ProfileOverview />` client component. The overview:

- Fetches `GET /profile` from the FastAPI backend with the Supabase JWT.
- Redirects to `/profile/setup` via `router.replace()` on a 404 response so first-run users land in the setup flow — matching the dashboard's behaviour.
- Masks the SA ID number in display: the last 7 digits encode citizenship, gender, and a race-group indicator — those shouldn't be on screen outside the active editing flow. Students still see the first 6 digits (the date-of-birth portion) so they can confirm it's their ID.
- Renders each field as a `<dl>` row, with an em-dash for any missing value so students can see at a glance what still needs filling in.
- Shows a skeleton of the final card shape while loading, so the layout doesn't jump when data arrives.
- Surfaces network, auth, and server errors inline with a retry affordance rather than auto-redirecting — a transient server error shouldn't boot the student out of their own profile page.

An "Edit" link in the page header routes students back to `/profile/setup` to modify their details.

### 2. Open-redirect in the OAuth callback

**Symptom.** `app/auth/callback/route.ts` previously built the post-login redirect URL as `${origin}${next}` without validating `next`. Two classic attack shapes slip through:

- `next=//evil.com/path` — protocol-relative, most browsers follow it to `evil.com`.
- `next=/\evil.com` — backslash often normalises to forward slash in URL parsers, collapsing to `//evil.com`.

Either shape would let an attacker craft a phishing link that sends a freshly authenticated Uniflo user, already holding a valid session cookie, to an attacker-controlled page.

**Fix.** A `safeNextPath()` helper validates with the regex `/^\/[^/\\]/`:

- Must start with `/` (same-origin path).
- Second character must not be `/` or `\` (blocks protocol-relative and backslash-collapse).
- Anything that fails falls back to `/dashboard`.

The `@` attack variant (`next=@evil.com`) is also blocked because it doesn't start with `/`. Userinfo semantics (`user@host`) only apply in the authority portion of a URL, which is bounded by `://` and the first `/`, so `https://uniflo.app/@evil.com` parses with authority `uniflo.app` and path `/@evil.com` — safe even if it got through.

### 3. Invalid Tailwind syntax in `<Skeleton>`

**Symptom.** `rounded-[--radius-md]` is invalid Tailwind arbitrary-value syntax. Arbitrary values referencing CSS custom properties need `var(...)` wrapping (e.g. `rounded-[var(--radius-md)]`). Without it, Tailwind emits a class that never matches, so the radius silently fell back to the browser default.

**Fix.** Use `rounded-md`, which maps to `--radius-md` because we register the token in the `@theme` block in `app/globals.css`. Now the class actually participates in the design system.

No user-visible change — the fallback radius happened to look fine — but the class is no longer dead code.

### 4. Signed-in users saw the auth forms

**Symptom.** `/login` and `/signup` were client components that did no session check. A signed-in user reaching either page (e.g. from a stale bookmark) saw the form and could enter credentials — confusing UX, and a subtle foot-gun if a second account was created by accident.

**Fix.** Split each page into a server/client pair:

- `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx` are now server components that call `supabase.auth.getUser()` and redirect to `/dashboard` if a session exists.
- The original form bodies moved into `components/auth/login-form.tsx` and `components/auth/signup-form.tsx` as client components owning the form hooks.

The login page wraps the form in `<Suspense>` because `useSearchParams` requires it (the form reads `?error=auth_callback_error` when an OAuth callback fails). Signup doesn't read search params, so no boundary is needed.

---

## Refactor

### Consolidate gender and home-language enums

**Before.** Both `components/profile/setup-form.tsx` (the three-step profile form) and the new `components/profile/overview.tsx` needed the same 4 gender values + 11 South African language values. The overview had a label-lookup map; the setup form had option objects for the `<Select>`. Both had comments saying "Kept aligned with `components/profile/setup-form.tsx`" — the drift risk was spelled out in the code.

**After.** A new `lib/constants/profile-enums.ts` (matching the pattern already used for `lib/constants/nsc-subjects.ts`) exposes:

- `GENDER_OPTIONS` and `HOME_LANGUAGE_OPTIONS` — arrays of `{value, label}` objects for the select dropdowns.
- `GENDER_LABELS` and `HOME_LANGUAGE_LABELS` — records mapping stored value back to display label, derived from the option arrays with `Object.fromEntries`.

Both consumers now import from one file. No behaviour change — values and labels are byte-identical.

---

## Tooling

### Prettier

**Before.** The checked-in `.prettierrc` specified `semi: false, singleQuote: true` but every tracked file in the repo used semicolons and double quotes. Running `prettier --write .` would have silently rewritten the whole tree in a destructive way. There was also no `.prettierignore`, so Prettier walked `package-lock.json`, `docs/`, and env files.

**After.**

- Config corrected to match actual codebase style (`semi: true, singleQuote: false`) plus `endOfLine: auto` so Windows checkouts (CRLF) don't trip on every file.
- `.prettierignore` excludes lockfiles, build output, env files, hand-authored docs, and generated API types.
- Ran `prettier --write .` across the tree — the large whitespace-only diff in this branch is that one pass.
- Added `format` and `format:check` npm scripts.
- CI now runs `format:check` on every push.

### CI coverage

**Before.** The frontend CI job ran `eslint` and `vitest`. Type errors and style drift were not gated.

**After.** Added two steps after lint:

```yaml
- name: Format check
  run: npm run format:check

- name: Typecheck
  run: npx tsc --noEmit
```

The build step is deliberately not in CI yet — `next build` needs env vars (Supabase URL/anon key, API URL) to produce accurate route data, and wiring GitHub secrets is best done alongside the Vercel deployment setup. Vercel already builds every PR as a preview deployment, which is the current backstop.

### Test upgrade

**Before.** `tests/placeholder.test.ts` contained `it('passes', () => {})` — proved Vitest was wired up but exercised no production code.

**After.** Replaced with a unit test for `cn()` covering: joining truthy strings with single spaces, silently dropping `null`/`undefined`/`false` so `isActive && "btn-active"` works inline, and returning an empty string when all inputs are falsy. This locks in the two behaviours every component relies on.

Note: no component-level tests yet — `@testing-library/react` is not a dependency. Adding it and writing component tests is worth doing as a separate pass once Phase 2 begins and the component surface stabilises.

### README

Rewrote the create-next-app boilerplate with Uniflo-specific content: what the app is, the stack, getting-started steps (including the three required env vars), all five npm scripts, project layout, git workflow summary, and key contributing conventions (Supabase-managed auth, OpenAPI-generated API types, mobile-first, mandatory `gender`/`home_language`, locked `subjects` JSON contract).

---

## Design decisions

### 1. Server/client split for auth pages

The cleanest way to redirect signed-in users away from `/login` and `/signup` is to read the session on the server before rendering anything. That requires the `page.tsx` to be a server component. But the existing form used `useState`, `useRouter`, and (for login) `useSearchParams` — all client-only hooks.

The split pattern (server `page.tsx` for the auth check, client form component for the interactive bits) is the canonical Next.js App Router approach. It's slightly more files but keeps each file's responsibility crisp: the server page is ~15 lines of session-check + render, the client form is pure form logic.

### 2. Em-dash for missing overview fields

When the profile overview renders, fields the student hasn't filled in yet could be hidden entirely, but that makes the overview look complete when it isn't. An em-dash (`—`) per empty row tells the student at a glance what's still missing, with the "Edit" button already in the header to act on it. This is the same pattern shadcn/ui and Linear use for empty cells.

### 3. ID number masking format

The SA 13-digit ID encodes:

- Digits 1–6: date of birth (YYMMDD)
- Digits 7–10: gender code (female 0000–4999, male 5000–9999)
- Digit 11: citizenship (0 SA, 1 permanent resident)
- Digit 12: historical race indicator
- Digit 13: checksum

The overview shows the first 6 digits so the student can confirm it's theirs — the rest are sensitive and would be redundant alongside the gender and nationality fields already on the overview. The mask uses spaced bullets (`• • •`) rather than asterisks because bullets are less visually noisy in a label/value table layout.

### 4. Open-redirect regex, not an allow-list

The `next` param could be validated against a hard-coded allow-list of paths (`/dashboard`, `/profile/setup`), but that ties the callback route to every new destination we ever add. The same-origin path regex catches the attack classes without maintenance burden. If the backend ever needs to redirect off-origin, that's a new decision that should be explicit, not a side-effect of a permissive validator.

### 5. Consolidating enums into a module, not a JSON file

The gender and language values could live in a `.json` file, but TypeScript can't narrow types off dynamic JSON imports as well as it narrows `as const` arrays. Keeping them as TypeScript exports means the `value` strings are inferable as string-literal union types later (if we ever need them) without an extra declaration step.

---

## Manual test plan

Once the PR is open the Vercel preview URL should be exercised through the full Phase 1 happy path:

- [ ] Sign up with email + password → lands on `/profile/setup` (if email confirmation off) or sees "Check your inbox" (if on).
- [ ] Confirm email, sign in → profile setup flow.
- [ ] Complete all three setup steps → redirected to dashboard.
- [ ] Dashboard shows all three sections as complete (or partially complete if academic/docs are skipped).
- [ ] Click "Profile" in the sidebar → `/profile` renders the overview with the saved data.
- [ ] Click "Edit" → back to `/profile/setup` with the fields pre-filled.
- [ ] Sign out, navigate to `/login` → form renders.
- [ ] Sign in, navigate to `/login` directly → redirected to `/dashboard` (new behaviour).
- [ ] Same check for `/signup`.
- [ ] Click "Continue with Google" → Google consent screen → back to the app, signed in.
- [ ] On mobile viewport (Pixel 7, 390×844): sidebar collapses to hamburger, profile overview rows stack vertically, all forms fit.

### Open-redirect regression test

From a signed-out state, visit these URLs. All three must land on `/dashboard` (not on `evil.com`), and the whole URL bar must show the Uniflo origin:

- `/auth/callback?code=<valid_code>&next=//evil.com`
- `/auth/callback?code=<valid_code>&next=/\evil.com`
- `/auth/callback?code=<valid_code>&next=/@evil.com`

(A valid `code` is needed to exercise the success branch, so this test is easiest to run with a fresh Google OAuth flow intercepted by DevTools.)

---

## What is intentionally not in this branch

- **Component tests.** `@testing-library/react` is not installed and adding it is a Phase 2 polish concern, not a phase-1 audit concern. The `cn()` test is there to prove the Vitest pipeline runs real code.
- **Sentry wiring.** `CLAUDE.md` mentions Sentry as the error tracker but doesn't require it for Phase 1. Deferred to Phase 2.
- **Backend OpenAPI types.** The overview's `ProfileResponse` is hand-written until Partner B publishes the OpenAPI spec. A comment in the file flags this.
- **Supabase Realtime or any polling.** `CLAUDE.md` is explicit that realtime is post-MVP. The overview does a single fetch on mount and stops.

---

## External setup the user still needs to do

These live outside this repo — the branch cannot ship fully without them. Listed in priority order:

1. **Supabase project** — URL/anon key for local + Vercel, email template customisation, Site URL + redirect allow-list for all environments, Storage bucket for documents (coordinate name with Partner B).
2. **Google OAuth** — Cloud Console project, consent screen, Web OAuth client with Supabase's callback as the authorized redirect URI, paste credentials into Supabase's Google provider.
3. **Vercel** — import repo, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` for Preview + Production.
4. **GitHub branch protection** — require PR into `main`, require the Frontend CI checks, disallow direct pushes.
5. **uniflo-api** — confirm base URL, JWT validation, CORS origin list, and that `GET /profile` returns 404 when no profile exists (the overview relies on this).
6. **Local `.env.local`** — copy from `.env.example`, fill in real values.

---

## Result

All checks green locally:

- `npm run lint` — clean
- `npm run format:check` — all matched files use Prettier code style
- `npx tsc --noEmit` — clean
- `npm run test` — 4 tests pass (the `cn` suite)
- `npm run build` — compiles, all 11 routes generated including the new `/profile`

Eight commits on top of `main`, each scoped to a single concern:

```
refactor(profile): consolidate gender and home-language enums
docs: rewrite README with Uniflo-specific setup and layout
test: cover cn() utility, drop empty placeholder
feat(profile): add /profile overview page with read-only summary
feat(auth): redirect signed-in users away from /login and /signup
fix(auth): validate next path in OAuth callback to prevent open redirect
fix(ui): use Tailwind theme utility for Skeleton border radius
chore(tooling): align Prettier config with codebase style and wire into CI
```
