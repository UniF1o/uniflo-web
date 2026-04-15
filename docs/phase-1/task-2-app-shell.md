# Task 2 — App shell and layout

**Branch:** `feature/app-shell`
**Phase:** 1
**Status:** Complete

This document captures everything that was built in this branch, the design decisions behind it, and any deviations from the Phase 1 plan in `docs/partner-a-phase-1-plan.md`.

---

## What was built

The structural skeleton that all signed-in product screens will live inside, plus a tidy public landing page, a minimal auth-group layout, and a working design system foundation (fonts, colour tokens, spacing, focus).

### Files added

| File | Role |
|---|---|
| `app/(app)/layout.tsx` | Server component. Validates the Supabase session and redirects to `/login` if the user isn't signed in. Hands rendering to `AppShell`. |
| `app/(app)/dashboard/page.tsx` | Placeholder dashboard so the (app) shell is reachable. Fleshed out in Task 7. |
| `app/(app)/loading.tsx` | Route-group loading UI. Shown inside the shell while a server-rendered page is streaming. |
| `app/(auth)/layout.tsx` | Minimal centred layout used by Task 3's login / signup / forgot-password screens. Brand mark at the top, centred card in the middle, footer at the bottom. |
| `components/layout/app-shell.tsx` | Client component — interactive chrome (drawer state, responsive composition). |
| `components/layout/brand-mark.tsx` | The "Uniflo" wordmark. Re-used in the navbar, the auth layout, and the landing page. |
| `components/layout/navbar.tsx` | Top utility bar. Logo, user menu, and a hamburger (mobile only) that toggles the sidebar. |
| `components/layout/sidebar.tsx` | Primary navigation. Fixed column on desktop, slide-in drawer on mobile. |
| `components/layout/user-menu.tsx` | Avatar button + dropdown with sign-out and a link to `/profile`. |
| `components/ui/skeleton.tsx` | Primitive loading block used by `loading.tsx` and any future skeleton UIs. |
| `lib/utils/cn.ts` | Tiny class-joiner used to compose conditional Tailwind classes. |

### Files modified

| File | Change |
|---|---|
| `app/layout.tsx` | Replaced Next.js starter fonts + copy with Uniflo metadata, Instrument Serif, and Geist. Configured a title template so child routes can set short titles like `"Dashboard"` which get expanded to `"Dashboard — Uniflo"`. |
| `app/globals.css` | Replaced the default template with a full design-token foundation — colours, fonts, radii, focus ring, text selection. |
| `app/page.tsx` | Replaced the Next.js starter page with a real Uniflo landing hero + CTAs into `/signup` and `/login`. |

### Dependencies added

- `lucide-react` — icon set used by the navbar, sidebar, and user menu. Tree-shakable, ~10kb gzipped.

---

## Design decisions

### 1. Aesthetic direction — "editorial-confident warmth"

Applying the guidance from the `frontend-design` and `ui-ux-pro-max` skills, the shell commits to a single clear direction rather than hedging:

- **Tone:** serious but optimistic. Students are betting on their futures, so the shell has to feel trustworthy; the accent colour and rounded pill CTAs keep it warm and approachable.
- **Typography:** [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) for display, [Geist Sans](https://fonts.google.com/specimen/Geist) for body. Both are distinctive — we explicitly avoided Inter/Arial/Roboto (the skill's "common AI convergence" list).
- **Palette:**
  - Background: warm cream `#faf7f2` (paper, not white)
  - Foreground: rich near-black `#121417`
  - Primary: deep indigo night `#1b2540`
  - Accent: terracotta `#d97757` — a warm anchor that feels distinctly South African without being literal
  - Muted: dusty stone `#ede7db`
- **Layout energy:** generous negative space on desktop, clean density on mobile. No grid-breaking overlap — that would undercut the trust signal this product needs.

### 2. Server layout + client shell split

`app/(app)/layout.tsx` is a Server Component so it can call `redirect()` and read cookies via the Supabase server client. Drawer state (the mobile sidebar open/closed flag) needs `useState`, which only works in a Client Component. Splitting them solves both problems without sprinkling `"use client"` directives through the whole layout tree.

### 3. Route groups `(auth)` and `(app)`

Next.js route groups (folders wrapped in parentheses) share a layout without contributing a URL segment. So `/dashboard` lives at `app/(app)/dashboard/page.tsx` but the URL is `/dashboard`, not `/app/dashboard`.

- `(auth)` is intentionally unprotected — signed-in users who visit `/login` or `/signup` just see the page. If we later want to bounce them away we'll do it per-page, not in the layout (`/forgot-password` should stay reachable even while signed in).
- `(app)` is protected at the layout level. `redirect()` throws, so execution stops before any child renders; the browser never sees authenticated chrome without a session.

### 4. Desktop sidebar vs mobile drawer

One sidebar component handles both:

- **Desktop (md+):** `position: sticky` in-flow column, always visible. Main content flexes into the remaining space.
- **Mobile:** `position: fixed`, starts translated off-screen. A backdrop fades in when `isOpen` is true; the sidebar slides in with a CSS transform. No JavaScript animation library needed.

Closing the drawer on navigation happens two ways: (a) each nav link's `onClick` calls `onClose`; (b) `AppShell` derives "close on pathname change" as state-during-render (React 19 lints against `setState` inside effects — see the next point).

### 5. Avoiding `setState` inside `useEffect`

Next.js 16 ships with React 19, which added `react-hooks/set-state-in-effect` to `eslint-plugin-react-hooks`. Our first draft used `useEffect(() => setIsSidebarOpen(false), [pathname])` to close the drawer when the route changed — ESLint correctly flagged this as a source of cascading renders.

The fix (from the [React docs](https://react.dev/reference/react/useState#storing-information-from-previous-renders)): store the previous pathname as state, and if it differs from the current one during render, call `setState` directly. React bails out, re-renders once with the fresh state, and no extra render cycle runs.

```tsx
const [lastPathname, setLastPathname] = useState(pathname);
if (lastPathname !== pathname) {
  setLastPathname(pathname);
  setIsSidebarOpen(false);
}
```

### 6. `<main>` container width and overflow protection

The main content container uses `max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10` inside a `min-w-0 flex-1` flex child. `min-w-0` is the key line: without it, a flex item's default `min-width` is `auto`, meaning long content (wide tables, code blocks) can force the parent wider than the viewport and produce horizontal scroll. This catches it before it happens.

### 7. Fonts loaded via `next/font/google`

`next/font` downloads the fonts at build time and serves them from our origin — no runtime request to fonts.googleapis.com, no CLS, and no extra cookie consent noise. Exposing each font as a CSS custom property (`--font-geist-sans`, `--font-instrument-serif`) lets Tailwind v4's `@theme` block pick them up as `font-body` / `font-display` utilities.

### 8. Tailwind v4 `@theme` for design tokens

Tailwind v4 uses CSS-first config. All design tokens — colours, fonts, radii — live in `app/globals.css` under `@theme`. Every custom property declared in that block becomes a Tailwind utility automatically (`--color-primary` → `bg-primary`, `text-primary`, `border-primary`, etc.). We avoided a separate `tailwind.config.ts` entirely, in line with the v4 recommendation.

### 9. Hand-rolled `cn` helper instead of `clsx` + `tailwind-merge`

The shell uses a five-line `cn()` that joins Tailwind class strings. We skipped `clsx` + `tailwind-merge` (the usual pairing) because we don't yet need conflict resolution and every dependency has a maintenance cost. If two utilities start fighting — `p-4` vs `p-6` inside the same call — the note on top of `lib/utils/cn.ts` explains how to swap in the real thing.

### 10. Placeholder `/dashboard` stub

Task 2 says "Do not build any screen content yet — just the shell." But a route group's layout is never rendered unless at least one route exists under it, and there's no way to verify the shell on a Vercel preview without a reachable page. So we added a minimal `/dashboard` page that contains nothing but the heading and a one-sentence placeholder pointing at Task 7. Real dashboard content lands in that task.

---

## Deviations from the Phase 1 plan

1. **Added `lucide-react`** — the plan didn't list an icon dependency; icons are ubiquitous in the navbar/sidebar/user-menu, and inlining SVGs for each one would have cost more in readability than the dependency costs in bytes.
2. **Added a minimal `/dashboard` placeholder** — see decision 10 above.
3. **Replaced the Next.js starter landing page at `/`** — the plan's Task 2 technically covers "app shell" only, but leaving the template page in place would make the Vercel preview inconsistent with the brand, so we shipped a simple Uniflo landing with CTAs into the auth flow.
4. **Added a small `cn` utility** — trivial helper, not called out in the plan, but needed to keep the component class strings readable.

Everything else in Task 2's checklist is implemented as specified.

---

## How to verify

### Locally

1. Populate `.env.local` with real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values.
2. `npm run dev`.
3. Visit `http://localhost:3000` — you should see the landing hero with the brand mark, the terracotta accent, and the "Start your application" CTA.
4. Visit `http://localhost:3000/dashboard` while signed out — the proxy + layout redirect you to `/login`. (The login page itself isn't built until Task 3, so you'll land on a 404 — that's expected.)
5. Sign in via the Supabase dashboard (manually create a user), then revisit `/dashboard` — the full shell (navbar + sidebar + placeholder dashboard) should render.
6. Resize the window below `md` (768px). The sidebar disappears; the hamburger appears in the navbar; tapping it slides the sidebar in as a drawer.

### CI

- `npm run lint` — passes.
- `npm test` — passes.
- `npm run build` — compiles successfully, types check, static/dynamic routes classified as expected.

---

## What this unblocks

- **Task 3 (auth screens)** can now drop login / signup / forgot-password pages straight into `app/(auth)/` and they inherit the minimal auth layout.
- **Task 4 (profile setup)** can add routes under `app/(app)/profile/` and pick up the shell automatically.
- **Task 6 (document upload)** same pattern for `app/(app)/documents/`.
- **Task 7 (dashboard)** replaces the placeholder `/dashboard` page with the real profile-completeness UI.
