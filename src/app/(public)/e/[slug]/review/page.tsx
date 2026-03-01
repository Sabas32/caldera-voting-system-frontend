"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride } from "@/lib/brandTheme";
import { endpoints } from "@/lib/endpoints";
import { setVoterOrganizationNameForElection, setVoterPrimaryColorForElection } from "@/lib/voterAutoLogout";

type StoredSelection = Record<string, { candidate_ids: string[]; abstain: boolean }>;
type BallotResponse = {
  data: {
    election: { slug: string; organization_name: string; primary_color_override: string | null };
    posts: Array<{
      id: string;
      title: string;
      max_selections: number;
      allow_abstain: boolean;
      candidates: Array<{ id: string; name: string }>;
    }>;
  };
};

export default function ReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const selections = useMemo<StoredSelection>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    return JSON.parse(sessionStorage.getItem(`ballot:${slug}`) ?? "{}");
  }, [slug]);

  const ballotQuery = useQuery({
    queryKey: ["review-ballot", slug],
    enabled: Boolean(slug),
    queryFn: () => apiClient<BallotResponse>(endpoints.vote.ballot(slug)),
    retry: false,
  });
  const electionSlug = ballotQuery.data?.data.election.slug ?? null;
  const electionPrimaryColorOverride = ballotQuery.data?.data.election.primary_color_override ?? null;

  useEffect(() => {
    if (!electionSlug) {
      return;
    }
    setVoterPrimaryColorForElection(electionSlug, electionPrimaryColorOverride);
    setVoterOrganizationNameForElection(electionSlug, ballotQuery.data?.data.election.organization_name ?? null);
    applyPrimaryColorOverride(electionPrimaryColorOverride);
  }, [ballotQuery.data?.data.election.organization_name, electionPrimaryColorOverride, electionSlug]);

  const totalSelections = useMemo(
    () => Object.values(selections).reduce((total, item) => total + (item.abstain ? 0 : item.candidate_ids.length), 0),
    [selections],
  );

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = {
        selections: Object.entries(selections).map(([post_id, value]) => ({
          post_id,
          candidate_ids: value.candidate_ids,
          abstain: value.abstain,
        })),
      };
      return apiClient<{ data: { redirect: string } }>(endpoints.vote.submit(slug), {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (response) => {
      toast.success("Ballot submitted");
      router.push(response.data.redirect === "/vote" ? "/vote" : `/e/${slug}/status`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_32%,transparent),transparent_70%)]" />
          <div className="relative">
            <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Final step</p>
            <h1 className="h2 mt-1">Review your ballot</h1>
            <p className="small mt-2 text-[var(--muted-text)]">Verify each selected candidate below before final submission.</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            {Object.keys(selections).length === 0 ? <p className="small text-[var(--muted-text)]">No selections found. Go back and choose candidates first.</p> : null}

            {(ballotQuery.data?.data.posts ?? []).map((post) => {
              const value = selections[post.id] ?? { candidate_ids: [], abstain: false };
              const selectedIds = new Set(value.candidate_ids);

              return (
                <div key={post.id} className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{post.title}</p>
                    <span className="small rounded-full border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] px-2.5 py-1 text-[var(--muted-text)]">
                      {value.abstain ? "Skipped this position" : `${selectedIds.size}/${post.max_selections} selected`}
                    </span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {post.candidates.map((candidate) => {
                      const isSelected = selectedIds.has(candidate.id);
                      return (
                        <div
                          key={candidate.id}
                          className={`small flex items-center justify-between gap-2 rounded-[10px] border px-3 py-2 ${
                            isSelected
                              ? "border-[color-mix(in_oklab,var(--primary)_62%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_20%,var(--surface))] text-[var(--text)]"
                              : "border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] text-[var(--muted-text)]"
                          } ${value.abstain ? "opacity-65" : ""}`}
                        >
                          <span className="truncate">{candidate.name}</span>
                          {isSelected ? (
                            <CheckCircle2 className="size-4 shrink-0 text-[var(--primary-700)]" />
                          ) : (
                            <Circle className="size-4 shrink-0 text-[var(--muted-text)]" />
                          )}
                        </div>
                      );
                    })}
                    {post.candidates.length === 0 ? (
                      <p className="small text-[var(--muted-text)]">No candidates available for this post.</p>
                    ) : null}
                  </div>
                  {!value.abstain && selectedIds.size === 0 ? (
                    <p className="small mt-2 text-[var(--muted-text)]">No candidate selected for this post.</p>
                  ) : null}
                  {value.abstain && post.allow_abstain ? (
                    <p className="small mt-2 text-[var(--muted-text)]">You chose to skip this position.</p>
                  ) : null}
                  {value.abstain && !post.allow_abstain ? (
                    <p className="small mt-2 text-[var(--danger)]">Skipping this position is not allowed for this post.</p>
                  ) : null}
                  {selectedIds.size > post.max_selections ? (
                    <p className="small mt-2 text-[var(--danger)]">Selection exceeds allowed maximum for this post.</p>
                  ) : null}
                </div>
              );
            })}

            {(ballotQuery.data?.data.posts ?? []).length === 0 ? (
              <div className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-4">
                <p className="small text-[var(--muted-text)]">No posts available to review.</p>
              </div>
            ) : null}

            {Object.keys(selections)
              .filter((postId) => !(ballotQuery.data?.data.posts ?? []).some((post) => post.id === postId))
              .map((stalePostId) => (
                <div key={stalePostId} className="rounded-[14px] border border-[color-mix(in_oklab,var(--warning)_55%,var(--edge))] bg-[color-mix(in_oklab,var(--warning)_10%,var(--surface))] p-4">
                  <p className="small text-[var(--text)]">Saved selection for a removed post was detected.</p>
                  <p className="tiny mt-1 text-[var(--muted-text)]">Post ID: {stalePostId}</p>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <Card>
          <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Summary</p>
          <p className="h3 mt-1">{Object.keys(selections).length} posts reviewed</p>
          <p className="small mt-1 text-[var(--muted-text)]">{totalSelections} candidate selections</p>
          <div className="mt-4 rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 text-[var(--primary-700)]" />
              <p className="small text-[var(--muted-text)]">Submission is final. You cannot edit choices after submitting.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Back to ballot
            </Button>
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit ballot"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
