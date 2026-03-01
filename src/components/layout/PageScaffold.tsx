import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Reveal } from "@/components/motion/Reveal";
import { PageTransition } from "@/components/motion/PageTransition";

export function PageScaffold({
  title,
  subtitle,
  crumbs,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  crumbs: Array<{ label: string; href?: string }>;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <PageTransition>
      <Breadcrumbs items={crumbs} />
      <Reveal>
        <div className="relative mb-6 overflow-hidden rounded-[18px] border border-[var(--edge)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_86%,transparent),color-mix(in_oklab,var(--surface)_74%,var(--surface-2)))] px-4 py-5 shadow-[0_18px_40px_var(--shadow)] md:px-6">
          <div className="pointer-events-none absolute -right-10 -top-14 size-44 rounded-full bg-[color-mix(in_oklab,var(--primary)_26%,transparent)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 size-36 rounded-full bg-[color-mix(in_oklab,var(--info)_18%,transparent)] blur-2xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="h1">{title}</h1>
              {subtitle ? <p className="small mt-1 text-[var(--muted-text)]">{subtitle}</p> : null}
            </div>
            {actions}
          </div>
        </div>
      </Reveal>
      {children}
    </PageTransition>
  );
}
