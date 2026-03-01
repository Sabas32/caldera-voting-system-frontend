"use client";

import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Clock3, Copy, Download, Eye, MoreHorizontal, RotateCcw, Search, ShieldCheck, Trash2, Users, Vote } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { downloadFile } from "@/lib/downloads";
import { API_BASE_URL, endpoints } from "@/lib/endpoints";
import { useOrgContext } from "@/lib/useOrgContext";

type TokenBatch = {
  id: string;
  label: string;
  quantity: number;
  expires_at: string | null;
  used_count: number;
  active_count: number;
  revoked: boolean;
  created_at: string;
};

type ElectionDetail = {
  data: {
    closes_at: string | null;
  };
};

type UsedTokenSelection = {
  post_title: string;
  abstained: boolean;
  candidate_names: string[];
};

type UsedTokenRecord = {
  id: string;
  token_hint: string;
  batch_label: string;
  status: string;
  used_at: string | null;
  receipt_code: string | null;
  submitted_at: string | null;
  selections: UsedTokenSelection[];
  is_resettable: boolean;
};

type UsedTokenListResponse = {
  data: {
    count: number;
    results: UsedTokenRecord[];
  };
};

type BatchTokensResponse = {
  data: {
    label: string;
    election_slug: string;
    tokens: string[];
  };
};

type GenerateBatchInput = {
  label: string;
  quantity: number;
  expires_at: string | null;
};

type PendingConfirmAction =
  | { kind: "revoke-batch"; batchId: string; batchLabel: string }
  | { kind: "delete-batch"; batchId: string; batchLabel: string }
  | { kind: "reset-vote"; tokenId: string; tokenHint: string }
  | { kind: "delete-token"; tokenId: string; tokenHint: string }
  | null;

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString();
}

function formatExpiryDateTime(value: string | null) {
  if (!value) {
    return "No expiry";
  }
  return formatDateTime(value);
}

export default function ElectionTokensPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { activeMembership } = useOrgContext();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [expiryMode, setExpiryMode] = useState<"NO_EXPIRY" | "SET_DATE">("NO_EXPIRY");
  const [expiresAt, setExpiresAt] = useState("");
  const [lastGeneratedTokens, setLastGeneratedTokens] = useState<string[]>([]);
  const [tokenDialogLabel, setTokenDialogLabel] = useState("");
  const [showTokensDialog, setShowTokensDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [usedTokenSearch, setUsedTokenSearch] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction>(null);

  const electionQuery = useQuery({
    queryKey: ["token-election-detail", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<ElectionDetail>(endpoints.org.electionDetail(electionId)),
  });

  const batchesQuery = useQuery({
    queryKey: ["org-token-batches", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<{ data: TokenBatch[] }>(endpoints.org.tokenBatches(electionId)),
  });

  const usedTokensQuery = useQuery({
    queryKey: ["org-used-tokens", electionId, usedTokenSearch],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<UsedTokenListResponse>(endpoints.org.usedTokens(electionId, usedTokenSearch.trim())),
  });

  const defaultElectionExpiryInput = electionQuery.data?.data.closes_at ? electionQuery.data.data.closes_at.slice(0, 16) : "";
  const selectedExpiryInput = expiresAt || defaultElectionExpiryInput;

  const generateMutation = useMutation({
    mutationFn: (payload: GenerateBatchInput) =>
      apiClient<{ data: { tokens: string[] } }>(endpoints.org.tokenBatches(electionId), {
        method: "POST",
        body: JSON.stringify({
          label: payload.label,
          quantity: payload.quantity,
          expires_at: payload.expires_at,
        }),
      }),
    onSuccess: (response, payload) => {
      const tokens = response.data.tokens ?? [];
      setLastGeneratedTokens(tokens);
      setTokenDialogLabel(payload.label);
      setShowTokensDialog(tokens.length > 0);
      setShowCreateDialog(false);
      toast.success(`Token batch generated (${tokens.length} tokens)`);
      setLabel("");
      setQuantity("100");
      setExpiresAt("");
      setExpiryMode("NO_EXPIRY");
      queryClient.invalidateQueries({ queryKey: ["org-token-batches", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (batchId: string) => apiClient(endpoints.org.revokeBatch(batchId), { method: "POST" }),
    onSuccess: () => {
      toast.success("Token batch revoked");
      queryClient.invalidateQueries({ queryKey: ["org-token-batches", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (batchId: string) => apiClient(endpoints.org.deleteBatch(batchId), { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Token batch deleted");
      queryClient.invalidateQueries({ queryKey: ["org-token-batches", electionId] });
      queryClient.invalidateQueries({ queryKey: ["org-used-tokens", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetVoteMutation = useMutation({
    mutationFn: (tokenId: string) => apiClient(endpoints.org.resetTokenVote(tokenId), { method: "POST" }),
    onSuccess: () => {
      toast.success("Vote removed and token is active again");
      queryClient.invalidateQueries({ queryKey: ["org-used-tokens", electionId] });
      queryClient.invalidateQueries({ queryKey: ["org-token-batches", electionId] });
      queryClient.invalidateQueries({ queryKey: ["org-election-detail", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTokenMutation = useMutation({
    mutationFn: (tokenId: string) => apiClient(endpoints.org.deleteToken(tokenId), { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Token deleted");
      queryClient.invalidateQueries({ queryKey: ["org-used-tokens", electionId] });
      queryClient.invalidateQueries({ queryKey: ["org-token-batches", electionId] });
      queryClient.invalidateQueries({ queryKey: ["org-election-detail", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const viewTokensMutation = useMutation({
    mutationFn: (batchId: string) => apiClient<BatchTokensResponse>(endpoints.org.tokenBatchTokens(batchId)),
    onSuccess: (response) => {
      const tokens = response.data.tokens ?? [];
      setTokenDialogLabel(response.data.label || "Token batch");
      setLastGeneratedTokens(tokens);
      setShowTokensDialog(true);
      toast.success(`Loaded ${tokens.length} tokens`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canManage = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";
  const confirmPending =
    revokeMutation.isPending || deleteBatchMutation.isPending || resetVoteMutation.isPending || deleteTokenMutation.isPending;

  const confirmTitle =
    pendingConfirm?.kind === "revoke-batch"
      ? "Revoke Token Batch"
      : pendingConfirm?.kind === "delete-batch"
        ? "Delete Token Batch"
      : pendingConfirm?.kind === "reset-vote"
        ? "Reset Token Vote"
        : pendingConfirm?.kind === "delete-token"
          ? "Delete Token"
          : "";

  const confirmDescription =
    pendingConfirm?.kind === "revoke-batch"
      ? `Revoke batch "${pendingConfirm.batchLabel}"? Active tokens in this batch will stop working.`
      : pendingConfirm?.kind === "delete-batch"
        ? `Delete batch "${pendingConfirm.batchLabel}" permanently? All tokens and related ballots in this batch will be removed.`
      : pendingConfirm?.kind === "reset-vote"
        ? `Remove submitted ballot for token ${pendingConfirm.tokenHint} and make the token usable again?`
        : pendingConfirm?.kind === "delete-token"
          ? `Delete token ${pendingConfirm.tokenHint} permanently? This cannot be undone.`
          : "";

  const confirmLabel =
    pendingConfirm?.kind === "revoke-batch"
      ? "Revoke Batch"
      : pendingConfirm?.kind === "delete-batch"
        ? "Delete Batch"
      : pendingConfirm?.kind === "reset-vote"
        ? "Reset Vote"
        : pendingConfirm?.kind === "delete-token"
          ? "Delete Token"
          : "Confirm";

  const confirmVariant = pendingConfirm?.kind === "delete-token" || pendingConfirm?.kind === "delete-batch" ? "danger" : "secondary";

  const onConfirmAction = () => {
    if (!pendingConfirm) {
      return;
    }

    const action = pendingConfirm;
    setPendingConfirm(null);
    if (action.kind === "revoke-batch") {
      revokeMutation.mutate(action.batchId);
      return;
    }
    if (action.kind === "delete-batch") {
      deleteBatchMutation.mutate(action.batchId);
      return;
    }
    if (action.kind === "reset-vote") {
      resetVoteMutation.mutate(action.tokenId);
      return;
    }
    deleteTokenMutation.mutate(action.tokenId);
  };

  const copyTokens = async () => {
    if (!lastGeneratedTokens.length) {
      return;
    }
    await navigator.clipboard.writeText(lastGeneratedTokens.join("\n"));
    toast.success("Tokens copied to clipboard");
  };

  const batches = batchesQuery.data?.data ?? [];
  const totalBatches = batches.length;
  const totalTokens = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalActiveTokens = batches.reduce((sum, batch) => sum + batch.active_count, 0);
  const totalUsedTokens = batches.reduce((sum, batch) => sum + batch.used_count, 0);
  const perpetualBatchCount = batches.filter((batch) => !batch.expires_at).length;

  const submitGenerateBatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedLabel = label.trim();
    const parsedQuantity = Number(quantity);
    if (!trimmedLabel) {
      toast.error("Batch label is required");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10000) {
      toast.error("Quantity must be between 1 and 10,000");
      return;
    }

    if (expiryMode === "SET_DATE" && !selectedExpiryInput) {
      toast.error("Select an expiry date or switch to no expiry");
      return;
    }

    generateMutation.mutate({
      label: trimmedLabel,
      quantity: parsedQuantity,
      expires_at: expiryMode === "SET_DATE" && selectedExpiryInput ? new Date(selectedExpiryInput).toISOString() : null,
    });
  };

  return (
    <PageScaffold
      title="Token Operations"
      subtitle="Create secure voter token batches, configure expiry policy, and audit usage in one place."
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "Tokens" },
      ]}
    >
      <DialogRoot open={showTokensDialog} onOpenChange={setShowTokensDialog}>
        <DialogContent>
          <h3 className="h3">{tokenDialogLabel ? `${tokenDialogLabel} tokens` : "Batch tokens"}</h3>
          <p className="small mt-2 text-[var(--muted-text)]">Plaintext tokens are stored as encrypted archive data and only available to authorized admins.</p>
          <div className="mt-3 max-h-64 overflow-auto rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] p-3">
            <pre className="small">{lastGeneratedTokens.join("\n")}</pre>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={copyTokens}>
              <Copy className="mr-2 size-4" />
              Copy all
            </Button>
            <Button onClick={() => setShowTokensDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </DialogRoot>

      <DialogRoot open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="h3">Create Token Batch</h3>
                <p className="small mt-1 text-[var(--muted-text)]">Set the label, quantity, and expiry mode for the new token batch.</p>
              </div>
              <Badge className="border-[color-mix(in_oklab,var(--primary)_45%,var(--edge))]">
                {expiryMode === "NO_EXPIRY" ? "No expiry" : "Expiring batch"}
              </Badge>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitGenerateBatch}>
              <div className="space-y-2 md:col-span-2">
                <label className="small text-[var(--muted-text)]">Batch label</label>
                <Input placeholder="e.g. Main Hall Voters" value={label} onChange={(event) => setLabel(event.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="small text-[var(--muted-text)]">Quantity</label>
                <Input
                  placeholder="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  min={1}
                  max={10000}
                />
              </div>

              <div className="space-y-2">
                <label className="small text-[var(--muted-text)]">Expiry date and time</label>
                <Input
                  type="datetime-local"
                  value={expiryMode === "SET_DATE" ? selectedExpiryInput : ""}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  disabled={expiryMode === "NO_EXPIRY"}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="small text-[var(--muted-text)]">Expiry mode</label>
                <div className="inline-flex w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-1">
                  <button
                    type="button"
                    onClick={() => setExpiryMode("NO_EXPIRY")}
                    className={`inline-flex h-10 flex-1 items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all duration-200 ${
                      expiryMode === "NO_EXPIRY"
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:text-[var(--text)]"
                    }`}
                  >
                    No expiry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpiryMode("SET_DATE");
                      if (!expiresAt && defaultElectionExpiryInput) {
                        setExpiresAt(defaultElectionExpiryInput);
                      }
                    }}
                    className={`inline-flex h-10 flex-1 items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all duration-200 ${
                      expiryMode === "SET_DATE"
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:text-[var(--text)]"
                    }`}
                  >
                    Set date
                  </button>
                </div>
                {expiryMode === "NO_EXPIRY" ? (
                  <p className="tiny text-[var(--muted-text)]">Tokens in this batch remain valid unless revoked.</p>
                ) : defaultElectionExpiryInput && !expiresAt ? (
                  <p className="tiny text-[var(--muted-text)]">Defaulting to election close time.</p>
                ) : (
                  <p className="tiny text-[var(--muted-text)]">Selected date will be enforced at token login.</p>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? "Generating..." : "Generate batch"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </DialogRoot>

      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingConfirm(null);
          }
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        confirmVariant={confirmVariant}
        confirmPending={confirmPending}
        onConfirm={onConfirmAction}
      />

      <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--primary),transparent_68%)] opacity-20" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--info)_60%,transparent),transparent_68%)] opacity-20" />
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Election token control</p>
                <h2 className="h2 mt-1">Secure Batch Management</h2>
                <p className="small mt-2 text-[var(--muted-text)]">
                  Election ID <span className="font-medium text-[var(--text)]">{electionId ?? "-"}</span>
                </p>
              </div>
              <Badge className="border-[color-mix(in_oklab,var(--primary)_45%,var(--edge))]">
                {canManage ? "Manage access" : "Read-only access"}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">Batches</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Vote className="size-4 text-[var(--primary-700)]" />
                  {totalBatches.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">Tokens Generated</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Users className="size-4 text-[var(--primary-700)]" />
                  {totalTokens.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">Active / Used</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <Clock3 className="size-4 text-[var(--primary-700)]" />
                  {totalActiveTokens.toLocaleString()} / {totalUsedTokens.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] p-3">
                <p className="tiny text-[var(--muted-text)]">No-expiry Batches</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck className="size-4 text-[var(--primary-700)]" />
                  {perpetualBatchCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="h3">Batch History</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Export packs, inspect archived tokens, and manage lifecycle for each batch.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-[color-mix(in_oklab,var(--primary)_45%,var(--edge))]">{totalBatches.toLocaleString()} batches</Badge>
            {canManage ? (
              <Button onClick={() => setShowCreateDialog(true)}>
                Create batch
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))]">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead className="sticky top-0 z-10 bg-[var(--surface)]">
                <tr className="border-b border-[var(--edge)] text-left">
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Batch</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Quantity</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Usage</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Expiry</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Status</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Created</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchesQuery.isLoading ? (
                  <tr>
                    <td className="small px-3 py-5 text-[var(--muted-text)]" colSpan={7}>
                      Loading batches...
                    </td>
                  </tr>
                ) : null}
                {!batchesQuery.isLoading && !totalBatches ? (
                  <tr>
                    <td className="small px-3 py-5 text-[var(--muted-text)]" colSpan={7}>
                      No token batches created yet.
                    </td>
                  </tr>
                ) : null}
                {batches.map((batch) => {
                  const usagePercent = batch.quantity > 0 ? Math.round((batch.used_count / batch.quantity) * 100) : 0;
                  return (
                    <tr
                      key={batch.id}
                      className="border-b border-[var(--edge)] align-top transition-colors hover:bg-[color-mix(in_oklab,var(--surface)_88%,var(--surface-2))]"
                    >
                      <td className="small px-3 py-3">
                        <p className="font-medium">{batch.label}</p>
                        <p className="tiny mt-1 text-[var(--muted-text)]">ID {batch.id.slice(0, 8)}</p>
                      </td>
                      <td className="small px-3 py-3 font-medium">{batch.quantity.toLocaleString()}</td>
                      <td className="small px-3 py-3">
                        <p>
                          {batch.used_count.toLocaleString()} used
                          <span className="text-[var(--muted-text)]"> / {batch.active_count.toLocaleString()} active</span>
                        </p>
                        <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--surface)_75%,var(--surface-2))]">
                          <div
                            className="h-full rounded-full bg-[var(--primary-600)]"
                            style={{ width: `${Math.min(100, Math.max(0, usagePercent))}%` }}
                          />
                        </div>
                      </td>
                      <td className="small px-3 py-3">
                        <div className="inline-flex items-center gap-2">
                          <CalendarClock className="size-4 text-[var(--muted-text)]" />
                          <span className="text-[var(--text)]">{formatExpiryDateTime(batch.expires_at)}</span>
                        </div>
                      </td>
                      <td className="small px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            className={
                              batch.revoked
                                ? "border-[color-mix(in_oklab,var(--danger)_45%,var(--edge))] bg-[color-mix(in_oklab,var(--danger)_12%,var(--surface))] text-[var(--danger)]"
                                : "border-[color-mix(in_oklab,var(--success)_45%,var(--edge))] bg-[color-mix(in_oklab,var(--success)_12%,var(--surface))] text-[var(--success)]"
                            }
                          >
                            {batch.revoked ? "Revoked" : "Active"}
                          </Badge>
                          {!batch.expires_at ? <span className="tiny text-[var(--muted-text)]">Perpetual</span> : null}
                        </div>
                      </td>
                      <td className="small px-3 py-3 text-[var(--muted-text)]">{formatDateTime(batch.created_at)}</td>
                      <td className="small px-3 py-3">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <DropdownMenuRoot>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="secondary" className="min-w-[94px]">
                                  <span className="inline-flex items-center gap-2">
                                    <Download className="size-4" />
                                    Export
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => downloadFile({ path: endpoints.org.tokenExportCsv(batch.id), filename: `${batch.label}.csv` })}>
                                  Download CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => window.open(`${API_BASE_URL}${endpoints.org.tokenExportPrint(batch.id)}`, "_blank")}>
                                  Open Print View
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => downloadFile({ path: endpoints.org.tokenExportQr(batch.id), filename: `${batch.label}-qr.zip` })}>
                                  Download QR Zip
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenuRoot>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="min-w-[84px]"
                              onClick={() => {
                                viewTokensMutation.mutate(batch.id);
                              }}
                              disabled={viewTokensMutation.isPending}
                            >
                              <Eye className="mr-2 size-4" />
                              View
                            </Button>
                            <DropdownMenuRoot>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="secondary" className="min-w-[98px] justify-between">
                                  <span>Manage</span>
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={batch.revoked || confirmPending}
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    setPendingConfirm({ kind: "revoke-batch", batchId: batch.id, batchLabel: batch.label });
                                  }}
                                >
                                  <RotateCcw className="mr-2 size-4" />
                                  Revoke batch
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={confirmPending}
                                  className="text-[var(--danger)] focus:bg-[color-mix(in_oklab,var(--danger)_14%,var(--surface))] focus:text-[var(--danger)]"
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    setPendingConfirm({ kind: "delete-batch", batchId: batch.id, batchLabel: batch.label });
                                  }}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete batch
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenuRoot>
                          </div>
                        ) : (
                          <span className="text-[var(--muted-text)]">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="h3">Used Tokens and Ballot Trace</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Search by token hint, receipt, batch, post, or candidate name.</p>
          </div>
          <Badge>{usedTokensQuery.data?.data.count ?? 0} used tokens</Badge>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-text)]" />
            <Input
              value={usedTokenSearch}
              onChange={(event) => setUsedTokenSearch(event.target.value)}
              placeholder="Search used tokens..."
              className="pl-9"
            />
          </div>
          <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["org-used-tokens", electionId] })}>
            Refresh
          </Button>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))]">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="sticky top-0 z-10 bg-[var(--surface)]">
                <tr className="border-b border-[var(--edge)] text-left">
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Token Hint</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Batch</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Used At</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Receipt</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Voted For</th>
                  <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usedTokensQuery.isLoading ? (
                  <tr>
                    <td className="small px-3 py-5 text-[var(--muted-text)]" colSpan={6}>
                      Loading used tokens...
                    </td>
                  </tr>
                ) : null}
                {!usedTokensQuery.isLoading && !(usedTokensQuery.data?.data.results.length ?? 0) ? (
                  <tr>
                    <td className="small px-3 py-5 text-[var(--muted-text)]" colSpan={6}>
                      No used tokens found.
                    </td>
                  </tr>
                ) : null}
                {(usedTokensQuery.data?.data.results ?? []).map((token) => (
                  <tr key={token.id} className="border-b border-[var(--edge)] align-top">
                    <td className="small px-3 py-3 font-medium">{token.token_hint}</td>
                    <td className="small px-3 py-3">{token.batch_label}</td>
                    <td className="small px-3 py-3 text-[var(--muted-text)]">
                      {token.used_at ? new Date(token.used_at).toLocaleString() : "-"}
                    </td>
                    <td className="small px-3 py-3">{token.receipt_code ?? "-"}</td>
                    <td className="small px-3 py-3">
                      {token.selections.length ? (
                        <ul className="space-y-1">
                          {token.selections.map((selection) => (
                            <li key={`${token.id}-${selection.post_title}`}>
                              <span className="font-medium">{selection.post_title}:</span>{" "}
                              {selection.abstained ? (
                                <span className="text-[var(--muted-text)]">Skipped this position</span>
                              ) : (
                                <span>{selection.candidate_names.join(", ") || "-"}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[var(--muted-text)]">No recorded ballot choices</span>
                      )}
                    </td>
                    <td className="small px-3 py-3">
                      {canManage ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setPendingConfirm({ kind: "reset-vote", tokenId: token.id, tokenHint: token.token_hint });
                            }}
                            disabled={!token.is_resettable || confirmPending}
                          >
                            <RotateCcw className="size-4" />
                            Reset vote
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setPendingConfirm({ kind: "delete-token", tokenId: token.id, tokenHint: token.token_hint });
                            }}
                            disabled={confirmPending}
                          >
                            <Trash2 className="size-4" />
                            Delete token
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[var(--muted-text)]">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      </div>
    </PageScaffold>
  );
}
