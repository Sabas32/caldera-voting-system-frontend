"use client";

import { LayoutDashboard, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth";

type DashboardAccessChoiceProps = {
  user: AuthUser;
  onChooseOrganization: () => void;
  onChooseSystem: () => void;
};

export function DashboardAccessChoice({ user, onChooseOrganization, onChooseSystem }: DashboardAccessChoiceProps) {
  const organizationCount = user.memberships.filter((membership) => membership.is_active).length;

  return (
    <div className="space-y-4">
      <div>
        <p className="small font-medium">Choose your workspace</p>
        <p className="small mt-1 text-[var(--muted-text)]">This account has both organization and platform administration access.</p>
      </div>
      <Button className="w-full justify-start" onClick={onChooseOrganization}>
        <LayoutDashboard className="size-4" /> Organization dashboard ({organizationCount})
      </Button>
      <Button className="w-full justify-start" variant="secondary" onClick={onChooseSystem}>
        <ShieldCheck className="size-4" /> System admin dashboard
      </Button>
    </div>
  );
}
