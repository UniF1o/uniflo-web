import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { UniversityManager } from "@/components/admin/university-manager";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = { title: "Universities — Admin" };

type UniversitiesListResponse =
  components["schemas"]["UniversitiesListResponse"];

export default async function AdminUniversitiesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const result = await serverApiGet<UniversitiesListResponse>(
    "/admin/universities",
    token,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Admin"
        title="Universities"
        description="Manage which universities appear in the student app."
      />

      {!result.ok ? (
        <Alert tone="destructive">
          Could not load universities. Refresh the page and try again.
        </Alert>
      ) : (
        <UniversityManager universities={result.data.items} />
      )}
    </div>
  );
}
