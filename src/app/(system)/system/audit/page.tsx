"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { AuditTable } from "@/components/tables/AuditTable";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type AuditRow = {
  id: string;
  action: string;
  organization_name: string | null;
  actor_email: string | null;
  target_type: string;
  target_id: string;
  created_at: string;
};

export default function SystemAuditPage() {
  const [orgId, setOrgId] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");

  const query = useQuery({
    queryKey: ["system-audit", orgId, action, dateFrom],
    queryFn: () => {
      const params = new URLSearchParams();
      if (orgId) {
        params.set("org_id", orgId);
      }
      if (action) {
        params.set("action", action);
      }
      if (dateFrom) {
        params.set("date_from", new Date(dateFrom).toISOString());
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return apiClient<{ data: AuditRow[] }>(`${endpoints.system.audit}${suffix}`);
    },
  });

  return (
    <PageScaffold title="System Audit" subtitle="Global activity across all organizations" crumbs={[{ label: "System" }, { label: "Audit" }]}>
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input placeholder="Organization ID" value={orgId} onChange={(event) => setOrgId(event.target.value)} />
          <Input placeholder="Action (e.g. TOKENS_GENERATED)" value={action} onChange={(event) => setAction(event.target.value)} />
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <AuditTable
          showActions={false}
          columns={["action", "organization", "actor", "target", "time"]}
          rows={(query.data?.data ?? []).map((row) => ({
            id: row.id,
            action: row.action,
            organization: row.organization_name ?? "-",
            actor: row.actor_email ?? "system",
            target: `${row.target_type}:${row.target_id}`,
            time: new Date(row.created_at).toLocaleString(),
          }))}
        />
      </Card>
    </PageScaffold>
  );
}
