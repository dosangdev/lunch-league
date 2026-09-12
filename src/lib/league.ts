import type {
  CategoryData,
  FinalsMap,
  GradeSports,
  MatchRecord,
  MatchResult,
  StandingRow,
  TeamGroup,
} from "./types";

export const GRADES = [1, 2, 3] as const;
export const SPORTS = ["ultimate", "volleyball"] as const;

export const DEFAULT_GRADE_SPORTS: GradeSports = {
  1: "ultimate",
  2: "volleyball",
  3: "ultimate",
};

export function categoryKey(grade: number, sport: string) {
  return `${grade}_${sport}`;
}

export function sportLabel(sport: string) {
  return sport === "volleyball" ? "배구" : "얼티미트";
}

export function sportIcon(sport: string) {
  return sport === "volleyball" ? "🏐" : "🥏";
}

export function createEmptyMatch(
  id: string,
  extra: Partial<MatchRecord> = {},
): MatchRecord {
  return {
    id,
    teamA: "",
    teamB: "",
    s1A: 0,
    s1B: 0,
    s2A: 0,
    s2B: 0,
    s3A: 0,
    s3B: 0,
    date: "",
    status: "pending",
    ...extra,
  };
}

export function createDefaultFinals(): FinalsMap {
  return {
    sf1: createEmptyMatch("sf1", {
      name: "준결승 1경기",
      teamA: "1위 팀",
      teamB: "4위 팀",
    }),
    sf2: createEmptyMatch("sf2", {
      name: "준결승 2경기",
      teamA: "2위 팀",
      teamB: "3위 팀",
    }),
    final: createEmptyMatch("final", {
      name: "결승전",
      teamA: "준결승1 승자",
      teamB: "준결승2 승자",
    }),
  };
}

export function createDefaultGroups(prefix = ""): TeamGroup[] {
  return [
    {
      id: `${prefix}group_A`,
      name: "A조",
      teams: ["1반", "2반", "3반", "4반"],
    },
  ];
}

export function generateLinkMatchesForGroups(groups: TeamGroup[]): MatchRecord[] {
  const matches: MatchRecord[] = [];

  groups.forEach((grp) => {
    const teams = grp.teams.filter((t) => t.trim() !== "");
    const n = teams.length;

    if (n >= 3) {
      for (let i = 0; i < n; i++) {
        matches.push(
          createEmptyMatch(`link_${grp.id}_${i}_${Date.now()}_${i}`, {
            groupId: grp.id,
            groupName: grp.name,
            teamA: teams[i],
            teamB: teams[(i + 1) % n],
          }),
        );
      }
    } else if (n === 2) {
      matches.push(
        createEmptyMatch(`link_${grp.id}_0_${Date.now()}`, {
          groupId: grp.id,
          groupName: grp.name,
          teamA: teams[0],
          teamB: teams[1],
        }),
      );
    }
  });

  return matches;
}

export function createInitialCategory(grade?: number, sport?: string): CategoryData {
  const prefix = grade && sport ? `${categoryKey(grade, sport)}_` : "";
  const groups = createDefaultGroups(prefix);
  return {
    groups,
    linkMatches: generateLinkMatchesForGroups(groups),
    finals: createDefaultFinals(),
  };
}

export function createInitialData() {
  const data: Record<string, CategoryData> = {};
  GRADES.forEach((grade) => {
    SPORTS.forEach((sport) => {
      data[categoryKey(grade, sport)] = createInitialCategory(grade, sport);
    });
  });
  return data;
}

export function calculateMatchResult(match: MatchRecord): MatchResult {
  let setsA = 0;
  let setsB = 0;
  let totalPtsA = 0;
  let totalPtsB = 0;

  const applySet = (a: number, b: number) => {
    if (a > b) setsA += 1;
    else if (b > a) setsB += 1;
    totalPtsA += a || 0;
    totalPtsB += b || 0;
  };

  applySet(match.s1A, match.s1B);
  applySet(match.s2A, match.s2B);
  applySet(match.s3A, match.s3B);

  let winner: MatchResult["winner"] = null;
  if (setsA > setsB) winner = "A";
  else if (setsB > setsA) winner = "B";

  return { setsA, setsB, totalPtsA, totalPtsB, winner };
}

export function calculateGroupStandings(
  group: TeamGroup,
  linkMatches: MatchRecord[],
): StandingRow[] {
  const stats: Record<string, StandingRow> = {};

  group.teams.forEach((team) => {
    if (!team.trim()) return;
    stats[team] = {
      team,
      groupId: group.id,
      groupName: group.name,
      played: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      setDiff: 0,
      ptsWon: 0,
      ptsLost: 0,
      ptDiff: 0,
    };
  });

  linkMatches.forEach((match) => {
    if (match.groupId !== group.id || match.status !== "completed") return;
    const result = calculateMatchResult(match);

    if (stats[match.teamA]) {
      stats[match.teamA].played += 1;
      stats[match.teamA].setsWon += result.setsA;
      stats[match.teamA].setsLost += result.setsB;
      stats[match.teamA].ptsWon += result.totalPtsA;
      stats[match.teamA].ptsLost += result.totalPtsB;
      if (result.winner === "A") stats[match.teamA].wins += 1;
      if (result.winner === "B") stats[match.teamA].losses += 1;
    }

    if (stats[match.teamB]) {
      stats[match.teamB].played += 1;
      stats[match.teamB].setsWon += result.setsB;
      stats[match.teamB].setsLost += result.setsA;
      stats[match.teamB].ptsWon += result.totalPtsB;
      stats[match.teamB].ptsLost += result.totalPtsA;
      if (result.winner === "B") stats[match.teamB].wins += 1;
      if (result.winner === "A") stats[match.teamB].losses += 1;
    }
  });

  const standings = Object.values(stats).map((row) => ({
    ...row,
    setDiff: row.setsWon - row.setsLost,
    ptDiff: row.ptsWon - row.ptsLost,
  }));

  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
    if (b.ptDiff !== a.ptDiff) return b.ptDiff - a.ptDiff;
    return b.ptsWon - a.ptsWon;
  });

  return standings;
}

export function sortStandings(rows: StandingRow[]) {
  return [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
    if (b.ptDiff !== a.ptDiff) return b.ptDiff - a.ptDiff;
    return b.ptsWon - a.ptsWon;
  });
}
