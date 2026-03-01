import { OrgShell } from "@/components/layout/OrgShell";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <OrgShell>{children}</OrgShell>;
}
