import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import type { QueryClient } from "@tanstack/react-query";

export type OrgRole = "ORG_ADMIN" | "ELECTION_MANAGER" | "RESULTS_VIEWER";

export type AuthMembership = {
  id: string;
  organization: string;
  organization_slug: string;
  role: OrgRole;
  is_active: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  is_system_admin: boolean;
  memberships: AuthMembership[];
};

export const ORG_SELECTION_KEY = "caldera:selected-org-id";
export const AUTH_SCOPE_KEY = "caldera:auth-scope";
export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;
export type AuthScope = "org" | "system";

export async function getCurrentUser() {
  const res = await apiClient<{ data: AuthUser | null }>(endpoints.auth.me);
  return res.data;
}

export function setCurrentUserCache(queryClient: QueryClient, user: AuthUser | null) {
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, user);
}

export function clearCurrentUserCache(queryClient: QueryClient) {
  queryClient.cancelQueries({ queryKey: AUTH_ME_QUERY_KEY });
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
}

export function getActiveMemberships(user: AuthUser): AuthMembership[] {
  return user.memberships.filter((membership) => membership.is_active);
}

export function resolveOrgIdForUser(user: AuthUser): string | null {
  const activeMemberships = getActiveMemberships(user);
  if (activeMemberships.length === 0) {
    return null;
  }

  const selectedOrgId = typeof window !== "undefined" ? window.localStorage.getItem(ORG_SELECTION_KEY) : null;
  if (selectedOrgId && activeMemberships.some((membership) => membership.organization === selectedOrgId)) {
    return selectedOrgId;
  }

  const envOrgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;
  if (envOrgId && activeMemberships.some((membership) => membership.organization === envOrgId)) {
    return envOrgId;
  }

  return activeMemberships[0].organization;
}

export function persistSelectedOrg(orgId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ORG_SELECTION_KEY, orgId);
  }
}

export function setAuthScope(scope: AuthScope) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_SCOPE_KEY, scope);
  }
}

export function getAuthScope(): AuthScope | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(AUTH_SCOPE_KEY);
  if (value === "org" || value === "system") {
    return value;
  }
  return null;
}

export function clearAuthScope() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_SCOPE_KEY);
  }
}
