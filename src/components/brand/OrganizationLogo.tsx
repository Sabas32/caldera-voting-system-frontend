"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

import { cn, getInitials } from "@/lib/utils";

const sizeClass = {
  sm: "h-8 w-8 rounded-[9px] text-[10px]",
  md: "h-10 w-10 rounded-[11px] text-xs",
  lg: "h-14 w-14 rounded-[14px] text-sm",
  xl: "h-20 w-20 rounded-[18px] text-lg",
};

type OrganizationLogoProps = {
  name?: string | null;
  logoUrl?: string | null;
  size?: keyof typeof sizeClass;
  className?: string;
};

export function OrganizationLogo({ name, logoUrl, size = "md", className }: OrganizationLogoProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const safeName = name?.trim() || "Organization";
  const shouldShowImage = Boolean(logoUrl) && failedLogoUrl !== logoUrl;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] font-semibold text-[var(--text)] shadow-[0_8px_20px_var(--shadow)]",
        sizeClass[size],
        className,
      )}
      aria-label={`${safeName} logo`}
    >
      {shouldShowImage ? (
        <img src={logoUrl ?? ""} alt={`${safeName} logo`} className="h-full w-full object-cover" onError={() => setFailedLogoUrl(logoUrl ?? null)} />
      ) : (
        getInitials(safeName)
      )}
    </span>
  );
}
