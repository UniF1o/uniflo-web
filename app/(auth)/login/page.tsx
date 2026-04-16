// Login screen — signs an existing user into Uniflo.
//
// Server component so we can check the session before rendering. A signed-in
// user landing here is redirected to /dashboard, avoiding the confusing UX of
// showing a login form to someone who is already authenticated.
//
// The form itself lives in LoginForm as a client component since it needs
// hooks (useRouter, useSearchParams, useState). useSearchParams requires a
// Suspense boundary, which we provide here at the page level.
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in — skip the form entirely.
  if (user) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
