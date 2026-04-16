// UserMenu — avatar button + dropdown for the signed-in user.
//
// Client component: owns the dropdown open/closed state and handles sign-out.
// Only rendered inside (app) layouts where the auth gate has already run,
// so the user prop is always present (non-nullable).
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Pull a friendly display name from Supabase user metadata (populated by
  // Google OAuth) and fall back to the email prefix for email/password users.
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Student";

  // Close the menu when the user clicks anywhere outside it. Keeps the
  // keyboard-escape behaviour working too.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Signs out via the browser Supabase client, then navigates to /login and
  // calls router.refresh() so the server layout re-runs its auth check.
  // The proxy also clears the session cookies on the next request.
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Build the avatar initials from display name (e.g. "Jane Doe" -> "JD").
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm transition-colors hover:bg-muted"
      >
        {/* Avatar circle — terracotta background + cream initials. */}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm text-accent-foreground">
          {initials || <UserIcon size={14} />}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown panel. Hidden when closed (rather than not rendered) so the
       * open/close transition can animate. */}
      <div
        role="menu"
        aria-hidden={!isOpen}
        className={cn(
          "absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-lg border border-border bg-background shadow-lg transition-all duration-150",
          isOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <nav className="py-1">
          <Link
            href="/profile"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            <UserIcon size={14} />
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-destructive transition-colors hover:bg-muted"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </nav>
      </div>
    </div>
  );
}
