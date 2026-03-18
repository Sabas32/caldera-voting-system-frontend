import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={resolvedType}
          className={cn(
            "h-10 w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] px-3 text-sm text-[var(--text)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--surface)_82%,transparent)] outline-none transition-all duration-200 placeholder:text-[color-mix(in_oklab,var(--muted-text)_65%,transparent)] hover:border-[color-mix(in_oklab,var(--border)_55%,var(--primary))] focus-visible:border-[color-mix(in_oklab,var(--primary)_70%,var(--border))] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            isPassword ? "pr-16" : "",
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-[var(--muted-text)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
