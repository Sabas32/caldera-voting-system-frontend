"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, PencilLine, Plus, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { CandidatesTable } from "@/components/tables/CandidatesTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { getInitials } from "@/lib/utils";
import { useOrgContext } from "@/lib/useOrgContext";

type Post = {
  id: string;
  title: string;
};

type Candidate = {
  id: string;
  name: string;
  status: string;
  description: string;
  sort_order?: number;
};

type CandidateCreateResponse = {
  data: Candidate;
};

type CandidateStatus = "APPROVED" | "DRAFT";

const textareaClassName =
  "w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] px-3 py-2 text-sm text-[var(--text)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--surface)_82%,transparent)] outline-none transition-all duration-200 placeholder:text-[color-mix(in_oklab,var(--muted-text)_65%,transparent)] hover:border-[color-mix(in_oklab,var(--border)_55%,var(--primary))] focus-visible:border-[color-mix(in_oklab,var(--primary)_70%,var(--border))] focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export default function ElectionCandidatesPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { activeMembership } = useOrgContext();
  const queryClient = useQueryClient();
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sort_order: "1",
    status: "APPROVED" as CandidateStatus,
  });
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    sort_order: "1",
    status: "APPROVED" as CandidateStatus,
  });

  const postsQuery = useQuery({
    queryKey: ["org-election-posts-for-candidates", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<{ data: Post[] }>(endpoints.org.posts(electionId)),
  });

  const effectivePostId = selectedPostId || postsQuery.data?.data?.[0]?.id || "";

  const candidatesQuery = useQuery({
    queryKey: ["org-post-candidates", effectivePostId],
    enabled: Boolean(effectivePostId),
    queryFn: () => apiClient<{ data: Candidate[] }>(endpoints.org.candidates(effectivePostId)),
  });

  const candidates = candidatesQuery.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient<CandidateCreateResponse>(endpoints.org.candidates(effectivePostId), {
        method: "POST",
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order),
        }),
      }),
    onSuccess: () => {
      toast.success("Candidate saved");
      queryClient.invalidateQueries({ queryKey: ["org-post-candidates", effectivePostId] });
      setForm({ name: "", description: "", sort_order: "1", status: "APPROVED" });
      setShowCreateDialog(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (candidateId: string) => apiClient(endpoints.org.candidateDetail(candidateId), { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Candidate deleted");
      queryClient.invalidateQueries({ queryKey: ["org-post-candidates", effectivePostId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingCandidateId) {
        throw new Error("No candidate selected for editing");
      }
      return apiClient(endpoints.org.candidateDetail(editingCandidateId), {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          sort_order: Number(editForm.sort_order),
          status: editForm.status,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Candidate updated");
      setEditingCandidateId(null);
      queryClient.invalidateQueries({ queryKey: ["org-post-candidates", effectivePostId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canManage = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";

  const openEditDialog = (candidate: Candidate) => {
    setEditingCandidateId(candidate.id);
    setEditForm({
      name: candidate.name,
      description: candidate.description ?? "",
      sort_order: String(candidate.sort_order ?? 1),
      status: (candidate.status === "DRAFT" ? "DRAFT" : "APPROVED") as CandidateStatus,
    });
  };

  return (
    <PageScaffold
      title="Candidates"
      subtitle={`Election ID: ${electionId ?? ""}`}
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "Candidates" },
      ]}
    >
      <DialogRoot open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-2xl">
          <form
            className="flex max-h-[92vh] min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="border-b border-[var(--edge)] px-4 py-4 sm:px-6">
              <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Candidate profile</p>
              <h3 className="h3 mt-1">Create candidate</h3>
              <p className="small mt-2 text-[var(--muted-text)]">Add a candidate to a post and control ballot order plus voter visibility.</p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6">
              <div className="space-y-2">
                <label className="small block text-[var(--muted-text)]">Attach to post</label>
                <Select value={effectivePostId} onChange={(event) => setSelectedPostId(event.target.value)}>
                  {(postsQuery.data?.data ?? []).map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.title}
                    </option>
                  ))}
                </Select>
                <p className="small text-[var(--muted-text)]">
                  Available posts: {(postsQuery.data?.data ?? []).map((post) => post.title).join(", ") || "None configured yet"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="small block text-[var(--muted-text)]">Candidate name</label>
                <Input
                  placeholder="Full display name (e.g. Jane Doe)"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="small block text-[var(--muted-text)]">Candidate profile summary</label>
                <textarea
                  className={textareaClassName}
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short profile for voters: priorities, experience, and manifesto highlights."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="small block text-[var(--muted-text)]">Ballot position</label>
                  <Input
                    placeholder="1"
                    type="number"
                    min={1}
                    value={form.sort_order}
                    onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                  />
                  <p className="tiny text-[var(--muted-text)]">Lower number appears first in the list.</p>
                </div>
                <div className="space-y-2">
                  <label className="small block text-[var(--muted-text)]">Visibility status</label>
                  <Select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as CandidateStatus }))}>
                    <option value="APPROVED">Approved (visible to voters)</option>
                    <option value="DRAFT">Draft (hidden from voters)</option>
                  </Select>
                </div>
              </div>

              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3">
                <p className="tiny uppercase tracking-[0.1em] text-[var(--muted-text)]">Submission note</p>
                <p className="small mt-1 text-[var(--muted-text)]">
                  Saving creates the candidate under the selected post and refreshes the candidate list instantly.
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--edge)] px-4 py-3 sm:px-6">
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreateDialog(false)} disabled={createMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !effectivePostId}>
                  {createMutation.isPending ? "Saving..." : "Save candidate"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={Boolean(editingCandidateId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCandidateId(null);
          }
        }}
      >
        <DialogContent>
          <h3 className="h3">Edit candidate</h3>
          <form
            className="mt-3 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate();
            }}
          >
            <Input
              placeholder="Candidate name"
              value={editForm.name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <Input
              placeholder="Description"
              value={editForm.description}
              onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Input
              placeholder="Sort order"
              type="number"
              value={editForm.sort_order}
              onChange={(event) => setEditForm((prev) => ({ ...prev, sort_order: event.target.value }))}
            />
            <Select
              value={editForm.status}
              onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as CandidateStatus }))}
            >
              <option value="APPROVED">APPROVED</option>
              <option value="DRAFT">DRAFT</option>
            </Select>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingCandidateId(null)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogRoot>

      <div className="grid gap-4">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="h3">Candidate List</h2>
              <p className="small mt-1 text-[var(--muted-text)]">Clean profile rows with concise summaries and controlled actions.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-2">
              <div className="min-w-[240px]">
                <label className="tiny mb-1 block uppercase tracking-[0.1em] text-[var(--muted-text)]">Post</label>
                <Select value={effectivePostId} onChange={(event) => setSelectedPostId(event.target.value)}>
                  {(postsQuery.data?.data ?? []).map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.title}
                    </option>
                  ))}
                </Select>
              </div>
              <Badge className="h-10 gap-2 border-[color-mix(in_oklab,var(--primary)_40%,var(--edge))] bg-[color-mix(in_oklab,var(--surface)_88%,var(--surface-2))] px-3 text-[var(--text)]">
                <Users2 className="size-4 text-[var(--muted-text)]" />
                {candidates.length} {candidates.length === 1 ? "candidate" : "candidates"}
              </Badge>
              {canManage ? (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  disabled={!effectivePostId}
                  className="h-10 gap-2 rounded-[11px] px-4 shadow-[0_10px_24px_color-mix(in_oklab,var(--primary)_24%,transparent)]"
                >
                  <Plus className="size-4" />
                  Create candidate
                </Button>
              ) : null}
            </div>
          </div>
          <p className="small mb-4 text-[var(--muted-text)]">
            Active post: {(postsQuery.data?.data ?? []).find((post) => post.id === effectivePostId)?.title ?? "None configured yet"}
          </p>
          <CandidatesTable
            showActions={false}
            columns={["candidate", "status", "description", "actions"]}
            rows={candidates.map((candidate) => ({
                id: candidate.id,
                candidate: (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] text-xs font-semibold tracking-[0.03em] text-[var(--text)]">
                      {getInitials(candidate.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{candidate.name}</p>
                      <p className="tiny text-[var(--muted-text)]">Order {candidate.sort_order ?? 1}</p>
                    </div>
                  </div>
                ),
                status: (
                  <Badge
                    className={
                      candidate.status === "APPROVED"
                        ? "border-[color-mix(in_oklab,var(--success)_45%,var(--edge))] bg-[color-mix(in_oklab,var(--success)_12%,var(--surface))] text-[var(--success)]"
                        : "border-[color-mix(in_oklab,var(--warning)_45%,var(--edge))] bg-[color-mix(in_oklab,var(--warning)_12%,var(--surface))] text-[var(--text)]"
                    }
                  >
                    {candidate.status === "APPROVED" ? "Approved" : "Draft"}
                  </Badge>
                ),
                description: candidate.description ? (
                  <p
                    className="small max-w-[440px] break-words leading-6 text-[var(--muted-text)]"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    title={candidate.description}
                  >
                    {candidate.description}
                  </p>
                ) : (
                  <span className="small text-[var(--muted-text)]">No profile description.</span>
                ),
                actions: canManage ? (
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="secondary" className="min-w-[98px] justify-between">
                        <span>Manage</span>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEditDialog(candidate)}>
                        <PencilLine className="mr-2 size-4" />
                        Edit candidate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-[var(--danger)] focus:bg-[color-mix(in_oklab,var(--danger)_14%,var(--surface))] focus:text-[var(--danger)]"
                        onSelect={() => deleteMutation.mutate(candidate.id)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete candidate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuRoot>
                ) : (
                  "-"
                ),
              }))}
          />
        </Card>
      </div>
    </PageScaffold>
  );
}
