// Server-side Supabase client.
//
// Used inside Server Components, Route Handlers, and Server Actions. Unlike
// the browser client, this one cannot rely on `document.cookie` — it has to
// be handed the request cookies explicitly via Next.js' `cookies()` helper.
//
// Per the @supabase/ssr docs, we create a NEW client per server invocation
// (never a shared module-level instance), because Server Components are
// rendered concurrently for many users and a shared client would leak the
// wrong session cookies between requests.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // In Next.js 15+ `cookies()` is async — it returns a Promise that resolves
  // to the request-scoped cookie store. Awaiting it here lets us pass a sync
  // cookie API into Supabase below.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // `getAll` lets Supabase read the existing auth cookies it set on a
        // previous response, so it can hydrate the current session.
        getAll() {
          return cookieStore.getAll();
        },
        // `setAll` writes refreshed auth cookies back to the response.
        //
        // When this client is used from a Server Component, Next.js does NOT
        // allow cookie writes (the response headers are already locked in
        // for the streamed render). That call throws, and we swallow it —
        // the proxy.ts at the repo root is responsible for refreshing the
        // session on every request, so missing a write here is harmless.
        //
        // When used from a Route Handler or Server Action, cookie writes DO
        // succeed and refreshed tokens are persisted as expected.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — see comment above.
          }
        },
      },
    },
  );
}
