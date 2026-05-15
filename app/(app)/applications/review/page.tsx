import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import type { components } from "@/lib/api/schema";
import { ReviewScreen } from "@/components/applications/review-screen";

export const metadata: Metadata = { title: "Review Application" };

type StudentProfileResponse = components["schemas"]["StudentProfileResponse"];
type DocumentResponse = components["schemas"]["DocumentResponse"];

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const [profileResult, documentsResult] = await Promise.all([
    serverApiGet<StudentProfileResponse>("/profile", token),
    serverApiGet<DocumentResponse[]>("/documents", token),
  ]);

  return (
    <ReviewScreen
      profile={profileResult.ok ? profileResult.data : null}
      documents={documentsResult.ok ? documentsResult.data : null}
    />
  );
}
