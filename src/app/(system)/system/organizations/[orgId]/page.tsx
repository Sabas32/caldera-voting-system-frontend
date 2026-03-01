"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Settings2, ShieldCheck, UserCog, Users } from "lucide-react";
import { useParams } from "next/navigation";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { ElectionsTable } from "@/components/tables/ElectionsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type OrgDetailResponse = {
  data: {
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at: string;
  };
};

type ElectionRow = {
  id: string;
  title: string;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
};

export default function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();

  const orgQuery = useQuery({
    queryKey: ["system-org-detail", orgId],
    enabled: Boolean(orgId),
    queryFn: () => apiClient<OrgDetailResponse>(endpoints.system.organizationDetail(orgId)),
  });

  const electionsQuery = useQuery({
    queryKey: ["system-org-elections", orgId],
    enabled: Boolean(orgId),
    queryFn: () =>
      apiClient<{ data: ElectionRow[] }>(endpoints.org.elections, {
        headers: { "X-Org-Id": orgId },
      }),
  });

  const organization = orgQuery.data?.data;
  const elections = electionsQuery.data?.data ?? [];
  const activeElections = elections.filter((election) => election.status === "LIVE").length;

  return (
    <PageScaffold
      title={organization ? organization.name : "Organization Detail"}
      subtitle={organization ? `${organization.slug} - ${organization.status}` : "Loading organization details"}
      crumbs={[
        { label: "System", href: "/system/dashboard" },
        { label: "Organizations", href: "/system/organizations" },
        { label: "Detail" },
      ]}
    >
      <TabsRoot defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <Card>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="h3">Organization Elections</h2>
                <p className="small mt-1 text-[var(--muted-text)]">Read-only election listing for this organization.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-[color-mix(in_oklab,var(--success)_50%,var(--edge))]">{activeElections} live</Badge>
                <Badge>{elections.length} total</Badge>
              </div>
            </div>
            <div className="mt-4">
              <ElectionsTable
                showActions={false}
                columns={["title", "status", "opens", "closes"]}
                rows={elections.map((election) => ({
                  id: election.id,
                  title: election.title,
                  status: election.status,
                  opens: election.opens_at ? new Date(election.opens_at).toLocaleString() : "-",
                  closes: election.closes_at ? new Date(election.closes_at).toLocaleString() : "-",
                }))}
              />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="admins" className="mt-4">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_24%,transparent),transparent_68%)]" />
            <div className="relative space-y-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))]">
                  <UserCog className="size-5 text-[var(--primary-700)]" />
                </span>
                <div>
                  <h2 className="h3">Admin User Control</h2>
                  <p className="small mt-1 text-[var(--muted-text)]">Manage administrator access, reset credentials, and control activation state.</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-3">
                  <p className="tiny uppercase tracking-[0.08em] text-[var(--muted-text)]">Scope</p>
                  <p className="small mt-1 font-medium">Organization members</p>
                </div>
                <div className="rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-3">
                  <p className="tiny uppercase tracking-[0.08em] text-[var(--muted-text)]">Tools</p>
                  <p className="small mt-1 font-medium">Role + password reset</p>
                </div>
                <div className="rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-3">
                  <p className="tiny uppercase tracking-[0.08em] text-[var(--muted-text)]">Status</p>
                  <p className="small mt-1 font-medium">Activation controls</p>
                </div>
              </div>

              <Link href={`/system/organizations/${orgId}/admins`} className="inline-flex">
                <Button>
                  <Users className="size-4" />
                  Open Admin Users
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--info)_24%,transparent),transparent_68%)]" />
            <div className="relative space-y-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))]">
                  <Settings2 className="size-5 text-[var(--primary-700)]" />
                </span>
                <div>
                  <h2 className="h3">Organization Settings</h2>
                  <p className="small mt-1 text-[var(--muted-text)]">Update organization-level branding, status, and operational defaults.</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-3">
                  <p className="tiny uppercase tracking-[0.08em] text-[var(--muted-text)]">Branding</p>
                  <p className="small mt-1 font-medium">Name and theme configuration</p>
                </div>
                <div className="rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-3">
                  <p className="tiny uppercase tracking-[0.08em] text-[var(--muted-text)]">Policy</p>
                  <p className="small mt-1 inline-flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="size-4 text-[var(--primary-700)]" />
                    Organization governance controls
                  </p>
                </div>
              </div>

              <Link href={`/system/organizations/${orgId}/settings`} className="inline-flex">
                <Button>
                  <Settings2 className="size-4" />
                  Open Organization Settings
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </TabsContent>
      </TabsRoot>
    </PageScaffold>
  );
}
