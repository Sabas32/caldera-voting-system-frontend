"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { ElectionsTable } from "@/components/tables/ElectionsTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

type ElectionRow = {
  id: string;
  title: string;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
  summary?: {
    turnout_percentage: number;
  };
};

export default function OrgElectionsPage() {
  const { orgId, activeMembership } = useOrgContext();
  const canManage = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const query = useQuery({
    queryKey: ["org-elections", orgId],
    enabled: Boolean(orgId),
    queryFn: () =>
      apiClient<{ data: ElectionRow[] }>(endpoints.org.elections, {
        headers: orgRequestHeaders(orgId),
      }),
  });

  const filteredRows = useMemo(() => {
    const rows = query.data?.data ?? [];
    return rows.filter((row) => {
      const searchHit = search.trim()
        ? row.title.toLowerCase().includes(search.trim().toLowerCase()) || row.id.toLowerCase().includes(search.trim().toLowerCase())
        : true;
      const statusHit = statusFilter.trim() ? row.status === statusFilter.trim().toUpperCase() : true;
      return searchHit && statusHit;
    });
  }, [query.data, search, statusFilter]);

  return (
    <PageScaffold
      title="Elections"
      subtitle="Manage election lifecycle, token batches, and outcomes"
      crumbs={[{ label: "Organization" }, { label: "Elections" }]}
      actions={
        canManage ? (
          <Link href="/org/elections/new">
            <Button>Create election</Button>
          </Link>
        ) : null
      }
    >
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input placeholder="Search elections" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Input placeholder="Status (LIVE, DRAFT...)" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} />
          <Input disabled placeholder={`${filteredRows.length} matched`} />
        </div>
        <ElectionsTable
          columns={["title", "status", "opens", "closes", "turnout"]}
          rows={filteredRows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            opens: row.opens_at ? new Date(row.opens_at).toLocaleDateString() : "-",
            closes: row.closes_at ? new Date(row.closes_at).toLocaleDateString() : "-",
            turnout: row.summary?.turnout_percentage ? `${row.summary.turnout_percentage}%` : "-",
            _viewHref: `/org/elections/${row.id}/overview`,
            _editHref: `/org/elections/${row.id}/setup`,
          }))}
        />
      </Card>
    </PageScaffold>
  );
}
