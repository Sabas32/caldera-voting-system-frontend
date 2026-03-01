import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeletons() {
  return (
    <div className="container-page space-y-4 py-6">
      <Skeleton className="h-10 w-64 rounded-[12px]" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-10 w-36" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-4 h-56 w-full rounded-[14px]" />
      </Card>
    </div>
  );
}
