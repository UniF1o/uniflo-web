// (app) route-group layout — the protected area of the app.
//
// Route groups in the App Router are folders wrapped in parentheses. They
// let us share a layout across a set of routes WITHOUT adding a URL
// segment. So `/dashboard` lives at `app/(app)/dashboard/page.tsx` but its
// URL stays `/dashboard`, not `/app/dashboard`.
//
// This layout does the auth check on the server and hands off rendering to
// the client-side AppShell (which owns interactive chrome like the mobile
// drawer).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server Supabase client reads the session cookies that the proxy has
  // already refreshed on this request.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session → bounce to /login. `redirect()` throws, so execution stops
  // here and no children render — the browser never sees unauthenticated
  // chrome. `/login` is built in Task 3; until then this route sends the
  // user to a 404, which is acceptable for a protected area.
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
