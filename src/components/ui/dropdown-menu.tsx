"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";

export const DropdownMenuRoot = DropdownMenu.Root;
export const DropdownMenuTrigger = DropdownMenu.Trigger;

export function DropdownMenuContent({ className, ...props }: DropdownMenu.DropdownMenuContentProps) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={10}
        className={cn(
          "z-50 min-w-44 rounded-[14px] border border-[var(--edge)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_90%,transparent),color-mix(in_oklab,var(--surface)_74%,var(--surface-2)))] p-1.5 shadow-[0_20px_42px_var(--shadow)] backdrop-blur-xl",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: DropdownMenu.DropdownMenuItemProps) {
  return (
    <DropdownMenu.Item
      className={cn(
        "cursor-pointer rounded-[10px] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))]",
        className,
      )}
      {...props}
    />
  );
}
