"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { OrganizationsTable } from "@/components/tables/OrganizationsTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type Organization = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  active_elections: number;
};

export default function SystemOrganizationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["system-organizations", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (status.trim()) {
        params.set("status", status.trim().toUpperCase());
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return apiClient<{ data: Organization[] }>(`${endpoints.system.organizations}${suffix}`);
    },
  });

  const rows = useMemo(
    () =>
      (query.data?.data ?? []).map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        created: new Date(org.created_at).toLocaleDateString(),
        "active elections": org.active_elections,
        _viewHref: `/system/organizations/${org.id}`,
        _editHref: `/system/organizations/${org.id}/settings`,
      })),
    [query.data],
  );

  return (
    <PageScaffold
      title="Organizations"
      subtitle="Create and manage tenant organizations"
      crumbs={[{ label: "System" }, { label: "Organizations" }]}
      actions={
        <Link href="/system/organizations/new">
          <Button>New Organization</Button>
        </Link>
      }
    >
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
          <Input placeholder="Search organizations" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Input placeholder="ACTIVE / INACTIVE" value={status} onChange={(event) => setStatus(event.target.value)} />
        </div>
        <OrganizationsTable columns={["name", "slug", "status", "created", "active elections"]} rows={rows} />
      </Card>
    </PageScaffold>
  );
}
