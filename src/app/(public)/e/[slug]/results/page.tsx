"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, LayoutPanelTop, Rows3, Trophy, Users, Vote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { ResultsBarChart } from "@/components/charts/ResultsBarChart";
import { ResultsCandidatesTable } from "@/components/tables/ResultsCandidatesTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride, getPrimaryColorVariables } from "@/lib/brandTheme";
import { setVoterOrganizationNameForElection, setVoterPrimaryColorForElection } from "@/lib/voterAutoLogout";

type CandidateResult = {
  candidate_id: string;
  name: string;
  votes: number;
  percentage: number;
  is_tied_leader: boolean;
};

type PostResult = {
  post_id: string;
  post_title: string;
  tie_detected: boolean;
  candidates: CandidateResult[];
};

type PublicResultsResponse = {
  data: {
    election: {
      id: string;
      title: string;
      slug: string;
      organization_name: string;
      status: string;
      publish_results: boolean;
      public_results_enabled: boolean;
      primary_color_override: string | null;
    };
    ballots_submitted: number;
    posts: PostResult[];
  };
};

function PostResultsPanel({
  post,
  mode,
}: {
  post: PostResult;
  mode: "split" | "chart" | "table";
}) {
  const totalVotes = post.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="h3">{post.post_title}</h2>
          <p className="small mt-1 text-[var(--muted-text)]">
            {post.candidates.length} candidates | {totalVotes.toLocaleString()} total votes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {post.tie_detected ? (
            <Badge className="border-[color-mix(in_oklab,var(--warning)_55%,var(--edge))]">Tie detected</Badge>
          ) : (
            <Badge className="border-[color-mix(in_oklab,var(--success)_55%,var(--edge))]">Clear leader</Badge>
          )}
        </div>
      </div>

      <div className={mode === "split" ? "grid gap-4 xl:grid-cols-2" : ""}>
        {mode !== "table" ? (
          <ResultsBarChart data={post.candidates.map((item) => ({ name: item.name, votes: item.votes }))} />
        ) : null}
        {mode !== "chart" ? <ResultsCandidatesTable candidates={post.candidates} tieDetected={post.tie_detected} /> : null}
      </div>
    </Card>
  );
}

export default function PublicResultsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [layoutMode, setLayoutMode] = useState<"split" | "individual">("split");
  const [individualMode, setIndividualMode] = useState<"split" | "chart" | "table">("split");
  const [activePostIdOverride, setActivePostIdOverride] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["public-results", slug],
    enabled: Boolean(slug),
    queryFn: () => apiClient<PublicResultsResponse>(`/vote/elections/${slug}/results/`),
  });

  const electionSlug = query.data?.data.election.slug ?? null;
  const electionPrimaryColorOverride = query.data?.data.election.primary_color_override ?? null;
  const localThemeVars = useMemo(() => getPrimaryColorVariables(electionPrimaryColorOverride), [electionPrimaryColorOverride]);

  useEffect(() => {
    if (!electionSlug) {
      return;
    }
    setVoterPrimaryColorForElection(electionSlug, electionPrimaryColorOverride);
    setVoterOrganizationNameForElection(electionSlug, query.data?.data.election.organization_name ?? null);
    applyPrimaryColorOverride(electionPrimaryColorOverride);
  }, [electionPrimaryColorOverride, electionSlug, query.data?.data.election.organization_name]);

  if (query.isLoading) {
    return <Card>Loading results...</Card>;
  }

  if (query.isError || !query.data) {
    return <Card>Results are not available for this election at this time.</Card>;
  }

  const election = query.data.data.election;
  const posts = query.data.data.posts;
  const ballotsSubmitted = query.data.data.ballots_submitted;
  const totalVotesAcrossPosts = posts.reduce(
    (sum, post) => sum + post.candidates.reduce((postSum, candidate) => postSum + candidate.votes, 0),
    0,
  );
  const tiePostsCount = posts.filter((post) => post.tie_detected).length;

  const activePostId = !posts.length
    ? null
    : activePostIdOverride && posts.some((post) => post.post_id === activePostIdOverride)
      ? activePostIdOverride
      : posts[0].post_id;

  const activePostIndex = activePostId ? posts.findIndex((post) => post.post_id === activePostId) : -1;
  const activePost = activePostIndex >= 0 ? posts[activePostIndex] : null;
  const layoutSegmentButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-medium transition-all duration-200";
  const subviewSegmentButtonClass =
    "inline-flex h-9 items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all duration-200";

  return (
    <div className="space-y-4" style={localThemeVars ?? undefined}>
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,var(--primary),transparent_65%)] opacity-20" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--info)_50%,transparent),transparent_65%)] opacity-25" />
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="h2">{election.title}</h1>
                <p className="small mt-1 text-[var(--muted-text)]">Voter results dashboard with graphical and tabular breakdown.</p>
              </div>
              <Badge className="border-[color-mix(in_oklab,var(--primary)_55%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_16%,var(--surface))] text-[var(--text)]">
                {election.status}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">Posts</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Vote className="size-4 text-[var(--primary-700)]" />
                  {posts.length.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">Ballots Counted</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Users className="size-4 text-[var(--primary-700)]" />
                  {ballotsSubmitted.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">Total Votes Cast</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <BarChart3 className="size-4 text-[var(--primary-700)]" />
                  {totalVotesAcrossPosts.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">Tied Posts</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Trophy className="size-4 text-[var(--primary-700)]" />
                  {tiePostsCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="h3">View Options</h2>
            <p className="small text-[var(--muted-text)]">Switch between split overview and individual post analysis.</p>
          </div>
          <div className="inline-flex rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] p-1 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--surface)_82%,transparent)]">
            <button
              type="button"
              onClick={() => setLayoutMode("split")}
              className={`${layoutSegmentButtonClass} ${
                layoutMode === "split"
                  ? "border border-[color-mix(in_oklab,var(--primary)_62%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_16%,var(--surface))] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                  : "text-[var(--muted-text)] hover:bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] hover:text-[var(--text)]"
              }`}
            >
              <LayoutPanelTop className="size-4" />
              Split view
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("individual")}
              className={`${layoutSegmentButtonClass} ${
                layoutMode === "individual"
                  ? "border border-[color-mix(in_oklab,var(--primary)_62%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_16%,var(--surface))] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                  : "text-[var(--muted-text)] hover:bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] hover:text-[var(--text)]"
              }`}
            >
              <Rows3 className="size-4" />
              Individual
            </button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] p-4">
            <p className="small text-[var(--muted-text)]">No published candidate results are available for this election yet.</p>
          </div>
        ) : null}

        {layoutMode === "split" ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostResultsPanel key={post.post_id} post={post} mode="split" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="space-y-2">
                <label className="small text-[var(--muted-text)]">Select post</label>
                <Select value={activePostId ?? undefined} onChange={(event) => setActivePostIdOverride(event.target.value)}>
                  {posts.map((post) => (
                    <option key={post.post_id} value={post.post_id}>
                      {post.post_title}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (!posts.length || activePostIndex < 0) {
                      return;
                    }
                    const previousIndex = activePostIndex === 0 ? posts.length - 1 : activePostIndex - 1;
                    setActivePostIdOverride(posts[previousIndex].post_id);
                  }}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (!posts.length || activePostIndex < 0) {
                      return;
                    }
                    const nextIndex = activePostIndex === posts.length - 1 ? 0 : activePostIndex + 1;
                    setActivePostIdOverride(posts[nextIndex].post_id);
                  }}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <div className="flex items-end">
                <div className="inline-flex rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] p-1 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--surface)_82%,transparent)]">
                  <button
                    type="button"
                    onClick={() => setIndividualMode("split")}
                    className={`${subviewSegmentButtonClass} ${
                      individualMode === "split"
                        ? "border border-[color-mix(in_oklab,var(--primary)_62%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_16%,var(--surface))] text-[var(--text)] shadow-[0_6px_14px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] hover:text-[var(--text)]"
                    }`}
                  >
                    Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndividualMode("chart")}
                    className={`${subviewSegmentButtonClass} ${
                      individualMode === "chart"
                        ? "border border-[color-mix(in_oklab,var(--primary)_62%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_16%,var(--surface))] text-[var(--text)] shadow-[0_6px_14px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] hover:text-[var(--text)]"
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndividualMode("table")}
                    className={`${subviewSegmentButtonClass} ${
                      individualMode === "table"
                        ? "border border-[color-mix(in_oklab,var(--primary)_62%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_16%,var(--surface))] text-[var(--text)] shadow-[0_6px_14px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] hover:text-[var(--text)]"
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            {activePost ? (
              <PostResultsPanel post={activePost} mode={individualMode} />
            ) : (
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] p-4">
                <p className="small text-[var(--muted-text)]">No post selected.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
