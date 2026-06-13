// ProfileOverview — renders a read-only summary of the student's saved profile.
//
// Fetches GET /profile on mount with the Supabase JWT. If the profile doesn't
// exist yet (404), redirects to /profile/setup so the student can create one.
// Other failures (auth, server, network) are surfaced inline with a retry
// affordance rather than auto-redirecting — a transient error shouldn't boot
// the student out of their own profile page.
//
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GENDER_LABELS,
  HOME_LANGUAGE_LABELS,
} from "@/lib/constants/profile-enums";
import { formatDate } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileResponse = components["schemas"]["StudentProfileResponse"];

// ─── Row list ─────────────────────────────────────────────────────────────────

// A label/value table. Shared by the core profile rows and the optional
// "additional details" rows so both render identically.
function RowList({
  rows,
}: {
  rows: Array<{ label: string; value: string | null }>;
}) {
  return (
    <dl className="divide-y divide-border rounded-lg border border-border bg-card shadow-[var(--shadow-paper)]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-40">
            {row.label}
          </dt>
          <dd className="text-sm text-foreground sm:flex-1">
            {row.value ?? <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Masks a 13-digit SA ID number to show only the first 6 digits (date of
// birth portion) — the remaining digits contain gender/citizenship/race info
// that shouldn't be on screen unless the student is actively editing them.
function maskIdNumber(idNumber: string): string {
  if (idNumber.length !== 13) return idNumber;
  return `${idNumber.slice(0, 6)} • • • • • • •`;
}

// ─── ProfileOverview ──────────────────────────────────────────────────────────

export function ProfileOverview() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }
      if (!apiUrl) {
        setError("API URL is not configured. Contact support.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // No profile yet — route the student straight into the setup flow.
        if (res.status === 404) {
          router.replace("/profile/setup");
          return;
        }

        if (!res.ok) {
          setError("Couldn't load your profile. Please try again.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ProfileResponse;
        setProfile(data);
        setLoading(false);
      } catch {
        setError(
          "Unable to connect. Check your internet connection and try again.",
        );
        setLoading(false);
      }
    }

    loadProfile();
  }, [apiUrl, router]);

  // Loading skeleton — mirrors the shape of the loaded overview card so the
  // layout doesn't shift when the real data arrives.
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert tone="destructive">{error}</Alert>;
  }

  if (!profile) return null;

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Each entry is rendered as a label/value row. Missing fields display an
  // em-dash so the student can see at a glance which sections still need
  // filling in — cleaner than hiding the row entirely.
  const rows: Array<{ label: string; value: string | null }> = [
    { label: "Full name", value: fullName || null },
    {
      label: "Date of birth",
      value: profile.date_of_birth ? formatDate(profile.date_of_birth) : null,
    },
    {
      label: "ID number",
      value: profile.id_number ? maskIdNumber(profile.id_number) : null,
    },
    { label: "Phone", value: profile.phone ?? null },
    { label: "Street address", value: profile.street_address ?? null },
    { label: "Suburb", value: profile.suburb ?? null },
    { label: "City", value: profile.city ?? null },
    { label: "Province", value: profile.province ?? null },
    { label: "Postal code", value: profile.postal_code ?? null },
    { label: "Nationality", value: profile.nationality ?? null },
    {
      label: "Gender",
      value: profile.gender
        ? (GENDER_LABELS[profile.gender] ?? profile.gender)
        : null,
    },
    {
      label: "Home language",
      value: profile.home_language
        ? (HOME_LANGUAGE_LABELS[profile.home_language] ?? profile.home_language)
        : null,
    },
    { label: "Religion", value: profile.religion ?? null },
    { label: "Disability", value: profile.disability ?? null },
    { label: "Marital status", value: profile.marital_status ?? null },
    { label: "Ethnicity", value: profile.ethnicity ?? null },
  ];

  // Renders a boolean as Yes/No, or null when the backend hasn't recorded it.
  const yesNo = (v: boolean | null | undefined): string | null =>
    v == null ? null : v ? "Yes" : "No";

  const mailingAddress =
    profile.mailing_same_as_residential === false
      ? [
          profile.mailing_street_address,
          profile.mailing_suburb,
          profile.mailing_city,
          profile.mailing_province,
          profile.mailing_postal_code,
        ]
          .filter(Boolean)
          .join(", ") || null
      : null;

  const redressCount = profile.redress_factors
    ? Object.keys(profile.redress_factors).length
    : 0;

  // Optional Phase-3 fields. Only the populated ones render, so students who
  // skip this section don't see a wall of em-dashes.
  const optionalRows: Array<{ label: string; value: string | null }> = [
    { label: "Title", value: profile.title ?? null },
    { label: "Middle names", value: profile.middle_names ?? null },
    { label: "Maiden name", value: profile.maiden_name ?? null },
    { label: "Preferred name", value: profile.preferred_name ?? null },
    { label: "SA citizen", value: yesNo(profile.is_sa_citizen) },
    { label: "Mailing address", value: mailingAddress },
    { label: "Disability detail", value: profile.disability_detail ?? null },
    {
      label: "Assistance required",
      value: profile.disability_assistance ?? null,
    },
    { label: "Current activity", value: profile.current_activity ?? null },
    { label: "Exam number", value: profile.exam_number ?? null },
    { label: "Sport", value: profile.sport ?? null },
    { label: "Wants residence", value: yesNo(profile.wants_residence) },
    {
      label: "Preferred residence",
      value: profile.preferred_residence ?? null,
    },
    { label: "Applying for NSFAS", value: yesNo(profile.applying_nsfas) },
    {
      label: "Institutional funding",
      value: yesNo(profile.applying_institutional_funding),
    },
    { label: "NBT reference", value: profile.nbt_reference ?? null },
    {
      label: "NBT year",
      value: profile.nbt_year != null ? String(profile.nbt_year) : null,
    },
    { label: "NBT date", value: formatDate(profile.nbt_date) },
    {
      label: "Redress factors",
      value: redressCount > 0 ? `${redressCount} recorded` : null,
    },
  ].filter((row) => row.value != null);

  return (
    <div className="space-y-8">
      <RowList rows={rows} />

      {/* Additional, optional details — only shown once the student fills in
       * at least one. These feed the portal automation but don't gate
       * profile completeness. */}
      {optionalRows.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Additional details
          </h2>
          <RowList rows={optionalRows} />
        </div>
      )}
    </div>
  );
}
