// (auth) route-group layout — minimal shell for /login, /signup, /forgot-password.
//
// No navbar or sidebar — auth screens are focused flows and the extra chrome
// would be a distraction. No auth check either: a signed-in user who lands
// on /login just sees the page. If we later want to redirect them away,
// that logic belongs in each individual page (so /forgot-password stays
// reachable even while signed in), not here in the shared layout.
import { BrandMark } from "@/components/layout/brand-mark";
import { Sprout } from "@/components/ui/motifs";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Atmospheric washes — pale sky bloom top-right and a deeper cobalt
       * haze lower down. Same recipe as the landing page so signing in
       * doesn't feel like leaving Uniflo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80vh] bg-[radial-gradient(ellipse_70%_60%_at_85%_5%,_var(--color-soft)_0%,_transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[120vh] bg-[radial-gradient(ellipse_55%_50%_at_92%_50%,_var(--color-primary)_0%,_transparent_65%)] opacity-[0.06]"
      />

      {/* Brand mark only — no nav links that would pull focus from the form.
       * Help link tucked on the right gives an out for confused users. */}
      <header className="flex h-16 items-center justify-between px-6 md:px-10">
        <BrandMark />
        <a
          href="mailto:hello@uniflo.app"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Need help?
        </a>
      </header>

      {/* Centred content column. max-w-md keeps forms readable on wide screens. */}
      <main className="flex flex-1 items-center justify-center px-6 py-8 md:py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer — small, muted, uses the sprout motif so it shares a closing
       * gesture with the landing page footer. */}
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          © {new Date().getFullYear()} Uniflo
          <Sprout className="h-3.5 w-3.5 text-primary" />
          Built for SA matrics
        </p>
      </footer>
    </div>
  );
}
