# uniflo-web

Frontend for **Uniflo** — a South African university application automation platform. Students fill in their details once and Uniflo automatically applies to multiple universities on their behalf. Students review and approve every application before anything is submitted.

This repo is owned by **Partner A (Frontend)**. The FastAPI backend lives separately in `uniflo-api`.

For architecture, schema, and build-plan detail see `docs/` — notably `docs/architecture-designs.md`, `docs/build-action-plan.md`, and `docs/partner-a-phase-1-plan.md`.

## Stack

| Concern   | Tool                                               |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16 (App Router) with TypeScript            |
| Styling   | Tailwind CSS v4                                    |
| Auth      | Supabase Auth (`@supabase/ssr` + `supabase-js`)    |
| Storage   | Supabase Storage (document uploads)                |
| API types | `openapi-typescript` (generated from `uniflo-api`) |
| Linting   | ESLint + Prettier                                  |
| Testing   | Vitest (+ jsdom)                                   |
| Hosting   | Vercel                                             |
| CI        | GitHub Actions — `.github/workflows/frontend.yml`  |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env.local
```

You'll need:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `NEXT_PUBLIC_API_URL` — base URL for the `uniflo-api` FastAPI backend

Never commit `.env.local`. If you add a new variable, add it to `.env.example` with a short description at the same time.

### 3. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. The dev server hot-reloads on edit.

## Scripts

| Command         | What it does                       |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the Next.js dev server       |
| `npm run build` | Production build (runs in CI)      |
| `npm run start` | Serve the production build locally |
| `npm run lint`  | ESLint over the whole tree         |
| `npm run test`  | Run Vitest suite once              |

## Project layout

```
app/                     Next.js App Router entry points
  (auth)/                Public auth screens (login, signup, forgot-password)
  (app)/                 Protected post-login app shell (dashboard, profile, …)
  auth/callback/         OAuth callback route handler
components/              React components, organised by feature
  auth/                  Sign-in / sign-up client forms
  layout/                App shell — sidebar, navbar, user menu
  profile/               Profile setup + overview
  academic-records/      NSC subjects form
  documents/             Document upload with progress
  ui/                    Primitive UI (Button, Input, Select, Skeleton)
lib/
  supabase/              Browser + server + middleware Supabase clients
  utils/                 Small utilities (cn, …)
  constants/             Static tables (e.g. canonical NSC subjects)
proxy.ts                 Next.js middleware (session refresh + route guards)
tests/                   Vitest suites
docs/                    Source-of-truth architecture & phase docs
```

## Git workflow

- **Never commit to `main` directly.**
- Work on `feature/*` branches cut from `main`.
- PRs target `main`. Merge with **Squash and Merge** only.
- CI must be green. Delete the branch after merge.

Full detail in `docs/git-github-workflow.md`.

## Contributing conventions

- Auth is Supabase-managed — never roll custom auth or store credentials locally.
- API types come from the `uniflo-api` OpenAPI spec — do not hand-write them.
- Mobile-first. Test on real Android viewports, not just desktop.
- `gender` and `home_language` on `student_profiles` are **mandatory** — they drive the Playwright automation in Phase 2.
- The `subjects` JSON contract is locked. See `docs/partner-a-phase-1-plan.md` before changing the shape.
