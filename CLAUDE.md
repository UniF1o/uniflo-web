@AGENTS.md

# UniFlo — uniflo-web Context for Claude Code

This file gives Claude Code the context it needs to work effectively in this repository. Read it before touching any code.

For full detail on architecture decisions, schema, and the build plan, refer to the three source-of-truth docs committed in `/docs`:

- `docs/architecture-designs.md` — full stack rationale, schema, layer-by-layer breakdown
- `docs/build-action-plan.md` — phased build plan, partner split, phase status, MVP scope
- `docs/git-github-workflow.md` — branching strategy, PR process, commit conventions

Per-task write-ups live under `docs/phase-1/` through `docs/phase-5/`, one file per task or feature, following the pattern set in `docs/phase-1/`. `docs/phase-1/phase-0-1-review.md` is the cross-phase audit that closed out Phase 1; later phases carry their own `phase-<N>-review.md` and task docs. The per-phase plan for each phase is `docs/phase-<N>/partner-a-phase-<N>-plan.md`, with the backend sibling at `uniflo-api/docs/phase-<N>/partner-b-phase-<N>-plan.md`.

---

## What This Repo Is

`uniflo-web` is the Next.js frontend for UniFlo — a South African university application automation platform. Students fill in their details once and UniFlo automatically applies to multiple universities on their behalf. The student reviews and approves every application before anything is submitted.

This repo is owned by **Partner A (Frontend)**. The backend lives in a separate repo: `uniflo-api` (FastAPI + Python).

---

## Current Phase

> **Note:** the executed phase track diverged from `docs/build-action-plan.md`'s
> original numbering (which called Phase 4 "beta hardening"). See that file's "Phase
> numbering note" for the reconciliation. The summary below follows the executed track.

**Phases 0–4 are complete on the frontend side.**

- **Phase 0–1** — sign up (email/password or Google OAuth), multi-step profile setup, academic records, document upload, a dashboard with completeness, and a read-only `/profile` overview.
- **Phase 2** — `/universities` browse + search, selection state (`lib/state/selection.tsx`), the per-university application form, `/applications/review`, and the `/applications` status dashboard. The apply flow runs end to end against the real API.
- **Phase 3** — the confidence-scoring / field-mapping review UI, the submission-proof screen, and the failure/retry + email-challenge handling that sit on top of the backend's real Playwright automation.
- **Phase 4** — the `/courses` page: per-university qualification matching (Qualifies / Borderline / Not yet) from `GET /recommendations`, with an Apply handoff into the existing flow.

**Phase 5 is planned (next up):** structured programme selection (a uni → faculty → course picker carrying `programme_id`, replacing the free-text programme box) and applicant-type inclusivity (`grade_12_final` records plus relaxing the "currently in Grade 12" apply gate). Full breakdown in `docs/phase-5/partner-a-phase-5-plan.md`; the backend sibling is `uniflo-api/docs/phase-5/partner-b-phase-5-plan.md`.

---

## Stack

| Concern        | Tool                                                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router) with TypeScript, React 19                                                                                            |
| Styling        | Tailwind CSS v4                                                                                                                              |
| Auth           | Supabase Auth via `@supabase/ssr` (SSR-aware) + `@supabase/supabase-js`                                                                      |
| Storage        | Supabase Storage (document uploads)                                                                                                          |
| API types      | `openapi-typescript` generated from `uniflo-api` OpenAPI spec — `lib/api/schema.d.ts` (committed), `lib/api/client.ts` (typed fetch wrapper) |
| Linting        | ESLint + Prettier (`format:check` gated in CI)                                                                                               |
| Testing        | Vitest (no `@testing-library/react` yet — added when component tests begin in Phase 2)                                                       |
| Error tracking | Sentry (deferred to Phase 2)                                                                                                                 |
| Hosting        | Vercel (Hobby during dev, Pro before beta)                                                                                                   |
| CI/CD          | GitHub Actions — `.github/workflows/frontend.yml` runs lint, `format:check`, `tsc --noEmit`, Vitest                                          |

---

## Architecture Decisions That Affect This Repo

**Auth is fully Supabase-managed.** Use the Supabase JS SDK for all auth flows — sign up, login, Google OAuth, OTP. Never roll custom auth or store credentials locally. The FastAPI backend validates JWTs issued by Supabase; the frontend just passes the token in the `Authorization` header.

**API types come from the backend spec.** `uniflo-api` auto-generates an OpenAPI spec. Run `openapi-typescript` against it to generate TypeScript types. Do not hand-write API types.

**SSR matters for SEO.** Next.js App Router is in use specifically for SSR. Keep that in mind when deciding what to fetch server-side vs client-side.

**Mobile-first.** SA users are on mobile. Every component must be responsive. Test on real Android device dimensions, not just desktop.

**Supabase Realtime is post-MVP.** Do not implement real-time status updates now. The application status dashboard refreshes on load — that is intentional for MVP.

---

## Database Schema (for reference — owned by uniflo-api)

The frontend needs to know the shape of data it sends and receives. All Phase 1 and Phase 2 types are defined in `lib/api/schema.d.ts`. Do not send fields the backend doesn't expect.

```
users                  — id, email, role, created_at

student_profiles       — id, user_id, first_name, last_name, id_number,
                         date_of_birth, phone, address, nationality,
                         gender, home_language, updated_at

academic_records       — id, student_id, institution, year,
                         subjects (JSON), aggregate

documents              — id, student_id, type, storage_url, uploaded_at

universities           — id, name, website, portal_url,
                         open_date, close_date, is_active         [Phase 2]

applications           — id, student_id, university_id, programme,
                         application_year, status, submitted_at,
                         updated_at, created_at                   [Phase 2]

application_jobs       — id, application_id, status, attempts,
                         last_error, screenshot_url, updated_at,
                         created_at                               [Phase 2]
```

**`users` has no password field.** Supabase Auth owns credentials. The `id` on the `users` table is the same UUID as the Supabase auth user.

**`gender` and `home_language` are mandatory** on `student_profiles`. They are required by the Playwright automation layer to complete university portal forms — not optional display fields.

**`subjects` JSON contract (locked — do not change without coordinating with Partner B):**

```json
{
  "subjects": [
    { "name": "Mathematics", "mark": 78 },
    { "name": "Physical Sciences", "mark": 71 },
    { "name": "English Home Language", "mark": 85 },
    { "name": "Other", "custom_name": "Dramatic Arts", "mark": 82 }
  ]
}
```

The subject name must come from the canonical NSC list (hardcoded TypeScript constant for MVP). Only `"Other"` entries carry a `custom_name`. Free-text keys are not permitted — the backend field mapping service cannot handle inconsistent keys.

**`applications.status` enum:** `"pending"`, `"processing"`, `"submitted"`, `"failed"`.

---

## Git Workflow

Full detail in `docs/git-github-workflow.md`. Summary:

- **Never commit directly to `main`.**
- All work on `feature/*` branches cut from `main`.
- Branch naming: `feature/auth-screens`, `feature/profile-form`, `feature/document-upload`
- PRs target `main`. Merge with **Squash and Merge** only.
- CI must be green before merging. No exceptions.
- Opening a PR on this repo automatically generates a Vercel Preview URL — use it to test UI before merging.
- Delete the feature branch immediately after merging.

**Commit message format:**

```
feat: add multi-step profile form
fix: handle empty subject list in academic records
chore: update openapi-generated types
```

---

## CI/CD

`.github/workflows/frontend.yml` runs on every push:

1. ESLint
2. Prettier — `format:check`
3. TypeScript — `tsc --noEmit`
4. Vitest

Vercel builds a Preview deployment on every PR and deploys to production on merge to `main`. Nothing merges with a failing CI run.

---

## Rules

- **Comment for clarity, not narration.** Add a short comment when the _why_ isn't obvious from the code — a hidden constraint, a subtle invariant, a non-obvious workaround. Don't restate what the code already says. Keep any comment you do write short, professional, and readable to someone who is not deeply proficient.
- **Write a task/feature doc at the end of each feature branch.** Drop it in `docs/phase-<N>/` as `task-<n>-<slug>.md` or `<feature>.md`. Cover: what was built, design decisions, any deviation from the plan, and anything the next person should know. This is the pattern already established in `docs/phase-1/`.
- **Commit as you go on a feature branch.** Small, focused commits — squash-merge collapses them into one clean commit on `main` anyway, so optimise for reviewability of history while the branch is alive.
- **Review your own work before opening the PR.** Run `lint`, `format:check`, `tsc --noEmit`, `test`, and `build` locally. Exercise the feature in a browser (desktop + mobile viewport). Catch the stuff a reviewer shouldn't have to.
- **After every task, do a self-review before reporting done.** Re-read every file you created or modified. Run all CI checks (`lint`, `format:check`, `tsc --noEmit`, `test`, `build`) and fix any failures before committing. Check for logic bugs, edge cases, missing accessibility attributes, and anything that would fail in a real code review. Do not consider a task complete until this pass is clean.

## What Not to Build (MVP Scope)

Do not implement any of the following — they are explicitly post-MVP:

- Payments (PayFast)
- SMS notifications
- Supabase Realtime / real-time status updates
- Essay / motivation letter AI assistance
- PostHog analytics
- React Native mobile app

See `docs/build-action-plan.md` for the full out-of-scope list.

---

## Environment Variables

All secrets are documented in `.env.example` at the repo root. Never hardcode secrets. Never commit `.env.local`. If you add a new environment variable, add it to `.env.example` immediately with a description.
