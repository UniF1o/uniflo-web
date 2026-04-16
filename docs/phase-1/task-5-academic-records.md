# Task 5 — Academic records form

**Branch:** `feature/academic-records`
**Phase:** 1
**Status:** Complete

This document captures what was built, the design decisions, and any deviations from the Phase 1 plan in `docs/partner-a-phase-1-plan.md`.

---

## What was built

A single-step form at `/academic-records` that collects a student's matric results — school name, academic year, a dynamic list of subjects with marks, and an auto-calculated aggregate. On submit, the data is POSTed to the backend and the student is redirected to the document upload flow.

### Files added

| File | Role |
|---|---|
| `lib/constants/nsc-subjects.ts` | Canonical NSC subject list as a `const` array. Single source of truth for subject names on the frontend. |
| `components/academic-records/records-form.tsx` | Client component. Owns all form state, per-row validation, aggregate calculation, and API submission. |
| `app/(app)/academic-records/page.tsx` | Server component. Sets page title, renders the client form. |

---

## Form structure

| Field | Type | Notes |
|---|---|---|
| Institution | Text input | School or institution name |
| Year | Number input | Academic year, validated 2000 to current year + 1 |
| Subjects | Dynamic row list | One card per subject — see subject row below |
| Aggregate | Derived display | Auto-calculated average, shown in section header |

### Subject row fields

| Field | Type | Notes |
|---|---|---|
| Subject name | `<select>` | Options from `NSC_SUBJECTS` + "Other" at bottom |
| Mark | Number input | Integer 0–100, `step={1}` enforces no decimals |
| Subject name (custom) | Text input | Visible only when "Other" is selected |
| Remove button | Icon button | Hidden when only one row remains |

---

## Design decisions

### 1. Single-step form (not multi-step)

Unlike the profile setup form, academic records fits naturally on one page. All fields are closely related and students typically fill them in one sitting. A multi-step wrapper would add complexity without improving UX.

### 2. Native `<select>` for subject name

With 58 subjects in the list, a native `<select>` is the right call for MVP:
- Mobile devices open the native picker (far better UX than a custom JS dropdown).
- Keyboard navigation (type first letter to jump) works on desktop.
- Zero extra dependencies.

Post-MVP upgrade path: replace with a searchable combobox component.

### 3. Dynamic subject rows

Students have different numbers of subjects (typically 6–8). A static set of fields would either have too many empty rows or not enough. Dynamic add/remove rows with a "Add subject" button matches how students think about their results.

The trash button is hidden when only one row remains — the form must always have at least one subject before it can be submitted.

### 4. Aggregate auto-calculated from marks

The aggregate is recalculated on every render from the current subject state. It only appears in the UI once at least one valid mark has been entered. For MVP the aggregate is a simple average — confirm with Partner B whether they need a weighted average (e.g. weighting by credit value) before going live.

### 5. Per-row error tracking via flat keys

Row-level validation errors (name, customName, mark) are stored in a single flat `Record<string, string>` with keys in the format `"${rowId}.${field}"` (e.g. `"abc123.mark"`). This avoids nested state objects and makes clearing individual field errors straightforward. When a row is removed, all its errors are cleared by iterating keys that start with the row's id.

### 6. `step={1}` on mark input

`<input type="number">` allows decimal input by default. Adding `step={1}` tells the browser the valid step increment is 1, which triggers the browser's native invalid state for decimal entries like "78.5". Our `parseInt` on submit is the authoritative parse, but `step={1}` gives the user earlier feedback at the browser level.

### 7. Locked JSON contract for subjects

The subjects array structure is agreed with Partner B and must not change:
```json
{ "name": "Mathematics", "mark": 78 }
{ "name": "Other", "custom_name": "Dramatic Arts", "mark": 82 }
```
Only `"Other"` entries carry a `custom_name` field. The payload mapping uses a runtime `row.name === "Other"` check to apply the correct shape. The `NSC_SUBJECTS` constant in `lib/constants/nsc-subjects.ts` is the source of truth for valid name strings — the backend field-mapping service maps these exact strings to university portal fields.

### 8. Hand-written `AcademicRecordsPayload` type

The FastAPI OpenAPI spec is not yet available. The `AcademicRecordsPayload` interface was manually typed against the `academic_records` schema in `docs/build-action-plan.md`. When Partner B delivers the spec, run `openapi-typescript` and replace it with the generated type.

---

## Deviations from the Phase 1 plan

1. **No searchable combobox** — the plan specifies "searchable select/combobox" but a native `<select>` was used for MVP. The reasoning is above in decision 2. This is a post-MVP upgrade.
2. **Aggregate formula not confirmed** — the plan says "confirm formula with Partner B". A simple average is used for now. This must be confirmed before the feature goes live with real applications.

---

## How to verify

### Locally

1. Ensure `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL`.
2. Sign in and visit `http://localhost:3000/academic-records`.
3. Submit empty — institution error, year error, and the first subject row's errors all appear inline.
4. Add a second subject row — trash button appears on both rows. Remove one — trash button disappears when only one remains.
5. Select "Other" on a subject row — custom name field appears below. Switch to a real subject — custom name field disappears and the value is cleared.
6. Enter marks — aggregate stat appears in the section header and updates live.
7. Enter a decimal mark (e.g. 78.5) — browser marks the field invalid via `step={1}`.
8. Enter a mark > 100 or < 0 — row-level validation error on submit.
9. Fill all fields correctly and submit — POST fires with the correct payload shape, redirect to `/documents` (404 until Task 6).

### CI

- `npm run lint` — passes.
- `npm run build` — passes. `/academic-records` compiles as a dynamic route.

---

## What this unblocks

- **Task 6 (document upload)** — students land at `/documents` after completing academic records.
- **Task 7 (dashboard)** — the profile completeness check can now verify whether `academic_records` has data for the signed-in user.
