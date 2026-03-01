"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Hash, LayoutList, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { PostsTable } from "@/components/tables/PostsTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DialogContent, DialogRoot } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { useOrgContext } from "@/lib/useOrgContext";

type PostRow = {
  id: string;
  title: string;
  max_selections: number;
  sort_order: number;
  allow_abstain: boolean;
};

type PostFormState = {
  title: string;
  max_selections: string;
  sort_order: string;
  allow_abstain: boolean;
};

export default function ElectionPostsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { activeMembership } = useOrgContext();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PostFormState>({
    title: "",
    max_selections: "1",
    sort_order: "1",
    allow_abstain: false,
  });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PostFormState>({
    title: "",
    max_selections: "1",
    sort_order: "1",
    allow_abstain: false,
  });

  const postsQuery = useQuery({
    queryKey: ["org-election-posts", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<{ data: PostRow[] }>(endpoints.org.posts(electionId)),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient(endpoints.org.posts(electionId), {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          max_selections: Number(form.max_selections),
          sort_order: Number(form.sort_order),
          allow_abstain: form.allow_abstain,
        }),
      }),
    onSuccess: () => {
      toast.success("Post saved");
      queryClient.invalidateQueries({ queryKey: ["org-election-posts", electionId] });
      setForm({ title: "", max_selections: "1", sort_order: "1", allow_abstain: false });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => apiClient(endpoints.org.postDetail(postId), { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["org-election-posts", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingPostId) {
        throw new Error("No post selected for editing");
      }
      return apiClient(endpoints.org.postDetail(editingPostId), {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title,
          max_selections: Number(editForm.max_selections),
          sort_order: Number(editForm.sort_order),
          allow_abstain: editForm.allow_abstain,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Post updated");
      setEditingPostId(null);
      queryClient.invalidateQueries({ queryKey: ["org-election-posts", electionId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canManage = activeMembership?.role === "ORG_ADMIN" || activeMembership?.role === "ELECTION_MANAGER";
  const resolvedMaxSelections = Math.max(1, Number(form.max_selections || "1"));
  const resolvedSortOrder = Math.max(1, Number(form.sort_order || "1"));

  const openEditDialog = (post: PostRow) => {
    setEditingPostId(post.id);
    setEditForm({
      title: post.title,
      max_selections: String(post.max_selections),
      sort_order: String(post.sort_order),
      allow_abstain: post.allow_abstain,
    });
  };

  return (
    <PageScaffold
      title="Posts"
      subtitle={`Election ID: ${electionId ?? ""}`}
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "Posts" },
      ]}
    >
      <DialogRoot
        open={Boolean(editingPostId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPostId(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <div className="space-y-4">
            <div>
              <h3 className="h3">Edit Post</h3>
              <p className="small mt-1 text-[var(--muted-text)]">Update title, limits, and skip policy for this post.</p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                updateMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <label className="small text-[var(--muted-text)]">Post title</label>
                <Input
                  value={editForm.title}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. President"
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="small text-[var(--muted-text)]">Max selections</label>
                  <Input
                    type="number"
                    value={editForm.max_selections}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, max_selections: event.target.value }))}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="small text-[var(--muted-text)]">Ballot order</label>
                  <Input
                    type="number"
                    value={editForm.sort_order}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                    min={1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="small text-[var(--muted-text)]">Skip option</label>
                <div className="inline-flex w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-1">
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, allow_abstain: false }))}
                    className={`inline-flex h-10 flex-1 items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all duration-200 ${
                      !editForm.allow_abstain
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:text-[var(--text)]"
                    }`}
                  >
                    Disallow
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, allow_abstain: true }))}
                    className={`inline-flex h-10 flex-1 items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all duration-200 ${
                      editForm.allow_abstain
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:text-[var(--text)]"
                    }`}
                  >
                    Allow
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingPostId(null)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </DialogRoot>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_44%,transparent),transparent_68%)] opacity-25" />
          <div className="relative">
            <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Post builder</p>
            <h2 className="h3 mt-1">Create Post</h2>
            <p className="small mt-2 text-[var(--muted-text)]">Define how this position appears on the ballot and how many candidates each voter can select.</p>
          </div>
          {canManage ? (
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="post-title" className="small text-[var(--muted-text)]">
                  Post title
                </label>
                <Input
                  id="post-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. President"
                  required
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="post-max-selections" className="small text-[var(--muted-text)]">
                    Max selections
                  </label>
                  <Input
                    id="post-max-selections"
                    type="number"
                    value={form.max_selections}
                    onChange={(event) => setForm((prev) => ({ ...prev, max_selections: event.target.value }))}
                    placeholder="1"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="post-sort-order" className="small text-[var(--muted-text)]">
                    Ballot order
                  </label>
                  <Input
                    id="post-sort-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                    placeholder="1"
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="small text-[var(--muted-text)]">Skip option</label>
                <div className="inline-flex w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-1">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, allow_abstain: false }))}
                    className={`inline-flex h-10 flex-1 items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all duration-200 ${
                      !form.allow_abstain
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:text-[var(--text)]"
                    }`}
                  >
                    Disallow
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, allow_abstain: true }))}
                    className={`inline-flex h-10 flex-1 items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all duration-200 ${
                      form.allow_abstain
                        ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_8px_18px_var(--shadow)]"
                        : "text-[var(--muted-text)] hover:text-[var(--text)]"
                    }`}
                  >
                    Allow
                  </button>
                </div>
              </div>

              <div className="rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_80%,var(--surface-2))] p-3">
                <p className="tiny uppercase tracking-[0.1em] text-[var(--muted-text)]">Policy preview</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div className="small inline-flex items-center gap-2 text-[var(--text)]">
                    <ListChecks className="size-4 text-[var(--primary-700)]" />
                    Up to {resolvedMaxSelections}
                  </div>
                  <div className="small inline-flex items-center gap-2 text-[var(--text)]">
                    <Hash className="size-4 text-[var(--primary-700)]" />
                    Order {resolvedSortOrder}
                  </div>
                  <div className="small inline-flex items-center gap-2 text-[var(--text)]">
                    <CircleCheck className="size-4 text-[var(--primary-700)]" />
                    {form.allow_abstain ? "Skip allowed" : "Skip not allowed"}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Saving..." : "Save post"}
              </Button>
            </form>
          ) : (
            <p className="small mt-4 text-[var(--muted-text)]">You have read-only access to posts.</p>
          )}
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="h3">Post List</h2>
              <p className="small mt-1 text-[var(--muted-text)]">Current ballot order and post constraints.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_82%,var(--surface-2))] px-2.5 py-1.5">
              <LayoutList className="size-4 text-[var(--primary-700)]" />
              <span className="small font-medium">{(postsQuery.data?.data ?? []).length}</span>
            </div>
          </div>
          <PostsTable
            showActions={false}
            columns={["title", "max selections", "order", "actions"]}
            rows={(postsQuery.data?.data ?? []).map((post) => ({
              id: post.id,
              title: post.title,
              "max selections": post.max_selections,
              order: post.sort_order,
              actions: canManage ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEditDialog(post)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(post.id)}>
                    Delete
                  </Button>
                </div>
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
