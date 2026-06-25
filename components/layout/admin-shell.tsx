"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsSidebarOpen(false);
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-chrome/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-chrome/60 md:h-16 md:px-6">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((o) => !o)}
          aria-label="Open navigation"
          className="-ml-2 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-foreground transition-colors hover:bg-foreground/5 md:hidden"
        >
          <Menu size={20} />
        </button>

        <BrandMark href="/admin" />

        <div className="flex-1" />

        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      </header>

      <div className="flex flex-1 overflow-y-auto min-h-0">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1">
          <div
            key={pathname}
            className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 [animation:page-enter_0.35s_cubic-bezier(0.2,0.8,0.2,1)_both] md:px-8 md:pt-10"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
