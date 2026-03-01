"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, MoreHorizontal, Search, ShieldCheck, UserCheck, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

type Membership = {
  id: string;
  user_email: string;
  role: "ORG_ADMIN" | "ELECTION_MANAGER" | "RESULTS_VIEWER";
  is_active: boolean;
};

type MembershipRole = Membership["role"];

export default function OrgUsersPage() {
  const queryClient = useQueryClient();
  const { orgId, activeMembership } = useOrgContext();
  const canManage = activeMembership?.role === "ORG_ADMIN";
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "ELECTION_MANAGER" as MembershipRole,
  });

  const usersQuery = useQuery({
    queryKey: ["org-users", orgId],
    enabled: Boolean(orgId && canManage),
    queryFn: () =>
      apiClient<{ data: Membership[] }>(endpoints.org.users, {
        headers: orgRequestHeaders(orgId),
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient<{ data: { generated_password?: string } }>(endpoints.org.users, {
        method: "POST",
        headers: orgRequestHeaders(orgId),
        body: JSON.stringify(form),
      }),
    onSuccess: (response) => {
      toast.success(response.data.generated_password ? `User saved. Temp password: ${response.data.generated_password}` : "User saved");
      setForm({ email: "", first_name: "", last_name: "", role: "ELECTION_MANAGER" });
      queryClient.invalidateQueries({ queryKey: ["org-users", orgId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ membershipId, payload }: { membershipId: string; payload: Record<string, unknown> }) =>
      apiClient<{ data: { generated_password?: string } }>(endpoints.org.userDetail(membershipId), {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (response) => {
      toast.success(response.data.generated_password ? `User updated. Temp password: ${response.data.generated_password}` : "User updated");
      queryClient.invalidateQueries({ queryKey: ["org-users", orgId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const allUsers = usersQuery.data?.data ?? [];
  const filteredUsers = allUsers.filter((membership) => {
    const search = userSearch.trim().toLowerCase();
    if (!search) {
      return true;
    }
    return membership.user_email.toLowerCase().includes(search) || membership.role.toLowerCase().includes(search);
  });

  const activeCount = allUsers.filter((membership) => membership.is_active).length;

  const roleTone: Record<MembershipRole, string> = {
    ORG_ADMIN: "border-[color-mix(in_oklab,var(--warning)_52%,var(--edge))]",
    ELECTION_MANAGER: "border-[color-mix(in_oklab,var(--info)_55%,var(--edge))]",
    RESULTS_VIEWER: "border-[color-mix(in_oklab,var(--success)_50%,var(--edge))]",
  };

  return (
    <PageScaffold title="Organization Users" subtitle="Role assignment, activation, and resets" crumbs={[{ label: "Organization" }, { label: "Users" }]}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="h3 mb-4">Add user</h2>
          {canManage ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <Input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
              <Input placeholder="First name" value={form.first_name} onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))} />
              <Input placeholder="Last name" value={form.last_name} onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))} />
              <Select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as MembershipRole }))}
              >
                <option value="ORG_ADMIN">ORG_ADMIN</option>
                <option value="ELECTION_MANAGER">ELECTION_MANAGER</option>
                <option value="RESULTS_VIEWER">RESULTS_VIEWER</option>
              </Select>
              <Button type="submit" disabled={createMutation.isPending || !orgId}>
                {createMutation.isPending ? "Saving..." : "Save user"}
              </Button>
            </form>
          ) : (
            <p className="small text-[var(--muted-text)]">Only ORG_ADMIN can manage users.</p>
          )}
        </Card>
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="h3">Existing users</h2>
              <p className="small text-[var(--muted-text)]">Manage access and credentials for this organization.</p>
            </div>
            {canManage ? (
              <div className="flex items-center gap-2">
                <Badge className="border-[color-mix(in_oklab,var(--success)_50%,var(--edge))]">{activeCount} active</Badge>
                <Badge>{allUsers.length} total</Badge>
              </div>
            ) : null}
          </div>
          {canManage ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-text)]" />
                  <Input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Search email or role"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[14px] border border-[var(--edge)]">
                <div className="max-h-[460px] overflow-auto">
                  <table className="w-full min-w-[780px] border-collapse">
                    <thead className="sticky top-0 z-10 bg-[var(--surface)]">
                      <tr className="border-b border-[var(--edge)] text-left">
                        <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">User</th>
                        <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Role</th>
                        <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Status</th>
                        <th className="small px-3 py-3 font-medium text-[var(--muted-text)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersQuery.isLoading ? (
                        <tr>
                          <td className="small px-3 py-5 text-[var(--muted-text)]" colSpan={4}>
                            Loading users...
                          </td>
                        </tr>
                      ) : null}
                      {!usersQuery.isLoading && !filteredUsers.length ? (
                        <tr>
                          <td className="small px-3 py-5 text-[var(--muted-text)]" colSpan={4}>
                            No users matched your search.
                          </td>
                        </tr>
                      ) : null}
                      {filteredUsers.map((membership) => (
                        <tr key={membership.id} className="border-b border-[var(--edge)] align-top">
                          <td className="small px-3 py-3">
                            <p className="font-medium">{membership.user_email}</p>
                          </td>
                          <td className="small px-3 py-3">
                            <Badge className={roleTone[membership.role]}>
                              {membership.role === "ORG_ADMIN"
                                ? "Org Admin"
                                : membership.role === "ELECTION_MANAGER"
                                  ? "Election Manager"
                                  : "Results Viewer"}
                            </Badge>
                          </td>
                          <td className="small px-3 py-3">
                            <Badge className={membership.is_active ? "border-[color-mix(in_oklab,var(--success)_50%,var(--edge))]" : "border-[color-mix(in_oklab,var(--danger)_48%,var(--edge))]"}>
                              {membership.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="small px-3 py-3">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateMutation.mutate({ membershipId: membership.id, payload: { reset_password: true } })}
                                disabled={updateMutation.isPending}
                              >
                                <KeyRound className="size-4" />
                                Reset password
                              </Button>
                              <DropdownMenuRoot>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0" aria-label="User actions">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      updateMutation.mutate({
                                        membershipId: membership.id,
                                        payload: { is_active: !membership.is_active },
                                      })
                                    }
                                    disabled={updateMutation.isPending}
                                  >
                                    {membership.is_active ? (
                                      <span className="inline-flex items-center gap-2">
                                        <UserMinus className="size-4" />
                                        Deactivate user
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-2">
                                        <UserCheck className="size-4" />
                                        Activate user
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled>
                                    <span className="inline-flex items-center gap-2 text-[var(--muted-text)]">
                                      <ShieldCheck className="size-4" />
                                      More actions soon
                                    </span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenuRoot>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="small text-[var(--muted-text)]">Only ORG_ADMIN can view and manage organization users.</p>
          )}
        </Card>
      </div>
    </PageScaffold>
  );
}
