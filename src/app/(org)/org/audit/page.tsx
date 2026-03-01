"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { AuditTable } from "@/components/tables/AuditTable";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

type AuditRow = {
  id: string;
  action: string;
  actor_email: string | null;
  target_type: string;
  target_id: string;
  created_at: string;
};

export default function OrgAuditPage() {
  const { orgId } = useOrgContext();
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const query = useQuery({
    queryKey: ["org-audit", orgId, action, dateFrom],
    enabled: Boolean(orgId),
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("org_id", orgId ?? "");
      if (action.trim()) {
        params.set("action", action.trim());
      }
      if (dateFrom) {
        params.set("date_from", new Date(dateFrom).toISOString());
      }
      return apiClient<{ data: AuditRow[] }>(`${endpoints.org.audit}?${params.toString()}`, {
        headers: orgRequestHeaders(orgId),
      });
    },
  });

  return (
    <PageScaffold title="Organization Audit" subtitle="Security and operational timeline" crumbs={[{ label: "Organization" }, { label: "Audit" }]}>
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input placeholder="Action" value={action} onChange={(event) => setAction(event.target.value)} />
          <Input disabled placeholder="Actor filter can be done in table export" />
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <AuditTable
          showActions={false}
          columns={["action", "actor", "target", "time"]}
          rows={(query.data?.data ?? []).map((row) => ({
            id: row.id,
            action: row.action,
            actor: row.actor_email ?? "system",
            target: `${row.target_type}:${row.target_id}`,
            time: new Date(row.created_at).toLocaleString(),
          }))}
        />
      </Card>
    </PageScaffold>
  );
}
