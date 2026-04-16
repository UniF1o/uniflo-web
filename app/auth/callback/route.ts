// OAuth callback Route Handler.
//
// After Google (or any OAuth provider) redirects back here with a short-lived
// `code`, this handler exchanges it for a real Supabase session cookie via
// exchangeCodeForSession(). On success the user is forwarded to their
// destination; on failure they land on /login with an error flag.
//
// The optional `next` query param lets the OAuth initiator set the post-auth
// destination — signup passes next=/profile/setup, login uses /dashboard.
// `next` is strictly validated as a same-origin path to prevent open-redirect
// attacks (e.g. next=//evil.com or next=@evil.com).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only accepts values that look like "/some/path". A single-slash prefix
// followed by a non-slash and non-backslash character keeps an attacker from
// smuggling in a different host via "//evil.com" or "/\evil.com".
function safeNextPath(next: string | null): string {
  if (next && /^\/[^/\\]/.test(next)) return next;
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

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
