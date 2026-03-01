"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Clock3, Eye, PencilLine, ShieldCheck } from "lucide-react";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

type DashboardResponse = {
  data: {
    active_elections: number;
    tokens_generated: number;
    tokens_used: number;
    turnout_percentage: number;
    ballots_submitted: number;
    recent_elections: Array<{
      id: string;
      title: string;
      status: string;
      opens_at: string | null;
      closes_at: string | null;
    }>;
    recent_audit: Array<{
      id: string;
      action: string;
      actor_email: string | null;
      created_at: string;
    }>;
  };
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: "border-[color-mix(in_oklab,var(--warning)_42%,var(--edge))] text-[color-mix(in_oklab,var(--warning)_90%,white)]",
  SCHEDULED: "border-[color-mix(in_oklab,var(--info)_45%,var(--edge))] text-[color-mix(in_oklab,var(--info)_85%,white)]",
  LIVE: "border-[color-mix(in_oklab,var(--success)_45%,var(--edge))] text-[color-mix(in_oklab,var(--success)_88%,white)]",
  CLOSED: "border-[color-mix(in_oklab,var(--muted-text)_42%,var(--edge))]",
  ARCHIVED: "border-[color-mix(in_oklab,var(--muted-text)_45%,var(--edge))] text-[var(--muted-text)]",
};

function formatAuditAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDateParts(value: string | null) {
  if (!value) {
    return { date: "-", time: "" };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "-", time: "" };
  }
  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

function getInitials(value: string | null) {
  if (!value) {
    return "SY";
  }
  const parts = value
    .split("@")[0]
    .split(/[.\-_ ]+/)
    .filter(Boolean);
  if (!parts.length) {
    return "US";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function OrgDashboardPage() {
  const { orgId, activeMembership } = useOrgContext();
  const canManage = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";
  const query = useQuery({
    queryKey: ["org-dashboard", orgId],
    enabled: Boolean(orgId),
    queryFn: () =>
      apiClient<DashboardResponse>(endpoints.org.dashboard, {
        headers: orgRequestHeaders(orgId),
      }),
  });

  const data = query.data?.data;
  const kpis = [
    { label: "Active elections", value: data?.active_elections ?? 0 },
    { label: "Tokens generated", value: data?.tokens_generated ?? 0 },
    { label: "Tokens used", value: data?.tokens_used ?? 0 },
    { label: "Turnout", value: `${data?.turnout_percentage ?? 0}%` },
  ];

  return (
    <PageScaffold
      title="Organization Dashboard"
      subtitle="Operational election visibility"
      crumbs={[{ label: "Organization" }, { label: "Dashboard" }]}
      actions={
        canManage ? (
          <Link href="/org/elections/new">
            <Button>Create election</Button>
          </Link>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] blur-xl" />
            <p className="small relative text-[var(--muted-text)]">{kpi.label}</p>
            <p className="display mt-2">{typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="h3">Recent Elections</h2>
              <p className="small mt-1 text-[var(--muted-text)]">Latest election activity with quick actions.</p>
            </div>
            <Link href="/org/elections">
              <Button variant="ghost" size="sm" className="h-8 rounded-[10px] border border-[var(--edge)] px-3">
                Open all
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <div className="max-h-[480px] space-y-3 overflow-auto pr-1">
            {(data?.recent_elections ?? []).length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[var(--edge)] p-6 text-center">
                <p className="small text-[var(--muted-text)]">No elections yet. Create one to get started.</p>
              </div>
            ) : null}
            {(data?.recent_elections ?? []).map((election) => {
              const opens = formatDateParts(election.opens_at);
              const closes = formatDateParts(election.closes_at);
              return (
                <article
                  key={election.id}
                  className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] p-4 transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_16px_30px_var(--shadow)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text)]">{election.title}</h3>
                      <p className="tiny mt-1 text-[var(--muted-text)]">Election ID {election.id.slice(0, 8)}</p>
                    </div>
                    <Badge className={STATUS_BADGE_CLASS[election.status] ?? ""}>{election.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] px-3 py-2">
                      <p className="tiny flex items-center gap-1.5 uppercase tracking-[0.07em] text-[var(--muted-text)]">
                        <CalendarClock className="size-3.5" />
                        Opens
                      </p>
                      <p className="small mt-1 font-medium">{opens.date}</p>
                      <p className="tiny text-[var(--muted-text)]">{opens.time}</p>
                    </div>
                    <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] px-3 py-2">
                      <p className="tiny flex items-center gap-1.5 uppercase tracking-[0.07em] text-[var(--muted-text)]">
                        <Clock3 className="size-3.5" />
                        Closes
                      </p>
                      <p className="small mt-1 font-medium">{closes.date}</p>
                      <p className="tiny text-[var(--muted-text)]">{closes.time}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Link href={`/org/elections/${election.id}/overview`}>
                      <Button size="sm" variant="ghost" className="h-8 rounded-[10px] border border-[var(--edge)] px-3">
                        <Eye className="size-3.5" />
                        View
                      </Button>
                    </Link>
                    {canManage ? (
                      <Link href={`/org/elections/${election.id}/setup`}>
                        <Button size="sm" variant="secondary" className="h-8 rounded-[10px] px-3">
                          <PencilLine className="size-3.5" />
                          Edit
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="h3">Audit Preview</h2>
              <p className="small mt-1 text-[var(--muted-text)]">Recent sensitive actions and access events.</p>
            </div>
            <Link href="/org/audit">
              <Button variant="ghost" size="sm" className="h-8 rounded-[10px] border border-[var(--edge)] px-3">
                Full audit
                <ShieldCheck className="size-4" />
              </Button>
            </Link>
          </div>
          <div className="max-h-[480px] space-y-2 overflow-auto pr-1">
            {(data?.recent_audit ?? []).length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[var(--edge)] p-6 text-center">
                <p className="small text-[var(--muted-text)]">No recent audit events.</p>
              </div>
            ) : null}
            {(data?.recent_audit ?? []).map((row) => (
              <article
                key={row.id}
                className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] px-3 py-2.5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] text-[11px] font-semibold">
                    {getInitials(row.actor_email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="small font-medium">{formatAuditAction(row.action)}</p>
                      <p className="tiny text-[var(--muted-text)]">
                        {new Date(row.created_at).toLocaleDateString()}{" "}
                        {new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge className="border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] text-[var(--muted-text)]">
                        {row.action}
                      </Badge>
                      <p className="tiny truncate text-[var(--muted-text)]">{row.actor_email ?? "system"}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </PageScaffold>
  );
}
