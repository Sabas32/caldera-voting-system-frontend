"use client";

import * as Tabs from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const TabsRoot = Tabs.Root;

export function TabsList({ className, ...props }: Tabs.TabsListProps) {
  return (
    <Tabs.List
      className={cn("inline-flex h-10 items-center rounded-[10px] bg-[var(--surface-2)] p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: Tabs.TabsTriggerProps) {
  return (
    <Tabs.Trigger
      className={cn(
        "rounded-[8px] px-3 py-1.5 text-sm text-[var(--muted-text)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--text)]",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = Tabs.Content;
