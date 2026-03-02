"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { PageScaffold } from "@/components/layout/PageScaffold";
import { ChangePasswordPanel } from "@/components/forms/ChangePasswordPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { normalizeHexColor } from "@/lib/brandTheme";
import { APP_NAME } from "@/lib/constants";
import { endpoints } from "@/lib/endpoints";
import {
  applyPlatformSettingsToDocument,
  DEFAULT_ANNOUNCEMENT_COLOR,
  getDefaultPlatformSettings,
  PlatformSettings,
  readPlatformSettings,
  savePlatformSettings,
} from "@/lib/platformSettings";

type SystemHealthResponse = {
  data: {
    status: "UP" | "DEGRADED";
    api: "UP" | "DOWN";
    database: "UP" | "DOWN";
    database_error: string | null;
    checked_at: string;
  };
};

function isSameSettings(a: PlatformSettings, b: PlatformSettings) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeAnnouncementDateInput(value: string) {
  if (!value.trim()) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  const local = new Date(parsed.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export default function SystemSettingsPage() {
  const { setTheme } = useTheme();
  const defaults = useMemo(() => getDefaultPlatformSettings(), []);

  const [saved, setSaved] = useState<PlatformSettings>(() => readPlatformSettings());
  const [form, setForm] = useState<PlatformSettings>(() => readPlatformSettings());
  const [saving, setSaving] = useState(false);
  const isDirty = !isSameSettings(form, saved);
  const announcementPickerColor = normalizeHexColor(form.announcementColor) ?? DEFAULT_ANNOUNCEMENT_COLOR;

  const healthQuery = useQuery({
    queryKey: ["system-health"],
    enabled: form.showSystemHealthPanel,
    refetchInterval: 30_000,
    queryFn: () => apiClient<SystemHealthResponse>(endpoints.system.health),
  });

  const handleSave = () => {
    const next: PlatformSettings = {
      ...form,
      platformName: form.platformName.trim() || APP_NAME,
      platformTagline: form.platformTagline.trim(),
      maintenanceMessage: form.maintenanceMessage.trim(),
      supportContactEmail: form.supportContactEmail.trim(),
      announcementMessage: form.announcementMessage.trim(),
      announcementExpiresAt: form.announcementExpiresAt.trim(),
    };

    if (next.supportContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.supportContactEmail)) {
      toast.error("Use a valid support email address.");
      return;
    }

    setSaving(true);
    savePlatformSettings(next);
    const applied = readPlatformSettings();
    applyPlatformSettingsToDocument(applied);
    setTheme(applied.defaultThemeBehavior);
    setSaved(applied);
    setForm(applied);
    setSaving(false);
    toast.success("Platform settings saved");
  };

  const handleReset = () => {
    savePlatformSettings(defaults);
    applyPlatformSettingsToDocument(defaults);
    setTheme(defaults.defaultThemeBehavior);
    setSaved(defaults);
    setForm(defaults);
    toast.success("Platform settings reset");
  };

  const health = healthQuery.data?.data;

  return (
    <PageScaffold title="Platform Settings" subtitle="Global system workspace preferences" crumbs={[{ label: "System" }, { label: "Settings" }]}>
      <div className="space-y-4">
        <Card className="p-0">
          <div className="border-b border-[var(--edge)] px-5 py-4 md:px-6">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text)]">System experience controls</h2>
            <p className="mt-1 text-sm text-[var(--muted-text)]">
              Configure branding, theme behavior, maintenance communication, and operational health visibility.
            </p>
          </div>

          <form
            className="space-y-6 px-5 py-5 md:px-6 md:py-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Branding</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Shown across system, organization, and voter dashboards.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Platform name</label>
                <Input value={form.platformName} onChange={(event) => setForm((prev) => ({ ...prev, platformName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="small">Platform short tagline</label>
                <Input
                  value={form.platformTagline}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      platformTagline: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Interface behavior</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Default rendering behavior for this platform workspace.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Default theme</label>
                <Select
                  value={form.defaultThemeBehavior}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      defaultThemeBehavior: event.target.value as PlatformSettings["defaultThemeBehavior"],
                    }))
                  }
                >
                  <option value="system">Follow system</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="small">Layout density</label>
                <Select
                  value={form.uiDensity}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      uiDensity: event.target.value as PlatformSettings["uiDensity"],
                    }))
                  }
                >
                  <option value="comfortable">Comfortable spacing</option>
                  <option value="compact">Compact spacing</option>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="small">Animation mode</label>
                <Select
                  value={form.reducedMotion ? "reduced" : "standard"}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      reducedMotion: event.target.value === "reduced",
                    }))
                  }
                >
                  <option value="standard">Standard animations</option>
                  <option value="reduced">Reduced motion</option>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Maintenance and support</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Broadcast platform operational state and support path.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Maintenance mode banner</label>
                <Select
                  value={form.maintenanceModeEnabled ? "enabled" : "disabled"}
                  onChange={(event) => setForm((prev) => ({ ...prev, maintenanceModeEnabled: event.target.value === "enabled" }))}
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="small">Support contact email</label>
                <Input
                  type="email"
                  placeholder="support@domain.com"
                  value={form.supportContactEmail}
                  onChange={(event) => setForm((prev) => ({ ...prev, supportContactEmail: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="small">Maintenance message</label>
                <Input
                  placeholder="Maintenance in progress. Some actions may be delayed."
                  value={form.maintenanceMessage}
                  onChange={(event) => setForm((prev) => ({ ...prev, maintenanceMessage: event.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">Global announcement banner</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Displayed across dashboards while active and before expiry.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Announcement status</label>
                <Select
                  value={form.announcementEnabled ? "enabled" : "disabled"}
                  onChange={(event) => setForm((prev) => ({ ...prev, announcementEnabled: event.target.value === "enabled" }))}
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="small">Banner color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcementPickerColor}
                    onChange={(event) => setForm((prev) => ({ ...prev, announcementColor: event.target.value.toUpperCase() }))}
                    className="h-10 w-14 cursor-pointer rounded-[10px] border border-[var(--edge)] bg-transparent p-1"
                  />
                  <Input
                    value={form.announcementColor}
                    onChange={(event) => setForm((prev) => ({ ...prev, announcementColor: event.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="small">Announcement message</label>
                <Input
                  placeholder="Platform update tonight at 11:00 PM."
                  value={form.announcementMessage}
                  onChange={(event) => setForm((prev) => ({ ...prev, announcementMessage: event.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="small">Announcement expiry (optional)</label>
                <Input
                  type="datetime-local"
                  value={normalizeAnnouncementDateInput(form.announcementExpiresAt)}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      announcementExpiresAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_84%,var(--surface-2))] p-4 md:p-5">
            <h3 className="h3">System health panel</h3>
            <p className="small mt-1 text-[var(--muted-text)]">Shows live API and database status on the System Dashboard.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="small">Health panel visibility</label>
                <Select
                  value={form.showSystemHealthPanel ? "enabled" : "disabled"}
                  onChange={(event) => setForm((prev) => ({ ...prev, showSystemHealthPanel: event.target.value === "enabled" }))}
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </Select>
              </div>
              {form.showSystemHealthPanel ? (
                <div className="rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_90%,var(--surface-2))] p-3">
                  <p className="small font-medium text-[var(--text)]">Live status preview</p>
                  <p className="tiny mt-1 text-[var(--muted-text)]">
                    {healthQuery.isLoading
                      ? "Checking..."
                      : healthQuery.isError
                        ? "Health check unavailable"
                        : `Overall: ${health?.status ?? "UNKNOWN"} | API: ${health?.api ?? "?"} | DB: ${health?.database ?? "?"}`}
                  </p>
                  {health?.database_error ? <p className="tiny mt-1 text-[var(--danger)]">DB error: {health.database_error}</p> : null}
                </div>
              ) : null}
            </div>
          </section>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--edge)] pt-4">
              <Button type="button" variant="secondary" onClick={handleReset}>
                Reset defaults
              </Button>
              <Button type="submit" disabled={!isDirty || saving}>
                {saving ? "Saving..." : "Save platform settings"}
              </Button>
            </div>
          </form>
        </Card>
        <ChangePasswordPanel />
      </div>
    </PageScaffold>
  );
}
