"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Topbar } from "@/components/layout/Topbar";
import { PlatformNotices } from "@/components/layout/PlatformNotices";
import { apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride, clearPrimaryColorOverride, getPrimaryColorVariables } from "@/lib/brandTheme";
import { APP_NAME } from "@/lib/constants";
import { endpoints } from "@/lib/endpoints";
import {
  clearVoterAutoLogoutSecondsForElection,
  getVoterAutoLogoutSecondsForElection,
  getVoterOrganizationNameForElection,
  getVoterPrimaryColorForElection,
  getVoterResultsViewUntilForElection,
  setVoterOrganizationNameForElection,
  setVoterPrimaryColorForElection,
} from "@/lib/voterAutoLogout";

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const timeoutHandledRef = useRef(false);
  const isElectionPage = pathname?.startsWith("/e/") ?? false;
  const electionSlug = useMemo(() => {
    if (!isElectionPage || !pathname) {
      return null;
    }
    const parts = pathname.split("/");
    return parts.length > 2 ? parts[2] : null;
  }, [isElectionPage, pathname]);
  const electionStage = useMemo(() => {
    if (!isElectionPage || !pathname) {
      return null;
    }
    const parts = pathname.split("/");
    return parts.length > 3 ? parts[3] : null;
  }, [isElectionPage, pathname]);
  const isResultsStage = electionStage === "status" || electionStage === "results";
  const votingAutoLogoutSeconds = useMemo(
    () => getVoterAutoLogoutSecondsForElection(electionSlug),
    [electionSlug],
  );
  const resultsViewUntil = useMemo(
    () => getVoterResultsViewUntilForElection(electionSlug),
    [electionSlug],
  );

  const themeProbePaths = useMemo(() => {
    if (!electionSlug) {
      return [];
    }
    if (electionStage === "results") {
      return [endpoints.vote.results(electionSlug), endpoints.vote.status(electionSlug), endpoints.vote.ballot(electionSlug)];
    }
    if (electionStage === "status") {
      return [endpoints.vote.status(electionSlug), endpoints.vote.results(electionSlug), endpoints.vote.ballot(electionSlug)];
    }
    return [endpoints.vote.ballot(electionSlug), endpoints.vote.status(electionSlug), endpoints.vote.results(electionSlug)];
  }, [electionSlug, electionStage]);

  const themeQuery = useQuery({
    queryKey: ["public-election-theme", electionSlug, electionStage],
    enabled: Boolean(electionSlug) && isElectionPage,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      for (const path of themeProbePaths) {
        try {
          const payload = await apiClient<{
            data?: {
              organization_name?: string | null;
              primary_color_override?: string | null;
              election?: { organization_name?: string | null; primary_color_override?: string | null };
            };
          }>(path);
          const organizationName = payload.data?.organization_name ?? payload.data?.election?.organization_name ?? null;
          const color = payload.data?.primary_color_override ?? payload.data?.election?.primary_color_override ?? null;
          if (organizationName || color) {
            return { organizationName, color };
          }
        } catch {
          continue;
        }
      }
      return { organizationName: null, color: null };
    },
  });

  const activeShellColor = themeQuery.data?.color ?? getVoterPrimaryColorForElection(electionSlug);
  const activeOrganizationName = themeQuery.data?.organizationName ?? getVoterOrganizationNameForElection(electionSlug);
  const shellThemeVars = isElectionPage ? getPrimaryColorVariables(activeShellColor) : null;

  useEffect(() => {
    if (!isElectionPage) {
      clearPrimaryColorOverride();
      return;
    }
    applyPrimaryColorOverride(activeShellColor);
  }, [activeShellColor, electionSlug, isElectionPage, pathname]);

  useEffect(() => {
    if (!electionSlug || !themeQuery.data) {
      return;
    }
    if (themeQuery.data.color) {
      setVoterPrimaryColorForElection(electionSlug, themeQuery.data.color);
      applyPrimaryColorOverride(themeQuery.data.color);
    }
    if (themeQuery.data.organizationName) {
      setVoterOrganizationNameForElection(electionSlug, themeQuery.data.organizationName);
    }
  }, [electionSlug, themeQuery.data]);

  const { mutate: logout, isPending: logoutPending } = useMutation({
    mutationFn: (reason: "manual" | "timeout") => apiClient(endpoints.vote.logout, { method: "GET" }).then(() => reason),
    onSuccess: (reason) => {
      if (reason === "timeout") {
        toast.info("You were automatically logged out.");
      } else {
        toast.success("Logged out");
      }
      clearVoterAutoLogoutSecondsForElection(electionSlug);
      router.replace("/vote");
    },
    onError: (_error: Error, reason: "manual" | "timeout") => {
      clearVoterAutoLogoutSecondsForElection(electionSlug);
      if (reason === "timeout") {
        toast.info("Your session ended and you were signed out.");
      } else {
        toast.info("You have been signed out.");
      }
      router.replace("/vote");
    },
  });

  useEffect(() => {
    if (!isElectionPage) {
      timeoutHandledRef.current = false;
      const clearSessionTimeout = window.setTimeout(() => setTimerStartedAt(null), 0);
      return () => window.clearTimeout(clearSessionTimeout);
    }

    timeoutHandledRef.current = false;
    const startSessionTimeout = window.setTimeout(() => {
      setTimerStartedAt(Date.now());
      setNowTs(Date.now());
    }, 0);
    const intervalId = window.setInterval(() => setNowTs(Date.now()), 1000);

    return () => {
      window.clearTimeout(startSessionTimeout);
      window.clearInterval(intervalId);
    };
  }, [electionSlug, electionStage, isElectionPage]);

  const remainingSeconds = useMemo(() => {
    if (!isElectionPage) {
      return votingAutoLogoutSeconds;
    }
    if (isResultsStage) {
      const deadline = resultsViewUntil ? new Date(resultsViewUntil).getTime() : NaN;
      if (Number.isFinite(deadline)) {
        return Math.max(0, Math.ceil((deadline - nowTs) / 1000));
      }
      return Number.POSITIVE_INFINITY;
    }
    if (timerStartedAt === null) {
      return votingAutoLogoutSeconds;
    }
    const deadline = timerStartedAt + votingAutoLogoutSeconds * 1000;
    return Math.max(0, Math.ceil((deadline - nowTs) / 1000));
  }, [isElectionPage, isResultsStage, nowTs, resultsViewUntil, timerStartedAt, votingAutoLogoutSeconds]);

  useEffect(() => {
    if (!isElectionPage || !Number.isFinite(remainingSeconds) || remainingSeconds > 0 || timeoutHandledRef.current || logoutPending) {
      return;
    }
    if (!isResultsStage && timerStartedAt === null) {
      return;
    }
    timeoutHandledRef.current = true;
    logout("timeout");
  }, [isElectionPage, isResultsStage, logout, logoutPending, remainingSeconds, timerStartedAt]);

  useEffect(
    () => () => {
      clearPrimaryColorOverride();
    },
    [],
  );

  const statusText = useMemo(() => {
    if (!isElectionPage) {
      return undefined;
    }
    if (isResultsStage) {
      if (!Number.isFinite(remainingSeconds)) {
        return "Results window active";
      }
      return `Results session logout ${formatCountdown(remainingSeconds)}`;
    }
    return `Voting session logout ${formatCountdown(remainingSeconds)}`;
  }, [isElectionPage, isResultsStage, remainingSeconds]);

  return (
    <div className="min-h-screen pb-4" style={shellThemeVars ?? undefined}>
      <Topbar
        title={activeOrganizationName ? `${activeOrganizationName} Voter` : `${APP_NAME} Voter`}
        statusText={statusText}
        onLogout={isElectionPage ? () => logout("manual") : undefined}
        logoutPending={logoutPending}
      />
      <PlatformNotices />
      <main className="container-page py-6 md:py-8">{children}</main>
    </div>
  );
}
