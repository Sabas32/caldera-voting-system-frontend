"use client";

import type { CSSProperties } from "react";
import { AlertTriangle, Mail, Megaphone } from "lucide-react";

import { isAnnouncementActive } from "@/lib/platformSettings";
import { usePlatformSettings } from "@/lib/usePlatformSettings";

export function PlatformNotices() {
  const settings = usePlatformSettings();
  const showMaintenance = settings.maintenanceModeEnabled && settings.maintenanceMessage.trim().length > 0;
  const showAnnouncement = isAnnouncementActive(settings);
  const showSupport = settings.supportContactEmail.trim().length > 0;
  const announcementExpiry = settings.announcementExpiresAt ? new Date(settings.announcementExpiresAt) : null;
  const hasAnnouncementExpiry = announcementExpiry && !Number.isNaN(announcementExpiry.getTime());

  if (!showMaintenance && !showAnnouncement && !showSupport) {
    return null;
  }

  return (
    <div className="container-page space-y-2 pt-3">
      {showMaintenance ? (
        <div className="flex items-start gap-2 rounded-[12px] border border-[color-mix(in_oklab,var(--danger)_58%,var(--edge))] bg-[color-mix(in_oklab,var(--danger)_14%,var(--surface))] px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 text-[var(--danger)]" />
          <div className="min-w-0">
            <p className="small font-semibold text-[var(--text)]">Maintenance mode active</p>
            <p className="small text-[var(--muted-text)]">{settings.maintenanceMessage}</p>
          </div>
        </div>
      ) : null}

      {showAnnouncement ? (
        <div
          className="flex items-start gap-2 rounded-[12px] border px-3 py-2.5"
          style={
            {
              borderColor: `color-mix(in oklab, ${settings.announcementColor} 55%, var(--edge))`,
              backgroundColor: `color-mix(in oklab, ${settings.announcementColor} 16%, var(--surface))`,
            } as CSSProperties
          }
        >
          <Megaphone className="mt-0.5 size-4" style={{ color: settings.announcementColor }} />
          <div className="min-w-0">
            <p className="small font-semibold text-[var(--text)]">Announcement</p>
            <p className="small text-[var(--muted-text)]">{settings.announcementMessage}</p>
            {hasAnnouncementExpiry ? (
              <p className="tiny mt-1 text-[var(--muted-text)]">Expires: {announcementExpiry.toLocaleString()}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showSupport ? (
        <div className="flex items-center gap-2 rounded-[12px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_86%,var(--surface-2))] px-3 py-2">
          <Mail className="size-4 text-[var(--muted-text)]" />
          <p className="small text-[var(--muted-text)]">
            Support:{" "}
            <a className="font-medium text-[var(--text)] underline-offset-2 hover:underline" href={`mailto:${settings.supportContactEmail}`}>
              {settings.supportContactEmail}
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
