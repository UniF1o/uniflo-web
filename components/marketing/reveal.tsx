// Reveal — fades a section into view as it scrolls into the viewport.
// Uses IntersectionObserver instead of `animation-timeline: view()` because
// Safari and older Firefox don't support that timeline yet.
//
// State lives on a `data-reveal` attribute rather than React state. That
// keeps the reveal mechanic out of the render cycle (so the
// react-hooks/set-state-in-effect lint rule stays quiet) and lets one
// CSS class drive the hidden/shown styling. With JS disabled the section
// renders visible from the start — there is no flash, no flicker.
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: React.ReactNode;
  // Stagger delay so siblings can cascade in. Defaults to 0.
  delayMs?: number;
  // Direction the content slides in from. Defaults to up.
  from?: "up" | "left" | "right" | "down";
  // When true, the element scales up from 0.96 to 1 alongside the slide.
  // Use sparingly for important callouts (the closing CTA, hero feature
  // cards). It draws more attention than a plain slide.
  scale?: boolean;
  className?: string;
}

// `useLayoutEffect` warns during SSR because it runs synchronously after
// commit. Swap it for `useEffect` on the server so Next.js stays quiet.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Reveal({
  children,
  delayMs = 0,
  from = "up",
  scale = false,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion → render visible immediately and skip the observer.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.reveal = "shown";
      return;
    }

    // If the element is already inside the viewport at mount, leave it
    // visible — avoids the case where above-the-fold sections (the hero)
    // flash hidden then in.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 48) {
      el.dataset.reveal = "shown";
      return;
    }

    // Below the fold: hide synchronously (before paint) and observe.
    el.dataset.reveal = "hidden";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      // Trigger slightly before the section is fully in frame.
      { threshold: 0.12, rootMargin: "0px 0px -64px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-from={from}
      data-scale={scale ? "on" : undefined}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        // Default state (no data attribute set) is visible — SSR + no-JS
        // friendly. The variants below only apply once the effect has set
        // data-reveal="hidden" on the client.
        "transition-[opacity,transform] duration-[800ms] ease-out will-change-transform",
        "data-[reveal=hidden]:opacity-0",
        // Directional offsets — bumped from 6 to 10 so the motion is felt
        // rather than blink-and-missed. Diagonal directions land on real
        // pixels per Tailwind's spacing scale (40px ≈ 2.5rem).
        "data-[from=up]:data-[reveal=hidden]:translate-y-10",
        "data-[from=down]:data-[reveal=hidden]:-translate-y-10",
        "data-[from=left]:data-[reveal=hidden]:-translate-x-10",
        "data-[from=right]:data-[reveal=hidden]:translate-x-10",
        // Optional scale used by feature cards / closing CTAs.
        "data-[scale=on]:data-[reveal=hidden]:scale-[0.96]",
        className,
      )}
    >
      {children}
    </div>
  );
}
