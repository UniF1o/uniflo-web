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
      <Sprout className="h-4 w-4 translate-y-[0.05em] text-accent transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
    </Link>
  );
}
