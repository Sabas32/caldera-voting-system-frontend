"use client";

import { toPng } from "html-to-image";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { ResultsBarChart } from "@/components/charts/ResultsBarChart";
import { PageScaffold } from "@/components/layout/PageScaffold";
import { ResultsCandidatesTable } from "@/components/tables/ResultsCandidatesTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TabsList, TabsRoot, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/apiClient";
import { downloadFile } from "@/lib/downloads";
import { endpoints } from "@/lib/endpoints";
import { useOrgContext } from "@/lib/useOrgContext";

type ResultsResponse = {
  data: {
    posts: Array<{
      post_id: string;
      post_title: string;
      tie_detected: boolean;
      candidates: Array<{ name: string; votes: number; percentage: number; is_tied_leader: boolean }>;
    }>;
  };
};

type ElectionDetail = {
  data: {
    publish_results: boolean;
    status: string;
    results_visibility: "HIDDEN_UNTIL_CLOSED" | "LIVE_ALLOWED";
  };
};

export default function ElectionResultsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { activeMembership } = useOrgContext();
  const queryClient = useQueryClient();
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [nextPublishState, setNextPublishState] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "charts" | "table">("split");

  const electionQuery = useQuery({
    queryKey: ["org-election-results-meta", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<ElectionDetail>(endpoints.org.electionDetail(electionId)),
  });

  const canFetchResults =
    electionQuery.data?.data.results_visibility === "LIVE_ALLOWED"
      ? ["LIVE", "CLOSED", "ARCHIVED"].includes(electionQuery.data?.data.status ?? "")
      : ["CLOSED", "ARCHIVED"].includes(electionQuery.data?.data.status ?? "");

  const resultsQuery = useQuery({
    queryKey: ["org-election-results", electionId],
    enabled: Boolean(electionId && electionQuery.data && canFetchResults),
    queryFn: () => apiClient<ResultsResponse>(endpoints.org.results(electionId)),
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) =>
      apiClient(endpoints.org.publishResults(electionId), {
        method: "POST",
        body: JSON.stringify({ publish }),
      }),
    onSuccess: () => {
      toast.success("Results visibility updated");
      queryClient.invalidateQueries({ queryKey: ["org-election-results-meta", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const downloadPng = async (postId: string) => {
    const node = document.getElementById(`results-chart-${postId}`);
    if (!node) {
      return;
    }
    const url = await toPng(node);
    const link = document.createElement("a");
    link.href = url;
    link.download = `results-${postId}.png`;
    link.click();
  };

  const canTogglePublish = ["CLOSED", "ARCHIVED"].includes(electionQuery.data?.data.status ?? "");
  const canPublish = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";
  const isPublishing = publishMutation.isPending;

  return (
    <PageScaffold
      title="Results"
      subtitle="Visibility and publication controls"
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "Results" },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          {canPublish ? (
            <Button
              variant="secondary"
              onClick={() => {
                const publish = !(electionQuery.data?.data.publish_results ?? false);
                setNextPublishState(publish);
                setPublishConfirmOpen(true);
              }}
              disabled={!canTogglePublish || publishMutation.isPending}
            >
              {electionQuery.data?.data.publish_results ? "Unpublish" : "Publish"}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            disabled={!canFetchResults}
            onClick={() => downloadFile({ path: endpoints.org.exportExcel(electionId), filename: `election-${electionId}.xlsx` })}
          >
            Export Excel
          </Button>
        </div>
      }
    >
      <ConfirmDialog
        open={publishConfirmOpen}
        onOpenChange={(open) => {
          setPublishConfirmOpen(open);
          if (!open) {
            setNextPublishState(null);
          }
        }}
        title={nextPublishState ? "Publish Results" : "Unpublish Results"}
        description={
          nextPublishState
            ? "Publish results publicly for eligible viewers?"
            : "Unpublish results and hide them from public viewers?"
        }
        confirmLabel={nextPublishState ? "Publish" : "Unpublish"}
        confirmVariant="secondary"
        confirmPending={isPublishing}
        onConfirm={() => {
          if (typeof nextPublishState !== "boolean") {
            return;
          }
          publishMutation.mutate(nextPublishState, {
            onSuccess: () => {
              setPublishConfirmOpen(false);
              setNextPublishState(null);
            },
          });
        }}
      />
      {!canFetchResults ? (
        <Card>
          <p className="small text-[var(--muted-text)]">
            Results are not currently visible for this election. Close the election or update results visibility rules.
          </p>
        </Card>
      ) : resultsQuery.isError ? (
        <Card>
          <p className="small text-[var(--muted-text)]">
            Results are not currently visible for this election. Close the election or change `results_visibility`.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="h3">Results View</h2>
              <p className="small text-[var(--muted-text)]">Switch between graphical and tabular analysis.</p>
            </div>
            <TabsRoot value={viewMode} onValueChange={(value) => setViewMode(value as "split" | "charts" | "table")}>
              <TabsList>
                <TabsTrigger value="split">Split</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </TabsRoot>
          </Card>
          {(resultsQuery.data?.data.posts ?? []).map((post) => (
            <Card key={post.post_id}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="h3">{post.post_title}</h2>
                  {post.tie_detected ? <p className="small text-[var(--warning)]">Tie detected among top candidates.</p> : null}
                </div>
                {viewMode !== "table" ? (
                  <Button variant="secondary" onClick={() => downloadPng(post.post_id)}>
                    Download PNG
                  </Button>
                ) : null}
              </div>
              <div className={viewMode === "split" ? "grid gap-4 xl:grid-cols-2" : ""}>
                {viewMode !== "table" ? (
                  <div id={`results-chart-${post.post_id}`}>
                    <ResultsBarChart data={post.candidates.map((candidate) => ({ name: candidate.name, votes: candidate.votes }))} />
                  </div>
                ) : null}
                {viewMode !== "charts" ? (
                  <ResultsCandidatesTable candidates={post.candidates} tieDetected={post.tie_detected} />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
