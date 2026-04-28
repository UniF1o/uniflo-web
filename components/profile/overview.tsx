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
import { Skeleton } from "@/components/ui/skeleton";
import {
  GENDER_LABELS,
  HOME_LANGUAGE_LABELS,
} from "@/lib/constants/profile-enums";
import type { components } from "@/lib/api/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileResponse = components["schemas"]["ProfileResponse"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Turns a Supabase ISO date string (YYYY-MM-DD) into the SA locale format.
// Returns the raw value if parsing fails so the user still sees something.
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "long" }).format(d);
}

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
        <div className="space-y-3 rounded-lg border border-border p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      </div>
    );
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
    { label: "Address", value: profile.address ?? null },
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
  ];

  return (
    <dl className="divide-y divide-border rounded-lg border border-border">
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
