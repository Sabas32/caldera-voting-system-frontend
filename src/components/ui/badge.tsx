import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[color-mix(in_oklab,var(--edge)_88%,transparent)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] px-2.5 py-1 text-xs font-medium tracking-[0.01em] text-[var(--text)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
