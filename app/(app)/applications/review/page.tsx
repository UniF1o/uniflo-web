import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { components } from "@/lib/api/schema";
import { ReviewScreen } from "@/components/applications/review-screen";

export const metadata: Metadata = { title: "Review Application" };

type ProfileResponse = components["schemas"]["ProfileResponse"];
type AcademicRecord = components["schemas"]["AcademicRecord"];
type Document = components["schemas"]["Document"];

async function fetchProfile(token: string): Promise<ProfileResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchAcademicRecords(
  token: string,
): Promise<AcademicRecord[] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/academic-records`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchDocuments(token: string): Promise<Document[] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const [profile, academicRecords, documents] = await Promise.all([
    token ? fetchProfile(token) : Promise.resolve(null),
    token ? fetchAcademicRecords(token) : Promise.resolve(null),
    token ? fetchDocuments(token) : Promise.resolve(null),
  ]);

  return (
    <ReviewScreen
      profile={profile}
      academicRecords={academicRecords}
      documents={documents}
    />
  );
}
