"use client";

import { useEffect, useState } from "react";

import { PLATFORM_SETTINGS_EVENT, PlatformSettings, readPlatformSettings } from "@/lib/platformSettings";

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(() => readPlatformSettings());

  useEffect(() => {
    const sync = () => setSettings(readPlatformSettings());
    window.addEventListener(PLATFORM_SETTINGS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PLATFORM_SETTINGS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return settings;
}

