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

**Goal:** the setup flow isolates the fields shown to each applicant by **current status**
(still-in-G12 / completed-matric / gap-year / employed / **upgrading**) and swaps the
**ID-vs-passport** input by **citizenship** (SA Citizen / Permanent Resident / Refugee / Asylum
Seeker / International), capturing exactly what each situation needs.

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

**D1. Promote status + citizenship earlier.** Move `current_activity` (status) and add a
citizenship block (`citizenship_status` / `is_sa_citizen`) into an early step so later fields can
gate on them.

**D2. ID-vs-passport swap (citizenship-gated).**
- SA Citizen / Permanent Resident → SA-ID input; run `validateSAID` (`lib/utils/sa-id.ts`).
- International / Refugee / Asylum Seeker → swap to `passport_number` + `study_permit_type`
  (`Select`) + `nationality` (country); **do not** run `validateSAID` on this branch.
- Add `is_sa_citizen` + the three new fields to `setup-form.tsx` (currently only `edit-form.tsx`
  has `is_sa_citizen`), and mirror the new passport/permit fields into `edit-form.tsx` so the two
  forms don't drift further. Prefer a shared citizenship field-group component.

**D3. Status-gated guidance.** Use `current_activity` to drive which academic-record path is
surfaced downstream (the academic-records page already splits `grade_12_final`). Remove
`"Upgrading matric"` from `AUTOMATION_BLOCKED_ACTIVITIES` in `lib/constants/profile-enums.ts` (now
supported); keep `"At university"`. The apply gate at `app/(app)/applications/new/page.tsx` uses
`isAutomationBlocked()` and needs no change beyond the constant.

**D4. Enums + types.** Add `CITIZENSHIP_STATUS_OPTIONS` and `STUDY_PERMIT_OPTIONS` to
`lib/constants/profile-enums.ts`. Replace the stale hand-written `ProfilePayload` in
`setup-form.tsx` with the generated `StudentProfileWrite`; regenerate `lib/api/schema.d.ts` after
the backend schema lands. (Opportunistic cleanup, flagged not required: migrate the two raw
`fetch('/profile')` calls onto `apiClient`.)

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
