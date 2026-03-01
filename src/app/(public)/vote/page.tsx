"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { KeyRound, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride } from "@/lib/brandTheme";
import { endpoints } from "@/lib/endpoints";
import {
  setVoterAutoLogoutSecondsForElection,
  setVoterOrganizationNameForElection,
  setVoterPrimaryColorForElection,
  setVoterResultsWindowForElection,
} from "@/lib/voterAutoLogout";

export default function VoteTokenPage() {
  const [token, setToken] = useState("");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () =>
      apiClient<{
        data: {
          election_slug: string;
          organization_name: string;
          status: string;
          post_vote_access_mode: string;
          primary_color_override: string | null;
          voter_auto_logout_seconds: number;
          voter_results_view_from: string | null;
          voter_results_view_until: string | null;
        };
      }>(endpoints.vote.tokenLogin, {
        method: "POST",
        body: JSON.stringify({ token: token.toUpperCase() }),
      }),
    onSuccess: (response) => {
      const payload = response.data;
      setVoterAutoLogoutSecondsForElection(payload.election_slug, payload.voter_auto_logout_seconds);
      setVoterResultsWindowForElection(payload.election_slug, payload.voter_results_view_until);
      setVoterPrimaryColorForElection(payload.election_slug, payload.primary_color_override);
      setVoterOrganizationNameForElection(payload.election_slug, payload.organization_name);
      applyPrimaryColorOverride(payload.primary_color_override);
      if (payload.status === "USED" && payload.post_vote_access_mode === "READ_ONLY_AFTER_VOTE") {
        router.push(`/e/${payload.election_slug}/status`);
        return;
      }
      router.push(`/e/${payload.election_slug}/ballot`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Token verification failed");
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-12 h-28 bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_34%,transparent),transparent_70%)]" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Token only voting</p>
            <h1 className="h2 mt-1">Access your ballot</h1>
            <p className="small mt-2 text-[var(--muted-text)]">Enter your token exactly as issued. Tokens are single-use unless election settings allow status-only re-entry.</p>

            <div className="mt-5 space-y-2">
              <label className="small inline-flex items-center gap-2 text-[var(--text)]">
                <KeyRound className="size-4 text-[var(--primary-700)]" />
                Voting token
              </label>
              <Input value={token} onChange={(event) => setToken(event.target.value)} placeholder="e.g. DEMO0001" autoComplete="off" />
            </div>

            <Button className="mt-4 w-full md:w-auto" onClick={() => mutation.mutate()} disabled={mutation.isPending || token.trim().length < 4}>
              {mutation.isPending ? "Verifying..." : "Continue to ballot"}
            </Button>
          </div>

          <div className="rounded-[14px] border border-dashed border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--text)]">
              <QrCode className="size-4" />
              <p className="small font-medium">QR login (optional)</p>
            </div>
            <p className="small text-[var(--muted-text)]">Camera-based token scan can be enabled without changing backend rules.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
