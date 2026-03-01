import { normalizeHexColor } from "@/lib/brandTheme";
import { APP_NAME } from "@/lib/constants";

export type ThemeBehavior = "system" | "light" | "dark";
export type UiDensity = "comfortable" | "compact";

export type PlatformSettings = {
  platformName: string;
  platformTagline: string;
  defaultThemeBehavior: ThemeBehavior;
  uiDensity: UiDensity;
  reducedMotion: boolean;
  maintenanceModeEnabled: boolean;
  maintenanceMessage: string;
  supportContactEmail: string;
  showSystemHealthPanel: boolean;
  announcementEnabled: boolean;
  announcementMessage: string;
  announcementColor: string;
  announcementExpiresAt: string;
};

export const PLATFORM_SETTINGS_STORAGE_KEY = "caldera:platform-settings";
export const PLATFORM_SETTINGS_EVENT = "caldera:platform-settings-change";
export const DEFAULT_ANNOUNCEMENT_COLOR = "#2563EB";

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: APP_NAME,
  platformTagline: "Secure, token-based elections",
  defaultThemeBehavior: "system",
  uiDensity: "comfortable",
  reducedMotion: false,
  maintenanceModeEnabled: false,
  maintenanceMessage: "Platform maintenance is currently in progress.",
  supportContactEmail: "",
  showSystemHealthPanel: true,
  announcementEnabled: false,
  announcementMessage: "",
  announcementColor: DEFAULT_ANNOUNCEMENT_COLOR,
  announcementExpiresAt: "",
};

function isThemeBehavior(value: unknown): value is ThemeBehavior {
  return value === "system" || value === "light" || value === "dark";
}

function isUiDensity(value: unknown): value is UiDensity {
  return value === "comfortable" || value === "compact";
}

function normalizeAnnouncementColor(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_ANNOUNCEMENT_COLOR;
  }
  return normalizeHexColor(value) ?? DEFAULT_ANNOUNCEMENT_COLOR;
}

function normalizeAnnouncementExpiresAt(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return trimmed;
}

function sanitizeSettings(value: unknown): PlatformSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }

  const candidate = value as Partial<PlatformSettings>;
  const platformName = typeof candidate.platformName === "string" && candidate.platformName.trim() ? candidate.platformName.trim() : APP_NAME;
  const platformTagline = typeof candidate.platformTagline === "string" ? candidate.platformTagline.trim() : DEFAULT_PLATFORM_SETTINGS.platformTagline;
  const maintenanceMessage = typeof candidate.maintenanceMessage === "string" ? candidate.maintenanceMessage.trim() : DEFAULT_PLATFORM_SETTINGS.maintenanceMessage;
  const supportContactEmail = typeof candidate.supportContactEmail === "string" ? candidate.supportContactEmail.trim() : "";
  const announcementMessage = typeof candidate.announcementMessage === "string" ? candidate.announcementMessage.trim() : "";

  return {
    platformName,
    platformTagline,
    defaultThemeBehavior: isThemeBehavior(candidate.defaultThemeBehavior) ? candidate.defaultThemeBehavior : DEFAULT_PLATFORM_SETTINGS.defaultThemeBehavior,
    uiDensity: isUiDensity(candidate.uiDensity) ? candidate.uiDensity : DEFAULT_PLATFORM_SETTINGS.uiDensity,
    reducedMotion: Boolean(candidate.reducedMotion),
    maintenanceModeEnabled: Boolean(candidate.maintenanceModeEnabled),
    maintenanceMessage,
    supportContactEmail,
    showSystemHealthPanel: candidate.showSystemHealthPanel === undefined ? DEFAULT_PLATFORM_SETTINGS.showSystemHealthPanel : Boolean(candidate.showSystemHealthPanel),
    announcementEnabled: Boolean(candidate.announcementEnabled),
    announcementMessage,
    announcementColor: normalizeAnnouncementColor(candidate.announcementColor),
    announcementExpiresAt: normalizeAnnouncementExpiresAt(candidate.announcementExpiresAt),
  };
}

export function getDefaultPlatformSettings(): PlatformSettings {
  return { ...DEFAULT_PLATFORM_SETTINGS };
}

export function readPlatformSettings(): PlatformSettings {
  if (typeof window === "undefined") {
    return getDefaultPlatformSettings();
  }

  try {
    const raw = window.localStorage.getItem(PLATFORM_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return getDefaultPlatformSettings();
    }
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return getDefaultPlatformSettings();
  }
}

export function savePlatformSettings(settings: PlatformSettings) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = sanitizeSettings(settings);
  window.localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(PLATFORM_SETTINGS_EVENT, { detail: normalized }));
}

export function applyPlatformSettingsToDocument(settings: PlatformSettings) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = sanitizeSettings(settings);
  const root = document.documentElement;
  root.dataset.uiDensity = normalized.uiDensity;
  root.classList.toggle("reduce-motion", normalized.reducedMotion);
}

function parseFutureDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getAnnouncementExpiryDate(settings: PlatformSettings): Date | null {
  return parseFutureDate(settings.announcementExpiresAt);
}

export function isAnnouncementActive(settings: PlatformSettings, now: Date = new Date()): boolean {
  if (!settings.announcementEnabled || !settings.announcementMessage.trim()) {
    return false;
  }
  const expiry = getAnnouncementExpiryDate(settings);
  if (!expiry) {
    return true;
  }
  return expiry.getTime() > now.getTime();
}

