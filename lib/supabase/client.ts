// Browser-side Supabase client for use in Client Components.
//
// Used for all interactive auth flows: email/password sign in, Google OAuth,
// password reset, and sign out. Reads the session from cookies managed by
// @supabase/ssr.
//
// A new client is created on every call rather than a module-level singleton
// to avoid stale state issues with React Fast Refresh in development.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // NEXT_PUBLIC_* vars are safe to expose to the browser.
  // Non-null assertions are intentional — missing vars should fail loudly.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
