"use client";

// DashboardHome — the command centre.
//
// Two lives, one layout spine (greeting → journey rail → next step):
//
//   Setting up   — the rail shows where they are, the next-step card says
//                  exactly what to do, and the section checklist fills in
//                  the detail. "How UniFlo works" teaches the model once.
//   Set up       — the checklist disappears and the page becomes a tracking
//                  hub: anything needing action first, then one card per
//                  application, then the universities' closing deadlines.
//
// All journey state comes from the shared JourneyProvider, so this page,
// the sidebar mini and the next-step card can never disagree.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  FileText,
  NotebookPen,
  UserCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useJourney } from "@/lib/journey/journey";
import { apiClient } from "@/lib/api/client";
import { JourneyRail } from "@/components/journey/journey-rail";
import { NextStepCard } from "@/components/journey/next-step-card";
import { StatusBadge } from "@/components/applications/status-badge";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import { Sprout } from "@/components/ui/motifs";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { components } from "@/lib/api/schema";

type UniversityRead = components["schemas"]["UniversityRead"];
type UniversitiesListResponse =
  components["schemas"]["UniversitiesListResponse"];

// ─── Greeting ────────────────────────────────────────────────────────────────

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function GreetingHero({ inSetup }: { inSetup: boolean }) {
  const { profile } = useJourney();
  const firstName = profile?.first_name?.trim();

  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header>
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
          {today}
        </p>
        <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
          {timeOfDayGreeting()}
          {firstName ? (
            <>
              , <span className="text-primary">{firstName}</span>.
            </>
          ) : (
            "."
          )}
        </h1>
      </div>
    </header>
  );
}

// ─── Setup checklist ─────────────────────────────────────────────────────────

const SETUP_SECTIONS: readonly {
  id: "profile" | "marks" | "documents";
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    id: "profile",
    label: "Personal profile",
    description: "Your personal and contact details, captured once.",
    href: "/profile/setup",
    icon: UserCircle2,
  },
  {
    id: "marks",
    label: "Academic records",
    description: "Your Grade 11 results and subject marks.",
    href: "/academic-records",
    icon: NotebookPen,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Certified ID and results, ready for any portal.",
    href: "/documents",
    icon: FileText,
  },
];

function SetupChecklist() {
  const { stages } = useJourney();
  const stateOf = (id: string) =>
    stages.find((s) => s.id === id)?.state ?? "upcoming";

  return (
    <Section kicker="Your setup">
      <div className="grid gap-4 md:grid-cols-3">
        {SETUP_SECTIONS.map(({ id, label, description, href, icon: Icon }) => {
          const done = stateOf(id) === "complete";
          return (
            <Card
              key={id}
              variant="paper"
              className={cn(
                "group flex h-full flex-col gap-4 p-5 transition-all duration-200",
                done
                  ? "border-success/25 bg-success/8"
                  : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]",
              )}
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={20} aria-hidden />
                {done && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-card bg-success text-background"
                  >
                    <CheckCircle2 size={10} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
              {done ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden />
                  Done
                </span>
              ) : (
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Complete this section
                  <ArrowRight
                    size={12}
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

// ─── How UniFlo works ────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Tell your story once",
    body: "Profile, marks and documents, captured once and reused everywhere.",
  },
  {
    step: "2",
    title: "Pick your universities",
    body: "Choose the ones that fit. We fill in their forms on your behalf.",
  },
  {
    step: "3",
    title: "Approve and track",
    body: "You review everything before it goes. Then watch the statuses roll in.",
  },
];

function HowItWorks() {
  return (
    <Section kicker="How UniFlo works">
      <div className="grid gap-4 sm:grid-cols-3">
        {HOW_IT_WORKS.map(({ step, title, body }) => (
          <Card key={step} variant="paper" className="flex gap-3 p-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm text-primary">
              {step}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ─── Current-activity nudge ──────────────────────────────────────────────────

// The setup wizard never asks what the student is currently doing, but the
// answer gates whether automated submission is even allowed for them. Until
// it's answered, keep a quiet prompt on the dashboard.
function ActivityNudge() {
  const { profile } = useJourney();
  if (profile?.current_activity) return null;

  return (
    <Card
      variant="paper"
      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <CircleHelp size={17} aria-hidden />
        </span>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            What are you doing this year?
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Whether you&rsquo;re in Grade 12, upgrading, or working changes how
            we submit for you. Ten seconds in your profile.
          </p>
        </div>
      </div>
      <Link
        href="/profile/edit"
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
      >
        Answer it
        <ArrowRight size={14} aria-hidden />
      </Link>
    </Card>
  );
}

// ─── Applications overview ───────────────────────────────────────────────────

function ApplicationsOverview({
  universityNames,
}: {
  universityNames: Record<string, string>;
}) {
  const { applications } = useJourney();

  if (applications.length === 0) {
    return (
      <Section kicker="Your applications">
        <Card
          variant="paper"
          className="flex flex-col items-center gap-3 px-6 py-10 text-center"
        >
          <Sprout aria-hidden className="h-10 w-10 text-primary/40" />
          <p className="text-sm font-medium text-foreground">
            No applications yet
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Pick your universities and your first applications will appear here.
          </p>
          <Link
            href="/universities"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
          >
            Browse universities
            <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>
      </Section>
    );
  }

  return (
    <Section
      kicker="Your applications"
      action={
        <Link
          href="/applications"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
        >
          View all
          <ArrowRight size={12} aria-hidden />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => {
          const needsAction =
            app.status === "action_required" || app.status === "failed";
          return (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <Card
                variant="paper"
                className={cn(
                  "group relative h-full overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]",
                  needsAction && "border-warning/40",
                )}
              >
                {/* Status rail — a slim colour edge so the grid scans by
                 * state before any text is read. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    app.status === "submitted" && "bg-success",
                    app.status === "processing" && "bg-primary",
                    app.status === "pending" && "bg-border",
                    app.status === "failed" && "bg-destructive",
                    app.status === "action_required" && "bg-warning",
                  )}
                />
                <div className="space-y-2 pl-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {universityNames[app.university_id] ?? "University"}
                    </p>
                    {app.status && <StatusBadge status={app.status} />}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {app.programme}
                  </p>
                  {app.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Updated {formatRelativeTime(app.updated_at)}
                    </p>
                  )}
                  {needsAction && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
                      <BellRing size={12} aria-hidden />
                      Open to continue
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Deadlines ───────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

function daysUntil(dateString: string): number {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / MS_PER_DAY);
}

// Fraction of the open→close window already elapsed, clamped to [0, 1].
// Null when the window can't be computed (no open date).
function windowElapsed(uni: UniversityRead): number | null {
  if (!uni.open_date || !uni.close_date) return null;
  const open = new Date(uni.open_date).getTime();
  const close = new Date(uni.close_date).getTime();
  if (close <= open) return null;
  return Math.min(1, Math.max(0, (Date.now() - open) / (close - open)));
}

function DeadlinesSection({
  universities,
}: {
  universities: UniversityRead[];
}) {
  const { applications } = useJourney();
  const appliedTo = new Set(applications.map((a) => a.university_id));

  const upcoming = universities
    .filter((u) => u.is_active && u.close_date && daysUntil(u.close_date) >= 0)
    .sort(
      (a, b) =>
        new Date(a.close_date!).getTime() - new Date(b.close_date!).getTime(),
    );

  if (upcoming.length === 0) return null;

  return (
    <Section kicker="Deadlines">
      <Card variant="paper" as="ul" className="divide-y divide-border">
        {upcoming.map((uni) => {
          const days = daysUntil(uni.close_date!);
          const elapsed = windowElapsed(uni);
          const closingSoon = days <= 21;
          const applied = appliedTo.has(uni.id);
          const closeLabel = new Date(uni.close_date!).toLocaleDateString(
            "en-ZA",
            { day: "numeric", month: "long" },
          );
          return (
            <li
              key={uni.id}
              className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <CalendarClock
                  size={16}
                  aria-hidden
                  className={cn(
                    "shrink-0",
                    closingSoon ? "text-warning" : "text-muted-foreground",
                  )}
                />
                <p className="truncate text-sm text-foreground">{uni.name}</p>
                {applied && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 size={12} aria-hidden />
                    Applied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 sm:w-72">
                {elapsed != null && (
                  <span
                    aria-hidden
                    className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-muted sm:block"
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        closingSoon ? "bg-warning" : "bg-primary",
                      )}
                      style={{ width: `${Math.round(elapsed * 100)}%` }}
                    />
                  </span>
                )}
                <p
                  className={cn(
                    "shrink-0 text-xs tabular-nums",
                    closingSoon
                      ? "font-medium text-warning"
                      : "text-muted-foreground",
                  )}
                >
                  Closes {closeLabel} · {days === 0 ? "today" : `${days}d left`}
                </p>
              </div>
            </li>
          );
        })}
      </Card>
    </Section>
  );
}

// ─── DashboardHome ───────────────────────────────────────────────────────────

export function DashboardHome() {
  const router = useRouter();
  const { loading, stages, profileMissing } = useJourney();

  // Universities feed the deadline list and the id → name lookup for
  // application cards. A failed fetch just hides the deadlines section.
  const [universities, setUniversities] = useState<UniversityRead[]>([]);
  useEffect(() => {
    apiClient
      .get<UniversitiesListResponse>("/universities")
      .then((data) => setUniversities(data.items))
      .catch(() => {});
  }, []);

  // No profile at all → straight into the setup wizard (same behaviour the
  // old dashboard had).
  useEffect(() => {
    if (profileMissing) router.replace("/profile/setup");
  }, [profileMissing, router]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-72" />
        </div>
        <Skeleton className="h-16 w-full max-w-xl" />
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const setupDone = (["profile", "marks", "documents"] as const).every(
    (id) => stages.find((s) => s.id === id)?.state === "complete",
  );

  const universityNames = Object.fromEntries(
    universities.map((u) => [u.id, u.name]),
  );

  return (
    <div className="space-y-10">
      <GreetingHero inSetup={!setupDone} />

      {/* The journey spine — always visible so every visit answers
       * "where am I, what's next" before anything else. */}
      <Card variant="paper" className="px-4 py-5 sm:px-6">
        <JourneyRail />
      </Card>

      <NextStepCard />

      {setupDone ? (
        <>
          <ActivityNudge />
          <ApplicationsOverview universityNames={universityNames} />
          <DeadlinesSection universities={universities} />
        </>
      ) : (
        <>
          <SetupChecklist />
          <HowItWorks />
        </>
      )}
    </div>
  );
}
