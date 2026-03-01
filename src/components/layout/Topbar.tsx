"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { usePlatformSettings } from "@/lib/usePlatformSettings";
import { cn } from "@/lib/utils";

export function Topbar({
  title,
  navItems,
  onLogout,
  logoutPending = false,
  statusText,
}: {
  title: string;
  navItems?: Array<{ label: string; href: string }>;
  onLogout?: () => void;
  logoutPending?: boolean;
  statusText?: string;
}) {
  const pathname = usePathname();
  const settings = usePlatformSettings();

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 md:px-4">
      <div className="rounded-[18px] border border-[var(--edge)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_86%,transparent),color-mix(in_oklab,var(--surface)_72%,var(--surface-2)))] shadow-[0_18px_34px_var(--shadow)] backdrop-blur-xl">
        <div className="flex min-h-16 items-center gap-3 px-3 py-2 md:px-4">
          <div className="min-w-0">
            <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">{settings.platformName}</p>
            <p className="small truncate font-medium text-[var(--text)]">{title}</p>
            {settings.platformTagline ? <p className="tiny truncate text-[var(--muted-text)]">{settings.platformTagline}</p> : null}
          </div>

          {statusText ? (
            <p className="small ml-2 hidden rounded-full border border-[color-mix(in_oklab,var(--primary)_55%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_20%,var(--surface))] px-3 py-1 text-[var(--text)] md:inline-flex">
              {statusText}
            </p>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {onLogout ? (
              <Button variant="secondary" size="sm" onClick={onLogout} disabled={logoutPending}>
                <LogOut className="size-4" />
                {logoutPending ? "Signing out..." : "Logout"}
              </Button>
            ) : null}
          </div>
        </div>

        {navItems?.length ? (
          <div className="border-t border-[var(--edge)] px-2 pb-2 pt-1 md:px-3">
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "small shrink-0 rounded-[10px] border px-3 py-2 transition duration-200",
                      isActive
                        ? "border-[color-mix(in_oklab,var(--primary)_72%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_22%,var(--surface))] text-[var(--text)]"
                        : "border-transparent text-[var(--muted-text)] hover:border-[var(--edge)] hover:bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] hover:text-[var(--text)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
