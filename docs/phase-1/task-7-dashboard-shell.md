# Task 7 — Dashboard shell

**Branch:** `feature/dashboard-shell`
**Phase:** 1
**Status:** Complete

This document captures what was built, the design decisions, and any deviations from the Phase 1 plan in `docs/partner-a-phase-1-plan.md`.

---

## What was built

The `/dashboard` page was upgraded from a placeholder to a real entry point. It shows a profile completeness checklist that tells the student which of the three Phase 1 sections they still need to finish. If the student has no profile at all, they are automatically redirected to `/profile/setup` before any dashboard content appears.

### Files changed

| File | Change |
|---|---|
| `app/(app)/dashboard/page.tsx` | Replaced placeholder content with heading and `<ProfileCompleteness />` |
| `components/dashboard/completeness.tsx` | New client component — completeness checklist with data fetching, auto-redirect, and skeleton loading state |

---

## Completeness sections

| Section | API call | Complete when |
|---|---|---|
| Personal profile | `GET /profile` | 200 response |
| Academic records | `GET /academic-records` | 200 response |
| Documents | `GET /documents` | All 3 required types present in the response array |

The three required document types are `id_document`, `matric_results`, and `transcripts`. Partial document progress is shown ("2 of 3 documents uploaded") so the student knows how close they are.

---

## Auto-redirect logic

If `GET /profile` returns **404**, the student is redirected to `/profile/setup` via `router.replace()`. The redirect uses `replace` rather than `push` so the student cannot press back and land on the dashboard mid-setup.

A 404 specifically triggers the redirect — other non-OK responses (500, 401, network errors) do not. This prevents a transient server error from bouncing the student off the dashboard when their profile actually exists.

---

## Design decisions

### 1. Client-side data fetching, not server-side

The completeness check could be done server-side in the page component. Client-side was chosen because:
- The page renders a loading skeleton immediately on first paint, then populates — no blocked server render waiting for three API calls.
- Consistent with the data-fetching pattern used in `documents` and `academic-records` (client components that fetch on mount).
- Server-side rendering would fail silently if the backend is down at build time.

### 2. Parallel API calls with `Promise.allSettled`

All three API calls fire at the same time using `Promise.allSettled`. `allSettled` (not `Promise.all`) is used so a single failing call doesn't prevent the other two from completing. A failed call marks that section as incomplete rather than leaving the whole page stuck.

### 3. Skeleton loading at the section level

While the API calls are in flight, three skeleton blocks render in place of the section cards. This prevents a layout jump when the real cards appear. The skeleton height (`h-[58px]`) matches the actual card height so the jump is minimal.

### 4. Documents partial progress

The plan only mentions "documents ✓" (binary). The implementation tracks `documentsUploaded` (0–3) so the description text reflects partial progress: "2 of 3 documents uploaded." This gives students more useful feedback than just "incomplete."

### 5. `router.replace` for the profile redirect

`router.push` adds the redirect to the browser history, so pressing back would return the student to the dashboard which immediately redirects them again — a loop. `router.replace` swaps the current history entry so the back button takes them somewhere sensible.

---

## Deviations from the Phase 1 plan

None. All checklist items from the plan were implemented.

---

## How to verify

### Locally

1. Ensure `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL`.
2. Sign up with a fresh account and visit `/dashboard` — should redirect to `/profile/setup` automatically.
3. Complete the profile setup flow — revisit `/dashboard`, profile section shows ✓.
4. Complete academic records — academic records section shows ✓.
5. Upload all three documents — documents section shows ✓ and summary reads "Your profile is complete."
6. Upload only 2 documents — documents section shows "2 of 3 documents uploaded."
7. Disconnect the network before visiting `/dashboard` — page shows skeletons briefly, then marks all sections incomplete (no crash).

### CI

- `npm run lint` — passes.
- `npm run build` — passes. `/dashboard` compiles as a dynamic route.

---

## What this completes

This is the final task in Phase 1. The full Phase 1 flow is now:

**Sign up → Profile setup → Academic records → Document upload → Dashboard**

All sections are reachable, all data flows to the backend, and the dashboard reflects the student's real completion state.
