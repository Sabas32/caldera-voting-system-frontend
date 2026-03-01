"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { DurationPicker } from "@/components/forms/DurationPicker";
import { PageScaffold } from "@/components/layout/PageScaffold";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { getDefaultPrimaryColor, normalizeHexColor } from "@/lib/brandTheme";
import { secondsToDurationParts } from "@/lib/duration";
import { endpoints } from "@/lib/endpoints";
import { cn } from "@/lib/utils";

type Organization = {
  id: string;
  name: string;
  slug: string;
  default_public_results_enabled: boolean;
  default_results_visibility: "HIDDEN_UNTIL_CLOSED" | "LIVE_ALLOWED";
  voter_auto_logout_seconds: number;
  default_voter_results_after_vote_enabled: boolean;
  default_voter_results_view_window_seconds: number;
  primary_color_override: string;
  status: string;
};

type BrandColorMode = "default" | "custom";

export default function OrgSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<Organization>>({});
  const [brandColorModeDraft, setBrandColorModeDraft] = useState<BrandColorMode | null>(null);

  const query = useQuery({
    queryKey: ["system-org-settings", orgId],
    enabled: Boolean(orgId),
    queryFn: () => apiClient<{ data: Organization }>(endpoints.system.organizationDetail(orgId)),
  });

  const form = query.data?.data ? { ...query.data.data, ...draft } : null;
  const savedColorMode: BrandColorMode = normalizeHexColor(query.data?.data?.primary_color_override) ? "custom" : "default";
  const brandColorMode = brandColorModeDraft ?? savedColorMode;

  const normalizedCustomColor = normalizeHexColor(form?.primary_color_override);
  const pickerColor = normalizedCustomColor ?? getDefaultPrimaryColor();
  const customColorInvalid = brandColorMode === "custom" && !normalizedCustomColor;
  const colorPresets = ["#F5C84B", "#2563EB", "#0EA5E9"];

  const logoutParts = secondsToDurationParts(form?.voter_auto_logout_seconds ?? 60);
  const resultsWindowParts = secondsToDurationParts(form?.default_voter_results_view_window_seconds ?? 600);
  const resultsAfterVoteEnabled = form?.default_voter_results_after_vote_enabled ?? false;

  const isDirty = useMemo(() => Object.keys(draft).length > 0 || brandColorModeDraft !== null, [draft, brandColorModeDraft]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient(endpoints.system.organizationDetail(orgId), {
        method: "PATCH",
        body: JSON.stringify({
          name: form?.name,
          slug: form?.slug,
          primary_color_override: brandColorMode === "custom" ? normalizedCustomColor ?? getDefaultPrimaryColor() : "",
          default_public_results_enabled: form?.default_public_results_enabled,
          default_results_visibility: form?.default_results_visibility,
          voter_auto_logout_seconds: form?.voter_auto_logout_seconds,
          default_voter_results_after_vote_enabled: form?.default_voter_results_after_vote_enabled,
          default_voter_results_view_window_seconds: form?.default_voter_results_view_window_seconds,
          status: form?.status,
        }),
      }),
    onSuccess: () => {
      toast.success("Organization settings updated");
      queryClient.invalidateQueries({ queryKey: ["system-org-settings", orgId] });
      setDraft({});
      setBrandColorModeDraft(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageScaffold
      title="Organization Settings"
      subtitle={`Organization ID: ${orgId ?? ""}`}
      crumbs={[
        { label: "System", href: "/system/dashboard" },
        { label: "Organizations", href: "/system/organizations" },
        { label: "Settings" },
      ]}
    >
      <Card className="p-0">
        <div className="border-b border-[var(--edge)] px-5 py-4 md:px-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text)]">Organization controls</h2>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Manage identity, brand defaults, voter session limits, and result access defaults for all new elections.
          </p>
        </div>
        <form
          className="space-y-6 px-5 py-5 md:px-6 md:py-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (customColorInvalid) {
              toast.error("Use a valid color format (example: #F5C84B) or switch to Default color.");
              return;
            }
            mutation.mutate();
          }}
        >
          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Basic profile</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Core organization identity and availability state.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Organization name</label>
                <Input value={form?.name ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="small">Status</label>
                <Select
                  value={form?.status ?? "ACTIVE"}
                  onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="small">Organization slug</label>
                <Input
                  value={form?.slug ?? ""}
                  onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value.trim().toLowerCase() }))}
                />
                <p className="tiny text-[var(--muted-text)]">
                  Used in system records and integration paths. Keep it lowercase with hyphens.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Brand theme</h3>
            <p className="small mt-1 text-[var(--muted-text)]">
              Set the default accent color used by the organization admin and voter result views.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setBrandColorModeDraft("default");
                  setDraft((prev) => ({ ...prev, primary_color_override: "" }));
                }}
                className={cn(
                  "rounded-[11px] border px-3 py-2 text-left transition-colors",
                  brandColorMode === "default"
                    ? "border-[color-mix(in_oklab,var(--primary)_72%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_18%,var(--surface))]"
                    : "border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_90%,var(--surface-2))]",
                )}
              >
                <p className="small font-medium">Default Gold</p>
                <p className="tiny text-[var(--muted-text)]">Uses the platform default theme color.</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrandColorModeDraft("custom");
                  setDraft((prev) => ({ ...prev, primary_color_override: normalizeHexColor(prev.primary_color_override) ?? getDefaultPrimaryColor() }));
                }}
                className={cn(
                  "rounded-[11px] border px-3 py-2 text-left transition-colors",
                  brandColorMode === "custom"
                    ? "border-[color-mix(in_oklab,var(--primary)_72%,var(--edge))] bg-[color-mix(in_oklab,var(--primary)_18%,var(--surface))]"
                    : "border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_90%,var(--surface-2))]",
                )}
              >
                <p className="small font-medium">Custom Color</p>
                <p className="tiny text-[var(--muted-text)]">Pick a branded accent for this organization.</p>
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <label className="small">Hex value</label>
                <Input
                  placeholder="#F5C84B"
                  value={form?.primary_color_override ?? ""}
                  disabled={brandColorMode !== "custom"}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      primary_color_override: event.target.value.toUpperCase(),
                    }))
                  }
                />
                <p className="tiny text-[var(--muted-text)]">Accepted formats: `#RGB` or `#RRGGBB`.</p>
              </div>
              <div className="space-y-2">
                <label className="small">Color picker</label>
                <input
                  type="color"
                  value={pickerColor}
                  disabled={brandColorMode !== "custom"}
                  onChange={(event) => {
                    setBrandColorModeDraft("custom");
                    setDraft((prev) => ({ ...prev, primary_color_override: event.target.value.toUpperCase() }));
                  }}
                  className="h-10 w-full cursor-pointer rounded-[11px] border border-[var(--edge)] bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_90%,var(--surface-2))] px-3 py-2 text-xs font-semibold text-[var(--text)]">
                  {pickerColor.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setBrandColorModeDraft("custom");
                    setDraft((prev) => ({
                      ...prev,
                      primary_color_override: color.toUpperCase(),
                    }));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[color-mix(in_oklab,var(--surface)_88%,var(--surface-2))]"
                >
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {color}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Default election result policy</h3>
            <p className="small mt-1 text-[var(--muted-text)]">These values prefill newly created elections for this organization.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Public results page (default)</label>
                <Select
                  value={(form?.default_public_results_enabled ?? false) ? "enabled" : "disabled"}
                  onChange={(event) => setDraft((prev) => ({ ...prev, default_public_results_enabled: event.target.value === "enabled" }))}
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="small">Internal result visibility (default)</label>
                <Select
                  value={form?.default_results_visibility ?? "HIDDEN_UNTIL_CLOSED"}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      default_results_visibility: event.target.value as Organization["default_results_visibility"],
                    }))
                  }
                >
                  <option value="HIDDEN_UNTIL_CLOSED">Hidden until election closes</option>
                  <option value="LIVE_ALLOWED">Allow live monitoring</option>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="small">Voter can view results after vote (default)</label>
                <Select
                  value={(form?.default_voter_results_after_vote_enabled ?? false) ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      default_voter_results_after_vote_enabled: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Default voter session limits</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Defines how long voter sessions and result viewing remain open by default.</p>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="small">Auto logout timeout</label>
                <DurationPicker
                  totalSeconds={form?.voter_auto_logout_seconds ?? 60}
                  minSeconds={30}
                  maxSeconds={3600}
                  onChange={(seconds) => setDraft((prev) => ({ ...prev, voter_auto_logout_seconds: seconds }))}
                />
                <p className="tiny text-[var(--muted-text)]">
                  Current default: {logoutParts.hours}h {logoutParts.minutes}m {logoutParts.seconds}s
                </p>
              </div>

              <div className="space-y-2">
                <label className="small">Post-vote results view window</label>
                <div className={cn(!resultsAfterVoteEnabled && "pointer-events-none opacity-60")}>
                  <DurationPicker
                    totalSeconds={form?.default_voter_results_view_window_seconds ?? 600}
                    minSeconds={30}
                    maxSeconds={86400}
                    onChange={(seconds) => setDraft((prev) => ({ ...prev, default_voter_results_view_window_seconds: seconds }))}
                  />
                </div>
                <p className="tiny text-[var(--muted-text)]">
                  Current default: {resultsWindowParts.hours}h {resultsWindowParts.minutes}m {resultsWindowParts.seconds}s
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end border-t border-[var(--edge)] pt-4">
            <Button type="submit" disabled={mutation.isPending || customColorInvalid || !isDirty} className="min-w-[170px]">
              {mutation.isPending ? "Saving..." : "Save organization settings"}
            </Button>
          </div>
        </form>
      </Card>
    </PageScaffold>
  );
}
