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

  return (
    <SelectionProvider>
      <AppShell user={user}>{children}</AppShell>
      <SelectionBar />
    </SelectionProvider>
  );
}
