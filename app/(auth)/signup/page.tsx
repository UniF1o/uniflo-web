// Sign up screen — creates a new Uniflo account.
//
// Server component so we can check the session before rendering. A signed-in
// user landing here is redirected to /dashboard, avoiding the confusing UX of
// showing a sign-up form to someone who already has an account.
//
// The form itself lives in SignUpForm as a client component since it needs
// hooks (useRouter, useState). Unlike /login, this page does not read search
// params so no Suspense boundary is required here.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignUpForm } from "@/components/auth/signup-form";

export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in — skip the form entirely.
  if (user) redirect("/dashboard");

  return <SignUpForm />;
}
