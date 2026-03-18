"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AUTH_ME_QUERY_KEY, getActiveMemberships, getCurrentUser, persistSelectedOrg, resolveOrgIdForUser } from "@/lib/auth";

export function useCurrentUser(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 0,
    refetchInterval: false,
    retry: false,
    enabled,
    refetchOnWindowFocus: true,
  });
}

export function useOrgContext(options?: { enabled?: boolean }) {
  const { data: user, isLoading, isError } = useCurrentUser(options);
  const [manualOrgId, setManualOrgId] = useState<string | null>(null);

  const resolvedOrgId = useMemo(() => (user ? resolveOrgIdForUser(user) : null), [user]);
  const orgId = manualOrgId ?? resolvedOrgId;

  const activeMemberships = useMemo(() => (user ? getActiveMemberships(user) : []), [user]);
  const activeMembership = useMemo(
    () => activeMemberships.find((membership) => membership.organization === orgId) ?? null,
    [activeMemberships, orgId],
  );

  const updateOrg = (nextOrgId: string) => {
    setManualOrgId(nextOrgId);
    persistSelectedOrg(nextOrgId);
  };

  return {
    user,
    orgId,
    isLoading,
    isError,
    activeMemberships,
    activeMembership,
    updateOrg,
  };
}

export function orgRequestHeaders(orgId: string | null): HeadersInit {
  if (!orgId) {
    return {};
  }
  return { "X-Org-Id": orgId };
}
