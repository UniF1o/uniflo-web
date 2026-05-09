// Public landing page at `/`. Lives outside both route groups — no navbar
// or sidebar. The marketing site for unauthenticated visitors.
//
// Structure: sticky header → hero → social-proof bar → universities marquee →
// testimonials → FAQ → closing CTA → footer with social links.
//
// Each major section is wrapped in <Reveal> so it fades up as it scrolls
// into view. The marquee runs on a CSS keyframe (see globals.css) and
// pauses on hover.
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { DashedPath, DotCluster, Sprout } from "@/components/ui/motifs";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { FAQItem } from "@/components/marketing/faq-item";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";
import { SocialLinks } from "@/components/marketing/social-links";
import { Marquee } from "@/components/marketing/marquee";
import { Reveal } from "@/components/marketing/reveal";
import { ScrollShadowHeader } from "@/components/marketing/scroll-shadow-header";
import { UniversityLogo } from "@/components/marketing/university-logo";
import {
  FEATURED_UNIVERSITIES,
  SA_UNIVERSITIES,
} from "@/lib/constants/universities";

// Footer sitemap. Hrefs that don't exist yet point to placeholders so the
// footer renders the full structure now and we can wire pages up later.
const FOOTER_LINKS = [
  { label: "Universities", href: "/universities" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Help centre", href: "#help" },
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
];

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Atmospheric washes — pale sky bloom top-right and a deeper cobalt
       * haze lower down. Both drift slowly via wash-drift so the corner is
       * never static. Reduced-motion stops the drift but keeps the colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80vh] bg-[radial-gradient(ellipse_70%_60%_at_85%_5%,_var(--color-soft)_0%,_transparent_60%)] [animation:wash-drift_28s_ease-in-out_infinite] motion-reduce:animate-none"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[120vh] bg-[radial-gradient(ellipse_55%_50%_at_92%_50%,_var(--color-primary)_0%,_transparent_65%)] opacity-[0.08] [animation:wash-drift_40s_ease-in-out_infinite_reverse] motion-reduce:animate-none"
      />

      {/* ── Sticky header ────────────────────────────────────────────── *
       * ScrollShadowHeader toggles a `data-scrolled` attribute as the user
       * scrolls past 8px so the bar gains a hairline border + shadow once
       * any content has moved underneath it. */}
      <ScrollShadowHeader className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6 md:px-10">
          <BrandMark />
          <div className="flex-1" />
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow-[var(--shadow-pop)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Start free
            <ArrowRight size={14} className="shrink-0" />
          </Link>
        </div>
      </ScrollShadowHeader>

      <main className="w-full">
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Reveal from="left" className="flex flex-col items-start gap-6">
            <Badge tone="info" dot pulse>
              For South African matrics
            </Badge>

            {/* Each word fades up on its own with a small stagger so the
             * headline reads in beat rather than landing flat on first paint.
             * The trailing space between spans is preserved with the explicit
             * {" "} so the words wrap correctly. Reduced-motion strips the
             * stagger and shows the line at full opacity. */}
            <h1 className="font-display text-5xl leading-[0.98] tracking-tight text-foreground md:text-7xl">
              {[
                { text: "Apply", delay: "0.05s" },
                { text: "to", delay: "0.13s" },
                { text: "every", delay: "0.21s" },
                { text: "university.", delay: "0.29s" },
              ].map((w, i, arr) => (
                <span
                  key={i}
                  style={{ animationDelay: w.delay }}
                  className="inline-block translate-y-5 opacity-0 [animation:fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_forwards] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:animate-none"
                >
                  {w.text}
                  {i < arr.length - 1 ? " " : ""}
                </span>
              ))}
              <br />
              {[
                { text: "In", delay: "0.42s" },
                { text: "one", delay: "0.5s" },
              ].map((w) => (
                <span
                  key={w.text}
                  style={{ animationDelay: w.delay }}
                  className="inline-block translate-y-5 text-primary opacity-0 [animation:fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_forwards] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:animate-none"
                >
                  {w.text}&nbsp;
                </span>
              ))}
              <span
                style={{ animationDelay: "0.58s" }}
                className="relative inline-block translate-y-5 opacity-0 [animation:fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_forwards] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:animate-none"
              >
                <span className="text-primary">go.</span>
                {/* Hand-script accent floating above the headline word —
                 * tilts away from the reading line so it feels like a
                 * margin note rather than copy. Wiggles gently. */}
                <span
                  aria-hidden
                  className="absolute -right-4 -top-6 hidden origin-bottom-right font-script text-2xl text-primary/80 [animation:wiggle_3.2s_ease-in-out_infinite] [animation-delay:2.2s] [transform:rotate(-8deg)] motion-reduce:animate-none md:block"
                >
                  you got this
                </span>
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Fill in your details once. Pick your universities. Review every
              application before we submit it on your behalf — so nothing goes
              out without your signature.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/signup" className="contents">
                <Button variant="accent">
                  Start your application
                  <ArrowRight size={16} aria-hidden />
                </Button>
              </Link>
              <Link href="/login" className="contents">
                <Button variant="ghost">I already have an account</Button>
              </Link>
            </div>

            {/* Tiny trust line under the CTAs — concrete, scannable. The
             * sparkle twinkles to draw a moment of attention without competing
             * with the hero CTA. */}
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles
                size={14}
                aria-hidden
                className="text-primary [animation:twinkle_2.2s_ease-in-out_infinite] motion-reduce:animate-none"
              />
              No card needed. Free to start.
            </p>
          </Reveal>

          {/* Hero illustration — stacks below the copy on mobile/tablet. */}
          <Reveal
            from="right"
            delayMs={100}
            className="flex items-center justify-center lg:justify-end"
          >
            <DashboardMockup />
          </Reveal>
        </section>

        {/* ── Social-proof bar ───────────────────────────────────────── */}
        <Reveal>
          <section className="mx-auto max-w-6xl border-y border-border px-6 py-10 md:px-10 md:py-14">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <Stat
                value={`${SA_UNIVERSITIES.length}`}
                label="universities covered"
                note="and counting"
              />
              <DashedPath
                variant="horizontal"
                className="hidden h-6 w-full text-muted-foreground/60 md:block"
              />
              <Stat value="40+" label="hours saved per applicant" />
              <DashedPath
                variant="horizontal"
                className="hidden h-6 w-full text-muted-foreground/60 md:block"
              />
              <Stat value="100%" label="review before we submit" />
            </div>
          </section>
        </Reveal>

        {/* ── Featured universities marquee ──────────────────────────── *
         * The full list of supported universities is many; here we surface
         * the most recognisable handful as a moving banner. The marquee
         * pauses on hover so a curious user can read a card. */}
        <section className="py-16 md:py-24">
          <Reveal from="left">
            <div className="mx-auto max-w-6xl px-6 md:px-10">
              <SectionHeading
                eyebrow="Top universities"
                title="The big six, all in one place."
                accentText="big six"
                description="A handful of the most-requested South African universities — and the marquee keeps moving so does our coverage. Hover any card to pause the scroll."
              />
            </div>
          </Reveal>

          <Reveal from="right" delayMs={150} className="mt-10">
            {/* Full-bleed: the marquee escapes the inner container so the
             * track has room to scroll edge-to-edge on desktop. */}
            <Marquee speed="medium">
              {FEATURED_UNIVERSITIES.map((u) => (
                <UniversityLogo key={u.shortName} university={u} />
              ))}
            </Marquee>
          </Reveal>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <DotCluster
            aria-hidden
            className="absolute right-4 top-12 hidden h-10 w-16 text-primary/70 md:block"
          />

          <Reveal>
            <SectionHeading
              eyebrow="From the class of 2025"
              title="Matrics who actually got in."
              accentText="got in"
              description="Real students who used Uniflo to land at the universities they wanted. Names changed where requested."
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            <Reveal delayMs={0} scale>
              <TestimonialCard
                badge="Accepted to UCT"
                initials="LM"
                name="Lesedi M."
                role="Matric, 2025"
                quote="I almost gave up halfway through filling forms for the third time. Uniflo did the boring part. I just had to read and tick. UCT confirmed two weeks later."
              />
            </Reveal>
            <Reveal delayMs={140} scale>
              <TestimonialCard
                badge="Bursary + Wits"
                initials="TS"
                name="Thandi S."
                role="Now at Wits"
                quote="My mom couldn't believe how quick it was. Three universities applied to in one evening, and I got to check every form before it went out."
              />
            </Reveal>
            <Reveal delayMs={280} scale>
              <TestimonialCard
                badge="Accepted at NMU"
                initials="JV"
                name="Jaco V."
                role="Matric, 2025"
                quote="Honestly the review screen was the best part. Felt like having a proper adult double-check my work. Made everything less scary."
              />
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
            <Reveal from="left">
              <SectionHeading
                eyebrow="Common questions"
                title="The stuff your matric WhatsApp group keeps asking."
                accentText="WhatsApp group"
                description="If you don't see your question here, message us — we'll add it."
              />
            </Reveal>

            <Reveal from="right" delayMs={150} className="lg:pt-2">
              <FAQItem
                defaultOpen
                question="Does Uniflo pay my application fees?"
                answer={
                  <>
                    No. Each university charges its own fee, and you pay those
                    directly when you apply. Uniflo only charges for the service
                    of preparing and submitting your applications — we&rsquo;ll
                    always show you exactly what each university costs before
                    you confirm.
                  </>
                }
              />
              <FAQItem
                question="What if I miss a deadline?"
                answer={
                  <>
                    Each university&rsquo;s open and close dates are shown on
                    its page. Once you start an application, your dashboard
                    shows the closing date and we send reminders before it
                    closes. Closed universities can&rsquo;t be applied to —
                    that&rsquo;s the only thing we can&rsquo;t help with.
                  </>
                }
              />
              <FAQItem
                question="Do I have to share my password with you?"
                answer={
                  <>
                    Never. Uniflo creates an account on each university&rsquo;s
                    portal on your behalf, and you can request the login details
                    at any time. Your Uniflo account password stays with you
                    alone.
                  </>
                }
              />
              <FAQItem
                question="What does Uniflo actually do for me?"
                answer={
                  <>
                    We map your details to each university&rsquo;s online form,
                    upload your documents, and submit. You get a single
                    dashboard showing every application&rsquo;s status, plus a
                    review step before anything goes out. Think of it as one
                    profile that fills in twenty different forms.
                  </>
                }
              />
              <FAQItem
                question="How do I know my information is safe?"
                answer={
                  <>
                    Your data is stored on the same infrastructure used by most
                    South African banks and only used to complete your
                    applications. You can delete your account and all associated
                    data at any time from your settings.
                  </>
                }
              />
            </Reveal>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
          <Reveal scale>
            <Card
              variant="feature"
              className="relative overflow-hidden p-8 md:p-12"
            >
              <DotCluster
                aria-hidden
                // Tiny up-and-down bob so the closing CTA has a "still alive"
                // signal even after the rest of the section has settled.
                className="absolute right-8 top-8 h-10 w-16 text-primary/70 [animation:bob_4s_ease-in-out_infinite] motion-reduce:animate-none"
              />
              <div className="flex flex-col items-start gap-6 md:max-w-2xl">
                <span className="font-script text-2xl text-primary">
                  ready when you are
                </span>
                <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
                  Start your applications. It takes about 20 minutes.
                </h2>
                <p className="text-base text-muted-foreground md:text-lg">
                  Sign up free, build your profile once, and watch a single
                  dashboard handle every university you choose.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="contents">
                    <Button variant="accent">
                      Start free
                      <ArrowRight size={16} aria-hidden />
                    </Button>
                  </Link>
                  <Link href="/login" className="contents">
                    <Button variant="secondary">Sign in</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:px-10">
          <div className="flex flex-col gap-4">
            <BrandMark />
            <p className="max-w-sm text-sm text-muted-foreground">
              One profile. Every university. Built in South Africa for South
              African matrics.
            </p>
            <SocialLinks />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Sitemap
            </span>
            <ul className="flex flex-col gap-2 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Get in touch
            </span>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href="mailto:hello@uniflo.app"
                  className="text-foreground transition-colors hover:text-primary"
                >
                  hello@uniflo.app
                </a>
              </li>
              <li className="text-muted-foreground">
                Cape Town · Johannesburg
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground sm:flex-row md:px-10">
            <p>© {year} Uniflo. Apply smarter.</p>
            <span className="inline-flex items-center gap-2">
              Made for SA matrics
              <Sprout className="h-4 w-4 origin-bottom text-primary [animation:sway_6s_ease-in-out_infinite] motion-reduce:animate-none" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
