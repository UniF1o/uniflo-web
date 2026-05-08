// FAQItem — a single question/answer pair, rendered as a native <details>
// element so the disclosure works without JavaScript and announces correctly
// to screen readers. The chevron rotates when the item is open via a CSS
// rule on the details[open] selector.
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
  return (
    <details
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
