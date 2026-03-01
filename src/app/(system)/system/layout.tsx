import { SystemShell } from "@/components/layout/SystemShell";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return <SystemShell>{children}</SystemShell>;
}
