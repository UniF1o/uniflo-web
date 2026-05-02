# Task 4 — Application form (programme + application year)

**Branch:** `feature/application-form`
**Phase:** 2
**Status:** Complete

This document captures what was built, design decisions, and any deviations from the plan in `docs/phase-2/partner-a-phase-2-plan.md`.

---

## What was built

Students who have selected universities are prompted to provide a programme name and application year for each selection on `/applications/new`. The form validates all fieldsets before enabling a "Review" button. Clicking Review writes the values into the selection context and navigates to `/applications/review` (Task 5).

### Files added

| File | What it does |
|---|---|
| `components/applications/application-fieldset.tsx` | Presentational component: university name heading, programme text input, application-year select. Stateless — values and errors come from props |
| `components/applications/new-applications-form.tsx` | Client component: holds `fields` and `errors` state for all fieldsets, derives `isAllValid` reactively, validates on Review click, writes to context and navigates |

### Files modified

| File | Change |
|---|---|
| `app/(app)/applications/new/page.tsx` | Replaced stub content with `<SelectionGuard><NewApplicationsForm /></SelectionGuard>` |

---

## Design decisions

### 1. Parent-owned form state keyed by `universityId`

The `NewApplicationsForm` holds a single `Record<universityId, { programme, year }>` for values and a parallel `Record<universityId, { programme?, year? }>` for errors. This avoids the imperative ref approach (`ref.current.validate()`) while still letting the parent:

- Derive `isAllValid` in one place without per-fieldset callbacks
- Collect all field values on Review click without asking each fieldset for its current state
- Write to the selection context in one loop, atomically

### 2. `isAllValid` derived reactively — not a `useEffect`

```tsx
const isAllValid =
  entries.length > 0 &&
  entries.every((e) => {
    const f = fields[e.universityId] ?? { programme: "", year: "" };
    const prog = f.programme.trim();
    return prog.length >= 3 && prog.length <= 120 && !!f.year;
  });
```

This runs on every render and directly drives the `disabled` prop of the Review button. A `useEffect` writing to a `useState` would introduce a one-render lag and unnecessary re-renders. The derivation is cheap.

### 3. `useState` initializer pre-fills from context

```tsx
const [fields, setFields] = useState<Record<string, FieldValues>>(() =>
  Object.fromEntries(
    entries.map((e) => [
      e.universityId,
      {
        programme: e.programme ?? "",
        year: e.applicationYear ? String(e.applicationYear) : "",
      },
    ]),
  ),
);
```

If the student navigates back from the review page, the context already holds `programme` and `applicationYear` from the previous Review click. The lazy initializer reads these on mount, so the fields are pre-populated. No separate "sync from context" effect is needed.

### 4. `ApplicationFieldset` is purely presentational — no `"use client"`

The component has no hooks and no browser APIs. It receives values, errors, and callbacks as props. Keeping it as a plain (server-compatible) component means it can be imported by any client component without needing its own boundary, and it's trivial to test in isolation.

### 5. Per-field error clearing matches the Phase 1 profile form UX

```tsx
setErrors((prev) => {
  const uErrors = prev[universityId];
  if (!uErrors?.[field]) return prev; // no-op if no error — avoids extra re-render
  const remaining = { ...uErrors };
  delete remaining[field];
  // ...
});
```

Only the field being edited clears its error. If programme has an error and the student edits the year field, the programme error stays visible until they correct programme. This matches the behaviour in `ProfileSetupForm`.

### 6. Year is a `<select>` bounded to `[currentYear, currentYear + 1]`

A `<number>` input would require range validation messages and nudges users to type a year. A select with two options enforces the valid range by construction, opens the native mobile picker, and eliminates that entire class of validation errors. The options are computed at module load time from `new Date().getFullYear()`.

### 7. No separate guard — `SelectionGuard` handles mid-session remove-all

The plan mentioned duplicating the guard in the form component. It isn't needed: `SelectionGuard`'s `useEffect` watches `entries.length` and fires `router.replace('/universities')` any time it drops to zero — including after the initial mount. The `if (entries.length === 0) return null` before it also prevents `NewApplicationsForm` from rendering empty.

---

## Deviations from the plan

| Plan item | What actually happened |
|---|---|
| "Redirect to `/universities` if the selection is empty (guard duplicated from Task 3)" | Not duplicated. `SelectionGuard` already handles deep-link AND mid-session remove-all via its `entries.length` effect. Adding a second guard would be dead code |
| `applicationYear` described as "number/select input" | Implemented as `<select>` only (not a hybrid). A number input would require explicit range validation; the select enforces the bound by construction and opens the native mobile picker |

---

## How to verify

### Build

```bash
npx tsc --noEmit   # zero errors
npm run lint       # zero warnings
npm run format:check
npm run test       # 4 tests pass
npm run build      # /applications/new appears as ƒ (dynamic)
```

### In the browser

1. Sign in → `/universities` → select 1+ universities → click Continue.
2. Land on `/applications/new`. Review button is disabled.
3. Fill in programme ("BSc CS") for the first university — still disabled (year not selected, or second fieldset empty).
4. Select a year for the first university — if there's a second fieldset, button stays disabled until that's also complete.
5. All fieldsets complete → Review button enables.
6. Click Review with empty programme (clear the field first) → "Programme is required." error appears below the field. Fill it in → error clears on typing.
7. Type 1–2 characters in programme → error "Programme must be at least 3 characters." on click. Correct it → error clears.
8. Type 121+ characters → error "Programme must be at most 120 characters." on click.
9. Remove one university via the selection bar → its fieldset disappears cleanly; remaining fieldsets and validity state are unaffected.
10. Remove all universities via the selection bar → immediately redirected to `/universities`.
11. Navigate directly to `/applications/new` with empty selection → immediately redirected to `/universities`.
12. Fill all fieldsets → click Review → navigates to `/applications/review` (404 until Task 5).
13. Mobile (375px): single-column layout, fields fill width, year dropdown opens native picker.
14. "← Back to universities" link navigates to `/universities` without losing the selection bar state.

---

## What this unblocks

- **Task 5** (`feature/application-review`) — `entries` from `useSelection()` now carry `programme` and `applicationYear` on every entry. The review page reads them directly to build the review summary and POST to `/applications`.
