"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride } from "@/lib/brandTheme";
import { endpoints } from "@/lib/endpoints";
import { getInitials } from "@/lib/utils";
import { setVoterOrganizationNameForElection, setVoterPrimaryColorForElection } from "@/lib/voterAutoLogout";

type BallotResponse = {
  data: {
    election: { title: string; slug: string; organization_name: string; instructions: string; primary_color_override: string | null };
    posts: Array<{
      id: string;
      title: string;
      max_selections: number;
      allow_abstain: boolean;
      candidates: Array<{ id: string; name: string; description: string }>;
    }>;
  };
};

type SelectionState = Record<string, { candidate_ids: string[]; abstain: boolean }>;

export default function BallotPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [selected, setSelected] = useState<SelectionState>({});

  const ballotQuery = useQuery({
    queryKey: ["ballot", slug],
    enabled: Boolean(slug),
    queryFn: () => apiClient<BallotResponse>(endpoints.vote.ballot(slug)),
  });

  const posts = useMemo(() => ballotQuery.data?.data.posts ?? [], [ballotQuery.data]);
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

  const completedPosts = useMemo(
    () =>
      posts.filter((post) => {
        const values = selected[post.id] ?? { candidate_ids: [], abstain: false };
        if (values.abstain) {
          return post.allow_abstain;
        }
        return values.candidate_ids.length > 0 && values.candidate_ids.length <= post.max_selections;
      }).length,
    [posts, selected],
  );

  const isValid = posts.length > 0 && completedPosts === posts.length;
  const progress = posts.length ? Math.round((completedPosts / posts.length) * 100) : 0;

  if (ballotQuery.isLoading) {
    return <Card>Loading ballot...</Card>;
  }

  if (ballotQuery.isError || !ballotQuery.data) {
    const message = ballotQuery.error instanceof ApiError ? ballotQuery.error.message : "Unable to load ballot.";
    return (
      <Card>
        <p className="small text-[var(--muted-text)]">{message}</p>
        <Link href="/vote" className="small mt-3 inline-block text-[var(--info)]">
          Back to token login
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_32%,transparent),transparent_70%)]" />
          <div className="relative">
            <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Election ballot</p>
            <h1 className="h2 mt-1">{ballotQuery.data.data.election.title}</h1>
            <p className="small mt-2 text-[var(--muted-text)]">Select candidates per post, then review and submit.</p>
            <div className="mt-4 h-2 rounded-full bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))]">
              <div className="h-2 rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-700))] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </Card>

        {posts.map((post, index) => {
          const values = selected[post.id] ?? { candidate_ids: [], abstain: false };
          const selectedCount = values.abstain ? 0 : values.candidate_ids.length;

          return (
            <Reveal key={post.id} delay={index * 0.03}>
              <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="tiny uppercase tracking-[0.1em] text-[var(--muted-text)]">Post {index + 1}</p>
                    <h2 className="h3">{post.title}</h2>
                  </div>
                  <span className="small rounded-full border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] px-3 py-1 text-[var(--muted-text)]">
                    {values.abstain ? "Skipped this position" : `${selectedCount}/${post.max_selections} selected`}
                  </span>
                </div>

                {post.allow_abstain ? (
                  <label className="small mb-4 inline-flex items-center gap-2 rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={values.abstain}
                      onChange={(event) =>
                        setSelected((prev) => ({
                          ...prev,
                          [post.id]: {
                            candidate_ids: [],
                            abstain: event.target.checked,
                          },
                        }))
                      }
                    />
                    Skip this position
                  </label>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  {post.candidates.map((candidate) => {
                    const active = values.candidate_ids.includes(candidate.id);
                    const initials = getInitials(candidate.name);

                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        className={`group rounded-[14px] border p-3 text-left transition ${
                          active
                            ? "border-[color-mix(in_oklab,var(--primary)_72%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_20%,var(--surface))]"
                            : "border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] hover:bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))]"
                        } ${values.abstain ? "opacity-55" : ""}`}
                        onClick={() => {
                          if (values.abstain) {
                            toast.error("Uncheck 'Skip this position' before selecting candidates");
                            return;
                          }

                          setSelected((prev) => {
                            const current = prev[post.id]?.candidate_ids ?? [];
                            const exists = current.includes(candidate.id);
                            let next = current;

                            if (exists) {
                              next = current.filter((id) => id !== candidate.id);
                            } else if (current.length < post.max_selections) {
                              next = [...current, candidate.id];
                            } else {
                              toast.error("Selection limit reached for this post");
                            }

                            return { ...prev, [post.id]: { candidate_ids: next, abstain: false } };
                          });
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] text-sm font-semibold tracking-[0.03em] text-[var(--text)]">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{candidate.name}</p>
                              {active ? <CheckCircle2 className="size-4 text-[var(--primary-700)]" /> : <Circle className="size-4 text-[var(--muted-text)]" />}
                            </div>
                            <p className="small mt-1 text-[var(--muted-text)]">{candidate.description || "No description provided."}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <Card>
          <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Progress</p>
          <p className="h3 mt-1">
            {completedPosts}/{posts.length} posts complete
          </p>
          <p className="small mt-2 text-[var(--muted-text)]">Complete each post selection before continuing to review.</p>
          {ballotQuery.data.data.election.instructions ? (
            <div className="mt-4 rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] p-3">
              <p className="tiny uppercase tracking-[0.1em] text-[var(--muted-text)]">Instructions</p>
              <p className="small mt-1 text-[var(--text)]">{ballotQuery.data.data.election.instructions}</p>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => router.push("/vote")}>Cancel session</Button>
            <Button
              onClick={() => {
                if (!isValid) {
                  toast.error("Complete all posts before review");
                  return;
                }
                sessionStorage.setItem(`ballot:${slug}`, JSON.stringify(selected));
                router.push(`/e/${slug}/review`);
              }}
            >
              Continue to review
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
