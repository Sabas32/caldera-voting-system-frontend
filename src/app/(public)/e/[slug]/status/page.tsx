"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride } from "@/lib/brandTheme";
import { setVoterOrganizationNameForElection, setVoterPrimaryColorForElection, setVoterResultsWindowForElection } from "@/lib/voterAutoLogout";

export default function StatusPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["status", slug],
    enabled: Boolean(slug),
    queryFn: () =>
      apiClient<{
        data: {
          receipt_code: string;
          submitted_at: string;
          public_results_available: boolean;
          voter_results_access_enabled: boolean;
          voter_results_available: boolean;
          voter_results_view_from: string | null;
          voter_results_view_until: string | null;
          organization_name: string;
          primary_color_override: string | null;
        };
      }>(`/vote/elections/${slug}/status/`),
  });
  const statusPayload = query.data?.data;
  const primaryColorOverride = query.data?.data.primary_color_override ?? null;
  const voterResultsViewUntil = query.data?.data.voter_results_view_until ?? null;
  const organizationName = query.data?.data.organization_name ?? null;

  useEffect(() => {
    if (!slug || !statusPayload) {
      return;
    }
    setVoterResultsWindowForElection(slug, voterResultsViewUntil);
    setVoterPrimaryColorForElection(slug, primaryColorOverride);
    setVoterOrganizationNameForElection(slug, organizationName);
    applyPrimaryColorOverride(primaryColorOverride);
  }, [organizationName, primaryColorOverride, slug, statusPayload, voterResultsViewUntil]);

  if (query.isLoading) {
    return <Card>Loading status...</Card>;
  }

  if (query.isError || !query.data) {
    return <Card>Token already used or status unavailable.</Card>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)]">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <h1 className="h2">Vote submitted</h1>
            <p className="small mt-1 text-[var(--muted-text)]">Your ballot was recorded successfully.</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-4">
          <p className="small text-[var(--muted-text)]">
            Receipt code: <strong className="text-[var(--text)]">{query.data.data.receipt_code}</strong>
          </p>
          <p className="small text-[var(--muted-text)]">Submitted at: {new Date(query.data.data.submitted_at).toLocaleString()}</p>
        </div>

        {query.data.data.voter_results_access_enabled ? (
          <div className="mt-4 rounded-[12px] border border-[color-mix(in_oklab,var(--primary)_45%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_9%,var(--surface))] p-3">
            {query.data.data.voter_results_view_from ? (
              <p className="small text-[var(--muted-text)]">
                Results window starts at:{" "}
                <strong className="text-[var(--text)]">{new Date(query.data.data.voter_results_view_from).toLocaleString()}</strong>
              </p>
            ) : null}
            {query.data.data.voter_results_available ? (
              <>
                <p className="small text-[var(--muted-text)]">
                  Results access expires at:{" "}
                  <strong className="text-[var(--text)]">
                    {query.data.data.voter_results_view_until ? new Date(query.data.data.voter_results_view_until).toLocaleString() : "-"}
                  </strong>
                </p>
                <div className="mt-3">
                  <Button size="sm" onClick={() => router.push(`/e/${slug}/results`)}>
                    View results now
                  </Button>
                </div>
              </>
            ) : (
              <p className="small text-[var(--muted-text)]">Your post-vote results window has ended.</p>
            )}
          </div>
        ) : null}

        {!query.data.data.voter_results_access_enabled && query.data.data.public_results_available ? (
          <div className="mt-4">
            <Button onClick={() => router.push(`/e/${slug}/results`)}>
              View published results
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
