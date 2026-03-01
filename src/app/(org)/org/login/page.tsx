import { Card } from "@/components/ui/card";
import { OrgLoginForm } from "@/components/forms/OrgLoginForm";

export default function OrgLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="h2">Organization Admin Login</h1>
        <p className="small mt-1 text-[var(--muted-text)]">Sign in to manage elections, tokens, and results.</p>
        <div className="mt-6">
          <OrgLoginForm />
        </div>
      </Card>
    </div>
  );
}
