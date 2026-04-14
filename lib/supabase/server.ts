// Server-side Supabase client for use in Server Components, Route Handlers,
// and Server Actions.
//
// Cannot use document.cookie — reads cookies via Next.js' cookies() helper
// instead. Always create a new client per request; never share one instance
// across requests or concurrent renders will mix up session cookies.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // cookies() is async in Next.js 15+ — await it to get the request-scoped store.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Reads existing auth cookies so Supabase can hydrate the session.
        getAll() {
          return cookieStore.getAll();
        },
        // Writes refreshed auth tokens back to the response.
        // Wrapped in try/catch because Server Components cannot write response
        // headers — Next.js throws if you try. The proxy (proxy.ts) handles
        // session refresh on every request, so missing the write here is safe.
        // Route Handlers and Server Actions can write cookies without issue.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Intentionally swallowed — called from a Server Component.
          }
        },
      },
    },
  );
}
