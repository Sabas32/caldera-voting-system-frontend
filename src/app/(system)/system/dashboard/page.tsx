"use client";

import { useQuery } from "@tanstack/react-query";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { AuditTable } from "@/components/tables/AuditTable";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { usePlatformSettings } from "@/lib/usePlatformSettings";
import { useCurrentUser } from "@/lib/useOrgContext";

type DashboardResponse = {
  data: {
    total_organizations: number;
    live_elections: number;
    ballots_last_7_days: number;
    tokens_used_last_7_days: number;
    recent_audit: Array<{
      id: string;
      action: string;
      organization_name: string | null;
      actor_email: string | null;
      created_at: string;
    }>;
  };
};

type SystemHealthResponse = {
  data: {
    status: "UP" | "DEGRADED";
    api: "UP" | "DOWN";
    database: "UP" | "DOWN";
    database_error: string | null;
    checked_at: string;
  };
};

export default function SystemDashboardPage() {
  const { data: user } = useCurrentUser();
  const platformSettings = usePlatformSettings();

  const query = useQuery({
    queryKey: ["system-dashboard"],
    enabled: Boolean(user?.is_system_admin),
    queryFn: () => apiClient<DashboardResponse>(endpoints.system.dashboard),
    retry: false,
    refetchInterval: 3_000,
  });

  const data = query.data?.data;
  const healthQuery = useQuery({
    queryKey: ["system-health-dashboard"],
    enabled: Boolean(user?.is_system_admin) && platformSettings.showSystemHealthPanel,
    queryFn: () => apiClient<SystemHealthResponse>(endpoints.system.health),
    refetchInterval: 30_000,
  });
  const health = healthQuery.data?.data;
  const kpis = [
    { label: "Total Organizations", value: data?.total_organizations ?? 0 },
    { label: "Live Elections", value: data?.live_elections ?? 0 },
    { label: "Ballots (7d)", value: data?.ballots_last_7_days ?? 0 },
    { label: "Tokens Used (7d)", value: data?.tokens_used_last_7_days ?? 0 },
  ];

  return (
    <PageScaffold title="System Dashboard" subtitle="Cross-tenant platform visibility" crumbs={[{ label: "System" }, { label: "Dashboard" }]}>
      {platformSettings.showSystemHealthPanel ? (
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <Card>
            <p className="small text-[var(--muted-text)]">Overall Health</p>
            <p className="h3 mt-2">{healthQuery.isLoading ? "Checking..." : health?.status ?? "Unavailable"}</p>
          </Card>
          <Card>
            <p className="small text-[var(--muted-text)]">API Status</p>
            <p className="h3 mt-2">{healthQuery.isLoading ? "Checking..." : health?.api ?? "Unavailable"}</p>
          </Card>
          <Card>
            <p className="small text-[var(--muted-text)]">Database Status</p>
            <p className="h3 mt-2">{healthQuery.isLoading ? "Checking..." : health?.database ?? "Unavailable"}</p>
            {health?.database_error ? <p className="tiny mt-1 text-[var(--danger)]">{health.database_error}</p> : null}
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="small text-[var(--muted-text)]">{kpi.label}</p>
            <p className="display mt-2">{kpi.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <Card>
          <h2 className="h3 mb-4">Recent Global Audit Events</h2>
          <AuditTable
            showActions={false}
            columns={["action", "organization", "actor", "time"]}
            rows={(data?.recent_audit ?? []).map((row) => ({
              id: row.id,
              action: row.action,
              organization: row.organization_name ?? "-",
              actor: row.actor_email ?? "system",
              time: new Date(row.created_at).toLocaleString(),
            }))}
          />
        </Card>
      </div>
    </PageScaffold>
  );
}
