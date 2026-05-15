// UniversityLogo — admissions-card chip used on the landing-page marquee.
// A tinted disc carrying the institution's monogram in the editorial
// display serif, paired with the full name and city. Each chip uses the
// university's own brand colour so the marquee reads as a row of distinct
// institutions; the cream-on-colour treatment + serif typography keep the
// card sitting on the Uniflo paper aesthetic rather than feeling like a
// foreign logo plate.
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
      {/* Monogram disc — brand-colour fill with cream (not pure white)
       * text so it sits in the same paper family as the rest of the page.
       * The inset highlight + soft drop give the disc a "pressed into
       * paper" depth rather than a flat colour blob. */}
      <span
        role="img"
        aria-label={`${university.name} mark`}
        style={{ backgroundColor: university.brandColor }}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-sm leading-none tracking-tight text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_-2px_rgba(20,24,43,0.25)]"
      >
        {university.mark}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* Display serif keeps the name on the academic register without
         * inflating the visual weight — text-base + leading-tight reads
         * as confident, not loud. */}
        <span className="truncate font-display text-base leading-tight tracking-tight text-foreground">
          {university.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {university.city}
        </span>
      </div>
    </Card>
  );
}
