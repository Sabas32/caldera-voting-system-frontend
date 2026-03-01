import { Card } from "@/components/ui/card";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="text-center">
      <h3 className="h3">{title}</h3>
      <p className="mt-2 small text-[var(--muted-text)]">{description}</p>
    </Card>
  );
}
