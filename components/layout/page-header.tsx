// PageHeader — the editorial opener every authenticated page shares.
//
// Brings the landing page's section-heading language inside the app: a
// cobalt kicker line, the display serif title, and a soft sky wash glowing
// behind the top of the page so the cream never reads as a flat void.
//
//   <PageHeader
//     kicker="Your applications"
//     title={<>Track every <span className="text-primary">application.</span></>}
//     description="…"
//     action={<Button>…</Button>}
//   />
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  // Short uppercase label above the title, e.g. "Your story".
  kicker: string;
  // Serif display title. Pass a fragment with a `text-primary` span to
  // accent one word, matching the landing page's heading rhythm.
  title: React.ReactNode;
  description?: React.ReactNode;
  // Optional right-aligned slot for the page's primary action.
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  kicker,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("relative", className)}>
      {/* Atmospheric wash — a pale sky bloom behind the heading. Oversized
       * and blurred so it reads as light on paper, not a shape. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 -top-24 h-64 w-[34rem] rounded-full bg-[radial-gradient(closest-side,var(--color-soft),transparent)] opacity-80 blur-2xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
            {kicker}
          </p>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 sm:pb-1">{action}</div>}
      </div>
    </header>
  );
}
