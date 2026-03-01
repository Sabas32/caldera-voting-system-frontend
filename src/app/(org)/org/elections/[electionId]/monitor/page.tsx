"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { TurnoutChart } from "@/components/charts/TurnoutChart";
import { PageScaffold } from "@/components/layout/PageScaffold";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import { endpoints } from "@/lib/endpoints";

type ElectionDetailResponse = {
  data: {
    turnout_series: Array<{ day: string; count: number }>;
  };
};

export default function ElectionMonitorPage() {
  const { electionId } = useParams<{ electionId: string }>();

  const query = useQuery({
    queryKey: ["org-election-monitor", electionId],
    enabled: Boolean(electionId),
    queryFn: () => apiClient<ElectionDetailResponse>(endpoints.org.electionDetail(electionId)),
    refetchInterval: 2_000,
  });

  return (
    <PageScaffold
      title="Live Monitor"
      subtitle={`Election ID: ${electionId ?? ""} - real-time sync every 2s`}
      crumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Elections", href: "/org/elections" },
        { label: "Monitor" },
      ]}
    >
      <Card>
        <TurnoutChart data={(query.data?.data.turnout_series ?? []).map((item) => ({ day: String(item.day), count: item.count }))} />
      </Card>
    </PageScaffold>
  );
}
