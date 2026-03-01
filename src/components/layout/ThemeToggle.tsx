"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Laptop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" aria-label="Theme">
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => {
          const Icon = item.icon;
          const active = theme === item.value;
          return (
            <DropdownMenuItem key={item.value} onClick={() => setTheme(item.value)}>
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </div>
                {active ? <Check className="size-4" /> : null}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
