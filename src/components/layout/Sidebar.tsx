"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Dot, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarItem = { label: string; href: string };

export function Sidebar({
  title,
  items,
  open,
  onOpenChange,
  collapsed,
  onCollapsedChange,
}: {
  title: string;
  items: SidebarItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col rounded-[20px] border border-[var(--edge)] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--surface)_86%,transparent),color-mix(in_oklab,var(--surface)_66%,var(--surface-2)))] shadow-[0_24px_44px_var(--shadow)] backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between border-b border-[var(--edge)] px-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-[9px] bg-[var(--primary)] text-xs font-semibold text-[var(--on-primary)]">CV</span>
          <p className={cn("small font-medium text-[var(--text)]", collapsed ? "sr-only" : "")}>{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="lg:hidden" onClick={() => onOpenChange(false)} aria-label="Close navigation">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-3">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className={cn(
                "group flex items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-all duration-200",
                isActive
                  ? "border-[color-mix(in_oklab,var(--primary)_72%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_22%,var(--surface))] text-[var(--text)]"
                  : "border-transparent text-[var(--muted-text)] hover:border-[var(--edge)] hover:bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] hover:text-[var(--text)]",
                collapsed ? "justify-center px-2" : "",
              )}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-[8px] border text-[10px] font-semibold",
                  isActive
                    ? "border-[color-mix(in_oklab,var(--primary)_72%,var(--edge))] bg-[var(--primary)] text-[var(--on-primary)]"
                    : "border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] text-[var(--muted-text)]",
                )}
              >
                {item.label.slice(0, 1).toUpperCase()}
              </span>
              <span className={cn("small", collapsed ? "hidden" : "")}>{item.label}</span>
              {isActive && !collapsed ? <Dot className="ml-auto size-5 text-[var(--primary-700)]" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-[var(--edge)] px-4 py-3 tiny text-[var(--muted-text)]", collapsed ? "text-center" : "")}>v1 platform</div>
    </div>
  );

  return (
    <>
      <aside className={cn("hidden shrink-0 p-4 lg:block", collapsed ? "w-[96px]" : "w-[304px]")}>{sidebarContent}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" type="button" aria-label="Close menu overlay" onClick={() => onOpenChange(false)} />
          <aside className="absolute inset-y-0 left-0 w-[304px] p-4">{sidebarContent}</aside>
        </div>
      ) : null}
    </>
  );
}
