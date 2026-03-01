import { Card } from "@/components/ui/card";
import { SystemLoginForm } from "@/components/forms/SystemLoginForm";

export default function SystemLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="h2">System Admin Login</h1>
        <p className="small mt-1 text-[var(--muted-text)]">Sign in to manage organizations and platform governance.</p>
        <div className="mt-6">
          <SystemLoginForm />
        </div>
      </Card>
    </div>
  );
}
