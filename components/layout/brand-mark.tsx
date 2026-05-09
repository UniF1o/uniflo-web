// BrandMark — the "Uniflo" wordmark in the display serif.
//
// Single source of truth for the brand treatment (font, tracking, accent
// sprout) so it looks identical in the navbar, auth layout, and landing.
// Accepts an optional href so the link target can be overridden if needed.
import Link from "next/link";
import { Sprout } from "@/components/ui/motifs";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      // Display serif + tight tracking gives the wordmark an editorial feel.
      // The coral sprout doodle is the brand signature — it picks up the
      // theme of growth ("starting your future") without being literal.
      className="group inline-flex items-baseline gap-1.5 font-display text-2xl leading-none tracking-tight text-foreground"
      aria-label="Uniflo home"
    >
      <span>Uniflo</span>
      <Sprout
        // `origin-bottom` so the sway pivots from the stem rather than the
        // glyph centre, and the hover scale reads as a planted wiggle.
        // motion-reduce: drop the swing entirely (Tailwind already nukes
        // animation duration via the global reduced-motion query, but we
        // also strip the hover scale so the static state is fully calm).
        className="h-4 w-4 origin-bottom translate-y-[0.05em] text-primary transition-transform duration-300 [animation:sway_6s_ease-in-out_infinite] group-hover:rotate-12 group-hover:scale-110 motion-reduce:animate-none"
      />
    </Link>
  );
}
