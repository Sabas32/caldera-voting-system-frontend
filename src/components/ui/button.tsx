"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const variantMap = {
  primary:
    "border border-[color-mix(in_oklab,var(--primary)_76%,var(--primary-700))] bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary-600)_100%)] text-[var(--on-primary)] shadow-[0_12px_26px_color-mix(in_oklab,var(--primary)_32%,transparent)] hover:-translate-y-[1px] hover:shadow-[0_16px_28px_color-mix(in_oklab,var(--primary)_38%,transparent)]",
  secondary:
    "border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)] hover:-translate-y-[1px] hover:bg-[color-mix(in_oklab,var(--surface)_88%,var(--surface-2))]",
  ghost:
    "border border-transparent bg-transparent text-[var(--text)] hover:bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))]",
  danger:
    "border border-[color-mix(in_oklab,var(--danger)_75%,black)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--danger)_88%,white),var(--danger))] text-white shadow-[0_12px_24px_color-mix(in_oklab,var(--danger)_34%,transparent)] hover:-translate-y-[1px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[12px] font-medium tracking-[-0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-[1px]",
          sizeMap[size],
          variantMap[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
