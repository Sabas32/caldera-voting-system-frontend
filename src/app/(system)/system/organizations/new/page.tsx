"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type FormState = {
  name: string;
  slug: string;
  primary_color_override: string;
  logo_url: string;
};

export default function NewOrganizationPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    primary_color_override: "",
    logo_url: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiClient<{ data: { id: string } }>(endpoints.system.organizations, {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          status: "ACTIVE",
          primary_color_override: form.primary_color_override || undefined,
          logo_url: form.logo_url || undefined,
        }),
      }),
    onSuccess: (response) => {
      toast.success("Organization created");
      router.push(`/system/organizations/${response.data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageScaffold
      title="Create Organization"
      crumbs={[
        { label: "System", href: "/system/dashboard" },
        { label: "Organizations", href: "/system/organizations" },
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
            <label className="small">Organization name</label>
            <Input
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                setForm((prev) => ({ ...prev, name, slug: prev.slug || slug }));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="small">Slug</label>
            <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <label className="small">Primary color override</label>
            <Input
              placeholder="#F5C84B"
              value={form.primary_color_override}
              onChange={(event) => setForm((prev) => ({ ...prev, primary_color_override: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="small">Logo URL</label>
            <Input value={form.logo_url} onChange={(event) => setForm((prev) => ({ ...prev, logo_url: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create organization"}
            </Button>
          </div>
        </form>
      </Card>
    </PageScaffold>
  );
}
