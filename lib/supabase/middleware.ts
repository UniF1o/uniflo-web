// Session refresh helper called by the root proxy (proxy.ts) on every request.
//
// Supabase access tokens expire after one hour. Calling supabase.auth.getUser()
// here validates the current JWT and writes a refreshed token to the response
// cookies if needed, keeping the session alive transparently.
//
// Note: this file is named middleware.ts to match Supabase's SSR guides and
// make it easy to find. It is NOT a Next.js convention file — proxy.ts at the
// repo root is the actual Next.js entry point.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Start with a pass-through response. Supabase will rewrite this if it
  // needs to set refreshed auth cookies on the outgoing response.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write new cookie values onto the incoming request first so
          // downstream proxy code sees the fresh values, then rebuild
          // supabaseResponse so it carries the updated cookies to the browser.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: nothing between createServerClient and getUser().
  // getUser() is what contacts the auth server, validates the JWT, and
  // triggers the cookie refresh. Inserting code here causes random-logout bugs.
  await supabase.auth.getUser();

  return supabaseResponse;
}
