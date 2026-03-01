import * as React from "react";

import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-separate border-spacing-0 text-sm", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-[52px] px-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[color-mix(in_oklab,var(--muted-text)_90%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "h-[52px] border-t border-[color-mix(in_oklab,var(--edge)_92%,transparent)] px-4 align-middle",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150 even:bg-[color-mix(in_oklab,var(--surface)_68%,var(--surface-2))] hover:bg-[color-mix(in_oklab,var(--surface)_86%,var(--primary))]",
        className,
      )}
      {...props}
    />
  );
}
