// PageHeader — the editorial opener every authenticated page shares.
//
// A cobalt kicker line, the display serif title, and an optional action
// slot. Deliberately quieter than the landing page — no washes or glows
// inside the app; depth comes from the lifted card surfaces below.
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
    <header className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
