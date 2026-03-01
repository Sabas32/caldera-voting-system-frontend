import { Card } from "@/components/ui/card";

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-[var(--danger)]/20">
      <h3 className="h3">{title}</h3>
      <p className="mt-2 small text-[var(--muted-text)]">{description}</p>
    </Card>
  );
}
