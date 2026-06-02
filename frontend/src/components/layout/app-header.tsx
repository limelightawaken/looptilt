"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { appShellClass } from "@/lib/layout";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", match: (path: string) => path === "/dashboard" },
  {
    href: "/dashboard/newsletters",
    label: "Newsletters",
    match: (path: string) => path.startsWith("/dashboard/newsletters"),
  },
] as const;

interface AppHeaderProps {
  userName: string;
  userEmail: string;
  onSignOut: () => void;
}

export function AppHeader({ userName, userEmail, onSignOut }: AppHeaderProps) {
  const pathname = usePathname();
  const initials = (userName || userEmail)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-50 border-b border-light-silver/30 bg-background/80 backdrop-blur-md dark:border-gunmetal/30">
      <div className={`${appShellClass} flex h-16 items-center justify-between gap-4`}>
        <div className="flex min-w-0 items-center gap-6 md:gap-8">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80 md:gap-3"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pantone-orange to-midnight-green">
              <RefreshCw className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold md:text-base">LoopTilt</div>
              <div className="hidden truncate text-xs text-muted-foreground sm:block">
                Newsletter personalization for Kit
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-wheat/60 text-foreground dark:bg-gunmetal/60"
                      : "text-foreground/80 hover:text-pantone-orange dark:text-foreground/90 dark:hover:text-sand-yellow"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-3 border-r border-light-silver/40 pr-3 dark:border-gunmetal/50 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pantone-orange/20 to-midnight-green/20 text-xs font-semibold text-foreground ring-1 ring-light-silver/50 dark:ring-gunmetal/60">
              {initials || "?"}
            </div>
            <div className="hidden text-right lg:block">
              <p className="max-w-[140px] truncate text-sm font-medium">{userName || "Creator"}</p>
              <p className="max-w-[180px] truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <ThemeToggle />

          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="border-foreground/20 dark:border-foreground/30"
          >
            <span className="hidden sm:inline">Sign out</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </div>
      </div>

      <nav
        className={`${appShellClass} flex gap-1 border-t border-light-silver/20 py-2 sm:hidden dark:border-gunmetal/30`}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition-colors ${
                active
                  ? "bg-wheat/60 text-foreground dark:bg-gunmetal/60"
                  : "text-foreground/80 hover:text-pantone-orange dark:hover:text-sand-yellow"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
