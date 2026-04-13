# Uniflo — Technical Architecture

## Product Summary
Uniflo is a South African university application automation platform. Students fill in their details once and AI agents automatically apply to multiple universities and colleges on their behalf. The student reviews and approves every application before submission.

## Architectural Philosophy
- **Modular monolith first** — one codebase with clearly separated modules, structured to split into microservices later without rewrites
- **Async-first** — university portal automation is slow and unpredictable, nothing should block the user
- **Data integrity above all** — wrong application submissions are unacceptable
- **Mobile-aware from day one** — SA users are mobile-first
- **Start simple, scale deliberately** — use managed services now, migrate to AWS when revenue justifies it

---

## Stack at a Glance

| Layer | MVP | Scale |
|-------|-----|-------|
| Frontend | Next.js + Tailwind CSS | Same |
| Backend | FastAPI (Python) | Same |
| Database | PostgreSQL via Supabase | AWS RDS (PostgreSQL) |
| ORM | SQLAlchemy + SQLModel + Alembic | Same |
| Caching | — | AWS ElastiCache (Redis) |
| Job Queue | FastAPI BackgroundTasks | Celery + Redis |
| Automation | Playwright + adapter pattern | Same + autoscaling workers |
| AI | Claude API — Anthropic Python SDK (to be reviewed between partners) | Same |
| Auth | Supabase Auth | Supabase Auth or AWS Cognito |
| Storage | Supabase Storage | AWS S3 |
| Email | Resend | Same |
| SMS | — (post-MVP) | Clickatell |
| Realtime | — (post-MVP) | Supabase Realtime |
| Frontend hosting | Vercel (Pro for beta+) | AWS CloudFront + S3 |
| Backend hosting | Render (dev) → Railway (beta+) | AWS ECS |
| Monitoring | Sentry + UptimeRobot | Sentry + Datadog |
| CI/CD | GitHub Actions | Same |

---

## Layer-by-Layer Breakdown

### 1. Frontend — Next.js + Tailwind CSS
**[MVP]**

Next.js is chosen over plain React for server-side rendering (SSR), which is critical for SEO so students can find Uniflo on Google. The App Router handles complex layouts like the dashboard, application tracker, and document vault. Tailwind CSS handles responsive design — essential for SA's mobile-first user base.

**Hosting — Vercel:**
Vercel connects directly to the GitHub repo and deploys automatically on push to `main`.

⚠️ **Important:** Vercel's free Hobby plan is restricted to personal, non-commercial use. Uniflo is a commercial product. During development the Hobby plan is acceptable, but we must upgrade to Vercel Pro ($20/month) before beta launch to comply with Vercel's terms of service.

**Mobile strategy:** Web-first, fully responsive. React Native mobile app is a post-MVP expansion.

---

### 2. Backend — FastAPI (Python)
**[MVP]**

FastAPI is chosen over Django because Django's "batteries included" approach bundles things Uniflo doesn't need (templates, admin panel, built-in ORM) when the frontend is a separate Next.js app. FastAPI is async-first by design — critical for background jobs and automation workers. It auto-generates Swagger API documentation at `/docs` with zero configuration.

FastAPI is chosen over NestJS because the team is comfortable with Python, and Python's AI/ML ecosystem (Anthropic SDK, LangChain) targets Python first.

**Type safety bridge:** FastAPI auto-generates an OpenAPI spec. The frontend uses `openapi-typescript` to generate TypeScript types from that spec — recovering most of the type-sharing benefit of a full TypeScript stack.

**Hosting — Render (development) → Railway (beta+):**
Vercel is unsuitable for FastAPI because Vercel is serverless (max ~10 second execution time). Playwright automation can take 2–5 minutes per application.

- **Development:** Render's free tier hosts FastAPI as a persistent server. Cold starts (30 seconds after 15 minutes of inactivity) are acceptable during development. UptimeRobot pings keep it awake.
- **Beta launch onwards:** Migrate to Railway ($5–20/month) for always-on persistent hosting with no cold starts.

**Backend module structure:**
```
/api
├── auth/
├── users/
├── profiles/
├── documents/
├── universities/
├── applications/
└── automation/
```

Each module is self-contained and can be extracted into its own microservice later without rewriting logic.

---

### 3. Database — PostgreSQL via Supabase
**[MVP → Scale: AWS RDS]**

PostgreSQL is chosen because Uniflo's data is relational — students, applications, universities, documents, jobs all have clear relationships. It is ACID compliant, guaranteeing data integrity on application submissions. JSONB columns handle flexible fields like subject combinations that vary per student.

⚠️ **Supabase free tier caveat:** Free projects are automatically paused after 7 days of inactivity. Acceptable during active development (you're touching it daily). Must upgrade to Supabase Pro ($25/month) before beta launch for guaranteed uptime (we will see if this is really necessary). Use a GitHub Actions scheduled ping as a workaround during slower development periods.

**ORM: SQLAlchemy + SQLModel + Alembic** **[MVP]**
- SQLModel provides clean, Pydantic-compatible models that integrate naturally with FastAPI
- SQLAlchemy handles complex queries and raw SQL when needed
- Alembic manages schema migrations — every database change is versioned and reversible

**Core schema:**
```
users                  — id, email, role, created_at

student_profiles       — id, user_id, first_name, last_name, id_number,
                         date_of_birth, phone, address, nationality,
                         gender, home_language, updated_at

academic_records       — id, student_id, institution, year,
                         subjects (JSON), aggregate

documents              — id, student_id, type, storage_url, uploaded_at

universities           — id, name, website, portal_url,
                         open_date, close_date, is_active

applications           — id, student_id, university_id, programme,
                         application_year, status, submitted_at,
                         updated_at, created_at

application_jobs       — id, application_id, status, attempts,
                         last_error, screenshot_url, updated_at, created_at

notifications          — id, user_id, type, message, read, created_at
```

**Schema notes:**

`users` — `hashed_password` is intentionally absent. Supabase Auth manages authentication and stores credentials in its own internal `auth.users` table. Your `users` table mirrors the Supabase auth user using the same UUID as the primary key, and stores only app-specific fields like `role`.

`academic_records` — `subjects` is stored as JSON to accommodate the variability of NSC subject combinations. Subject names are enforced from a canonical list on the frontend (for the MVP) — the `"Other"` entry carries a `custom_name` for anything not on the list. Example structure:

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

`applications` — `programme` is the specific course the student is applying for (e.g. "BSc Computer Science"). `application_year` is the intended year of study (e.g. 2026). Both are mandatory fields on every SA university portal and are required by the Playwright adapters. `updated_at` tracks status changes separately from `submitted_at`.

`application_jobs` — `screenshot_url` stores the Supabase Storage URL of the submission confirmation screenshot captured by Playwright. `updated_at` tracks when the job status last changed, which is essential for debugging failed jobs.

**Build order — migrations must be scoped to the phase they belong to:**

| Phase | Tables |
|-------|--------|
| Phase 1 | `users`, `student_profiles`, `academic_records`, `documents` |
| Phase 2 | `universities`, `applications`, `application_jobs` |
| Post-MVP | `notifications` |

---

### 4. Automation Layer — Playwright + Adapter Pattern
**[MVP — Core product, cannot be removed]**

Playwright automates real browser sessions on the server. When a student submits, Playwright opens the university portal invisibly, fills in the form using the AI's field mapping, uploads documents, and submits — exactly as a human would, but automatically.

**Why Playwright over Puppeteer:**
Playwright supports Chromium, Firefox, and WebKit. It has built-in smart waiting, first-class Python support, and is more stable than Puppeteer against portal changes.

**Adapter pattern:**
Each university gets its own self-contained adapter class:

```
UniversityAdapter (abstract base class)
├── login()
├── fill_form()
├── upload_documents()
├── submit()
└── verify_submission()

UCTAdapter(UniversityAdapter)
WITSAdapter(UniversityAdapter)
StellenboschAdapter(UniversityAdapter)
UJAdapter(UniversityAdapter)
```

Adding a new university means writing one new adapter. No existing code is touched.

**Portal health monitoring:**
A scheduled job runs test submissions against each university portal regularly. If a portal changes and breaks an adapter, the system flags it and notifies the team before any real student is affected.

**MVP job queue — FastAPI BackgroundTasks:** **[MVP]**
FastAPI's built-in BackgroundTasks handles automation jobs without the operational overhead of Celery. A student triggers an application, it goes into a background task, and the status updates in the database when complete.

**Scale job queue — Celery + Redis:** **[Scale]**
When volume demands it, Celery replaces BackgroundTasks. Redis acts as the message broker. Celery adds retry logic, priority queues, dead letter queues, and autoscaling workers on AWS ECS.

---

### 5. AI Layer — Claude API (Anthropic)
**[MVP — field mapping and confidence scoring only]**

Claude handles two specific tasks in Uniflo. Essay/motivation letter assistance is deliberately excluded from the MVP to control API costs.

**Task 1 — Field mapping intelligence:**
Given a university's form structure, Claude maps the student's profile fields to the correct form fields — even when field names differ across portals (e.g. "Surname" vs "Last Name"). This produces a mapping object that Playwright executes.

**Task 2 — Confidence scoring:**
Claude rates how confident it is about each field mapping. Low-confidence mappings are flagged and highlighted for the student to manually review before submission. This is the primary data integrity safeguard.

**Implementation:** Direct API calls via the Anthropic Python SDK — no LangChain overhead at MVP stage.

**Cost note:** Claude API costs accrue per application processed, not monthly. Budget seasonally — the bulk of costs hit during SA university application season (roughly August–October).

---

### 6. Authentication — Supabase Auth
**[MVP]**

Supabase Auth is managed on the frontend via the Supabase JS SDK. The FastAPI backend validates the JWT tokens Supabase issues — clean separation of concerns with no custom auth logic to maintain.

**Required:** Email/password login, Google OAuth, OTP via email, role-based access control (student vs admin).

Auth.js is excluded — it is JS/TS only and does not integrate cleanly with a Python backend. Rolling your own auth is never recommended — JWT management is a security minefield.

---

### 7. Document Storage — Supabase Storage
**[MVP → Scale: AWS S3]**

Students upload sensitive documents — ID copies, matric results, transcripts. Supabase Storage is used at MVP because it uses an S3-compatible API, making migration to raw AWS S3 at scale straightforward with minimal code changes.

**Security requirements:** Encrypted at rest, access-controlled per student, virus scanning on upload.

---

### 8. Email — Resend
**[MVP]**

Resend handles transactional emails only — application submitted, status changed, deadline approaching. The free tier (3,000 emails/month, 100/day) is sufficient for development and early beta.

SMS via Clickatell is a **[Post-MVP]** feature added when the subscription tier is built.

---

### 9. Realtime — Supabase Realtime
**[Post-MVP]**

Real-time in-app status updates ("Your UCT application was submitted") are a post-MVP feature. During MVP, students see status updates by refreshing their dashboard. Supabase Realtime is already available in the stack when needed — no additional infrastructure required.

---

### 10. Hosting Strategy
**[MVP: Render + Vercel → Beta: Railway + Vercel Pro]**

| Service | Development | Beta Launch |
|---------|-------------|-------------|
| Frontend | Vercel Hobby (free, non-commercial) | Vercel Pro ($20/month) |
| Backend | Render free tier (cold starts acceptable) | Railway ($5–20/month) |
| Database | Supabase free (ping to prevent pause) | Supabase Pro ($25/month) |

**Why not a VPS now:** A Hetzner VPS in Johannesburg would be cheaper at scale and offers lower latency for SA users. Recommended migration path post-beta when infrastructure bills become meaningful.

**Why not AWS now:** AWS is powerful but operationally complex. Two developers building an MVP should not be spending time on VPC configuration.

---

### 11. Monitoring — Sentry + UptimeRobot
**[MVP]**

**Sentry — error tracking:**
Catches and reports errors across both the Next.js frontend and FastAPI backend in real time.

⚠️ **Important:** Sentry's free Developer plan is limited to 1 user. Since Uniflo has two co-founders, you either share one login during development or pay $26/month for the Team plan (unlimited users). Budget for Team plan from beta launch.

**UptimeRobot — uptime monitoring:**
Monitors app availability 24/7 and sends immediate alerts on downtime. Free tier includes 50 monitors at 5-minute intervals.

⚠️ **Important:** UptimeRobot's free plan is restricted to personal, non-commercial use. Uniflo is commercial — budget for the Solo plan (~$7/month) from beta launch.

**Dual purpose during development:** UptimeRobot's pings to your Render backend every 5 minutes also prevent Render's cold start problem. Two birds, one stone.

---

### 12. CI/CD — GitHub Actions
**[MVP]**

Two workflow files in the repository:

**`frontend.yml`** — triggers on changes to `uniflo-web`. Runs ESLint, runs Vitest tests, deploys to Vercel on merge to `main`.

**`backend.yml`** — triggers on changes to `uniflo-api`. Runs Ruff linting, runs Pytest, deploys to Render (dev) / Railway (beta) on merge to `main`.

**Branching strategy:**
```
feature/*   →  PR to main     →  tests run, nothing deploys
main        →  merge          →  tests run, deploys to production
```

Merge strategy:
- `feature/*` → `main`: **Squash and Merge** — one clean commit per feature

Nothing merges to `main` with a failing test. This is the rule from day one.

---

### 13. Security
**[MVP — non-negotiable]**

Uniflo handles sensitive personal data — ID numbers, academic records — of minors. Security is not optional.

- Encryption at rest for all documents and PII
- HTTPS everywhere, TLS 1.3
- **POPIA compliance** — South Africa's data protection law. Requires a privacy policy, data processing agreements, and consent flows before launch. Get a SA tech lawyer to review before any student data is collected.
- Rate limiting via `slowapi` (Redis-backed at scale, in-memory at MVP) on all FastAPI endpoints
- Input validation via Pydantic — built into FastAPI, validates every request automatically
- Environment variables for all secrets — never hardcoded
- Security audit before beta launch

---

## AWS Migration Map
**[Scale — for future reference]**

| Current | AWS Equivalent | Notes |
|---------|---------------|-------|
| Vercel | CloudFront + S3 or Amplify | CDN-served frontend |
| Railway (FastAPI) | ECS (Elastic Container Service) | Containerised via Docker |
| Supabase PostgreSQL | RDS (PostgreSQL) | Same engine, minimal code changes |
| Supabase Auth | Keep Supabase Auth or Cognito | Cognito is more complex — many keep Supabase |
| Supabase Storage | S3 | Already S3-compatible, straightforward migration |
| Upstash Redis | ElastiCache | Managed Redis |
| FastAPI BackgroundTasks | ECS tasks (autoscaling) | Workers scale with queue depth |

**When to migrate:** When Railway + Supabase costs become significant relative to what AWS would cost at the same volume, or when you need infrastructure control that managed services don't provide. Not before.
