// (app) route-group layout — wraps every authenticated page.
//
// Route groups (folders in parentheses) share a layout without adding a URL
// segment. So app/(app)/dashboard/page.tsx is reachable at /dashboard.
//
// This layout runs on the server: it validates the session and redirects to
// /login if no user is found, before any child page renders.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { SelectionProvider } from "@/lib/state/selection";
import { SelectionBar } from "@/components/universities/selection-bar";
import type { components } from "@/lib/api/schema";

type ProfileResponse = components["schemas"]["StudentProfileResponse"];

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy has already refreshed the session cookies for this request.
  // getUser() validates the JWT — if invalid or missing, user is null.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // redirect() throws internally, so no code below this runs for guests.
  // The browser never receives any authenticated UI without a valid session.
  if (!user) {
    redirect("/login");
  }

  // Fetch the student's name from the backend profile so the UserMenu always
  // reflects the latest saved name rather than the Supabase auth metadata
  // (which is only set at OAuth sign-in and never updated on profile edits).
  let profileName: string | undefined;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (token && apiUrl) {
      const res = await fetch(`${apiUrl}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        // next.revalidate: 0 ensures this fetch is not cached between requests,
        // so router.refresh() from the edit form picks up the updated name.
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = (await res.json()) as ProfileResponse;
        const name = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(" ");
        if (name) profileName = name;
      }
    }
  } catch {
    // Non-fatal — UserMenu falls back to Supabase metadata or email prefix.
  }

  return (
    <SelectionProvider>
      <AppShell user={user} profileName={profileName}>
        {children}
      </AppShell>
      <SelectionBar />
    </SelectionProvider>
  );
}
