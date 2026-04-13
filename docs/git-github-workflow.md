# Uniflo — Git & GitHub Guide

This is the source of truth for how we use Git and GitHub across both repositories (`uniflo-api` and `uniflo-web`). When in doubt, check here first.

---

## Branch Structure

We use a streamlined GitHub Flow. There is only one long-lived branch.

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production-ready code | Production (Render / Vercel) |
| `feature/*` | Active development — one branch per feature | Vercel Preview URL (Web only) / Local (API) |

### The Golden Rules

- **Never commit directly to `main`.** All work happens on a `feature/*` branch.
- **Never merge with failing tests.** If CI is red, the PR does not merge — no exceptions.
- **Merge means deploy. The moment a feature is merged into `main`, it goes live to the single production environment.**

---

## Deployments & Staging Environments

Because we utilise the free tiers for our React frontend and Python backend, staging looks slightly different depending on the repository:

- **Frontend (`uniflo-web`):** Hosted on Vercel. Opening a Pull Request automatically generates a free, temporary Preview URL. Test UI changes there before merging.
- **Backend (`uniflo-api`):** Hosted on Render. Render does not offer free PR previews for API servers. Backend features must be tested locally against your local development environment. Staging and Production are the same thing: the `main` branch.

---

## Branch Naming

Feature branches are cut from `main` and named with the `feature/` prefix followed by a short, descriptive slug.

```
feature/auth-jwt-middleware
feature/profile-endpoints
feature/documents-upload
feature/db-schema-phase1
```

Keep names lowercase, hyphen-separated, and specific enough that the other partner knows what's in the branch without asking.

---

## The Full Workflow

### Step 1 — Cut a feature branch from main

Always make sure your local `main` is up to date before cutting a new branch.

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Step 2 — Work and commit on your feature branch

Commit often. Message quality here doesn't matter — these commits get squashed later. But keep each commit focused so it's easy to reason about what changed.

```bash
git add .
git commit -m "add jwt validation to middleware"
```

### Step 3 — Push your branch to GitHub

```bash
git push origin feature/your-feature-name
```

### Step 4 — Open a PR from feature → main

On GitHub, open a Pull Request targeting `main`.

**PR checklist before merging:**
- [ ] CI is green (Pytest + Ruff pass for API, ESLint + Vitest pass for Web)
- [ ] Tests are included in this branch, not deferred
- [ ] `.env.example` is updated if you added any new environment variables
- [ ] The PR description explains *what* changed and *why*, not just a list of files

### Step 5 — Merge feature → main using Squash and Merge

When the review is approved and CI is green, merge using **Squash and Merge**.

This collapses all your working commits (the "wip", "fix", "ok this actually works" ones) into a single clean commit on `main`. Write a meaningful squash commit message at this point — it becomes the permanent record in the repo.

**Good squash commit messages:**
```
feat: add JWT validation middleware
feat: add profile create, read, update endpoints
feat: add document upload to Supabase Storage
fix: handle missing profile fields in Pydantic schema
```

After merging, delete the feature branch on GitHub. It has served its purpose.

---

## Commit Message Format

Use this format for all commits, especially squash messages that land on `main`:

```
<type>: <short description>
```

| Type | When to use |
|------|-------------|
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, dependencies |
| `docs` | Documentation only |
| `refactor` | Code change with no behaviour change |
| `migration` | Alembic migration |

Keep the description under 72 characters. No full stops at the end.

---

## Common Mistakes to Avoid

**Committing directly to `main`**
If you catch yourself doing this, stop. Stash your changes, cut a feature branch, and apply them there.

```bash
git stash
git checkout -b feature/what-i-was-doing
git stash pop
```

**Letting your feature branch fall behind `main`**
If `main` has moved on while you were working, rebase your feature branch before opening a PR.

```bash
git fetch origin
git rebase origin/main
```

Resolve any conflicts, then push. Use `--force-with-lease` (not `--force`) when pushing a rebased branch — it's safer.

```bash
git push --force-with-lease origin feature/your-feature-name
```

**Using the wrong merge strategy on GitHub**
Always double-check the dropdown before clicking merge:
- `feature/*` → `main`: **Squash and Merge**

**Forgetting to delete the feature branch after merging**
Stale branches cause confusion. Delete them immediately after merging. GitHub offers a button to do this right after the merge — use it.

---

## Quick Reference

```bash
# Start new feature
git checkout main && git pull origin main
git checkout -b feature/your-feature-name

# Keep feature branch up to date with main
git fetch origin
git rebase origin/main

# Push feature branch (first time)
git push -u origin feature/your-feature-name

# Push after rebase (force-with-lease, never --force)
git push --force-with-lease origin feature/your-feature-name

# After your PR is merged — clean up locally
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```
