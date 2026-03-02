"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const INITIAL_STATE: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordPanel() {
  const [form, setForm] = useState<PasswordFormState>(INITIAL_STATE);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient<{ message: string }>(endpoints.auth.changePassword, {
        method: "POST",
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password: form.newPassword,
          confirm_password: form.confirmPassword,
        }),
      }),
    onSuccess: (response) => {
      setForm(INITIAL_STATE);
      toast.success(response.message || "Password updated successfully.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit = Boolean(form.currentPassword && form.newPassword && form.confirmPassword) && !mutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <Card className="p-0">
      <div className="border-b border-[var(--edge)] px-5 py-4 md:px-6">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text)]">Security</h2>
        <p className="mt-1 text-sm text-[var(--muted-text)]">Change your account password for future sign-ins.</p>
      </div>

      <form className="space-y-4 px-5 py-5 md:px-6 md:py-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="small">Current password</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="small">New password</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="small">Confirm new password</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--edge)] pt-4">
          <p className="tiny text-[var(--muted-text)]">Use at least 8 characters and avoid common passwords.</p>
          <Button type="submit" disabled={!canSubmit}>
            {mutation.isPending ? "Updating..." : "Update password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
