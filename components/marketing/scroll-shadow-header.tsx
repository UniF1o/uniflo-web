// ScrollShadowHeader — a sticky <header> that gains a hairline border + tiny
// shadow once the user has scrolled past the top of the page.
//
// Pure presentation: the shadow itself is driven by the `data-scrolled="true"`
// attribute that this component toggles on the <header>. Tailwind utilities
// applied via the className handle the actual visual change.
//
// Used on the public landing page — the auth + post-login routes use a
// different layout chrome that already styles its own sticky bar.
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface ScrollShadowHeaderProps extends React.HTMLAttributes<HTMLElement> {
  // Pixel offset above which the shadow turns on. Defaults to 8 — small
  // enough that the cue triggers as soon as scroll starts.
  threshold?: number;
}

export function ScrollShadowHeader({
  threshold = 8,
  className,
  children,
  ...props
}: ScrollShadowHeaderProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Initial sync — covers the case where the page restores a scrolled
    // position on reload and the header should already wear its shadow.
    const sync = () => {
      el.dataset.scrolled = window.scrollY > threshold ? "true" : "false";
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [threshold]);

  return (
    <header
      ref={ref}
      data-scrolled="false"
      className={cn(
        // Border opacity + shadow lift in via data-scrolled. The transition
        // is on the <header> rather than the children so the cue is felt as
        // the bar settling rather than its contents nudging.
        "transition-[border-color,box-shadow] duration-300",
        "data-[scrolled=true]:border-border",
        "data-[scrolled=true]:shadow-[0_1px_0_rgba(20,24,43,0.04)]",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}
