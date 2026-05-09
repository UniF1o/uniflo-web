// Reveal — fades a section up (or in from a side) when it scrolls into the
// viewport. Uses IntersectionObserver instead of `animation-timeline: view()`
// because Safari and older Firefox don't support that timeline yet.
//
// State lives on a data attribute rather than React state. That keeps the
// reveal mechanic out of the render cycle (so we don't trip the
// react-hooks/set-state-in-effect lint rule) and lets a single CSS class
// drive the hidden/shown styling. With JS disabled the section renders
// visible from the start — there is no flash, no flicker.
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: React.ReactNode;
  // Stagger delay so siblings can cascade in. Defaults to 0.
  delayMs?: number;
  // Direction the content slides in from. Defaults to up.
  from?: "up" | "left" | "right";
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

    // If the element is already inside the viewport at mount time,
    // there's nothing to animate — leave it visible. Avoids the case
    // where above-the-fold sections (the hero) flash hidden then in.
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
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-from={from}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        // Default state is visible (SSR + no-JS friendly). The data attribute
        // is set on the client and the variants below take over.
        "transition-[opacity,transform] duration-700 ease-out will-change-transform",
        "data-[reveal=hidden]:opacity-0",
        "data-[from=up]:data-[reveal=hidden]:translate-y-6",
        "data-[from=left]:data-[reveal=hidden]:-translate-x-6",
        "data-[from=right]:data-[reveal=hidden]:translate-x-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
