"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getActiveMemberships, getAuthScope, resolveOrgIdForUser, type AuthUser, type OrgRole } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useOrgContext";

const ORG_ADMIN_ONLY_PREFIXES = ["/org/users", "/org/settings"];

function resolveActiveOrgRole(user: AuthUser): OrgRole | null {
  const activeMemberships = getActiveMemberships(user);
  if (activeMemberships.length === 0) {
    return null;
  }

  const selectedOrgId = resolveOrgIdForUser(user);
  const activeMembership = activeMemberships.find((membership) => membership.organization === selectedOrgId) ?? activeMemberships[0];
  return activeMembership?.role ?? null;
}

function isOrgRouteBlockedForRole(pathname: string, role: OrgRole | null): boolean {
  const adminOnlyRoute = ORG_ADMIN_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!adminOnlyRoute) {
    return false;
  }
  return role !== "ORG_ADMIN";
}

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

    const authScope = getAuthScope();
    const hasSystemAccess = user.is_system_admin;
    const hasOrgAccess = getActiveMemberships(user).length > 0;

    let redirectTarget: string | null = null;

    if (mode === "system") {
      if (authScope === "org" && hasOrgAccess) {
        redirectTarget = "/org/dashboard";
      } else if (!hasSystemAccess) {
        redirectTarget = hasOrgAccess ? "/org/dashboard" : "/system/login";
      } else if (pathname === "/system/login") {
        redirectTarget = "/system/dashboard";
      }
    } else {
      if (authScope === "system" && hasSystemAccess) {
        redirectTarget = "/system/dashboard";
      } else if (!hasOrgAccess) {
        redirectTarget = hasSystemAccess ? "/system/dashboard" : "/org/login";
      } else if (pathname === "/org/login") {
        redirectTarget = "/org/dashboard";
      } else {
        const activeRole = resolveActiveOrgRole(user);
        if (isOrgRouteBlockedForRole(pathname, activeRole)) {
          redirectTarget = "/org/dashboard";
        }
      }
    }

    if (redirectTarget && redirectTarget !== pathname) {
      router.replace(redirectTarget);
      return;
    }

    const systemAllowed = mode === "system" && hasSystemAccess;
    const orgAllowed = mode === "org" && hasOrgAccess;
    if (!systemAllowed && !orgAllowed && pathname !== loginPath) {
      router.replace(loginPath);
    }
  }, [enabled, isError, isLoading, loginPath, mode, pathname, router, user]);

  return { user: user ?? null, loading: enabled ? isLoading : false };
}
