import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationDetail } from "@/components/applications/application-detail";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = { title: "Application" };

type ApplicationWithJob = components["schemas"]["ApplicationWithJob"];
type University = components["schemas"]["University"];

async function fetchApplication(
  token: string,
  id: string,
): Promise<ApplicationWithJob | "not_found" | null> {
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

async function fetchUniversity(
  token: string,
  id: string,
): Promise<University | null> {
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

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  if (!token) notFound();

  const application = await fetchApplication(token, id);

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

  const university = await fetchUniversity(token, application.university_id);
  const universityName = university?.name ?? application.university_id;

  return (
    <ApplicationDetail
      application={application}
      universityName={universityName}
    />
  );
}
