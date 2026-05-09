// FAQItem — a single question/answer pair, rendered as a native <details>
// element so the disclosure works without JavaScript and announces correctly
// to screen readers. The chevron rotates when the item is open via a CSS
// rule on the details[open] selector.
//
// When opened, the item auto-closes any sibling FAQItems inside the same
// parent — so the FAQ behaves as a single-open accordion. The behaviour is
// scoped to the closest parent rather than the document so multiple FAQ
// groups on a page (unlikely but possible) don't fight.
"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItemProps {
  question: string;
  // Plain-text or React node — kept flexible so we can drop links inline.
  answer: React.ReactNode;
  // Optional default-open state. Useful for the first item in the list so
  // visitors can see the disclosure pattern at a glance.
  defaultOpen?: boolean;
}

export function FAQItem({ question, answer, defaultOpen }: FAQItemProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onToggle = () => {
      if (!el.open) return;
      // Find sibling <details> nodes and force them closed. Walking the
      // parent's children keeps the scope tight — we don't accidentally
      // close FAQs in another section.
      const parent = el.parentElement;
      if (!parent) return;
      Array.from(
        parent.querySelectorAll<HTMLDetailsElement>("details"),
      ).forEach((other) => {
        if (other !== el && other.open) other.open = false;
      });
    };
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, []);

  return (
    <details
      ref={ref}
      open={defaultOpen}
      className="group border-b border-border py-5 last:border-b-0 [&[open]>summary>svg]:rotate-180"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium text-foreground marker:hidden hover:text-primary">
        <span>{question}</span>
        <ChevronDown
          aria-hidden
          size={20}
          className="shrink-0 text-muted-foreground transition-transform duration-200"
        />
      </summary>
      <div className="pt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
        {answer}
      </div>
    </details>
  );
}
