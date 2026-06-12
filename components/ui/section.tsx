// Section — in-page grouping with the standard kicker heading.
//
// Replaces the ad-hoc uppercase <h2> pattern repeated across app pages so
// every section label shares one rhythm: a short cobalt dash, tracked
// uppercase text, and an optional trailing action (e.g. a Refresh button).
import { cn } from "@/lib/utils/cn";

interface SectionProps {
  // The section label, rendered as a tracked-uppercase heading.
  kicker: string;
  // Optional element rendered on the heading row's right edge.
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({ kicker, action, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span aria-hidden className="h-px w-5 shrink-0 bg-primary/60" />
          {kicker}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
