const AUTO_LOGOUT_MAP_KEY = "caldera:voter-auto-logout-map";

export const DEFAULT_VOTER_AUTO_LOGOUT_SECONDS = 60;
export const MIN_VOTER_AUTO_LOGOUT_SECONDS = 30;
export const MAX_VOTER_AUTO_LOGOUT_SECONDS = 3600;

type ElectionTimerConfig = {
  voting_seconds: number;
  results_view_until: string | null;
  primary_color_override: string | null;
  organization_name: string | null;
};

function clampVoting(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_VOTER_AUTO_LOGOUT_SECONDS;
  }
  return Math.min(MAX_VOTER_AUTO_LOGOUT_SECONDS, Math.max(MIN_VOTER_AUTO_LOGOUT_SECONDS, Math.round(value)));
}

function readMap(): Record<string, ElectionTimerConfig> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.sessionStorage.getItem(AUTO_LOGOUT_MAP_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, ElectionTimerConfig> = {};
    for (const [key, value] of Object.entries(parsed)) {
      // Backward compatibility with old payload shape: {slug: number}
      if (typeof value === "number") {
        next[key] = {
          voting_seconds: clampVoting(value),
          results_view_until: null,
          primary_color_override: null,
          organization_name: null,
        };
      } else if (value && typeof value === "object") {
        const candidate = value as Partial<ElectionTimerConfig>;
        next[key] = {
          voting_seconds: clampVoting(Number(candidate.voting_seconds ?? DEFAULT_VOTER_AUTO_LOGOUT_SECONDS)),
          results_view_until: typeof candidate.results_view_until === "string" ? candidate.results_view_until : null,
          primary_color_override: typeof candidate.primary_color_override === "string" ? candidate.primary_color_override : null,
          organization_name: typeof candidate.organization_name === "string" ? candidate.organization_name : null,
        };
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, ElectionTimerConfig>) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(AUTO_LOGOUT_MAP_KEY, JSON.stringify(map));
}

export function setVoterAutoLogoutSecondsForElection(slug: string, seconds: number) {
  if (!slug) {
    return;
  }
  const map = readMap();
  map[slug] = {
    voting_seconds: clampVoting(seconds),
    results_view_until: map[slug]?.results_view_until ?? null,
    primary_color_override: map[slug]?.primary_color_override ?? null,
    organization_name: map[slug]?.organization_name ?? null,
  };
  writeMap(map);
}

export function setVoterResultsWindowForElection(slug: string, viewUntil: string | null = null) {
  if (!slug) {
    return;
  }
  const map = readMap();
  map[slug] = {
    voting_seconds: map[slug]?.voting_seconds ?? DEFAULT_VOTER_AUTO_LOGOUT_SECONDS,
    results_view_until: viewUntil,
    primary_color_override: map[slug]?.primary_color_override ?? null,
    organization_name: map[slug]?.organization_name ?? null,
  };
  writeMap(map);
}

export function setVoterPrimaryColorForElection(slug: string, primaryColorOverride: string | null = null) {
  if (!slug) {
    return;
  }
  const map = readMap();
  map[slug] = {
    voting_seconds: map[slug]?.voting_seconds ?? DEFAULT_VOTER_AUTO_LOGOUT_SECONDS,
    results_view_until: map[slug]?.results_view_until ?? null,
    primary_color_override: typeof primaryColorOverride === "string" ? primaryColorOverride : null,
    organization_name: map[slug]?.organization_name ?? null,
  };
  writeMap(map);
}

export function setVoterOrganizationNameForElection(slug: string, organizationName: string | null = null) {
  if (!slug) {
    return;
  }
  const map = readMap();
  map[slug] = {
    voting_seconds: map[slug]?.voting_seconds ?? DEFAULT_VOTER_AUTO_LOGOUT_SECONDS,
    results_view_until: map[slug]?.results_view_until ?? null,
    primary_color_override: map[slug]?.primary_color_override ?? null,
    organization_name: typeof organizationName === "string" && organizationName.trim() ? organizationName.trim() : null,
  };
  writeMap(map);
}

export function getVoterAutoLogoutSecondsForElection(slug: string | null | undefined): number {
  if (!slug) {
    return DEFAULT_VOTER_AUTO_LOGOUT_SECONDS;
  }
  const map = readMap();
  return clampVoting(map[slug]?.voting_seconds ?? DEFAULT_VOTER_AUTO_LOGOUT_SECONDS);
}

export function getVoterResultsViewUntilForElection(slug: string | null | undefined): string | null {
  if (!slug) {
    return null;
  }
  const map = readMap();
  return map[slug]?.results_view_until ?? null;
}

export function getVoterPrimaryColorForElection(slug: string | null | undefined): string | null {
  if (!slug) {
    return null;
  }
  const map = readMap();
  return map[slug]?.primary_color_override ?? null;
}

export function getVoterOrganizationNameForElection(slug: string | null | undefined): string | null {
  if (!slug) {
    return null;
  }
  const map = readMap();
  return map[slug]?.organization_name ?? null;
}

export function clearVoterAutoLogoutSecondsForElection(slug: string | null | undefined) {
  if (!slug) {
    return;
  }
  const map = readMap();
  delete map[slug];
  writeMap(map);
}
