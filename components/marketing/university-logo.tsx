// UniversityLogo — a brand-colored chip used on the landing-page marquee.
//
// Renders a coloured disc with a short wordmark in the editorial serif,
// then the full university name in a card. Doubles as a placeholder for
// real SVG logos: when official assets are sourced, swap the disc for an
// <img> or inline SVG and keep the layout.
import type { FeaturedUniversity } from "@/lib/constants/universities";
import { Card } from "@/components/ui/card";

interface UniversityLogoProps {
  university: FeaturedUniversity;
}

export function UniversityLogo({ university }: UniversityLogoProps) {
  return (
    <Card
      variant="elevated"
      className="flex w-[18rem] shrink-0 items-center gap-4 px-5 py-4"
    >
      <span
        role="img"
        aria-label={`${university.name} mark`}
        // The disc gets the university's primary brand colour so each chip
        // is instantly distinguishable while the marquee scrolls.
        style={{ backgroundColor: university.brandColor }}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-base leading-none tracking-tight text-white shadow-[var(--shadow-soft)]"
      >
        {university.mark}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {university.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {university.city}
        </span>
      </div>
    </Card>
  );
}
