export type Sport = "ultimate" | "volleyball";
export type TabId = "standings" | "links" | "finals" | "admin";
export type MatchStatus = "pending" | "completed";
export type MatchKind = "link" | "sf1" | "sf2" | "final";

export type GradeSports = Record<1 | 2 | 3, Sport>;

export type TeamGroup = {
  id: string;
  name: string;
  teams: string[];
};

export type MatchRecord = {
  id: string;
  groupId?: string;
  groupName?: string;
  name?: string;
  teamA: string;
  teamB: string;
  s1A: number;
  s1B: number;
  s2A: number;
  s2B: number;
  s3A: number;
  s3B: number;
  date: string;
  status: MatchStatus;
};

export type FinalsMap = {
  sf1: MatchRecord;
  sf2: MatchRecord;
  final: MatchRecord;
};

export type CategoryData = {
  groups: TeamGroup[];
  linkMatches: MatchRecord[];
  finals: FinalsMap;
};

export type LeaguePayload = {
  gradeSports: GradeSports;
  data: Record<string, CategoryData>;
};

export type AppStateResponse = LeaguePayload & {
  isAdmin: boolean;
};

export type StandingRow = {
  team: string;
  groupId: string;
  groupName: string;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  ptsWon: number;
  ptsLost: number;
  ptDiff: number;
};

export type MatchResult = {
  setsA: number;
  setsB: number;
  totalPtsA: number;
  totalPtsB: number;
  winner: "A" | "B" | null;
};
