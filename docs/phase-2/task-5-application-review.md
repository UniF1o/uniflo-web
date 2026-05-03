# Task 5 — Review and approve screen

**Branch:** `feature/application-review`
**Phase:** 2
**Status:** Complete

This document captures what was built, design decisions, and any deviations from the plan in `docs/phase-2/partner-a-phase-2-plan.md`.

---

## What was built

`/applications/review` is the final checkpoint before any application is submitted. The student sees a read-only summary of their profile, academic records, and documents alongside the list of applications they are about to send. The "Submit applications" button stays disabled until every completeness check passes and the consent checkbox is ticked. On submit, each application is POSTed to `/applications` sequentially; partial failures stop the loop and surface the backend error inline with a retry affordance.

### Files added

| File | What it does |
|---|---|
| `app/(app)/applications/review/page.tsx` | Server component: fetches profile, academic records, and documents in parallel using the session token; passes them as props to `ReviewScreen` |
| `components/applications/review-screen.tsx` | Client component: selection guard, completeness checks, sequential submit, consent checkbox, retry logic |

### Files modified

| File | Change |
|---|---|
| `components/universities/selection-bar.tsx` | Two fixes carried over from feature/application-form: `md:left-64` so the bar doesn't overlap the desktop sidebar, `py-4` to match the sidebar footer height |
| `docs/phase-2/partner-a-phase-2-plan.md` | All 4 Task 5 checklist items ticked |
| `CLAUDE.md` | Updated "Current Phase" to Tasks 1–5 complete, Task 6 next; added Task 5 write-up link |

---

## Design decisions

### 1. Server-fetches profile/records/documents; client reads selection

The selection (which universities, programme, year) lives in React context — a server component can't read it. But profile, academic records, and documents are in the backend and are best fetched server-side (first paint without a loading flash, same pattern as Task 2).

The split: `page.tsx` is a server component that fetches the three backend resources and passes them as props. `ReviewScreen` is a client component that reads the selection from context and combines both data sources.

### 2. Null vs empty-array for server fetch failures

The three fetch helpers return `null` on any error (non-2xx, network failure, missing API URL) and an empty array `[]` on a successful fetch that returned no data. This lets `ReviewScreen` distinguish between "couldn't load" and "genuinely no records":
- `null` → error banner: "Couldn't load. Refresh the page."
- `[]` → prompt banner: "Nothing here yet. Add them." with a link
- `[...]` → render the data

### 3. Completeness checks derive directly from the fetched data

```tsx
const profileComplete =
  !!profile &&
  REQUIRED_PROFILE_FIELDS.every((f) => !!profile[f as keyof ProfileResponse]);

const recordsOk = academicRecords !== null && academicRecords.length > 0;

const uploadedTypes = new Set(documents?.map((d) => d.type) ?? []);
const docsOk =
  documents !== null &&
  REQUIRED_DOC_TYPES.every((t) => uploadedTypes.has(t));
```

`REQUIRED_PROFILE_FIELDS` lists the nine fields the Playwright automation needs to fill portal forms — any missing field blocks submission. `REQUIRED_DOC_TYPES` are the three mandatory document slots (`id_document`, `matric_results`, `transcripts`).

### 4. Sequential POST — stop on first failure

```tsx
for (const entry of entries) {
  if (statuses[entry.universityId] === "success") continue; // skip on retry
  // ... POST ...
  // On failure: record error, setIsSubmitting(false), return
}
// All succeeded: clear(), router.push("/applications")
```

Sequential rather than `Promise.all` for two reasons the plan spells out: simpler progress reporting (one row at a time changes state) and rate-limit-friendliness. The skip-on-success guard means the retry button only re-sends the failed and pending entries — already-submitted applications are never duplicated.

### 5. Per-entry submit state drives inline feedback

```tsx
type SubmitStatus = "idle" | "submitting" | "success" | "error";
const [statuses, setStatuses] = useState<Record<string, SubmitStatus>>({});
const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
```

Each entry in the applications list reflects its current status: a spinner label while submitting, a green "Submitted" badge on success, or the backend's `detail` string on failure. This gives the student precise feedback when a batch partially succeeds.

### 6. Selection guard mirrors SelectionGuard from Task 3

```tsx
useEffect(() => {
  const invalid =
    entries.length === 0 ||
    entries.some((e) => !e.programme || !e.applicationYear);
  if (invalid) router.replace("/applications/new");
}, [entries, router]);
```

The guard is stricter than `SelectionGuard`: it also redirects if any entry is missing `programme` or `applicationYear` (the fields written by Task 4). Prevents a student who deep-links to `/applications/review` from seeing a broken form. The `if (guardInvalid) return null` before the render is the synchronous companion so nothing renders during the redirect tick.

### 7. Consent checkbox — POPIA-adjacent requirement

The checkbox is mandatory and blocks the submit button. It is intentionally simple (no modal, no separate consent screen) per the MVP scope. The text matches the phrasing in `docs/architecture-designs.md` section 13. The checkbox uses native `<input type="checkbox">` to avoid accessibility overhead of a custom component for a single instance.

---

## Deviations from the plan

| Plan item | What actually happened |
|---|---|
| Component named `components/applications/review.tsx` | Named `review-screen.tsx` to avoid clashing with a potential `review/page.tsx` import alias and to follow the existing `new-applications-form.tsx` naming pattern |
| "success toast/inline banner" on redirect | Redirect goes to `/applications` without a toast — the dashboard page (Task 6) doesn't exist yet, so a toast passed via URL param or session storage would be dead code until Task 6 merges. Left for Task 7 polish |

---

## How to verify

### Build

```bash
npx tsc --noEmit   # zero errors
npm run lint       # zero warnings
npm run format:check
npm run test
npm run build      # /applications/review appears as ƒ (dynamic)
```

### In the browser

1. Sign in → `/universities` → select 1+ universities → Continue → fill in programme/year → click Review.
2. Land on `/applications/review`. Sections render: Personal details, Academic records, Documents, Your applications.
3. If profile is incomplete, "Some required details are missing. Complete your profile" banner appears and Submit stays disabled.
4. If academic records are missing, "No academic records found. Add your results" banner appears.
5. If a document type is missing, its row shows an `✗ Not uploaded` pill and the banner "Some required documents are missing" appears.
6. With all sections complete, tick the consent checkbox → Submit button enables.
7. Click Submit → each application row shows "Submitting…" then "Submitted". After all succeed, redirects to `/applications` (404 until Task 6).
8. Simulate a failure (API offline) → the failed row shows the backend error message; "Retry" button appears; clicking it skips already-submitted rows and retries the rest.
9. Navigate directly to `/applications/review` with empty selection → immediately redirected to `/applications/new`.
10. Navigate to `/applications/review` with entries missing programme/year → immediately redirected to `/applications/new`.
11. Mobile (375px): sections stack cleanly, consent label wraps properly, Submit button fills the width.

---

## What this unblocks

- **Task 6** (`feature/applications-dashboard`) — applications are now being POSTed to the backend. The dashboard page reads `GET /applications` (with the pre-joined latest-job shape agreed with Partner B) to show status per row.
