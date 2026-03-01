import { ElectionSubnav } from "@/components/layout/ElectionSubnav";

export default async function ElectionDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;

  return (
    <>
      <ElectionSubnav electionId={electionId} />
      {children}
    </>
  );
}
