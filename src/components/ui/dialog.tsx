"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

export const DialogRoot = Dialog.Root;
export const DialogTrigger = Dialog.Trigger;
export const DialogClose = Dialog.Close;

export function DialogContent({ className, ...props }: Dialog.DialogContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--bg)_30%,black)]/70 backdrop-blur-sm" />
      <Dialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-[var(--edge)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_90%,transparent),color-mix(in_oklab,var(--surface)_70%,var(--surface-2)))] p-6 shadow-[0_24px_60px_var(--shadow)]",
          className,
        )}
        {...props}
      />
    </Dialog.Portal>
  );
}
