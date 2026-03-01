"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mail, ShieldCheck, UserCheck, UserMinus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";
import { getInitials } from "@/lib/utils";

type Membership = {
  id: string;
  role: "ORG_ADMIN" | "ELECTION_MANAGER" | "RESULTS_VIEWER";
  is_active: boolean;
  organization_name: string;
  user_email: string;
};

type NewUserForm = {
  email: string;
  first_name: string;
  last_name: string;
  role: Membership["role"];
};

export default function OrgAdminsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewUserForm>({
    email: "",
    first_name: "",
    last_name: "",
    role: "ORG_ADMIN",
  });

  const membershipsQuery = useQuery({
    queryKey: ["system-org-admins", orgId],
    enabled: Boolean(orgId),
    queryFn: () =>
      apiClient<{ data: Membership[] }>(endpoints.org.users, {
        headers: { "X-Org-Id": orgId },
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient<{ data: Membership & { generated_password?: string } }>(endpoints.system.organizationAdmins(orgId), {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: (response) => {
      toast.success(response.data.generated_password ? `User saved. Temp password: ${response.data.generated_password}` : "User saved");
      queryClient.invalidateQueries({ queryKey: ["system-org-admins", orgId] });
      setForm({ email: "", first_name: "", last_name: "", role: "ORG_ADMIN" });
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
      toast.success(response.data.generated_password ? `Membership updated. Temp password: ${response.data.generated_password}` : "Membership updated");
      queryClient.invalidateQueries({ queryKey: ["system-org-admins", orgId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = membershipsQuery.data?.data ?? [];
  const activeCount = rows.filter((membership) => membership.is_active).length;

  const roleTone: Record<Membership["role"], string> = {
    ORG_ADMIN: "border-[color-mix(in_oklab,var(--warning)_52%,var(--edge))] bg-[color-mix(in_oklab,var(--warning)_10%,var(--surface))]",
    ELECTION_MANAGER: "border-[color-mix(in_oklab,var(--info)_55%,var(--edge))] bg-[color-mix(in_oklab,var(--info)_10%,var(--surface))]",
    RESULTS_VIEWER: "border-[color-mix(in_oklab,var(--success)_50%,var(--edge))] bg-[color-mix(in_oklab,var(--success)_10%,var(--surface))]",
  };

  const roleLabel: Record<Membership["role"], string> = {
    ORG_ADMIN: "Org Admin",
    ELECTION_MANAGER: "Election Manager",
    RESULTS_VIEWER: "Results Viewer",
  };

  return (
    <PageScaffold
      title="Organization Admin Users"
      subtitle={`Organization ID: ${orgId ?? ""}`}
      crumbs={[
        { label: "System", href: "/system/dashboard" },
        { label: "Organizations", href: "/system/organizations" },
        { label: "Admins" },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="h3 mb-4">Create or Update Admin</h2>
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
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as Membership["role"] }))}
            >
              <option value="ORG_ADMIN">ORG_ADMIN</option>
              <option value="ELECTION_MANAGER">ELECTION_MANAGER</option>
              <option value="RESULTS_VIEWER">RESULTS_VIEWER</option>
            </Select>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save organization user"}
            </Button>
          </form>
        </Card>
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="h3">Existing Users</h2>
              <p className="small mt-1 text-[var(--muted-text)]">Professional access overview for all organization members.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-[color-mix(in_oklab,var(--success)_52%,var(--edge))]">{activeCount} active</Badge>
              <Badge>{rows.length} total</Badge>
            </div>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))]">
            <div className="max-h-[460px] overflow-auto">
              <Table className="min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-[color-mix(in_oklab,var(--surface)_86%,var(--surface-2))]">
                  <tr className="border-b border-[var(--edge)]">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {membershipsQuery.isLoading ? (
                    <tr>
                      <TableCell className="small py-6 text-[var(--muted-text)]" colSpan={4}>
                        Loading users...
                      </TableCell>
                    </tr>
                  ) : null}

                  {!membershipsQuery.isLoading && rows.length === 0 ? (
                    <tr>
                      <TableCell className="small py-6 text-[var(--muted-text)]" colSpan={4}>
                        No users found for this organization.
                      </TableCell>
                    </tr>
                  ) : null}

                  {rows.map((membership) => (
                    <TableRow
                      key={membership.id}
                      className="even:!bg-transparent hover:!bg-[color-mix(in_oklab,var(--primary)_9%,var(--surface))]"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] text-xs font-semibold tracking-[0.03em] text-[var(--text)]">
                            {getInitials(membership.user_email)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{membership.user_email}</p>
                            <p className="tiny mt-0.5 inline-flex items-center gap-1 text-[var(--muted-text)]">
                              <Mail className="size-3.5" />
                              Member record
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={roleTone[membership.role]}>
                          <ShieldCheck className="mr-1 size-3.5" />
                          {roleLabel[membership.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={membership.is_active ? "border-[color-mix(in_oklab,var(--success)_52%,var(--edge))]" : "border-[color-mix(in_oklab,var(--danger)_50%,var(--edge))]"}>
                          {membership.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 rounded-[10px]"
                            onClick={() => updateMutation.mutate({ membershipId: membership.id, payload: { reset_password: true } })}
                          >
                            <KeyRound className="size-4" />
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            variant={membership.is_active ? "danger" : "secondary"}
                            className={
                              membership.is_active
                                ? "h-8 rounded-[10px] shadow-none hover:shadow-none"
                                : "h-8 rounded-[10px] border-[color-mix(in_oklab,var(--success)_52%,var(--edge))] bg-[color-mix(in_oklab,var(--success)_14%,var(--surface))] text-[var(--text)] hover:bg-[color-mix(in_oklab,var(--success)_20%,var(--surface))]"
                            }
                            onClick={() =>
                              updateMutation.mutate({
                                membershipId: membership.id,
                                payload: { is_active: !membership.is_active },
                              })
                            }
                          >
                            {membership.is_active ? <UserMinus className="size-4" /> : <UserCheck className="size-4" />}
                            {membership.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </PageScaffold>
  );
}
