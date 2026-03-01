"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const electionSections = [
  { key: "overview", label: "Overview" },
  { key: "setup", label: "Setup" },
  { key: "posts", label: "Posts" },
  { key: "candidates", label: "Candidates" },
  { key: "tokens", label: "Tokens" },
  { key: "monitor", label: "Monitor" },
  { key: "results", label: "Results" },
  { key: "history", label: "History" },
];

export function ElectionSubnav({ electionId }: { electionId: string }) {
  const pathname = usePathname();

  return (
    <div className="mb-4 overflow-auto rounded-[16px] border border-[var(--edge)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_84%,transparent),color-mix(in_oklab,var(--surface)_72%,var(--surface-2)))] p-2 shadow-[0_14px_30px_var(--shadow)]">
      <nav className="flex min-w-max items-center gap-1.5">
        {electionSections.map((section) => {
          const href = `/org/elections/${electionId}/${section.key}`;
          const isActive = pathname === href;
          return (
            <Link
              key={section.key}
              href={href}
              className={cn(
                "small rounded-[10px] border px-3 py-2 transition",
                isActive
                  ? "border-[color-mix(in_oklab,var(--primary)_72%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_22%,var(--surface))] text-[var(--text)]"
                  : "border-transparent text-[var(--muted-text)] hover:border-[var(--edge)] hover:bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] hover:text-[var(--text)]",
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
