# Uniflo — MVP Build Action Plan

## Product Summary
Uniflo is a South African university application automation platform. Students fill in their details once and Uniflo automatically applies to multiple universities on their behalf. The MVP has one job: a student signs up, fills in their profile, selects universities, and Uniflo submits those applications automatically.

---

## MVP Scope

### In (MVP)
- Supabase Auth — sign up, login, Google OAuth
- Student profile builder — personal info, academic records
- Document upload — Supabase Storage
- University database — seeded with 3–5 SA universities
- University selection + review and approve flow
- Playwright automation — core product, cannot be cut
- Claude API — field mapping and confidence scoring only
- FastAPI BackgroundTasks — lightweight job processing, no Celery overhead
- Basic application status page — submitted, processing, failed
- Resend — transactional emails only, free tier
- Sentry — error tracking
- GitHub Actions CI/CD

### Out (Post-MVP)
- Payments (PayFast)
- SMS notifications (Clickatell)
- Supabase Realtime — real-time status updates
- Celery + Redis — full job queue (replaced by FastAPI BackgroundTasks for MVP)
- Essay / motivation letter AI assistance
- Subscription tier features — deadline tracking, notification centre
- TVET colleges, bursaries, postgrad
- Mobile app (React Native)

---

## Guiding Principles
- **Never build what you can't test** — every phase ends with something usable
- **Real users before perfect code** — get students using it early, iterate fast
- **Divide and conquer** — clear ownership between partners prevents bottlenecks
- **Document as you go** — future you will thank present you

---

## Partner Split

| Partner A (Frontend) | Partner B (Backend & Automation) |
|----------------------|----------------------------------|
| Next.js frontend | FastAPI backend |
| UI/UX design | Database schema & API design |
| Supabase Auth — client side | Supabase Auth — server side (JWT validation) |
| Application tracker & status dashboard | Playwright automation layer |
| Application review & approve UI | Claude API — field mapping & confidence scoring logic |
| Document upload UI | Celery workers & job queue (post-MVP) |
| Confidence scoring flagging UI | Resend email integration |
| PostHog analytics (post-MVP) | CI/CD pipeline setup (GitHub Actions) |

---

## Phase 0 — Foundation
**Duration:** Weeks 1–2
**Goal:** Development environment, tooling, and deployment pipeline fully set up before a single line of product code is written.
**Reference tag: `[PHASE-0]`**

### Both Partners
- [x] Agree on Git branching strategy — Git Flow: `main`, `feature/*`
- [x] Create a GitHub organisation for Uniflo — separate from personal accounts
- [x] Create two repositories — `uniflo-web` (Next.js) and `uniflo-api` (FastAPI)
- [x] Set up project management — GitHub Projects or Notion for task tracking
- [x] Create a shared `.env.example` in each repo documenting every environment variable
- [x] Set up a shared password manager for API keys and secrets — Bitwarden is free
- [x] Create accounts on: Supabase, Vercel, Render, Sentry, Resend, UptimeRobot

### Partner A — Frontend
- [x] Scaffold Next.js app with TypeScript and Tailwind CSS
- [x] Set up ESLint + Prettier
- [x] Deploy blank Next.js app to Vercel Hobby plan — pipeline should work from day one
- [x] Set up Sentry in the Next.js app

### Partner B — Backend
- [x] Scaffold FastAPI app with SQLModel and Alembic
- [x] Set up Ruff + Black for linting and formatting
- [x] Set up Pytest with a single passing test
- [x] Deploy blank FastAPI app to Render free tier — pipeline should work from day one
- [x] Set up Sentry in the FastAPI app
- [x] Provision a PostgreSQL database on Supabase free tier
- [x] Set up GitHub Actions `backend.yml` — runs Pytest on every push, deploys to Render on merge to `main`
- [x] Set up UptimeRobot to ping the Render backend every 5 minutes — prevents cold starts and keeps Supabase active

### ⚠️ Free Tier Caveats for Development
- **Render** — spins down after 15 minutes of inactivity (cold starts ~30 seconds). UptimeRobot pings prevent this. Acceptable for development, not for production.
- **Supabase** — pauses after 7 days of inactivity. UptimeRobot pings and active development prevent this. Must upgrade to Pro before beta.
- **Sentry** — free Developer plan is limited to 1 user. Share one login during development or upgrade to Team plan ($26/month) at beta.

### ✅ Phase 0 Checkpoint
Both apps are live (even if blank). CI/CD is running. Both partners can push code and see it deploy automatically. Sentry is catching errors. UptimeRobot is monitoring and pinging.

---

## Phase 1 — Auth, Profiles & Documents
**Duration:** Weeks 3–5
**Goal:** A student can sign up, fill in their full profile, and upload their documents. The data foundation is solid.
**Reference tag: `[PHASE-1]`**

### Database Schema Design — Both Partners
Do this together before writing any other code. This is the most important technical decision you will make. Define SQLModel models for:

```
users                  — id, email, role, created_at

student_profiles       — id, user_id, first_name, last_name, id_number,
                         date_of_birth, phone, address, nationality,
                         gender, home_language, updated_at

academic_records       — id, student_id, institution, year,
                         subjects (JSON), aggregate

documents              — id, student_id, type, storage_url, uploaded_at
```

**Schema notes for Phase 1:**
- `users` does not store `hashed_password` — Supabase Auth owns credentials. The `id` is the same UUID as the Supabase auth user.
- `academic_records.subjects` is JSON. Subject names come from a canonical NSC subject list enforced on the frontend. The structure is — both partners must agree on this before writing any code, it is the contract between the frontend form and the backend Pydantic schema:

```json
{
  "subjects": [
    { "name": "Mathematics", "mark": 78 },
    { "name": "Other", "custom_name": "Dramatic Arts", "mark": 82 }
  ]
}
```

Write models first, generate Alembic migration, run migration against Supabase PostgreSQL. Do not include Phase 2 tables in this migration.

### Partner A — Frontend
- [ ] Build authentication screens — sign up, login, forgot password
- [ ] Integrate Supabase Auth JS SDK on the client
- [ ] Build basic app layout — navbar, sidebar, page shell
- [ ] Build student profile setup flow — multi-step form covering all profile fields including gender and home language
- [ ] Build academic records form — subject multi-select from canonical NSC list with mark input per subject, plus "Other" free text option
- [ ] Build document upload UI — ID copy, matric results, transcripts
- [ ] Handle upload progress and error states clearly

### Partner B — Backend
- [ ] Set up Supabase Auth JWT validation middleware in FastAPI
- [ ] Build `/auth` endpoints — register, login, get current user
- [ ] Build `/profile` endpoints — create, read, update student profile
- [ ] Build `/documents` endpoints — upload file to Supabase Storage, save URL to DB
- [ ] Validate all inputs with Pydantic — every request schema defined explicitly
- [ ] Write Pytest tests for all endpoints

### ✅ Phase 1 Checkpoint
A student can sign up, complete their profile, and upload their documents. Data is persisting in PostgreSQL. All endpoints have passing tests in CI.

---

## Phase 2 — University Data & Application Flow
**Duration:** Weeks 6–8
**Goal:** Students can select universities and trigger applications. The full user flow works end to end, even though automation is not real yet.
**Reference tag: `[PHASE-2]`**

### Database Schema Extension — Both Partners
```
universities           — id, name, website, portal_url,
                         open_date, close_date, is_active

applications           — id, student_id, university_id, programme,
                         application_year, status, submitted_at,
                         updated_at, created_at

application_jobs       — id, application_id, status, attempts,
                         last_error, screenshot_url, updated_at, created_at
```

**Schema notes for Phase 2:**
- `applications.programme` — the specific course the student is applying for (e.g. "BSc Computer Science"). Required by Playwright adapters.
- `applications.application_year` — the intended year of study (e.g. 2026). Required by Playwright adapters.
- `applications.status` — enum: `"pending"`, `"processing"`, `"submitted"`, `"failed"`.
- `application_jobs.screenshot_url` — Supabase Storage URL of the submission confirmation screenshot captured by Playwright.
- `application_jobs.updated_at` — tracks when the job status last changed, essential for debugging.

### Partner A — Frontend
- [ ] Build university browsing and search page
- [ ] Build university selection flow — student picks institutions to apply to
- [ ] Build application form — student selects programme and application year per university
- [ ] Build application review screen — shows exactly what will be submitted, student approves before anything is triggered
- [ ] Build application status dashboard — pending, processing, submitted, failed badges per university
- [ ] Handle error states clearly — what does the student see if a submission fails?

### Partner B — Backend
- [ ] Seed the database with 3–5 target SA universities — name, portal URL, deadlines, requirements
- [ ] Build `/universities` endpoints — list, search, filter by currently open applications
- [ ] Build `/applications` endpoints — create application, get status, list all for student
- [ ] Set up FastAPI BackgroundTasks — even if the task just logs "triggered for [university]" for now
- [ ] Build `/application-jobs` endpoints — job status tracking for the dashboard

### ✅ Phase 2 Checkpoint
Full user flow works: signup → profile → select universities → select programme and year → review → trigger → see "processing" on dashboard. Automation is fake but every screen and API endpoint is real. Show this to someone outside the team and watch them use it.

---

## Phase 3 — Automation Layer
**Duration:** Weeks 9–14
**Goal:** Real Playwright adapters for 3–5 universities. Actual form submission happening. This is the MVP.
**Reference tag: `[PHASE-3]`**

### Preparation — Both Partners
Before writing any Playwright or AI code:
- [ ] Manually complete the full application process on each target university portal
- [ ] Document every step — each page, each field, each file upload, each button click
- [ ] Map every university form field to your student profile schema in a shared document
- [ ] Create test accounts on each university portal for development use only
- [ ] Do not write a single line of automation code before this research is complete

### Partner B — Playwright Automation + Claude AI Integration
All automation and AI work belongs to Partner B. This is backend Python work.

- [ ] Build the abstract `UniversityAdapter` base class:
  ```python
  class UniversityAdapter:
      async def login(self): ...
      async def fill_form(self, mapping): ...
      async def upload_documents(self, documents): ...
      async def submit(self): ...
      async def verify_submission(self): ...
  ```
- [ ] Build first adapter — choose the university with the simplest portal
- [ ] Build adapters for remaining 2–4 universities iteratively
- [ ] Integrate Claude API via Anthropic Python SDK
- [ ] Build field mapping service — Claude maps student profile fields to university form fields
- [ ] Build confidence scoring — Claude rates each field mapping, returns a score per field
- [ ] Build portal health monitoring — scheduled job that tests each adapter and flags broken ones
- [ ] Wire adapters into FastAPI BackgroundTasks — job picks up application, runs adapter, updates DB status
- [ ] Capture submission confirmation screenshot as proof — store URL in `application_jobs.screenshot_url`
- [ ] Write tests for every adapter — portal changes are the highest risk in the product

### Partner A — Confidence Scoring UI
Partner A's role in Phase 3 is limited to the frontend UI for confidence scoring. All Claude API and backend work is Partner B's.

- [ ] Build the flagging UI — fields with low confidence scores are highlighted on the application review screen for the student to manually check before submission
- [ ] Build the submission confirmation screen — shows screenshot proof of what was submitted
- [ ] Handle the "failed" state clearly — what does the student see and what can they do if an adapter fails?

### ✅ Phase 3 Checkpoint
A real student can apply to at least 3 SA universities through Uniflo. Real browser automation is running on Render. Claude is mapping fields and scoring confidence. This is your MVP.

---

## Phase 4 — Beta Hardening & Launch
**Duration:** Weeks 15–18
**Goal:** The product is stable, secure, and ready for real students.
**Reference tag: `[PHASE-4]`**

### Infrastructure Upgrades Before Beta
- [ ] Upgrade Vercel Hobby → Vercel Pro ($20/month) — required for commercial use
- [ ] Upgrade Supabase free → Supabase Pro ($25/month) — required for guaranteed uptime
- [ ] Migrate backend from Render free → Railway ($5–20/month) — required to eliminate cold starts
- [ ] Upgrade Sentry Developer → Sentry Team ($26/month) — required for 2-user access
- [ ] Upgrade UptimeRobot free → UptimeRobot Solo (~$7/month) — required for commercial use

### Both Partners — Hardening
- [ ] Security audit — every endpoint checked for auth, authorisation, and input validation
- [ ] POPIA compliance — privacy policy drafted, consent flows in place, data processing documented. Get a SA tech lawyer to review before any real student data is collected. Budget R3,000–8,000.
- [ ] Write end-to-end tests with Playwright for every critical user flow
- [ ] Mobile responsiveness review — test on real Android devices, not just browser dev tools
- [ ] Load test — simulate concurrent users, find bottlenecks before students do
- [ ] Document every university adapter — what it does, how to update it, known edge cases
- [ ] Write a basic runbook — what to do when submissions fail, when a portal changes, when the app goes down

### Beta Launch
- [ ] Contact school principal — arrange for matric students to beta test
- [ ] Offer free access in exchange for detailed feedback
- [ ] Set up a feedback channel — Typeform or WhatsApp group
- [ ] Monitor Sentry obsessively during beta — fix every error real users trigger
- [ ] Talk to users directly — conversations matter more than metrics at this stage
- [ ] Iterate fast — daily fixes are appropriate during beta

### ✅ Phase 4 Checkpoint
Real matric students are using Uniflo. Applications are being submitted. Feedback is coming in. You have a live product.

---

## Post-MVP Roadmap
These phases follow after a successful beta. Order may shift based on user feedback.

| Phase | Focus |
|-------|-------|
| 5 | Payments — PayFast once-off + recurring subscription |
| 6 | Subscription features — deadline tracking, notification centre, Supabase Realtime |
| 7 | SMS notifications — Clickatell integration |
| 8 | Celery + Redis — replace BackgroundTasks for scale |
| 9 | PostHog analytics |
| 10 | TVET college adapters |
| 11 | Bursary application support |
| 12 | AWS migration |
| 13 | Mobile app (React Native) |

---

## Timeline Summary

| Phase | Focus | Duration |
|-------|-------|----------|
| 0 `[PHASE-0]` | Foundation & setup | Weeks 1–2 |
| 1 `[PHASE-1]` | Auth, profiles, documents | Weeks 3–5 |
| 2 `[PHASE-2]` | University data & application flow | Weeks 6–8 |
| 3 `[PHASE-3]` | Automation layer + AI | Weeks 9–14 |
| 4 `[PHASE-4]` | Beta hardening & launch | Weeks 15–18 |

---

## Ongoing From Phase 0

### Weekly Rituals
- **Sunday sync** — 30 mins: what shipped last week, plan for this week, any blockers
- **No red CI** — nothing merges with a failing test, ever

### Never Skip
- Tests for every Playwright adapter — portals change often and silently
- Keep `.env.example` updated when new environment variables are added
- Tag every production release with a version number
