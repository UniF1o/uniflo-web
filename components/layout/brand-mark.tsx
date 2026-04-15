// BrandMark — the "Uniflo" wordmark in the display serif.
//
// Single source of truth for the brand treatment (font, tracking, accent dot)
// so it looks identical in the navbar, auth layout, and landing page.
// Accepts an optional href so the link target can be overridden if needed.
import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      // Display serif + tight tracking gives the wordmark an editorial feel.
      // The terracotta dot is a nod to the "full stop" of a submitted
      // application — subtle brand detail, not decoration.
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
