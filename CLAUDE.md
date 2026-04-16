@AGENTS.md

# Uniflo — uniflo-web Context for Claude Code

This file gives Claude Code the context it needs to work effectively in this repository. Read it before touching any code.

For full detail on architecture decisions, schema, and the build plan, refer to the three source-of-truth docs committed in `/docs`:

- `docs/architecture-designs.md` — full stack rationale, schema, layer-by-layer breakdown
- `docs/build-action-plan.md` — phased build plan, partner split, phase status, MVP scope
- `docs/git-github-workflow.md` — branching strategy, PR process, commit conventions

---

## What This Repo Is

`uniflo-web` is the Next.js frontend for Uniflo — a South African university application automation platform. Students fill in their details once and Uniflo automatically applies to multiple universities on their behalf. The student reviews and approves every application before anything is submitted.

This repo is owned by **Partner A (Frontend)**. The backend lives in a separate repo: `uniflo-api` (FastAPI + Python).

---

## Current Phase

**Phase 0 is complete.** Phase 1 is the active phase. Refer to `docs\partner-a-phase-1-plan.md` when prompted on tasks for the phase.

---

## Stack

| Concern        | Tool                                                          |
| -------------- | ------------------------------------------------------------- |
| Framework      | Next.js (App Router) with TypeScript                          |
| Styling        | Tailwind CSS                                                  |
| Auth           | Supabase Auth JS SDK (client side)                            |
| Storage        | Supabase Storage (document uploads)                           |
| API types      | `openapi-typescript` generated from `uniflo-api` OpenAPI spec |
| Linting        | ESLint + Prettier                                             |
| Testing        | Vitest                                                        |
| Error tracking | Sentry                                                        |
| Hosting        | Vercel (Hobby during dev, Pro before beta)                    |
| CI/CD          | GitHub Actions — `frontend.yml`                               |

---

## Architecture Decisions That Affect This Repo

**Auth is fully Supabase-managed.** Use the Supabase JS SDK for all auth flows — sign up, login, Google OAuth, OTP. Never roll custom auth or store credentials locally. The FastAPI backend validates JWTs issued by Supabase; the frontend just passes the token in the `Authorization` header.

**API types come from the backend spec.** `uniflo-api` auto-generates an OpenAPI spec. Run `openapi-typescript` against it to generate TypeScript types. Do not hand-write API types.

**SSR matters for SEO.** Next.js App Router is in use specifically for SSR. Keep that in mind when deciding what to fetch server-side vs client-side.

**Mobile-first.** SA users are on mobile. Every component must be responsive. Test on real Android device dimensions, not just desktop.

**Supabase Realtime is post-MVP.** Do not implement real-time status updates now. The application status dashboard refreshes on load — that is intentional for MVP.

---

## Database Schema (for reference — owned by uniflo-api)

The frontend needs to know the shape of data it sends and receives. These are the Phase 1 and Phase 2 tables. Do not send fields the backend doesn't expect.

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

`frontend.yml` runs on every push:

1. ESLint
2. Vitest
3. Deploys to Vercel on merge to `main`

Nothing merges with a failing CI run.

---

## Rules

When writing code, write comments that explain how the code work so one can understand how the code works
Keep the comments consice and professional but easy enough that someone not proficient can understand before we actually push the branch out
After every feature branch is done, write documentation that explains everything you did, design decisions, changes in implementation and make it an md file
Make commits as you work on each feature branch so you can track your history
Review all your work when you are done to catch mistakes, revise work to be better or to just note stuff for your improvement

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
