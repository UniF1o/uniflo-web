# Task 6 — Application status dashboard

**Branch:** `feature/applications-dashboard`
**Phase:** 2
**Status:** Complete

This document captures what was built, design decisions, and any deviations from the plan in `docs/phase-2/partner-a-phase-2-plan.md`.

---

## What was built

`/applications` is the post-submission home screen — students see every application they've started and its current status. `/applications/[id]` is the detail view with full job information and a retry button for failed applications. The dashboard page gains an applications summary card that appears once the student has at least one application.

### Files added

| File | What it does |
|---|---|
| `components/applications/status-badge.tsx` | Pill component mapping the four status strings to design-token colours |
| `components/applications/application-list.tsx` | Client component: renders the applications list with a Refresh button and relative timestamps |
| `components/applications/application-detail.tsx` | Client component: application + job detail view with retry affordance |
| `app/(app)/applications/page.tsx` | Server component: fetches `GET /applications` and `GET /universities` in parallel; passes the pre-joined data to `ApplicationList` |
| `app/(app)/applications/[id]/page.tsx` | Server component: fetches `GET /applications/{id}` and the university for display; renders `ApplicationDetail` |

### Files modified

| File | Change |
|---|---|
| `components/layout/sidebar.tsx` | Added "Applications" nav item with `ClipboardList` icon |
| `app/(app)/dashboard/page.tsx` | Made async; added server-side `fetchApplicationCounts` and applications summary card |
| `docs/phase-2/partner-a-phase-2-plan.md` | All 6 Task 6 checklist items ticked |
| `CLAUDE.md` | Updated current phase; added Task 6 write-up link |

---

## Design decisions

### 1. Parallel fetch for university names

`ApplicationWithJob` only includes `university_id` — the display name is not in the pre-joined shape. Rather than N+1 requests (one per row), `ApplicationsPage` fetches `GET /universities` alongside `GET /applications` in a `Promise.all`. The resulting `Record<string, string>` lookup is passed to `ApplicationList` as a prop. The university list is tiny for MVP (3–5 rows), so this is a single extra request with negligible cost.

```tsx
const [applications, universities] = await Promise.all([
  token ? fetchApplications(token) : Promise.resolve(null),
  token ? fetchUniversities(token) : Promise.resolve(null),
]);
const universityNames: Record<string, string> = {};
for (const u of universities ?? []) {
  universityNames[u.id] = u.name;
}
```

### 2. No Supabase Realtime — Refresh button instead

`CLAUDE.md` is explicit: Supabase Realtime is post-MVP. The list renders fresh data on page load. A visible "Refresh" button lets the student manually re-fetch. `isRefreshing` drives an animated spinner on the icon (via `animate-spin`) without going through the Button's `loading` prop, so the label can change to "Refreshing…" while the icon spins.

### 3. 404 vs API error distinction on the detail page

`fetchApplication` returns a tagged union:

```tsx
async function fetchApplication(...): Promise<ApplicationWithJob | "not_found" | null> {
  if (res.status === 404) return "not_found";
  if (!res.ok) return null;           // other error
  return res.json();
}
```

`"not_found"` triggers Next.js `notFound()` (renders the 404 boundary); `null` renders an inline error message with a "Refresh" instruction. This avoids showing a misleading 404 page when the API is temporarily unavailable.

### 4. Retry wired against the schema's endpoint

The schema already defines `retry_application: POST /applications/{id}/retry → Application`. `ApplicationDetail` calls this directly via `apiClient.post<Application>`. After a successful retry the response's `status` field updates `currentStatus`, which hides the retry button and updates the `StatusBadge` without a full page reload.

### 5. Screenshot URL guarded for Phase 3

`ApplicationJob.screenshot_url` is in the schema as a Phase 3 deliverable. The detail view only renders the row when `job.screenshot_url` is non-null:

```tsx
{job.screenshot_url && (
  <DetailRow label="Screenshot">
    <a href={job.screenshot_url} target="_blank" rel="noopener noreferrer">
      View screenshot
    </a>
  </DetailRow>
)}
```

### 6. Dashboard applications summary is conditional

The applications card only renders when `appCounts.total > 0` — students who haven't applied yet see a clean dashboard without an empty "0 applications" card. The fetch cost is one server-side API call that runs in parallel with `ProfileCompleteness`'s client-side fetches.

### 7. Relative timestamp computed client-side

`formatRelativeTime` runs at render time on the client. For MVP accuracy is fine; the student can hit Refresh if they need up-to-date timestamps. A shared utility function was not created because this is the only component that needs relative time — no premature abstraction.

---

## Deviations from the plan

| Plan item | What actually happened |
|---|---|
| "mobile: rows become cards" | Implemented via `flex-col sm:flex-row` responsive layout — same pattern used throughout Phase 2. Not a separate card component |
| Failed-state "Retry" or "Contact support" placeholder | Retry is fully wired (the schema has `POST /applications/{id}/retry`) so the placeholder path was not needed |
| `generateMetadata` on detail page | Title is static "Application" for MVP — Task 7 (polish) can add dynamic title from the fetched application |

---

## How to verify

### Build

```bash
npx tsc --noEmit
npm run lint
npm run format:check
npm run test
npm run build   # /applications and /applications/[id] appear as ƒ (dynamic)
```

### In the browser

1. Submit at least one application via `/applications/review`.
2. Redirect lands on `/applications` — list shows the application with "Queued" status badge, programme, year, relative time, "View →" link.
3. Click "Refresh" — spinner plays on the icon, label changes to "Refreshing…", list updates.
4. Click "View →" — detail page loads with application fields, automation status section, and retry button (only visible if status is `failed`).
5. Navigate directly to `/applications/[nonexistent-id]` — Next.js 404 page.
6. Dashboard: after having at least one application, an "Applications — N of M submitted" card appears below ProfileCompleteness.
7. Mobile (375px): list rows stack vertically, badge wraps next to university name, Refresh button fits the top bar.
8. Sidebar: "Applications" nav item appears below "Universities" with `ClipboardList` icon; highlights correctly on `/applications` and `/applications/[id]`.
9. Empty state: student with no applications sees centred "No applications yet" block with "Browse universities →" CTA.

---

## What this unblocks

- **Task 7** (`feature/phase-2-polish`) — the full Phase 2 flow is now end-to-end. Task 7 closes out Phase 2 with a final polish pass, accessibility sweep, and cross-task review doc.
