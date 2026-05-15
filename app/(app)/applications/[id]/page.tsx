import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet, type ServerFetch } from "@/lib/api/server";
import { Alert } from "@/components/ui/alert";
import { ApplicationDetail } from "@/components/applications/application-detail";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];
type UniversityRead = components["schemas"]["UniversityRead"];

// React.cache deduplicates calls within a single request so generateMetadata
// and the page component share one network round-trip for the application fetch.
const getApplicationById = cache(
  async (id: string): Promise<ServerFetch<ApplicationRead>> => {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    return serverApiGet<ApplicationRead>(`/applications/${id}`, token);
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getApplicationById(id);
  if (!result.ok) return { title: "Application" };
  return { title: `${result.data.programme} — Application` };
}

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const applicationResult = await getApplicationById(id);

  if (!applicationResult.ok && applicationResult.status === 404) notFound();

  if (!applicationResult.ok) {
    return (
      <div className="max-w-2xl">
        <Alert tone="destructive">
          Could not load this application. Refresh the page and try again.
        </Alert>
      </div>
    );
  }

  const application = applicationResult.data;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const universityResult = await serverApiGet<UniversityRead>(
    `/universities/${application.university_id}`,
    token,
  );
  const universityName = universityResult.ok
    ? universityResult.data.name
    : application.university_id;

  return (
    <ApplicationDetail
      application={application}
      universityName={universityName}
    />
  );
}
