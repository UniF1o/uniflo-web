import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationDetail } from "@/components/applications/application-detail";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];
type UniversityRead = components["schemas"]["UniversityRead"];

async function fetchApplication(
  token: string,
  id: string,
): Promise<ApplicationRead | "not_found" | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/applications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return "not_found";
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchUniversityRead(
  token: string,
  id: string,
): Promise<UniversityRead | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/universities/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// React.cache deduplicates calls within a single request so generateMetadata
// and the page component share one network round-trip for the application fetch.
const getApplicationById = cache(
  async (id: string): Promise<ApplicationRead | "not_found" | null> => {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) return null;
    return fetchApplication(token, id);
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application || application === "not_found") {
    return { title: "Application" };
  }
  return { title: `${application.programme} — Application` };
}

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const application = await getApplicationById(id);

  if (application === "not_found") notFound();

  if (application === null) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-destructive">
          Could not load this application. Refresh the page and try again.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const university = token
    ? await fetchUniversityRead(token, application.university_id)
    : null;
  const universityName = university?.name ?? application.university_id;

  return (
    <ApplicationDetail
      application={application}
      universityName={universityName}
    />
  );
}
