# Task 4 — Student profile setup flow

**Branch:** `feature/profile-setup`
**Phase:** 1
**Status:** Complete

This document captures what was built, the design decisions, and any deviations from the Phase 1 plan in `docs/partner-a-phase-1-plan.md`.

---

## What was built

A three-step profile setup form that collects all fields required by the `student_profiles` table, saves progress to the backend after each step, and redirects to the academic records form on completion.

### Files added

| File | Role |
|---|---|
| `app/(app)/profile/setup/page.tsx` | Server component. Sets page title, renders the client form. |
| `components/profile/setup-form.tsx` | Client component. Owns all form state, validation, step navigation, and API calls. |
| `components/ui/select.tsx` | Styled native `<select>` wrapper — consistent with `Input` appearance, used for gender and home language. |

---

## Steps

| Step | Fields |
|---|---|
| 1 — Personal details | First name, last name, date of birth, SA ID number |
| 2 — Contact details | Phone, residential address, nationality |
| 3 — Identity | Gender (select), home language (select) |

---

## Design decisions

### 1. Three-step split

All fields could technically fit on one long form. Steps are used because:
- Students on mobile (375px screens) scroll a lot less per step.
- Grouping related fields reduces cognitive load at each decision point.
- Partial saves per step protect against drop-off (see decision 2).

### 2. Save to API after each step

Each "Save and continue" POSTs the accumulated data to `/profile` on the backend. The payload grows with each step:
- After step 1: `{ first_name, last_name, id_number, date_of_birth }`
- After step 2: adds `phone, address, nationality`
- After step 3: adds `gender, home_language` (complete profile)

This means if a student drops off after step 2, their personal and contact data is already persisted and they don't need to re-enter it when they return.

**Assumption:** the backend accepts partial profile data (upsert / PATCH semantics via POST). This needs to be confirmed with Partner B when the API is delivered. If the API requires all fields in one request, the save-per-step approach should change to: accumulate all state in the client and POST only on the final step.

### 3. Hand-written `ProfilePayload` type

The FastAPI OpenAPI spec isn't available yet. The `ProfilePayload` interface was manually typed to match the `student_profiles` schema in `docs/build-action-plan.md`. When Partner B delivers the spec, run `openapi-typescript` against it and replace `ProfilePayload` with the generated type.

### 4. `Select` component wrapping native `<select>`

A custom combobox/dropdown library would add unnecessary complexity for two static option lists. The native `<select>` element is fully accessible out of the box (keyboard navigation, screen reader announcements, mobile-native pickers). `appearance-none` removes the browser default arrow; a Lucide `ChevronDown` icon takes its place, styled consistently with the rest of the design.

### 5. Step indicator — numbered circles + connector lines

The step indicator uses numbered circles (filled + ring when active, checkmark when done) connected by thin lines. This pattern is recognisable, lightweight, and doesn't require an external library. On mobile, step labels are hidden (`sm:inline`) to prevent overflow on 375px screens.

### 6. SA ID number field

Input is filtered to digits only via `replace(/\D/g, '')` on `onChange`. The maxLength is 13 to prevent over-typing. Validation checks for exactly 13 digits (the minimum bar for MVP). Full Luhn checksum validation is post-MVP — it adds complexity without meaningful UX benefit at this stage.

### 7. Error clearing on input change

Each field calls `clearError(key)` when the user starts typing, so validation errors disappear as they're corrected rather than persisting until the next submission attempt. This is standard UX for forms with inline errors.

---

## Deviations from the Phase 1 plan

1. **No per-step confirmation** — the plan says "Save and continue per step" but doesn't specify a success toast or indicator between steps. Advancing to the next step is the implicit confirmation of a successful save. A toast can be added later.
2. **Address as single-line input** — the schema has `address` as a text field. A textarea was considered but a single-line input is sufficient for MVP and keeps the form visually consistent. Students typically write a short address like "123 Main St, Soweto, JHB".

---

## How to verify

### Locally

1. Ensure `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL` (the backend dev URL from Partner B).
2. Sign in, then visit `http://localhost:3000/profile/setup`.
3. Step 1 — try submitting empty: all four error messages appear inline. Fill in valid data and click "Save and continue" — page advances to step 2, check the backend for the partial save.
4. Step 2 — repeat validation check, then save and continue to step 3.
5. Step 3 — select gender and home language, click "Complete setup" — full profile POSTed, redirect to `/academic-records` (404 until Task 5).
6. Click "Back" on steps 2 and 3 — returns to the previous step with data preserved in state.
7. Resize to 375px — form is single-column, step labels hide, all fields remain reachable.

### CI

- `npm run lint` — passes.
- `npm test` — passes.
- `npm run build` — `/profile/setup` compiles as a dynamic route.

---

## What this unblocks

- **Task 5 (academic records)** — students land at `/academic-records` after completing profile setup.
- **Task 7 (dashboard)** — the dashboard's profile-completeness check can now determine whether `student_profiles` has data for the signed-in user and show the correct state.
