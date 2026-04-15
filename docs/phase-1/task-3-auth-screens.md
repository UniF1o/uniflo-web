# Task 3 — Authentication screens

**Branch:** `feature/auth-screens`
**Phase:** 1
**Status:** Complete

This document captures what was built, the design decisions behind it, and any deviations from the Phase 1 plan in `docs/partner-a-phase-1-plan.md`.

---

## What was built

Three auth screens (sign up, login, forgot password), a shared UI component library foundation (Button + Input), and an OAuth callback Route Handler.

### Files added

| File | Role |
|---|---|
| `app/(auth)/signup/page.tsx` | Sign up screen — email/password + Google OAuth. |
| `app/(auth)/login/page.tsx` | Login screen — email/password + Google OAuth + forgot-password link. |
| `app/(auth)/forgot-password/page.tsx` | Forgot password screen — email field + success message. |
| `app/auth/callback/route.ts` | Route Handler that exchanges the OAuth authorization code for a Supabase session. |
| `components/ui/button.tsx` | Reusable button — primary and ghost variants + loading spinner. |
| `components/ui/input.tsx` | Reusable labelled input — with error state and accessible aria attributes. |

---

## Design decisions

### 1. Client Components with `useState` (not Server Actions)

The Next.js docs recommend Server Actions for forms. Auth screens don't use them here because:

- Supabase auth calls (`signUp`, `signInWithPassword`, `signInWithOAuth`, `resetPasswordForEmail`) run through the **browser** Supabase client. They need to run client-side so the session cookie is written to the browser.
- Server Actions are a good fit when the form submits data to a database via a server function. Auth state management is fundamentally a client-side concern with Supabase's SDK architecture.

All form state, validation, and Supabase calls live in `useState` + async event handlers.

### 2. Two-step email signup (handle confirmation state)

Supabase's `signUp()` response can go two ways:
- `data.session` is set → email confirmation is **disabled** in the Supabase dashboard. The user is immediately signed in. Redirect to `/profile/setup`.
- `data.session` is null → email confirmation is **required**. Show a "check your inbox" message instead of redirecting.

Both cases are handled. The Supabase project settings control which path is taken — the frontend adapts to either.

### 3. `useSearchParams` wrapped in Suspense (login page)

The login page reads `?error=auth_callback_error` to surface a friendly message when the OAuth callback fails (e.g. the user cancelled the Google consent screen). `useSearchParams` in Next.js requires a Suspense boundary to prevent the whole page from being forced into dynamic server rendering.

Pattern used:
```tsx
function LoginContent() {
  const searchParams = useSearchParams(); // reads ?error param
  // ...
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
```

### 4. OAuth callback Route Handler (`app/auth/callback/route.ts`)

Google OAuth redirects back to this route with a short-lived `code` param. The handler:
1. Calls `supabase.auth.exchangeCodeForSession(code)` to mint a real session.
2. Reads an optional `?next` param so the OAuth initiator can specify the post-auth destination (signup passes `next=/profile/setup`, login uses the default `/dashboard`).
3. On failure, redirects to `/login?error=auth_callback_error`.

The `redirectTo` in `signInWithOAuth()` must point to this route. It is set to `${window.location.origin}/auth/callback` so it works on both localhost and Vercel preview URLs without hardcoding a domain.

### 5. User enumeration prevention (forgot password)

The forgot password success message reads: *"If an account exists for [email], you'll receive a password reset link shortly."*

This deliberately avoids confirming or denying whether the email has a Uniflo account. An attacker cannot probe the user database by submitting this form and watching for different responses.

### 6. Error message mapping

Raw Supabase error strings (e.g. `"Invalid login credentials"`) are mapped to friendly copy before being shown to users. A `getAuthErrorMessage(error)` function per page handles the mapping. Unknown errors fall back to `"Something went wrong. Please try again."` so internal implementation details never reach the UI.

### 7. Shared UI components: Button and Input

Two primitive components were added to `components/ui/`:

**Button** — handles primary vs ghost variants and a loading spinner state. The loading state disables the button and shows a spinning SVG so the user knows their action was received.

**Input** — wraps a native `<input>` with a label and error message slot. Uses `aria-describedby` to link the input to its error message (screen readers announce the error when the field is focused) and `aria-invalid` to signal the invalid state.

These components will be reused across profile setup (Task 4), academic records (Task 5), and document upload (Task 6).

### 8. Google SVG logo

`lucide-react` doesn't include a Google icon. The four-path Google G SVG is inlined in both the signup and login pages. `aria-hidden` prevents screen readers from announcing the decorative graphic.

---

## Deviations from the Phase 1 plan

1. **No metadata titles on auth pages** — `metadata` can only be exported from Server Components. Since all three auth pages are Client Components (they manage form state with `useState`), adding title metadata would require splitting each page into a server wrapper + client form component. For MVP this extra complexity isn't justified; the default site title shows in the browser tab.

2. **`/profile/setup` as redirect destination** — the plan says "redirect to the profile setup flow (Task 4)" but doesn't specify a URL. Using `/profile/setup` as a forward-compatible placeholder. Task 4 will create that route.

---

## How to verify

### Locally

1. Populate `.env.local` with real Supabase credentials.
2. In the Supabase dashboard → Authentication → URL Configuration, add `http://localhost:3000/auth/callback` to the **Redirect URLs** allowlist.
3. `npm run dev`.
4. Visit `http://localhost:3000/signup` — form, Google button, and "Already have an account?" link should render.
5. Submit the form with an invalid email — inline error appears without a network call.
6. Submit with a valid new email + password — either a "check your inbox" message (email confirmation on) or redirect to `/profile/setup` (email confirmation off).
7. Visit `/login` — form, Google button, and "Forgot password?" link render.
8. Submit with wrong credentials — "Incorrect email or password." appears.
9. Click "Forgot password?" → `/forgot-password` — enter an email, submit — success message appears regardless of whether the email exists.
10. Click "Continue with Google" on either signup or login — browser redirects to Google.

### CI

- `npm run lint` — passes.
- `npm test` — passes.
- `npm run build` — all three auth routes compile as static pages, callback as dynamic.

---

## What this unblocks

- **Task 4 (profile setup)** can now receive users redirected from `/profile/setup` after signup.
- **Task 7 (dashboard)** can redirect incomplete profiles back to `/profile/setup` on login.
- The `/login` redirect target for unauthenticated users in `app/(app)/layout.tsx` now resolves to a real page.
