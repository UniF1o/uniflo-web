import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { careersPath } from "@/lib/api/careers";
import { PageHeader } from "@/components/layout/page-header";
import { CareersView } from "@/components/careers/careers-view";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = {
  title: "Careers",
};

type CareersListResponse = components["schemas"]["CareersListResponse"];

export default async function CareersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  let initialData: CareersListResponse | null = null;
  let initialNoRecord = false;

  if (token) {
    const result = await serverApiGet<CareersListResponse>(
      careersPath(),
      token,
    );
    if (result.ok) {
      initialData = result.data;
    } else if (result.status === 409) {
      initialNoRecord = true;
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        kicker="Discover"
        title="Careers"
        description="Explore careers matched to the subjects you already take, then see which university programmes lead there."
      />

      <CareersView
        initialData={initialData}
        initialNoRecord={initialNoRecord}
      />
    </div>
  );
}
