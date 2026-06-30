# Phase 6 — Applicant-type + citizenship coverage (frontend)

> Frontend half of a cross-repo plan. Backend (adapters/mapping/schema) lives in
> `uniflo-api/docs/phase-6/`; the offline harness in `uniflo-testing/docs/phase-6/`.
> **Status: plan only. No implementation until research PRs #80 (UJ) and #82 (UP) are merged.**

## Context

The Phase 3 portal-research effort mapped how each university portal's form branches by applicant
type and citizenship. The profile-setup flow has not caught up.

`components/profile/setup-form.tsx` is a 5-step wizard that branches on **nothing**:
`current_activity` (status) sits in an optional last step; `is_sa_citizen` is absent from setup
entirely (it exists only in `edit-form.tsx`); the ID input is hardcoded "South African ID number"
with no passport alternative. There is also no `passport_number` / permit field in the schema yet
(added by the backend half).

**Goal:** **applicant type is the first question**, and it drives the whole wizard — the academic
info and documents requested are isolated to what that type needs (Grade 10 / Grade 11 / in matric
/ completed matric / upgrading / gap year / employed / at university). Setup is also **time-aware**:
depending on the month of setup, a current matric learner can add whatever interim results they
have (April, June/July, September prelims). Citizenship is the secondary axis, swapping the
**ID-vs-passport** input (SA Citizen / Permanent Resident / Refugee / Asylum Seeker / International).

### Decisions (locked)
- **Full residency taxonomy** drives the citizenship block: `citizenship_status` +
  `passport_number` + `study_permit_type` (new backend fields) alongside existing `nationality`
  and `is_sa_citizen`.
- No new form library — keep the plain `useState` + per-step validator pattern.
- Conform to the design lock `docs/phase-3/app-redesign.md` (cream/cobalt, hairline borders, no
  glows/gradients, no em dashes, plain-noun titles, short declarative sentences).

### Dependency
This consumes new backend fields (`citizenship_status`, `passport_number`, `study_permit_type`).
Regenerate `lib/api/schema.d.ts` via `npm run types:api` **after** the backend schema lands; do not
hand-write the types.

---

## Workstream D — Conditional profile setup

Reuse the existing conditional-block precedents (`disability !== "None"`,
`mailingSameAsResidential`, `wantsResidence`) and the field primitives in `components/ui/`
(`Input`, `Select`, `Checkbox`, `DateInput`, `FormSection`).

### Applicant type is the entry point (Step 1)
The **first question** is "What best describes you right now?" — a single selector whose answer
drives the whole wizard: which academic-info fields, which document uploads, and which downstream
steps appear. Citizenship is the **secondary** axis (drives only the ID-vs-passport swap).

| Status | Apply-eligible? | Academic info | Documents |
|--------|-----------------|---------------|-----------|
| In Grade 10 | No (profile-only) | optional Grade 10 results | ID/passport |
| In Grade 11 | No (profile-only) | Grade 11 results | ID/passport, Grade 11 results |
| In Grade 12 (matric) | Yes — current learner | Grade 11 final (+ interim, see D1c) | ID/passport, Grade 11 results |
| Completed matric (prior year) | Yes — completed | Grade 12 final | ID/passport, matric certificate/results |
| Repeating / upgrading matric | Yes — upgrading | Grade 12 final + upgrade subjects | ID/passport, matric results |
| Gap year | Yes — completed | Grade 12 final | ID/passport, matric certificate/results |
| Employed | Yes — completed | Grade 12 final | ID/passport, matric results (CV note for Wits) |
| At university (transfer) | No (profile-only, out of scope) | — | ID/passport |

Profile-only statuses (Grade 10/11, at-university) save a full profile, but the Apply step shows a
clear "not eligible to apply yet — profile saved" message (no adapter run). **Assumption flagged
for confirmation:** Grade 10/11 are selectable but profile-only; flip easily if they should be
hidden entirely.

**D1. Make applicant type the entry point.** Promote the status selector (today's
`current_activity`, currently the optional last step) to **Step 1**, expand its options to the
taxonomy above, and gate every later step on it. Place the citizenship block
(`citizenship_status` / `is_sa_citizen`) immediately after so the ID-vs-passport swap keys off it.

**D1b. Status-driven info + documents.** Surface academic-info fields and document-upload prompts
per the matrix above. Reuse the per-record-type academic forms (the academic-records page already
splits `grade_12_final`) and the existing document types
(`ID_COPY`/`MATRIC_RESULTS`/`GRADE11_RESULTS`/…). The matrix is the single source of truth shared
with the apply gate.

**D1c. Time-aware interim results (month of setup).** For a current matric (Grade 12) learner, use
the **current date** to offer the interim result sets plausibly available by then, so students add
their latest marks as the year progresses:
- ~Apr onward → April/term-1 (`grade_12_april`)
- ~Jun/Jul onward → mid-year / June (`grade_12_june`)
- ~Sep onward → September prelims (`grade_12_september` — new record type)
- ~Nov/Dec onward → final NSC (`grade_12_final`)
Each is **optional** ("add it if you have it"), additive to the Grade 11 final base, labelled by
month. Completed/gap/employed go straight to `grade_12_final`. Drive the cutoffs off a small
`interimResultsAvailable(today)` helper (data-driven, not hard-coded per render). Add
`grade_12_september` to `RECORD_TYPE_LABELS` (`lib/api/academic-records.ts`).

**D2. ID-vs-passport swap (citizenship-gated).**
- SA Citizen / Permanent Resident → SA-ID input; run `validateSAID` (`lib/utils/sa-id.ts`).
- International / Refugee / Asylum Seeker → swap to `passport_number` + `study_permit_type`
  (`Select`) + `nationality` (country); **do not** run `validateSAID` on this branch.
- Add `is_sa_citizen` + the three new fields to `setup-form.tsx` (currently only `edit-form.tsx`
  has `is_sa_citizen`), and mirror the new passport/permit fields into `edit-form.tsx` so the two
  forms don't drift further. Prefer a shared citizenship field-group component.

**D3. Status-gated guidance + apply gate.** Use `current_activity` to drive which academic-record
path is surfaced downstream. In `AUTOMATION_BLOCKED_ACTIVITIES` (`lib/constants/profile-enums.ts`):
remove `"Upgrading matric"` (now supported); keep `"At university"`; **add `"In Grade 10"` and
`"In Grade 11"`** (profile-only — can't apply yet). The apply gate at
`app/(app)/applications/new/page.tsx` uses `isAutomationBlocked()` and needs no change beyond the
constant, but its message should read "not eligible to apply yet" for these statuses.

**D4. Enums + types.** Expand `CURRENT_ACTIVITY_OPTIONS` to the Step-1 taxonomy (add "In Grade 10"
and "In Grade 11"). Add `CITIZENSHIP_STATUS_OPTIONS` and `STUDY_PERMIT_OPTIONS`. Add
`grade_12_september` to `RECORD_TYPE_LABELS` (`lib/api/academic-records.ts`). Replace the stale
hand-written `ProfilePayload` in `setup-form.tsx` with the generated `StudentProfileWrite`;
regenerate `lib/api/schema.d.ts` after the backend schema lands. (Opportunistic cleanup, flagged
not required: migrate the two raw `fetch('/profile')` calls onto `apiClient`.)

**D5. Design lock.** Conform to `docs/phase-3/app-redesign.md`.

---

## Workstream E3 — Frontend tests (vitest)

Conditional rendering: the citizenship swap shows passport/permit and hides SA-ID;
`validateSAID` runs only on the SA branch; status gating surfaces the right downstream path. Follow
the existing component-test patterns.

---

## Verification

```
cd uniflo-web && npm run lint && npm run format:check && npx tsc --noEmit && npm test && npm run build
```
- Clean, with a regenerated `lib/api/schema.d.ts`.
- **Manual:** walk `/profile/setup` as an SA citizen, an international applicant, and an upgrader;
  confirm the right fields appear/validate and the payload matches `StudentProfileWrite`.

---

## Execution gating (user directive)
1. **Now:** this plan PR only.
2. **Hold:** do not start Workstream D / E3 until research PRs **#80 (UJ)** and **#82 (UP)** are
   merged, and until the backend schema fields land so types can be regenerated.
3. **Then:** D1 → D2 → D3/D4 → E3.
