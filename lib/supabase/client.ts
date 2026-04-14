// Browser-side Supabase client.
//
// This client runs inside Client Components in the browser. It reads the
// session out of cookies that are managed by `@supabase/ssr`, and is the
// entry point used for all interactive auth flows: email + password sign in,
// Google OAuth, password reset emails, sign out, etc.
//
// We deliberately create a brand new client every time `createClient()` is
// called instead of caching a singleton. `createBrowserClient` already wires
// up its own internal storage backed by `document.cookie`, so the cost of
// reinstantiation is small, and we avoid the React Fast Refresh / module
// re-evaluation issues that come with module-scoped singletons.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Both env vars are public (NEXT_PUBLIC_*) and safe to ship to the browser.
  // The non-null assertion is appropriate here: if either is missing the app
  // is unbuildable, so we want a loud runtime failure rather than a silent
  // fallback to an unauthenticated client.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
