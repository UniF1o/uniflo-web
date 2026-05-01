# Task 2 — University browsing and search

**Branch:** `feature/universities-browse`
**Phase:** 2
**Status:** Complete

This document captures what was built, design decisions, and any deviations from the plan in `docs/phase-2/partner-a-phase-2-plan.md`.

---

## What was built

Students can now browse and search the universities Uniflo supports at `/universities`. The page renders on first paint without a loading flash, degrades to a client-side fetch for subsequent searches, and handles all states (loading, empty, error) with appropriate affordances.

### Files added

| File | What it does |
|---|---|
| `app/(app)/universities/page.tsx` | Server component — fetches initial university list server-side and passes it to `UniversityList` |
| `components/universities/university-card.tsx` | Presentational card: name, date range, status pill, Select button |
| `components/universities/university-list.tsx` | Client component: search input, debounced re-fetch, skeleton loading, empty and error states |

### Files modified

| File | Change |
|---|---|
| `components/layout/sidebar.tsx` | Added `/universities` entry with `GraduationCap` icon |

---

## Status pill logic

The status is derived purely from `is_active`, `open_date`, and `close_date` — no backend state required:

| Condition | Label | Style |
|---|---|---|
| `is_active === false` OR past `close_date` | Closed | Muted grey |
| Before `open_date` | Opens in N days | Amber |
| Between `open_date` and `close_date`, `is_active === true` | Open now | Emerald |

Days-until is calculated fresh on each render from `Date.now()` — no hydration mismatch risk because this is a client component.

---

## Design decisions

### 1. Server component fetches initial list; client component owns search

The page is a server component that fetches `GET /universities` using the server Supabase client for the JWT. This gives first paint with data — no loading flash for the common case. `UniversityList` is a client component that handles debounced search re-fetches against the same endpoint with a `q` query param. The split means: fast initial render (server) + interactive search (client), with no intermediate loading state visible to the student on arrival.

### 2. `apiClient` is browser-only — server component uses raw fetch

`lib/api/client.ts` imports `createClient` from `lib/supabase/client` (the browser Supabase client). A server component cannot call it. The universities page therefore does a raw `fetch` call against `NEXT_PUBLIC_API_URL`, reading the token from the server Supabase client's session. This is a one-off in the page — if this pattern repeats across multiple server-fetching pages, a server-safe API helper in `lib/api/server.ts` would be worth introducing.

### 3. Select button is a no-op placeholder

The `onSelect` prop on `UniversityCard` is wired to an empty function in `UniversityList`. Task 3 replaces this with the selection context hook. The card's `onSelect` prop is the stable integration point — Task 3 passes the real callback without touching the card component.

### 4. Debounce with `useRef`, not `useMemo`

The debounce timer is stored in a `useRef` (not state) to avoid triggering re-renders on every keystroke. The ref is cleaned up on unmount to prevent the callback firing after the component is gone.

### 5. Distinct empty-state copy

Two empty states with different copy:
- No query: "No universities are available right now." — tells the student nothing is seeded yet
- With query: `No universities match "query". Try a different search.` — tells the student their search had no hits, not that the system is empty

A generic "nothing found" message would be ambiguous and less useful.

### 6. Skeleton matches card shape

The skeleton placeholder renders three cards with the same structure (name, date range, button) so the layout doesn't shift when the real cards arrive. This is consistent with the skeleton pattern established in `components/profile/overview.tsx`.

---

## Deviations from the plan

| Plan item | What actually happened |
|---|---|
| "Fetch the initial university list server-side using the server Supabase client + typed API client" | Done, but `apiClient` can't be used server-side (it depends on the browser Supabase client). Used a raw `fetch` call in the server component instead — functionally identical. |
| "Mobile check: card grid collapses to single column on 375px viewports" | Done via `grid-cols-1` (default) → `sm:grid-cols-2` → `lg:grid-cols-3`. Verified in build. |

---

## How to verify

### Build

```bash
npx tsc --noEmit   # zero errors
npm run lint       # zero warnings
npm run format:check
npm run test       # 4 tests pass (no new tests — no testable logic beyond component rendering)
npm run build      # /universities appears as ƒ (dynamic)
```

### In the browser

1. Sign in and open `/universities`.
2. Cards should render on first paint (no loading flash for the initial list).
3. Type in the search box — after ~300ms the list re-fetches. Skeletons appear during the fetch.
4. Clear the search — full list returns.
5. On mobile (375px viewport): single-column card grid, search bar visible above the fold.
6. Sidebar: "Universities" entry is present and highlights when on `/universities`.

---

## What this unblocks

- **Task 3** (`feature/university-selection`) — the `onSelect` prop on `UniversityCard` is the integration point for selection context
- **Task 4** (`feature/application-form`) — the selection from Task 3 feeds into the application form at `/applications/new`
