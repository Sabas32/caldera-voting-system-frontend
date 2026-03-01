"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { AuditTable } from "@/components/tables/AuditTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import { downloadFile } from "@/lib/downloads";
import { endpoints } from "@/lib/endpoints";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

type ResultsResponse = {
  data: {
    ballots_submitted: number;
    posts: Array<{ post_title: string; candidates: Array<{ name: string; votes: number }> }>;
  };
};

type ElectionDetail = {
  data: {
    status: string;
    results_visibility: "HIDDEN_UNTIL_CLOSED" | "LIVE_ALLOWED";
  };
};

type AuditResponse = {
  data: Array<{
    id: string;
    action: string;
    actor_email: string | null;
    target_type: string;
    target_id: string;
    created_at: string;
  }>;
};

export default function ElectionHistoryPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { orgId } = useOrgContext();

  const electionQuery = useQuery({
    queryKey: ["org-election-history-meta", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<ElectionDetail>(endpoints.org.electionDetail(electionId)),
  });

  const canFetchResults =
    electionQuery.data?.data.results_visibility === "LIVE_ALLOWED"
      ? ["LIVE", "CLOSED", "ARCHIVED"].includes(electionQuery.data?.data.status ?? "")
      : ["CLOSED", "ARCHIVED"].includes(electionQuery.data?.data.status ?? "");

  const resultsQuery = useQuery({
    queryKey: ["org-election-history-results", electionId],
    enabled: Boolean(electionId && electionQuery.data && canFetchResults),
    queryFn: () => apiClient<ResultsResponse>(endpoints.org.results(electionId)),
    retry: false,
  });

  const auditQuery = useQuery({
    queryKey: ["org-election-history-audit", electionId, orgId],
    enabled: Boolean(orgId && electionId),
    queryFn: () =>
      apiClient<AuditResponse>(`${endpoints.org.audit}?org_id=${orgId ?? ""}`, {
        headers: orgRequestHeaders(orgId),
      }),
  });

  return (
    <PageScaffold
      title="Election History"
      subtitle={`Election ID: ${electionId ?? ""}`}
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "History" },
      ]}
      actions={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={!canFetchResults}
            onClick={() => downloadFile({ path: endpoints.org.exportExcel(electionId), filename: `election-${electionId}-history.xlsx` })}
          >
            Export Excel
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="h3 mb-3">Final Report Snapshot</h2>
          {!canFetchResults ? (
            <p className="small text-[var(--muted-text)]">Results are not visible for this election yet.</p>
          ) : null}
          <p className="small text-[var(--muted-text)]">Ballots submitted: {resultsQuery.data?.data.ballots_submitted ?? 0}</p>
          <div className="mt-3 space-y-2">
            {(resultsQuery.data?.data.posts ?? []).map((post) => (
              <div key={post.post_title} className="rounded-[10px] border border-[var(--border)] p-3">
                <p className="font-medium">{post.post_title}</p>
                <p className="small text-[var(--muted-text)]">
                  {post.candidates.map((candidate) => `${candidate.name}: ${candidate.votes}`).join(" - ") || "No votes"}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="h3 mb-4">Audit Timeline</h2>
          <AuditTable
            showActions={false}
            columns={["action", "actor", "time"]}
            rows={(auditQuery.data?.data ?? [])
              .filter((row) => row.target_id === electionId || row.action.includes("ELECTION"))
              .map((row) => ({
                id: row.id,
                action: row.action,
                actor: row.actor_email ?? "system",
                time: new Date(row.created_at).toLocaleString(),
              }))}
          />
        </Card>
      </div>
    </PageScaffold>
  );
}
