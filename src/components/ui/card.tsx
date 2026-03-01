import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-[var(--edge)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_86%,transparent)_0%,color-mix(in_oklab,var(--surface)_72%,var(--surface-2))_100%)] p-4 shadow-[0_12px_32px_var(--shadow)] backdrop-blur-md transition duration-200 md:p-6 hover:-translate-y-[1px] hover:shadow-[0_18px_38px_var(--shadow)]",
        className,
      )}
      {...props}
    />
  );
}
