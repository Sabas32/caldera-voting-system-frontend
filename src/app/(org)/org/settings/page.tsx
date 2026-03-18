"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DurationPicker } from "@/components/forms/DurationPicker";
import { ChangePasswordPanel } from "@/components/forms/ChangePasswordPanel";
import { PageScaffold } from "@/components/layout/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride, clearPrimaryColorOverride, getDefaultPrimaryColor, normalizeHexColor } from "@/lib/brandTheme";
import { secondsToDurationParts } from "@/lib/duration";
import { endpoints } from "@/lib/endpoints";
import { cn } from "@/lib/utils";
import { orgRequestHeaders, useOrgContext } from "@/lib/useOrgContext";

type OrgSettings = {
  id: string;
  name: string;
  logo_url: string;
  primary_color_override: string;
  default_public_results_enabled: boolean;
  default_results_visibility: "HIDDEN_UNTIL_CLOSED" | "LIVE_ALLOWED";
  voter_auto_logout_seconds: number;
};

type BrandColorMode = "default" | "custom";

export default function OrgSettingsPage() {
  const { orgId, activeMembership } = useOrgContext();
  const queryClient = useQueryClient();
  const canManage = activeMembership?.role === "ORG_ADMIN";
  const [draft, setDraft] = useState<Partial<OrgSettings>>({});
  const [brandColorModeDraft, setBrandColorModeDraft] = useState<BrandColorMode | null>(null);

  const query = useQuery({
    queryKey: ["org-settings", orgId],
    enabled: Boolean(orgId),
    queryFn: () =>
      apiClient<{ data: OrgSettings }>(endpoints.org.settings, {
        headers: orgRequestHeaders(orgId),
      }),
  });

  const form = query.data?.data ? { ...query.data.data, ...draft } : null;
  const logoutParts = secondsToDurationParts(form?.voter_auto_logout_seconds ?? 60);
  const savedColorMode: BrandColorMode = normalizeHexColor(query.data?.data?.primary_color_override) ? "custom" : "default";
  const brandColorMode = brandColorModeDraft ?? savedColorMode;
  const currentOverride = form?.primary_color_override ?? "";
  const normalizedOverride = normalizeHexColor(currentOverride);
  const pickerColor = normalizedOverride ?? getDefaultPrimaryColor();
  const hasInvalidCustomColor = brandColorMode === "custom" && !normalizedOverride;

  useEffect(() => {
    if (brandColorMode === "custom") {
      applyPrimaryColorOverride(currentOverride || pickerColor);
      return;
    }
    clearPrimaryColorOverride();
  }, [brandColorMode, currentOverride, pickerColor]);

  const mutation = useMutation({
    mutationFn: () => {
      const normalizedForSave = normalizeHexColor(form?.primary_color_override);

      return apiClient(endpoints.org.settings, {
        method: "PATCH",
        headers: orgRequestHeaders(orgId),
        body: JSON.stringify({
          name: form?.name,
          primary_color_override: brandColorMode === "custom" ? normalizedForSave ?? getDefaultPrimaryColor() : "",
          default_public_results_enabled: form?.default_public_results_enabled,
          default_results_visibility: form?.default_results_visibility,
          voter_auto_logout_seconds: form?.voter_auto_logout_seconds,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Organization settings updated");
      queryClient.invalidateQueries({ queryKey: ["org-settings", orgId] });
      setDraft({});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageScaffold title="Organization Settings" subtitle="Branding defaults and election defaults" crumbs={[{ label: "Organization" }, { label: "Settings" }]}>
      <div className="space-y-4">
        <Card>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (hasInvalidCustomColor) {
                toast.error("Enter a valid hex color for custom mode, for example #F5C84B.");
                return;
              }
              mutation.mutate();
            }}
          >
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="small">Organization name</label>
              <Input value={form?.name ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="h3">Brand Color</h3>
                <p className="small mt-1 text-[var(--muted-text)]">Set the primary color used across buttons, highlights, and accents.</p>
              </div>
              <Badge className="border-[color-mix(in_oklab,var(--primary)_45%,var(--edge))]">Live preview</Badge>
            </div>

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
                    : "border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))]",
                )}
              >
                <p className="small font-medium">Default Gold</p>
                <p className="tiny text-[var(--muted-text)]">Use Caldera default brand color.</p>
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
                    : "border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))]",
                )}
              >
                <p className="small font-medium">Custom Color</p>
                <p className="tiny text-[var(--muted-text)]">Pick your own organization brand color.</p>
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
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
                  className="h-12 w-full cursor-pointer rounded-[10px] border border-[var(--edge)] bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="small">Hex value</label>
                <Input
                  placeholder="#F5C84B"
                  value={form?.primary_color_override ?? ""}
                  disabled={brandColorMode !== "custom"}
                  onChange={(event) => {
                    setBrandColorModeDraft("custom");
                    setDraft((prev) => ({ ...prev, primary_color_override: event.target.value }));
                  }}
                />
                <p className="tiny text-[var(--muted-text)]">
                  Two options are available: <strong>Default Gold</strong> or <strong>Custom Color</strong>. Custom supports `#RGB` or `#RRGGBB`.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] p-4">
            <h3 className="h3">Default Voter Session</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Applied automatically when creating a new election.</p>
            <div className="mt-3 space-y-3">
              <DurationPicker
                totalSeconds={form?.voter_auto_logout_seconds ?? 60}
                minSeconds={30}
                maxSeconds={3600}
                onChange={(seconds) => setDraft((prev) => ({ ...prev, voter_auto_logout_seconds: seconds }))}
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-2.5 text-center">
                  <p className="tiny text-[var(--muted-text)]">Hours</p>
                  <p className="h3 mt-1">{logoutParts.hours}</p>
                </div>
                <div className="rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-2.5 text-center">
                  <p className="tiny text-[var(--muted-text)]">Minutes</p>
                  <p className="h3 mt-1">{logoutParts.minutes}</p>
                </div>
                <div className="rounded-[10px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-2.5 text-center">
                  <p className="tiny text-[var(--muted-text)]">Seconds</p>
                  <p className="h3 mt-1">{logoutParts.seconds}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] p-4">
            <h3 className="h3">Default Results Visibility</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Used as a starting point when creating new elections.</p>
            <div className="mt-3 space-y-2">
              <label className="small">Results visibility default</label>
              <Select
                value={form?.default_results_visibility ?? "HIDDEN_UNTIL_CLOSED"}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    default_results_visibility: event.target.value as OrgSettings["default_results_visibility"],
                  }))
                }
              >
                <option value="HIDDEN_UNTIL_CLOSED">Hidden until election closes</option>
                <option value="LIVE_ALLOWED">Allow internal live monitoring</option>
              </Select>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_76%,var(--surface-2))] p-4">
            <h3 className="h3">Public Results Defaults</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Public result pages remain controlled separately from post-vote voter access.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Default public results page</label>
                <Select
                  value={(form?.default_public_results_enabled ?? false) ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      default_public_results_enabled: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Badge>{(form?.default_public_results_enabled ?? false) ? "Public results default ON" : "Public results default OFF"}</Badge>
              </div>
            </div>
          </section>

            <div>
              <Button type="submit" disabled={mutation.isPending || !orgId || !canManage || hasInvalidCustomColor}>
                {mutation.isPending ? "Saving..." : "Save org settings"}
              </Button>
              {!canManage ? <p className="small mt-3 text-[var(--muted-text)]">Only ORG_ADMIN can update organization settings.</p> : null}
            </div>
          </form>
        </Card>
        <ChangePasswordPanel />
      </div>
    </PageScaffold>
  );
}
