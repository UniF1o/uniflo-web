// ProfileCompleteness — fetches the student's completion status across all
// three Phase 1 sections and renders a visual checklist on the dashboard.
//
// Three sections are checked in parallel on mount:
//   1. Personal profile  — GET /profile
//   2. Academic records  — GET /academic-records
//   3. Documents         — GET /documents (counts how many of 3 types are present)
//
// Auto-redirect rule: if the profile endpoint returns 404 (no profile exists),
// the student is sent to /profile/setup before any content renders. Other
// non-OK responses (auth failures, server errors) are treated as incomplete
// rather than triggering a redirect, so a transient API error doesn't boot
// the student out of the dashboard unexpectedly.
//
// Types are hand-written until Partner B delivers the FastAPI OpenAPI spec.
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { REQUIRED_DOC_TYPES } from "@/lib/constants/documents";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

// Lifecycle states for each completeness section.
//   loading    — API call in flight, skeleton shown in place of this section
//   complete   — backend confirmed the section has data
//   incomplete — section has no data or the API returned a non-2xx response
type SectionStatus = "loading" | "complete" | "incomplete";

type CompletenessState = {
  profile: SectionStatus;
  academicRecords: SectionStatus;
  documents: SectionStatus;
  // Tracks partial document progress (0–3) so we can show "2 of 3 uploaded".
  documentsUploaded: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

// Static config for each section card — label, description, and where to send
// the student if the section is incomplete.
const SECTIONS = [
  {
    key: "profile" as const,
    label: "Personal profile",
    description: "Your personal and contact details.",
    href: "/profile/setup",
  },
  {
    key: "academicRecords" as const,
    label: "Academic records",
    description: "Your matric results and subject marks.",
    href: "/academic-records",
  },
  {
    key: "documents" as const,
    label: "Documents",
    description: "Your ID document, matric certificate, and transcripts.",
    href: "/documents",
  },
];

// ─── SectionItem ──────────────────────────────────────────────────────────────
//
// Renders one row in the completeness checklist. Shows a green checkmark when
// complete, a muted circle when incomplete, and a "Complete" link on the right
// so the student can jump directly to the section they still need to finish.

interface SectionItemProps {
  label: string;
  // Description text — can vary for documents to show partial progress.
  description: string;
  href: string;
  status: Exclude<SectionStatus, "loading">;
}

function SectionItem({ label, description, href, status }: SectionItemProps) {
  const isComplete = status === "complete";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
      {/* Status icon — green checkmark when done, muted circle when not */}
      {isComplete ? (
        <CheckCircle2
          size={18}
          className="shrink-0 text-green-600"
          aria-hidden
        />
      ) : (
        <Circle
          size={18}
          className="shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}

      {/* Section label and dynamic description */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* "Complete" link — only visible when the section is not done yet.
       * Hidden once complete so the card doesn't imply further action. */}
      {!isComplete && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Complete
          <ArrowRight size={12} aria-hidden />
        </Link>
      )}
    </div>
  );
}

// ─── ProfileCompleteness ──────────────────────────────────────────────────────

export function ProfileCompleteness() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // All three sections start in loading so skeletons render on first paint.
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

      // If there's no session or no API URL configured, mark everything
      // incomplete rather than leaving the page stuck in loading.
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

      // Fire all three checks at once so the page loads in one round-trip
      // rather than three sequential requests.
      const [profileRes, recordsRes, docsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/profile`, { headers }),
        fetch(`${apiUrl}/academic-records`, { headers }),
        fetch(`${apiUrl}/documents`, { headers }),
      ]);

      // ── Profile ──────────────────────────────────────────────────────────
      // A 404 specifically means the student hasn't set up their profile yet.
      // Redirect them to the setup flow so they can't skip it.
      // Any other non-OK status (500, 401, etc.) is treated as incomplete
      // rather than triggering a redirect — we don't want a server error to
      // bounce the student off the dashboard when they do have a profile.
      if (
        profileRes.status === "fulfilled" &&
        profileRes.value.status === 404
      ) {
        router.replace("/profile/setup");
        return;
      }

      const profileComplete =
        profileRes.status === "fulfilled" && profileRes.value.ok;

      // ── Academic records ─────────────────────────────────────────────────
      // Any 2xx response means records exist and are complete.
      const recordsComplete =
        recordsRes.status === "fulfilled" && recordsRes.value.ok;

      // ── Documents ────────────────────────────────────────────────────────
      // Count how many of the three required document types are present.
      // This powers both the complete/incomplete status and the partial
      // progress description ("2 of 3 documents uploaded").
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

  // Show skeleton cards while any section is still loading.
  const isLoading = SECTIONS.some((s) => state[s.key] === "loading");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-[58px] w-full" />
          <Skeleton className="h-[58px] w-full" />
          <Skeleton className="h-[58px] w-full" />
        </div>
      </div>
    );
  }

  // Count complete sections to drive the summary line.
  const completeCount = SECTIONS.filter(
    (s) => state[s.key] === "complete",
  ).length;

  // Build the documents description based on partial progress.
  const documentsDescription =
    state.documents === "complete"
      ? "All 3 documents uploaded."
      : state.documentsUploaded === 0
        ? "No documents uploaded yet."
        : `${state.documentsUploaded} of 3 documents uploaded.`;

  return (
    <div className="space-y-4">
      {/* Summary line — updates as the student completes each section */}
      <p className="text-sm text-muted-foreground">
        {completeCount === SECTIONS.length ? (
          "Your profile is complete."
        ) : (
          <>
            <span className="font-medium text-foreground">
              {completeCount} of {SECTIONS.length}
            </span>{" "}
            sections complete. Finish the remaining sections to start applying.
          </>
        )}
      </p>

      {/* One card per section — rendered from SECTIONS so label/href stay
       * in one place. Documents gets a dynamic description based on partial
       * progress; the other two sections use the static description from SECTIONS. */}
      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <SectionItem
            key={section.key}
            label={section.label}
            description={
              section.key === "documents"
                ? documentsDescription
                : section.description
            }
            href={section.href}
            status={state[section.key] as Exclude<SectionStatus, "loading">}
          />
        ))}
      </div>
    </div>
  );
}
