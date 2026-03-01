"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DurationPicker } from "@/components/forms/DurationPicker";
import { PageScaffold } from "@/components/layout/PageScaffold";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { secondsToDurationParts } from "@/lib/duration";
import { endpoints } from "@/lib/endpoints";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

type FormState = {
  title: string;
  slug: string;
  opens_at: string;
  closes_at: string;
  results_visibility?: "HIDDEN_UNTIL_CLOSED" | "LIVE_ALLOWED";
  post_vote_access_mode: "READ_ONLY_AFTER_VOTE" | "FULLY_BLOCK_AFTER_VOTE";
  ballot_instructions: string;
  voter_auto_logout_seconds?: number;
  voter_results_after_vote_enabled?: boolean;
  voter_results_window_mode: "ALWAYS_OPEN" | "TIME_WINDOW";
  voter_results_window_starts_at: string;
  voter_results_window_ends_at: string;
};

export default function NewElectionPage() {
  const router = useRouter();
  const { orgId, activeMembership } = useOrgContext();
  const canManage = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    opens_at: "",
    closes_at: "",
    results_visibility: undefined,
    post_vote_access_mode: "READ_ONLY_AFTER_VOTE",
    ballot_instructions: "",
    voter_auto_logout_seconds: undefined,
    voter_results_after_vote_enabled: undefined,
    voter_results_window_mode: "ALWAYS_OPEN",
    voter_results_window_starts_at: "",
    voter_results_window_ends_at: "",
  });

  const resolvedResultsVisibility = form.results_visibility ?? "HIDDEN_UNTIL_CLOSED";
  const resolvedAutoLogoutSeconds = form.voter_auto_logout_seconds ?? 60;
  const resolvedPostVoteResultsEnabled = form.voter_results_after_vote_enabled ?? false;

  const mutation = useMutation({
    mutationFn: () =>
      apiClient<{ data: { id: string } }>(endpoints.org.elections, {
        method: "POST",
        headers: orgRequestHeaders(orgId),
        body: JSON.stringify({
          ...form,
          opens_at: form.opens_at ? new Date(form.opens_at).toISOString() : null,
          closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
          voter_results_window_starts_at:
            form.voter_results_window_mode === "TIME_WINDOW" && form.voter_results_window_starts_at
            ? new Date(form.voter_results_window_starts_at).toISOString()
            : null,
          voter_results_window_ends_at:
            form.voter_results_window_mode === "TIME_WINDOW" && form.voter_results_window_ends_at
            ? new Date(form.voter_results_window_ends_at).toISOString()
            : null,
          results_visibility: resolvedResultsVisibility,
          publish_results: false,
          public_results_enabled: false,
          voter_auto_logout_seconds: resolvedAutoLogoutSeconds,
          voter_results_after_vote_enabled: resolvedPostVoteResultsEnabled,
        }),
      }),
    onSuccess: (response) => {
      toast.success("Election created");
      router.push(`/org/elections/${response.data.id}/overview`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const logoutParts = secondsToDurationParts(resolvedAutoLogoutSeconds);

  return (
    <PageScaffold
      title="Create Election"
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "New" },
      ]}
    >
      <Card>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <label className="small">Election title</label>
            <Input
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                setForm((prev) => ({ ...prev, title, slug: prev.slug || slug }));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="small">Slug</label>
            <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <label className="small">Opens at</label>
            <Input type="datetime-local" value={form.opens_at} onChange={(event) => setForm((prev) => ({ ...prev, opens_at: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="small">Closes at</label>
            <Input type="datetime-local" value={form.closes_at} onChange={(event) => setForm((prev) => ({ ...prev, closes_at: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="small">Results visibility</label>
            <Select
              value={resolvedResultsVisibility}
              onChange={(event) => setForm((prev) => ({ ...prev, results_visibility: event.target.value as FormState["results_visibility"] }))}
            >
              <option value="HIDDEN_UNTIL_CLOSED">HIDDEN_UNTIL_CLOSED</option>
              <option value="LIVE_ALLOWED">LIVE_ALLOWED</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="small">Post-vote access mode</label>
            <Select
              value={form.post_vote_access_mode}
              onChange={(event) => setForm((prev) => ({ ...prev, post_vote_access_mode: event.target.value as FormState["post_vote_access_mode"] }))}
            >
              <option value="READ_ONLY_AFTER_VOTE">READ_ONLY_AFTER_VOTE</option>
              <option value="FULLY_BLOCK_AFTER_VOTE">FULLY_BLOCK_AFTER_VOTE</option>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="small">Ballot instructions</label>
            <Input
              value={form.ballot_instructions}
              onChange={(event) => setForm((prev) => ({ ...prev, ballot_instructions: event.target.value }))}
              placeholder="Optional voter guidance"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="small">Voter auto logout (per election)</label>
            <DurationPicker
              totalSeconds={resolvedAutoLogoutSeconds}
              onChange={(seconds) => setForm((prev) => ({ ...prev, voter_auto_logout_seconds: seconds }))}
            />
            <p className="small text-[var(--muted-text)]">
              Selected timeout: {logoutParts.hours}h {logoutParts.minutes}m {logoutParts.seconds}s
            </p>
          </div>
          <div className="space-y-2">
            <label className="small">Allow post-vote results access</label>
            <Select
              value={resolvedPostVoteResultsEnabled ? "enabled" : "disabled"}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  voter_results_after_vote_enabled: event.target.value === "enabled",
                }))
              }
            >
              <option value="disabled">Disabled</option>
              <option value="enabled">Enabled</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="small">Post-vote results window mode</label>
            <Select
              value={form.voter_results_window_mode}
              onChange={(event) =>
                setForm((prev) => {
                  const mode = event.target.value as FormState["voter_results_window_mode"];
                  if (mode === "ALWAYS_OPEN") {
                    return {
                      ...prev,
                      voter_results_window_mode: mode,
                      voter_results_window_starts_at: "",
                      voter_results_window_ends_at: "",
                    };
                  }
                  return { ...prev, voter_results_window_mode: mode };
                })
              }
            >
              <option value="ALWAYS_OPEN">Always open</option>
              <option value="TIME_WINDOW">Use time window</option>
            </Select>
          </div>
          {form.voter_results_window_mode === "TIME_WINDOW" ? (
            <>
              <div className="space-y-2">
                <label className="small">Results window start</label>
                <Input
                  type="datetime-local"
                  value={form.voter_results_window_starts_at}
                  onChange={(event) => setForm((prev) => ({ ...prev, voter_results_window_starts_at: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="small">Results window end</label>
                <Input
                  type="datetime-local"
                  value={form.voter_results_window_ends_at}
                  onChange={(event) => setForm((prev) => ({ ...prev, voter_results_window_ends_at: event.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      voter_results_window_mode: "ALWAYS_OPEN",
                      voter_results_window_starts_at: "",
                      voter_results_window_ends_at: "",
                    }))
                  }
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
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending || !orgId || !canManage}>
              {mutation.isPending ? "Creating..." : "Create election"}
            </Button>
            {!canManage ? <p className="small text-[var(--muted-text)]">Only ORG_ADMIN or ELECTION_MANAGER can create elections.</p> : null}
          </div>
        </form>
      </Card>
    </PageScaffold>
  );
}
