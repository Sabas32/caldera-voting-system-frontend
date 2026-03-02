"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

import { applyPlatformSettingsToDocument, PLATFORM_SETTINGS_EVENT, readPlatformSettings } from "@/lib/platformSettings";

const NEXT_THEME_STORAGE_KEY = "theme";

function PlatformSettingsSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const apply = () => {
      const settings = readPlatformSettings();
      applyPlatformSettingsToDocument(settings);
      const explicitTheme = window.localStorage.getItem(NEXT_THEME_STORAGE_KEY);
      if (!explicitTheme) {
        setTheme(settings.defaultThemeBehavior);
      }
    };

    apply();
    window.addEventListener(PLATFORM_SETTINGS_EVENT, apply);
    window.addEventListener("storage", apply);

    return () => {
      window.removeEventListener(PLATFORM_SETTINGS_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, [setTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 0,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchInterval: 5_000,
            refetchIntervalInBackground: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <PlatformSettingsSync />
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

