import type {
  AppStateResponse,
  GradeSports,
  LeaguePayload,
  MatchRecord,
  TeamGroup,
} from "./types";

async function parseJson<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "요청에 실패했습니다.");
  }
  return body as T;
}

export function fetchLeague() {
  return parseJson<AppStateResponse>(fetch("/api/league", { cache: "no-store" }));
}

export function loginAdmin(pin: string) {
  return parseJson<{ ok: boolean; isAdmin: boolean }>(
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    }),
  );
}

export function logoutAdmin() {
  return parseJson<{ ok: boolean }>(fetch("/api/auth", { method: "DELETE" }));
}

export function saveGradeSports(gradeSports: GradeSports) {
  return parseJson<AppStateResponse>(
    fetch("/api/league/sport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gradeSports }),
    }),
  );
}

export function saveGroups(payload: {
  grade: number;
  sport: string;
  groups: TeamGroup[];
  regenerate: boolean;
}) {
  return parseJson<AppStateResponse>(
    fetch("/api/league/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function saveMatch(payload: {
  grade: number;
  sport: string;
  type: "link" | "finals";
  matchId: string;
  fields: Partial<MatchRecord>;
}) {
  return parseJson<AppStateResponse>(
    fetch("/api/league/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function autoFillFinals(payload: { grade: number; sport: string }) {
  return parseJson<AppStateResponse>(
    fetch("/api/league/finals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function resetCategory(payload: { grade: number; sport: string }) {
  return parseJson<AppStateResponse>(
    fetch("/api/league/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function importLeague(payload: LeaguePayload) {
  return parseJson<AppStateResponse>(
    fetch("/api/league/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function exportLeague() {
  return parseJson<LeaguePayload>(fetch("/api/league/backup"));
}
