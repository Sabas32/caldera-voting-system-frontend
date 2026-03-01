import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] bg-[color-mix(in_oklab,var(--surface)_70%,var(--surface-2))] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.45s_infinite] before:bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--primary)_30%,transparent),transparent)]",
        className,
      )}
    />
  );
}
