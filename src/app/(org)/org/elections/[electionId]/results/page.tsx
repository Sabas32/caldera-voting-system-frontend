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
import { Select } from "@/components/ui/select";
import { TabsList, TabsRoot, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/apiClient";
import { downloadFile } from "@/lib/downloads";
import { endpoints } from "@/lib/endpoints";
import { useOrgContext } from "@/lib/useOrgContext";

type ResultsResponse = {
  data: {
    available_segments: Array<{ key: string; values: string[] }>;
    filters: Record<string, string>;
    group_by: string[];
    breakdowns: Array<{
      group: Record<string, string>;
      ballots_submitted: number;
      posts: Array<{
        post_id: string;
        post_title: string;
        tie_detected: boolean;
        candidates: Array<{ name: string; image_url?: string; votes: number; percentage: number; is_tied_leader: boolean }>;
      }>;
    }>;
    posts: Array<{
      post_id: string;
      post_title: string;
      tie_detected: boolean;
      candidates: Array<{ name: string; image_url?: string; votes: number; percentage: number; is_tied_leader: boolean }>;
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
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [groupBy, setGroupBy] = useState("");

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
    queryKey: ["org-election-results", electionId, filterValues, groupBy],
    enabled: Boolean(electionId && electionQuery.data && canFetchResults),
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filterValues).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });
      if (groupBy) {
        params.set("group_by", groupBy);
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return apiClient<ResultsResponse>(`${endpoints.org.results(electionId)}${suffix}`);
    },
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
  const availableSegments = resultsQuery.data?.data.available_segments ?? [];
  const activeBreakdowns = resultsQuery.data?.data.breakdowns ?? [];
  const resultQuerySuffix = () => {
    const params = new URLSearchParams();
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    if (groupBy) {
      params.set("group_by", groupBy);
    }
    return params.toString() ? `?${params.toString()}` : "";
  };

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
            onClick={() => downloadFile({ path: `${endpoints.org.exportExcel(electionId)}${resultQuerySuffix()}`, filename: `election-${electionId}.xlsx` })}
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
          <Card className="space-y-4">
            <div>
              <h2 className="h3">Category Filters</h2>
              <p className="small mt-1 text-[var(--muted-text)]">
                Filter or split results using categories attached to voter tokens.
              </p>
            </div>
            {availableSegments.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {availableSegments.map((segment) => (
                  <div key={segment.key} className="space-y-2">
                    <label className="small text-[var(--muted-text)]">{segment.key}</label>
                    <Select
                      value={filterValues[segment.key] ?? ""}
                      onChange={(event) => setFilterValues((prev) => ({ ...prev, [segment.key]: event.target.value }))}
                    >
                      <option value="">All {segment.key}</option>
                      {segment.values.map((value) => (
                        <option key={`${segment.key}-${value}`} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
                <div className="space-y-2">
                  <label className="small text-[var(--muted-text)]">Breakdown by</label>
                  <Select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                    <option value="">No breakdown</option>
                    {availableSegments.map((segment) => (
                      <option key={segment.key} value={segment.key}>
                        {segment.key}
                      </option>
                    ))}
                    {availableSegments.length > 1 ? (
                      <option value={availableSegments.map((segment) => segment.key).join(",")}>All categories</option>
                    ) : null}
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setFilterValues({});
                      setGroupBy("");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            ) : (
              <p className="small text-[var(--muted-text)]">No token categories have been configured for this election yet.</p>
            )}
          </Card>
          {activeBreakdowns.length ? (
            <Card className="space-y-3">
              <div>
                <h2 className="h3">Grouped Breakdown</h2>
                <p className="small mt-1 text-[var(--muted-text)]">Export Excel includes this breakdown in a separate sheet.</p>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {activeBreakdowns.map((breakdown, index) => (
                  <div key={index} className="rounded-[14px] border border-[var(--edge)] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="small font-medium">
                        {Object.entries(breakdown.group)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" / ")}
                      </p>
                      <span className="tiny text-[var(--muted-text)]">{breakdown.ballots_submitted} ballots</span>
                    </div>
                    <div className="space-y-2">
                      {breakdown.posts.map((post) => (
                        <div key={`${index}-${post.post_id}`} className="rounded-[12px] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] p-2">
                          <p className="tiny uppercase tracking-[0.08em] text-[var(--muted-text)]">{post.post_title}</p>
                          <div className="mt-1 space-y-1">
                            {post.candidates.map((candidate) => (
                              <div key={`${index}-${post.post_id}-${candidate.name}`} className="flex items-center justify-between gap-3 text-sm">
                                <span>{candidate.name}</span>
                                <span className="font-medium">{candidate.votes}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
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
                  <div id={`results-chart-${post.post_id}`} className="space-y-3">
                    <ResultsBarChart data={post.candidates.map((candidate) => ({ name: candidate.name, votes: candidate.votes }))} />
                    <div className="flex flex-wrap gap-2">
                      {post.candidates.map((candidate, index) => (
                        <div
                          key={`${post.post_id}-${candidate.name}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] px-2.5 py-1"
                        >
                          <span className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[var(--edge)] bg-[var(--surface)] text-[9px] font-semibold text-[var(--muted-text)]">
                            {candidate.image_url ? (
                              <img
                                src={candidate.image_url}
                                alt={candidate.name}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                  const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                                  if (fallback) {
                                    fallback.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <span className={candidate.image_url ? "hidden h-full w-full items-center justify-center" : "flex h-full w-full items-center justify-center"}>
                              {candidate.name
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() ?? "")
                                .join("") || "NA"}
                            </span>
                          </span>
                          <span className="small">{candidate.name}</span>
                        </div>
                      ))}
                    </div>
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
