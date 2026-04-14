// Session-refresh helper used by the root proxy (proxy.ts).
//
// Naming note: the file is called `middleware.ts` to follow the long-standing
// Supabase convention so future contributors can find it quickly, but the
// actual file Next.js 16 loads is `proxy.ts` at the repo root — Next.js 16
// renamed Middleware to Proxy. This file is just a plain helper imported by
// proxy.ts, not a Next.js convention file itself.
//
// Why this exists: Supabase access tokens are short-lived (one hour by
// default). Without something refreshing them on every request, a user's
// session silently expires server-side and they get logged out the next time
// a Server Component tries to read it. Running `supabase.auth.getUser()`
// inside the proxy triggers the refresh and writes the new cookies onto the
// outgoing response, keeping the session alive transparently.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // We start with a pass-through response. Any auth cookie writes that
  // Supabase needs to perform during the refresh will be copied onto this
  // response below.
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First, reflect the cookies onto the *incoming* request so any
          // downstream code in this same proxy invocation sees the new
          // values. Then rebuild the outgoing response with the same request
          // (so it inherits the updated cookies), and finally set the
          // cookies on the response so the browser persists them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not put any code between `createServerClient` and
  // `supabase.auth.getUser()`. Per Supabase docs, the `getUser()` call is
  // what actually contacts the auth server, validates the JWT, and triggers
  // the cookie refresh. Skipping or delaying it is the most common cause of
  // mysterious "random logout" bugs.
  await supabase.auth.getUser();

  return supabaseResponse;
}
