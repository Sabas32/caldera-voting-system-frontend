"use client";

import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger";
  confirmPending?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  confirmPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h3 className="h3">{title}</h3>
        <p className="small mt-2 text-[var(--muted-text)]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={confirmPending}
          >
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={confirmPending}>
            {confirmPending ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
