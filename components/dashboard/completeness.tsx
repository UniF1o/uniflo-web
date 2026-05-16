// ProfileCompleteness — fetches the student's completion status across all
// three sections and renders a visual checklist on the dashboard.
//
// Three sections are checked in parallel on mount:
//   1. Personal profile  — GET /profile
//   2. Academic records  — GET /academic-records (a record present = done)
//   3. Documents         — GET /documents (counts how many of 3 types present)
//
// Auto-redirect rule: if the profile endpoint returns 404 (no profile exists),
// the student is sent to /profile/setup before any content renders. Other
// non-OK responses (auth failures, server errors) are treated as incomplete
// rather than triggering a redirect, so a transient API error doesn't boot
// the student out of the dashboard unexpectedly.
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GraduationCap,
  UserCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { REQUIRED_DOC_TYPES } from "@/lib/constants/documents";
import type { AcademicRecordResponse } from "@/lib/api/academic-records";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionStatus = "loading" | "complete" | "incomplete";

type CompletenessState = {
  profile: SectionStatus;
  academicRecords: SectionStatus;
  documents: SectionStatus;
  // Tracks partial document progress (0–3) so we can show "2 of 3 uploaded".
  documentsUploaded: number;
};

// ─── Section config ──────────────────────────────────────────────────────────

interface SectionConfig {
  key: keyof Omit<CompletenessState, "documentsUploaded">;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const SECTIONS: readonly SectionConfig[] = [
  {
    key: "profile",
    label: "Personal profile",
    description: "Your personal and contact details.",
    href: "/profile/setup",
    icon: UserCircle2,
  },
  {
    key: "academicRecords",
    label: "Academic records",
    description: "Your matric results and subject marks.",
    href: "/academic-records",
    icon: GraduationCap,
  },
  {
    key: "documents",
    label: "Documents",
    description: "Your ID document, matric certificate, and transcripts.",
    href: "/documents",
    icon: FileText,
  },
] as const;

// ─── Completeness ring ───────────────────────────────────────────────────────
// SVG ring showing X/N sections complete. The stroke-dashoffset transition
// animates the progress when the data finishes loading.

function CompletenessRing({
  complete,
  total,
}: {
  complete: number;
  total: number;
}) {
  // Geometry: 64-radius circle in a 144×144 viewBox. The dasharray equals
  // the circumference so we can express progress as a percentage of it.
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const percent = total === 0 ? 0 : complete / total;
  const offset = circumference * (1 - percent);

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg
        role="img"
        aria-label={`${complete} of ${total} sections complete`}
        viewBox="0 0 144 144"
        className="h-full w-full -rotate-90"
      >
        {/* Track ring — muted so the progress arc reads against it. */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="10"
        />
        {/* Progress arc — cobalt, transitioned via stroke-dashoffset. */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {/* Center label — "n/N" in the editorial serif. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-4xl leading-none tracking-tight text-foreground">
            {complete}
            <span className="text-muted-foreground">/{total}</span>
          </div>
          <div className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            done
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: Exclude<SectionStatus, "loading">;
}

function SectionCard({
  label,
  description,
  href,
  icon: Icon,
  status,
}: SectionCardProps) {
  const isComplete = status === "complete";
  return (
    <Card
      variant="paper"
      className={cn(
        "group flex h-full flex-col gap-4 p-5 transition-all duration-200",
        // Complete cards are softly tinted and lifted; incomplete cards
        // pop on hover so the call-to-action is felt before it's read.
        isComplete
          ? "border-success/25 bg-success/8"
          : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]",
      )}
    >
      {/* Icon + status pip — icon sits in a tinted disc; the pip bottom-
       * right of the disc broadcasts complete vs not at a glance. */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={20} aria-hidden />
        {isComplete && (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-success text-background"
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

      {isComplete ? (
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
}

// ─── ProfileCompleteness ─────────────────────────────────────────────────────

export function ProfileCompleteness() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [state, setState] = useState<CompletenessState>({
    profile: "loading",
    academicRecords: "loading",
    documents: "loading",
    documentsUploaded: 0,
  });

  useEffect(() => {
    async function checkCompleteness() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token || !apiUrl) {
        setState({
          profile: "incomplete",
          academicRecords: "incomplete",
          documents: "incomplete",
          documentsUploaded: 0,
        });
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, recordsRes, docsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/profile`, { headers }),
        fetch(`${apiUrl}/academic-records`, { headers }),
        fetch(`${apiUrl}/documents`, { headers }),
      ]);

      // 404 on profile means setup hasn't been done — bounce to the flow.
      if (
        profileRes.status === "fulfilled" &&
        profileRes.value.status === 404
      ) {
        router.replace("/profile/setup");
        return;
      }

      const profileComplete =
        profileRes.status === "fulfilled" && profileRes.value.ok;

      // The endpoint returns the student's single record, or null when they
      // haven't entered one yet (200 with a null body). Presence of a record
      // object is what counts as done.
      let recordsComplete = false;
      if (recordsRes.status === "fulfilled" && recordsRes.value.ok) {
        const record = (await recordsRes.value
          .json()
          .catch(() => null)) as AcademicRecordResponse | null;
        recordsComplete = record !== null && typeof record === "object";
      }

      let documentsUploaded = 0;
      if (docsRes.status === "fulfilled" && docsRes.value.ok) {
        const docs = (await docsRes.value.json()) as Array<{ type: string }>;
        documentsUploaded = REQUIRED_DOC_TYPES.filter((type) =>
          docs.some((d) => d.type === type),
        ).length;
      }

      setState({
        profile: profileComplete ? "complete" : "incomplete",
        academicRecords: recordsComplete ? "complete" : "incomplete",
        documents:
          documentsUploaded === REQUIRED_DOC_TYPES.length
            ? "complete"
            : "incomplete",
        documentsUploaded,
      });
    }

    checkCompleteness();
  }, [apiUrl, router]);

  // Show skeleton scaffold while any section is still loading.
  const isLoading = SECTIONS.some((s) => state[s.key] === "loading");

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-36 w-36 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[170px] w-full" />
          <Skeleton className="h-[170px] w-full" />
          <Skeleton className="h-[170px] w-full" />
        </div>
      </div>
    );
  }

  const completeCount = SECTIONS.filter(
    (s) => state[s.key] === "complete",
  ).length;
  const allDone = completeCount === SECTIONS.length;

  // Documents description varies with partial progress; the others are static.
  const documentsDescription =
    state.documents === "complete"
      ? "All 3 documents uploaded."
      : state.documentsUploaded === 0
        ? "No documents uploaded yet."
        : `${state.documentsUploaded} of 3 documents uploaded.`;

  return (
    <div className="space-y-8">
      {/* Header — completeness ring + summary copy */}
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
        <CompletenessRing complete={completeCount} total={SECTIONS.length} />
        <div className="space-y-2">
          <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            {allDone ? (
              <>
                You&rsquo;re ready to{" "}
                <span className="text-primary">apply.</span>
              </>
            ) : (
              <>
                You&rsquo;re{" "}
                <span className="text-primary">
                  {Math.round((completeCount / SECTIONS.length) * 100)}%
                </span>{" "}
                there.
              </>
            )}
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            {allDone
              ? "Your profile is complete. Pick the universities you want and we'll handle the rest."
              : "Finish the remaining sections so we can match you with universities and start applying on your behalf."}
          </p>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => (
          <SectionCard
            key={section.key}
            label={section.label}
            description={
              section.key === "documents"
                ? documentsDescription
                : section.description
            }
            href={section.href}
            icon={section.icon}
            status={state[section.key] as Exclude<SectionStatus, "loading">}
          />
        ))}
      </div>
    </div>
  );
}
