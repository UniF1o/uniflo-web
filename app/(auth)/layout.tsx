// (auth) route-group layout — minimal shell for /login, /signup, /forgot-password.
//
// No navbar or sidebar — auth screens are focused flows; the extra chrome
// would be a distraction. No auth check either: a signed-in user who lands
// on /login just sees the page. If we later want to redirect them away,
// that logic belongs in each individual page (so /forgot-password stays
// reachable even while signed in), not here in the shared layout.
import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Brand mark only — no nav links that would pull focus from the form. */}
      <header className="flex h-16 items-center px-6">
        <BrandMark />
      </header>

      {/* Centred content column. max-w-md keeps forms readable on wide screens. */}
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer — small, muted, gives the layout visual closure. */}
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Uniflo. Building futures, one application
          at a time.
        </p>
      </footer>
    </div>
  );
}
