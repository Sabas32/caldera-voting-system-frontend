import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] px-3 text-sm text-[var(--text)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--surface)_82%,transparent)] outline-none transition-all duration-200 placeholder:text-[color-mix(in_oklab,var(--muted-text)_65%,transparent)] hover:border-[color-mix(in_oklab,var(--border)_55%,var(--primary))] focus-visible:border-[color-mix(in_oklab,var(--primary)_70%,var(--border))] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
