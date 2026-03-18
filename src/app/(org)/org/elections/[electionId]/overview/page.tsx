"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { TurnoutChart } from "@/components/charts/TurnoutChart";
import { PageScaffold } from "@/components/layout/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { useOrgContext } from "@/lib/useOrgContext";

type ElectionDetailResponse = {
  data: {
    id: string;
    title: string;
    status: string;
    opens_at: string | null;
    closes_at: string | null;
    summary: {
      tokens_generated: number;
      tokens_used: number;
      turnout_percentage: number;
      ballots_submitted: number;
    };
    turnout_series: Array<{ day: string; count: number }>;
  };
};

export default function ElectionOverviewPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const router = useRouter();
  const { activeMembership } = useOrgContext();
  const queryClient = useQueryClient();
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const query = useQuery({
    queryKey: ["org-election-detail", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<ElectionDetailResponse>(endpoints.org.electionDetail(electionId)),
    refetchInterval: 10_000,
  });

  const statusMutation = useMutation({
    mutationFn: (action: "schedule" | "close" | "archive") =>
      apiClient(endpoints.org.electionStatus(electionId), {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      toast.success("Election status updated");
      queryClient.invalidateQueries({ queryKey: ["org-election-detail", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => apiClient(endpoints.org.electionDuplicate(electionId), { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => toast.success("Election duplicated"),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient(endpoints.org.electionDetail(electionId), { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Election deleted");
      queryClient.invalidateQueries({ queryKey: ["org-elections"] });
      router.push("/org/elections");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const election = query.data?.data;

  const canEdit = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";
  const canArchive = activeMembership?.role === "ORG_ADMIN";
  const canDelete = activeMembership?.role === "ORG_ADMIN";
  const canDeleteByStatus = !["LIVE", "SCHEDULED"].includes(election?.status ?? "");

  return (
    <PageScaffold
      title={election?.title ?? "Election Overview"}
      subtitle={election ? `Election ID: ${election.id}` : "Loading election"}
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "Overview" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {canEdit ? (
            <>
              <Button variant="secondary" onClick={() => statusMutation.mutate("schedule")} disabled={statusMutation.isPending}>
                Schedule Election
              </Button>
              <Button variant="secondary" onClick={() => setCloseConfirmOpen(true)} disabled={statusMutation.isPending}>
                Close Election
              </Button>
              {canArchive ? (
                <Button onClick={() => statusMutation.mutate("archive")} disabled={statusMutation.isPending}>
                  Archive Election
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending}>
                Duplicate Election
              </Button>
            </>
          ) : null}
        </div>
      }
    >
      <ConfirmDialog
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="Close Election"
        description="Are you sure you want to close this election now? Voters will no longer be able to submit ballots."
        confirmLabel="Yes, Close Election"
        confirmVariant="danger"
        confirmPending={statusMutation.isPending}
        onConfirm={() =>
          statusMutation.mutate("close", {
            onSuccess: () => setCloseConfirmOpen(false),
          })
        }
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Election"
        description="Delete this election permanently? This removes related posts, candidates, tokens, and ballots."
        confirmLabel="Delete Election"
        confirmVariant="danger"
        confirmPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
      <div className="mb-4">
        <Badge>{election?.status ?? "..."}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="small text-[var(--muted-text)]">Generated</p>
          <p className="h2 mt-2">{election ? election.summary.tokens_generated.toLocaleString() : "0"}</p>
        </Card>
        <Card>
          <p className="small text-[var(--muted-text)]">Used</p>
          <p className="h2 mt-2">{election ? election.summary.tokens_used.toLocaleString() : "0"}</p>
        </Card>
        <Card>
          <p className="small text-[var(--muted-text)]">Turnout</p>
          <p className="h2 mt-2">{election?.summary.turnout_percentage ?? 0}%</p>
        </Card>
        <Card>
          <p className="small text-[var(--muted-text)]">Ballots</p>
          <p className="h2 mt-2">{election ? election.summary.ballots_submitted.toLocaleString() : "0"}</p>
        </Card>
      </div>
      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="h3">Turnout Trend</h2>
          <div className="flex items-center gap-2">
            <Link href={`/org/elections/${electionId}/monitor`}>
              <Button variant="secondary">Open monitor</Button>
            </Link>
            {canDelete ? (
              <Button
                variant="danger"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={!canDeleteByStatus || deleteMutation.isPending}
              >
                Delete election
              </Button>
            ) : null}
          </div>
        </div>
        <TurnoutChart data={(election?.turnout_series ?? []).map((item) => ({ day: String(item.day), count: item.count }))} />
        {canDelete && !canDeleteByStatus ? (
          <p className="small mt-3 text-[var(--muted-text)]">Only non-active elections (not LIVE/SCHEDULED) can be deleted.</p>
        ) : null}
      </Card>
    </PageScaffold>
  );
}
