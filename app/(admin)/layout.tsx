// (admin) route-group layout — role gate for all /admin/* pages.
//
// Runs before any admin page renders. Checks the Supabase session, then
// fetches /auth/me to read the role from the DB. Non-admins are redirected
// to /dashboard rather than shown a 403, so the admin section is invisible
// to students.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import type { components } from "@/lib/api/schema";

type UserResponse = components["schemas"]["UserResponse"];

export default async function AdminGateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const result = await serverApiGet<UserResponse>("/auth/me", token);
  const role = result.ok ? result.data.role : null;

  if (role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
