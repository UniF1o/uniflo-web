// OAuth callback Route Handler.
//
// After the user authorises with Google (or any OAuth provider), the provider
// redirects back here with a short-lived `code` in the query string. This
// handler exchanges that code for a real Supabase session (which gets stored
// as an HttpOnly cookie by @supabase/ssr).
//
// Flow:
//   1. User clicks "Continue with Google" → supabase.auth.signInWithOAuth()
//      redirects the browser to Google's consent screen.
//   2. Google redirects to this URL: /auth/callback?code=<code>
//   3. We call exchangeCodeForSession(code) — Supabase validates the code and
//      sets the session cookies on the response.
//   4. We redirect the user to their destination (default: /dashboard).
//
// The optional `next` query param lets callers override the post-auth
// destination. For example, new signups pass next=/profile/setup so users
// land on the profile form rather than the dashboard.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session cookies are now set — redirect to the intended destination.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Either the code was absent or the exchange failed. Redirect to login with
  // an error flag so the login page can surface a friendly message.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
