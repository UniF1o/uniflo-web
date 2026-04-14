# Task 1 — Supabase Auth SDK setup

**Branch:** `feature/auth-sdk-setup`
**Phase:** 1
**Status:** Complete

This document captures everything that was done in this branch, the design decisions behind it, and any deviations from the original Phase 1 plan in `docs/partner-a-phase-1-plan.md`.

---

## What was built

A working Supabase Auth foundation that all later auth screens (Task 3 onward) and route protection (Task 2) will plug into. No UI is shipped in this branch — only the wiring.

### Files added

| File | Role |
|---|---|
| `lib/supabase/client.ts` | Browser-side Supabase client, used inside Client Components for interactive auth flows (sign in, OAuth, password reset, sign out). |
| `lib/supabase/server.ts` | Server-side Supabase client, used inside Server Components, Route Handlers, and Server Actions. Reads cookies via Next.js' async `cookies()` helper. |
| `lib/supabase/middleware.ts` | `updateSession(request)` helper that performs the actual token refresh. Imported by `proxy.ts`. Kept separate so it stays unit-testable. |
| `proxy.ts` | Next.js 16 root proxy file. Calls `updateSession` on every non-asset request to keep the Supabase JWT fresh. |

### Files modified

| File | Change |
|---|---|
| `package.json` / `package-lock.json` | Added `@supabase/supabase-js` and `@supabase/ssr` dependencies. |

`.env.example` already contained `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Phase 0, so no env changes were needed.

---

## Design decisions

### 1. `proxy.ts` instead of `middleware.ts` — Next.js 16 breaking change

The Phase 1 plan instructs creating `middleware.ts`. **Next.js 16 renamed Middleware to Proxy** (see `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`):

> Starting with Next.js 16, Middleware is now called Proxy to better reflect its purpose. The functionality remains the same.

This repo is on `next@16.2.3`, and `AGENTS.md` explicitly warns "this is NOT the Next.js you know". So:

- The root file is `proxy.ts` exporting `proxy()`, not `middleware.ts` exporting `middleware()`.
- The internal Supabase helper is still named `lib/supabase/middleware.ts` because that matches every published Supabase SSR guide and search query a future contributor will run. It is not a Next.js convention file, so the name has no behavioural effect.

If/when the Phase 1 plan or Supabase docs catch up, we should consider renaming the helper to `lib/supabase/proxy.ts` for consistency.

### 2. Two clients (browser vs server) instead of one universal client

`@supabase/ssr` exposes `createBrowserClient` and `createServerClient` separately because they need different cookie backends:

- The browser client reads/writes `document.cookie` directly.
- The server client must be handed Next.js' request-scoped cookie store explicitly.

A single "universal" wrapper is tempting but tends to leak server-only code into client bundles or vice versa. Keeping them in separate files lets the bundler tree-shake correctly and lets the server client safely import `next/headers` (which throws if imported into a Client Component).

### 3. New client per server invocation, no module-level singleton

`lib/supabase/server.ts` exports an `async function createClient()` rather than a singleton. The reason is concurrency: a single Next.js server process renders many users' requests in parallel, and a shared Supabase client would mix up cookie state between them. The Supabase docs are explicit on this point.

The browser client is also a fresh instance per call, but for a different reason: module-scoped singletons interact badly with React Fast Refresh during development.

### 4. `setAll` swallows errors in the server client

Inside `lib/supabase/server.ts`, the `setAll` cookie handler is wrapped in `try { ... } catch {}`. This is intentional and matches the official Supabase SSR pattern.

When a Server Component calls into Supabase and Supabase tries to refresh the JWT, it has to write new auth cookies. But Server Components cannot mutate response headers — by the time they render, headers have already been streamed. Next.js throws.

We swallow that throw because the proxy (`proxy.ts`) is doing the same refresh on every request anyway. So missing the write inside a Server Component is harmless: the next request's proxy hop will pick it up. The throw still fires — and gets propagated — when the client is used from a Route Handler or Server Action, where cookie writes are legal.

### 5. `getUser()` is called inside `updateSession`, with nothing between

The Supabase docs are emphatic: do not put any code between `createServerClient(...)` and `supabase.auth.getUser()` inside the proxy. `getUser()` is what actually contacts the auth server, validates the JWT, and writes refreshed cookies. Any work inserted in between can:

- Cause stale session reads.
- Trigger "random logout" bugs that are extremely hard to reproduce.

This constraint is documented in the inline comment in `lib/supabase/middleware.ts` so it is preserved when the file is edited later.

### 6. Proxy `matcher` excludes static assets

The matcher regex skips `_next/static`, `_next/image`, `favicon.ico`, and common image extensions. There is no point refreshing a Supabase session for a request that is fetching a PNG. This keeps the proxy hot path cheap.

If we later add public, intentionally-unauthenticated API routes, they should be added to this exclusion list.

### 7. Non-null assertions on the env vars

`process.env.NEXT_PUBLIC_SUPABASE_URL!` and `..._ANON_KEY!` use the non-null assertion. If either is missing the app cannot function, so we want a loud runtime crash on the first request rather than a silent fallback to an unauthenticated client. This is preferable to either:

- Throwing manually (extra noise, same outcome).
- Falling back to a no-op client (silent failure — much worse).

---

## Deviations from the Phase 1 plan

1. **`proxy.ts` instead of `middleware.ts`** — forced by Next.js 16. See decision 1 above.
2. **`updateSession` lives in `lib/supabase/middleware.ts`, not at the root** — only the entry point (`proxy.ts`) has to be at the repo root. Keeping the logic in `lib/` makes it testable and matches the file organisation we'll use for everything else in `lib/supabase/`.

Everything else in the Task 1 checklist is implemented as specified.

---

## How to verify

1. Add real values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
2. `npm run dev`.
3. Open any page. The proxy fires; with no session cookie, `supabase.auth.getUser()` returns `{ data: { user: null } }` and the request passes through. No errors should appear in the terminal.
4. `npm run lint` — passes.
5. `npm test` — passes.

End-to-end auth testing happens in Task 3 once the sign up / login screens exist.

---

## What this unblocks

- **Task 2 (app shell)** can now use the server client to gate `app/(app)/layout.tsx` behind authentication.
- **Task 3 (auth screens)** can now use the browser client for sign up, login, OAuth, and password reset.
- **Tasks 4–7** can use either client to attach the Supabase JWT to backend API calls via `Authorization: Bearer <token>`.
