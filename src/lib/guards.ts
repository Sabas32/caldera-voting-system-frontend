"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCurrentUser } from "@/lib/useOrgContext";

export function useAuthGuard(mode: "system" | "org", options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useCurrentUser({ enabled });

  const loginPath = mode === "system" ? "/system/login" : "/org/login";

  useEffect(() => {
    if (!enabled || isLoading) {
      return;
    }
    if (isError || !user) {
      if (pathname !== loginPath) {
        router.replace(loginPath);
      }
      return;
    }

    const systemAllowed = mode === "system" && user.is_system_admin;
    const orgAllowed = mode === "org" && user.memberships.some((membership) => membership.is_active);
    if (!systemAllowed && !orgAllowed) {
      if (pathname !== loginPath) {
        router.replace(loginPath);
      }
    }
  }, [enabled, isError, isLoading, loginPath, mode, pathname, router, user]);

  return { user: user ?? null, loading: enabled ? isLoading : false };
}
