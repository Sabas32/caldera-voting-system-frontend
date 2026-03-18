"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { LoadingSkeletons } from "@/components/feedback/LoadingSkeletons";
import { PlatformNotices } from "@/components/layout/PlatformNotices";
import { Topbar } from "@/components/layout/Topbar";
import { apiClient } from "@/lib/apiClient";
import { clearAuthScope, clearCurrentUserCache } from "@/lib/auth";
import { endpoints } from "@/lib/endpoints";
import { useAuthGuard } from "@/lib/guards";

const systemItems = [
  { label: "Dashboard", href: "/system/dashboard" },
  { label: "Organizations", href: "/system/organizations" },
  { label: "Audit", href: "/system/audit" },
  { label: "Settings", href: "/system/settings" },
];

export function SystemShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLogin = pathname === "/system/login";
  const { loading } = useAuthGuard("system");

  const logoutMutation = useMutation({
    mutationFn: () => apiClient(endpoints.auth.logout, { method: "POST" }),
    onSuccess: () => {
      clearAuthScope();
      clearCurrentUserCache(queryClient);
      toast.success("Logged out");
      router.replace("/system/login");
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
        title="System Administration"
        navItems={systemItems}
        onLogout={() => logoutMutation.mutate()}
        logoutPending={logoutMutation.isPending}
      />
      <PlatformNotices />
      <main className="container-page flex-1 py-6 md:py-8">{children}</main>
    </div>
  );
}
