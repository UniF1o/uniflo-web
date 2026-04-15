// Brand mark — the "Uniflo" wordmark rendered with the display serif.
//
// Centralised so the visual brand treatment (font, tracking, accent dot) stays
// consistent across the navbar, auth layout, and any future hero usage. Kept
// deliberately tiny: no props, no variants. If we later add logomark sizes
// or a monogram, extend this file rather than duplicating the markup.
import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      // Display serif + tight leading gives the brand an editorial feel
      // rather than a generic tech-startup one. The terracotta dot at the
      // end is the subtle distinguishing mark — a nod to the "full stop" of
      // an application being finally submitted.
      className="group inline-flex items-baseline gap-1 font-display text-2xl leading-none tracking-tight text-foreground"
      aria-label="Uniflo home"
    >
      <span>Uniflo</span>
      <span
        aria-hidden
        className="h-1.5 w-1.5 translate-y-[-0.1em] rounded-full bg-accent transition-transform duration-300 group-hover:scale-125"
      />
    </Link>
  );
}
