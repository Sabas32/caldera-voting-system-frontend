"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { LoadingSkeletons } from "@/components/feedback/LoadingSkeletons";
import { PlatformNotices } from "@/components/layout/PlatformNotices";
import { Topbar } from "@/components/layout/Topbar";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { clearAuthScope, clearCurrentUserCache } from "@/lib/auth";
import { applyPrimaryColorOverride, clearPrimaryColorOverride } from "@/lib/brandTheme";
import { endpoints } from "@/lib/endpoints";
import { useAuthGuard } from "@/lib/guards";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

export function OrgShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLogin = pathname === "/org/login";
  const { loading } = useAuthGuard("org");
  const { activeMemberships, orgId, updateOrg } = useOrgContext({ enabled: !isLogin });
  const activeMembership = activeMemberships.find((membership) => membership.organization === orgId) ?? null;
  const activeRole = activeMemberships.find((membership) => membership.organization === orgId)?.role ?? null;

  const settingsQuery = useQuery({
    queryKey: ["org-settings", orgId],
    enabled: Boolean(orgId) && !isLogin,
    queryFn: () =>
      apiClient<{ data: { name?: string; primary_color_override?: string | null } }>(endpoints.org.settings, {
        headers: orgRequestHeaders(orgId),
      }),
  });
  const activeOrgName = settingsQuery.data?.data?.name || activeMembership?.organization_slug || "Organization";

  useEffect(() => {
    if (isLogin) {
      clearPrimaryColorOverride();
      return;
    }

    applyPrimaryColorOverride(settingsQuery.data?.data?.primary_color_override ?? "");
  }, [isLogin, orgId, settingsQuery.data?.data?.primary_color_override]);

  useEffect(
    () => () => {
      clearPrimaryColorOverride();
    },
    [],
  );

  const orgItems = useMemo(
    () => [
      { label: "Dashboard", href: "/org/dashboard" },
      { label: "Elections", href: "/org/elections" },
      ...(activeRole === "ORG_ADMIN" ? [{ label: "Users", href: "/org/users" }] : []),
      { label: "Audit", href: "/org/audit" },
      ...(activeRole === "ORG_ADMIN" ? [{ label: "Settings", href: "/org/settings" }] : []),
    ],
    [activeRole],
  );

  const logoutMutation = useMutation({
    mutationFn: () => apiClient(endpoints.auth.logout, { method: "POST" }),
    onSuccess: () => {
      clearAuthScope();
      clearCurrentUserCache(queryClient);
      toast.success("Logged out");
      router.replace("/org/login");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isLogin && loading) {
    return <LoadingSkeletons />;
  }

  if (isLogin) {
    return (
      <div className="container-page min-h-screen py-10 md:py-16">
        <div className="mx-auto max-w-lg">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      <Topbar
        title="Organization Administration"
        statusText={activeOrgName}
        navItems={orgItems}
        onLogout={() => logoutMutation.mutate()}
        logoutPending={logoutMutation.isPending}
      />
      <PlatformNotices />

      {activeMemberships.length > 1 ? (
        <div className="container-page pt-3">
          <div className="flex items-center gap-2 rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2 shadow-[0_10px_24px_var(--shadow)]">
            <label className="small whitespace-nowrap text-[var(--muted-text)]">Active organization</label>
            <Select
              uiSize="sm"
              className="min-w-0 flex-1 px-2"
              value={orgId ?? ""}
              onChange={(event) => updateOrg(event.target.value)}
            >
              {activeMemberships.map((membership) => (
                <option key={membership.organization} value={membership.organization}>
                  {membership.organization_slug} ({membership.role})
                </option>
              ))}
            </Select>
          </div>
        </div>
      ) : null}

      <main className="container-page flex-1 py-6 md:py-8">{children}</main>
    </div>
  );
}
