"use client";

import { useState } from "react";
import { CalendarClock, Eye, ListChecks, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DurationPicker } from "@/components/forms/DurationPicker";
import { PageScaffold } from "@/components/layout/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apiClient";
import { secondsToDurationParts } from "@/lib/duration";
import { endpoints } from "@/lib/endpoints";
import { useOrgContext } from "@/lib/useOrgContext";

type ElectionDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED" | "ARCHIVED";
  opens_at: string | null;
  closes_at: string | null;
  results_visibility: "HIDDEN_UNTIL_CLOSED" | "LIVE_ALLOWED";
  public_results_enabled: boolean;
  publish_results: boolean;
  post_vote_access_mode: "READ_ONLY_AFTER_VOTE" | "FULLY_BLOCK_AFTER_VOTE";
  ballot_instructions: string;
  voter_auto_logout_seconds: number;
  voter_results_after_vote_enabled: boolean;
  voter_results_window_starts_at: string | null;
  voter_results_window_ends_at: string | null;
};

type PostPreview = {
  id: string;
  title: string;
  max_selections: number;
  allow_abstain: boolean;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return format(date, "PPP p");
}

const textareaClassName =
  "w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] px-3 py-2 text-sm text-[var(--text)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--surface)_82%,transparent)] outline-none transition-all duration-200 placeholder:text-[color-mix(in_oklab,var(--muted-text)_65%,transparent)] hover:border-[color-mix(in_oklab,var(--border)_55%,var(--primary))] focus-visible:border-[color-mix(in_oklab,var(--primary)_70%,var(--border))] focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export default function ElectionSetupPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { activeMembership } = useOrgContext();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<ElectionDetail>>({});
  const [resultsWindowModeOverride, setResultsWindowModeOverride] = useState<"ALWAYS_OPEN" | "TIME_WINDOW" | null>(null);

  const electionQuery = useQuery({
    queryKey: ["org-election-setup", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<{ data: ElectionDetail }>(endpoints.org.electionDetail(electionId)),
  });

  const postsQuery = useQuery({
    queryKey: ["org-election-posts-preview", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<{ data: PostPreview[] }>(endpoints.org.posts(electionId)),
  });

  const form = electionQuery.data?.data ? { ...electionQuery.data.data, ...draft } : null;
  const hasWindowConfigured = Boolean(form?.voter_results_window_starts_at) || Boolean(form?.voter_results_window_ends_at);
  const resultsWindowMode = resultsWindowModeOverride ?? (hasWindowConfigured ? "TIME_WINDOW" : "ALWAYS_OPEN");

  const logoutParts = secondsToDurationParts(form?.voter_auto_logout_seconds ?? 60);
  const hasDraftChanges = Object.keys(draft).length > 0;
  const canManage = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";

  const scheduleLabel = form ? `${formatDateTime(form.opens_at)} to ${formatDateTime(form.closes_at)}` : "Loading schedule";
  const isPublicResultsLive = Boolean(
    form &&
      ["CLOSED", "ARCHIVED"].includes(form.status) &&
      form.public_results_enabled &&
      form.publish_results,
  );
  const publicResultsStatusHint = !form
    ? "Loading..."
    : !form.public_results_enabled
      ? "Public results URL is disabled."
      : !form.publish_results
        ? "Results are not published yet. Use the Results page to publish."
        : !["CLOSED", "ARCHIVED"].includes(form.status)
          ? "Election must be Closed or Archived."
          : "Public viewers can access published results.";

  const mutation = useMutation({
    mutationFn: () =>
      apiClient(endpoints.org.electionDetail(electionId), {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          opens_at: form?.opens_at ? new Date(form.opens_at).toISOString() : null,
          closes_at: form?.closes_at ? new Date(form.closes_at).toISOString() : null,
          voter_results_window_starts_at:
            resultsWindowMode === "TIME_WINDOW" && form?.voter_results_window_starts_at
            ? new Date(form.voter_results_window_starts_at).toISOString()
            : null,
          voter_results_window_ends_at:
            resultsWindowMode === "TIME_WINDOW" && form?.voter_results_window_ends_at
            ? new Date(form.voter_results_window_ends_at).toISOString()
            : null,
        }),
      }),
    onSuccess: () => {
      toast.success("Election setup saved");
      setDraft({});
      setResultsWindowModeOverride(null);
      queryClient.invalidateQueries({ queryKey: ["org-election-setup", electionId] });
      queryClient.invalidateQueries({ queryKey: ["org-election-detail", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageScaffold
      title="Election Setup"
      subtitle={`Election ID: ${electionId ?? ""}`}
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "Setup" },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDraft({});
              setResultsWindowModeOverride(null);
              toast.success("Unsaved changes discarded");
            }}
            disabled={!hasDraftChanges || mutation.isPending}
          >
            <RotateCcw className="size-4" />
            Discard
          </Button>
          <Button
            form="election-setup-form"
            type="submit"
            disabled={mutation.isPending || !canManage || !form}
          >
            <Save className="size-4" />
            {mutation.isPending ? "Saving..." : "Save setup"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <Card>
          {!form ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <form
              id="election-setup-form"
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <section className="space-y-3 rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] p-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-[var(--primary-700)]" />
                  <h2 className="h3">Core Details</h2>
                </div>
                <p className="small text-[var(--muted-text)]">Define election identity and what voters see before submitting.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="small text-[var(--muted-text)]">Election title</label>
                    <Input
                      value={form.title}
                      onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Student Council 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Slug</label>
                    <Input
                      value={form.slug}
                      onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))}
                      placeholder="student-council-2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Status</label>
                    <div className="flex h-10 items-center rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] px-3">
                      <Badge>{form.status}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="small text-[var(--muted-text)]">Description</label>
                    <textarea
                      value={form.description ?? ""}
                      onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                      className={textareaClassName}
                      rows={3}
                      placeholder="Optional election context for administrators."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="small text-[var(--muted-text)]">Ballot instructions</label>
                    <textarea
                      value={form.ballot_instructions ?? ""}
                      onChange={(event) => setDraft((prev) => ({ ...prev, ballot_instructions: event.target.value }))}
                      className={textareaClassName}
                      rows={3}
                      placeholder="Optional voter guidance before they start selecting candidates."
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-[var(--primary-700)]" />
                  <h2 className="h3">Schedule</h2>
                </div>
                <p className="small text-[var(--muted-text)]">Set the exact voting window. Scheduled elections open automatically.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Opens at</label>
                    <Input
                      type="datetime-local"
                      value={form.opens_at ? form.opens_at.slice(0, 16) : ""}
                      onChange={(event) => setDraft((prev) => ({ ...prev, opens_at: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Closes at</label>
                    <Input
                      type="datetime-local"
                      value={form.closes_at ? form.closes_at.slice(0, 16) : ""}
                      onChange={(event) => setDraft((prev) => ({ ...prev, closes_at: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] p-3">
                  <p className="small font-medium">Voting window</p>
                  <p className="small mt-1 text-[var(--muted-text)]">{scheduleLabel}</p>
                </div>
              </section>

              <section className="space-y-3 rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] p-4">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-[var(--primary-700)]" />
                  <h2 className="h3">Results & Access</h2>
                </div>
                <p className="small text-[var(--muted-text)]">Control when results appear and how used tokens can re-enter.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Results visibility</label>
                    <Select
                      value={form.results_visibility}
                      onChange={(event) => setDraft((prev) => ({ ...prev, results_visibility: event.target.value as ElectionDetail["results_visibility"] }))}
                    >
                      <option value="HIDDEN_UNTIL_CLOSED">Hidden until election is closed</option>
                      <option value="LIVE_ALLOWED">Allow internal live monitoring</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Post-vote access mode</label>
                    <Select
                      value={form.post_vote_access_mode}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          post_vote_access_mode: event.target.value as ElectionDetail["post_vote_access_mode"],
                        }))
                      }
                    >
                      <option value="READ_ONLY_AFTER_VOTE">Read-only status page after vote</option>
                      <option value="FULLY_BLOCK_AFTER_VOTE">Fully block used token access</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Allow public results URL</label>
                    <Select
                      value={form.public_results_enabled ? "enabled" : "disabled"}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          public_results_enabled: event.target.value === "enabled",
                        }))
                      }
                    >
                      <option value="disabled">Blocked</option>
                      <option value="enabled">Allowed (requires published + closed)</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Public results publish state</label>
                    <div className="flex h-10 items-center rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] px-3">
                      <Badge className={form.publish_results ? "border-[color-mix(in_oklab,var(--success)_55%,var(--edge))]" : ""}>
                        {form.publish_results ? "Published" : "Unpublished"}
                      </Badge>
                    </div>
                    <p className="tiny text-[var(--muted-text)]">Change this from the Results page using Publish/Unpublish.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="small text-[var(--muted-text)]">Current public access</label>
                    <div className="flex h-10 items-center rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] px-3">
                      <Badge className={isPublicResultsLive ? "border-[color-mix(in_oklab,var(--success)_55%,var(--edge))]" : "border-[color-mix(in_oklab,var(--danger)_55%,var(--edge))]"}>
                        {isPublicResultsLive ? "Live" : "Blocked"}
                      </Badge>
                    </div>
                    <p className="tiny text-[var(--muted-text)]">{publicResultsStatusHint}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Post-vote voter results access</label>
                    <Select
                      value={form.voter_results_after_vote_enabled ? "enabled" : "disabled"}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          voter_results_after_vote_enabled: event.target.value === "enabled",
                        }))
                      }
                    >
                      <option value="disabled">Disabled</option>
                      <option value="enabled">Enabled for used tokens</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="small text-[var(--muted-text)]">Post-vote results window mode</label>
                    <Select
                      value={resultsWindowMode}
                      onChange={(event) => {
                        const mode = event.target.value as "ALWAYS_OPEN" | "TIME_WINDOW";
                        setResultsWindowModeOverride(mode);
                        if (mode === "ALWAYS_OPEN") {
                          setDraft((prev) => ({
                            ...prev,
                            voter_results_window_starts_at: null,
                            voter_results_window_ends_at: null,
                          }));
                        }
                      }}
                    >
                      <option value="ALWAYS_OPEN">Always open</option>
                      <option value="TIME_WINDOW">Use time window</option>
                    </Select>
                  </div>
                  {resultsWindowMode === "TIME_WINDOW" ? (
                    <>
                      <div className="space-y-2">
                        <label className="small text-[var(--muted-text)]">Results window start</label>
                        <Input
                          type="datetime-local"
                          value={form.voter_results_window_starts_at ? form.voter_results_window_starts_at.slice(0, 16) : ""}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              voter_results_window_starts_at: event.target.value || null,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="small text-[var(--muted-text)]">Results window end</label>
                        <Input
                          type="datetime-local"
                          value={form.voter_results_window_ends_at ? form.voter_results_window_ends_at.slice(0, 16) : ""}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              voter_results_window_ends_at: event.target.value || null,
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setResultsWindowModeOverride("ALWAYS_OPEN");
                            setDraft((prev) => ({
                              ...prev,
                              voter_results_window_starts_at: null,
                              voter_results_window_ends_at: null,
                            }));
                          }}
                        >
                          Clear window and keep results open
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2 rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] px-3 py-2">
                      <p className="small text-[var(--muted-text)]">Used-token voters can view results anytime while access is enabled.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[var(--primary-700)]" />
                  <h2 className="h3">Voter Session Security</h2>
                </div>
                <p className="small text-[var(--muted-text)]">Configure auto logout duration per election using hours, minutes, and seconds.</p>
                <DurationPicker
                  totalSeconds={form.voter_auto_logout_seconds}
                  onChange={(seconds) => setDraft((prev) => ({ ...prev, voter_auto_logout_seconds: seconds }))}
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3 text-center">
                    <p className="tiny text-[var(--muted-text)]">Hours</p>
                    <p className="h3 mt-1">{logoutParts.hours}</p>
                  </div>
                  <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3 text-center">
                    <p className="tiny text-[var(--muted-text)]">Minutes</p>
                    <p className="h3 mt-1">{logoutParts.minutes}</p>
                  </div>
                  <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3 text-center">
                    <p className="tiny text-[var(--muted-text)]">Seconds</p>
                    <p className="h3 mt-1">{logoutParts.seconds}</p>
                  </div>
                </div>
                <p className="small text-[var(--muted-text)]">
                  Effective timeout: {logoutParts.hours}h {logoutParts.minutes}m {logoutParts.seconds}s
                </p>
              </section>

              {!canManage ? <p className="small text-[var(--muted-text)]">You have read-only access to this election setup.</p> : null}
            </form>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="h3">Live Configuration Summary</h2>
            <p className="small mt-1 text-[var(--muted-text)]">Review policy and schedule before saving.</p>
            {!form ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2">
                  <span className="small text-[var(--muted-text)]">Election</span>
                  <span className="small font-medium">{form.title || "Untitled election"}</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2">
                  <span className="small text-[var(--muted-text)]">Schedule</span>
                  <Badge>{form.opens_at && form.closes_at ? "Configured" : "Incomplete"}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2">
                  <span className="small text-[var(--muted-text)]">Results visibility</span>
                  <Badge>{form.results_visibility === "LIVE_ALLOWED" ? "Live allowed" : "Hidden until closed"}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2">
                  <span className="small text-[var(--muted-text)]">Post-vote access</span>
                  <Badge>{form.post_vote_access_mode === "READ_ONLY_AFTER_VOTE" ? "Read-only after vote" : "Fully blocked"}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2">
                  <span className="small text-[var(--muted-text)]">Public results</span>
                  <Badge>{form.public_results_enabled ? "Enabled" : "Disabled"}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2">
                  <span className="small text-[var(--muted-text)]">Post-vote voter results</span>
                  <Badge>{form.voter_results_after_vote_enabled ? "Enabled" : "Disabled"}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] px-3 py-2">
                  <span className="small text-[var(--muted-text)]">Results window</span>
                  <Badge>
                    {form.voter_results_window_starts_at || form.voter_results_window_ends_at ? "Configured" : "Always open"}
                  </Badge>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="h3">Ballot Preview</h2>
            <p className="small mt-1 text-[var(--muted-text)]">Posts that will appear to voters in ballot order.</p>
            <div className="mt-4 space-y-2">
              {postsQuery.isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : postsQuery.data?.data?.length ? (
                postsQuery.data.data.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3"
                  >
                    <p className="font-medium">{post.title}</p>
                    <p className="small mt-1 text-[var(--muted-text)]">
                      Max selections: {post.max_selections} | Skip option: {post.allow_abstain ? "Allowed" : "Not allowed"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="small rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3 text-[var(--muted-text)]">
                  No posts added yet. Add posts in the Posts section before going live.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageScaffold>
  );
}
