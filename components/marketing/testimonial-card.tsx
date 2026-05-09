// TestimonialCard — a quote from a student. Initials-only avatar keeps it
// honest while we don't have real user photos yet. The card itself uses
// the elevated Card variant so the testimonials feel handed-out from the
// page, not pinned flat.
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TestimonialCardProps {
  quote: string;
  name: string;
  // E.g. "Matric, 2025" or "Now at Wits".
  role: string;
  // 2-letter initials. Pre-computed by the caller so we don't have to
  // worry about non-Latin name handling here.
  initials: string;
  // Optional badge above the quote, e.g. "Accepted" or "Bursary".
  badge?: string;
}

export function TestimonialCard({
  quote,
  name,
  role,
  initials,
  badge,
}: TestimonialCardProps) {
  return (
    <Card variant="elevated" className="flex h-full flex-col gap-5 p-6">
      {badge && (
        <Badge tone="success" dot>
          {badge}
        </Badge>
      )}
      {/* Big editorial quote glyph — purely decorative. */}
      <span
        aria-hidden
        className="font-display text-5xl leading-none text-primary/70"
      >
        “
      </span>
      <p className="flex-1 text-base leading-relaxed text-foreground">
        {quote}
      </p>
      <div className="flex items-center gap-3 border-t border-border pt-5">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-base text-primary-foreground"
        >
          {initials}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">{role}</span>
        </div>
      </div>
    </Card>
  );
}
