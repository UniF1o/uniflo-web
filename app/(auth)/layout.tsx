// (auth) route-group layout — the unauthenticated area of the app.
//
// Covers /login, /signup, /forgot-password (all built in Task 3). This
// layout is intentionally minimal: a centred card on a warm cream page with
// the brand mark at the top. No navbar, no sidebar — the user is in a
// focused flow and shouldn't be distracted.
//
// Unlike (app) we don't check auth here: a signed-in user who visits /login
// or /signup just gets the screen as-is. If we want to bounce authed users
// away from these pages later, the redirect should live in each page's
// server component (so /forgot-password can stay reachable even while
// authed), not in this layout.
import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top strip: brand mark only. Acts as a subtle anchor without adding
       * navigation that would pull focus from the auth flow. */}
      <header className="flex h-16 items-center px-6">
        <BrandMark />
      </header>

      {/* Main centred column. `max-w-md` keeps the form readable on wide
       * displays; `px-6` keeps it comfortable on mobile. */}
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer breadcrumb — small, muted, sets a tone of polish. */}
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Uniflo. Building futures, one application at a time.</p>
      </footer>
    </div>
  );
}
