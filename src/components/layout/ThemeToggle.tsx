"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const effectiveTheme = resolvedTheme ?? theme;
  const isDark = effectiveTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = `Switch to ${nextTheme} mode`;

  return (
    <Button
      variant="secondary"
      size="sm"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
      className="min-w-10"
    >
      {theme === "system" ? <Monitor className="size-4" /> : isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}
