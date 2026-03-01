import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5 tiny uppercase tracking-[0.08em] text-[var(--muted-text)]">
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
          {item.href ? (
            <Link
              href={item.href}
              className="rounded-[8px] px-2 py-1 transition hover:bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] hover:text-[var(--text)]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="rounded-[8px] bg-[color-mix(in_oklab,var(--surface)_75%,var(--surface-2))] px-2 py-1 text-[var(--text)]">{item.label}</span>
          )}
          {idx < items.length - 1 ? <ChevronRight className="size-3" /> : null}
        </div>
      ))}
    </div>
  );
}
