import type { Match } from "@prisma/client";
import { prisma } from "./prisma";
import {
  categoryKey,
  createDefaultFinals,
  createInitialCategory,
  createInitialData,
  DEFAULT_GRADE_SPORTS,
  generateLinkMatchesForGroups,
  GRADES,
  SPORTS,
} from "./league";
import type {
  CategoryData,
  FinalsMap,
  GradeSports,
  LeaguePayload,
  MatchKind,
  MatchRecord,
  TeamGroup,
} from "./types";

function parseGradeSports(raw: string): GradeSports {
  try {
    const parsed = JSON.parse(raw) as GradeSports;
    return {
      1: parsed[1] || DEFAULT_GRADE_SPORTS[1],
      2: parsed[2] || DEFAULT_GRADE_SPORTS[2],
      3: parsed[3] || DEFAULT_GRADE_SPORTS[3],
    };
  } catch {
    return DEFAULT_GRADE_SPORTS;
  }
}

function toMatchRecord(match: Match): MatchRecord {
  return {
    id: match.id,
    groupId: match.groupId || undefined,
    groupName: match.groupName || undefined,
    name: match.name || undefined,
    teamA: match.teamA,
    teamB: match.teamB,
    s1A: match.s1A,
    s1B: match.s1B,
    s2A: match.s2A,
    s2B: match.s2B,
    s3A: match.s3A,
    s3B: match.s3B,
    date: match.date,
    status: match.status === "completed" ? "completed" : "pending",
  };
}

async function writeCategory(key: string, grade: number, sport: string, category: CategoryData) {
  await prisma.category.upsert({
    where: { id: key },
    update: { grade, sport },
    create: { id: key, grade, sport },
  });

  await prisma.group.deleteMany({ where: { categoryId: key } });
  await prisma.match.deleteMany({ where: { categoryId: key } });

  const groupIdMap = new Map<string, string>();

  for (const [index, group] of category.groups.entries()) {
    const groupId = group.id.startsWith(`${key}_`) ? group.id : `${key}_${group.id}`;
    groupIdMap.set(group.id, groupId);
    await prisma.group.create({
      data: {
        id: groupId,
        categoryId: key,
        name: group.name,
        sortOrder: index,
        teams: {
          create: group.teams.map((name, teamIndex) => ({
            name,
            sortOrder: teamIndex,
          })),
        },
      },
    });
  }

  const allMatches: Array<MatchRecord & { kind: MatchKind; sortOrder: number }> = [
    ...category.linkMatches.map((match, index) => ({
      ...match,
      id: match.id.startsWith(`${key}_`) ? match.id : `${key}_${match.id}_${index}`,
      groupId: match.groupId ? groupIdMap.get(match.groupId) || `${key}_${match.groupId}` : match.groupId,
      kind: "link" as const,
      sortOrder: index,
    })),
    { ...category.finals.sf1, id: `${key}_sf1`, kind: "sf1" as const, sortOrder: 0 },
    { ...category.finals.sf2, id: `${key}_sf2`, kind: "sf2" as const, sortOrder: 1 },
    { ...category.finals.final, id: `${key}_final`, kind: "final" as const, sortOrder: 2 },
  ];

  if (allMatches.length) {
    await prisma.match.createMany({
      data: allMatches.map((match) => ({
        id: match.id,
        categoryId: key,
        kind: match.kind,
        groupId: match.groupId,
        groupName: match.groupName,
        name: match.name,
        teamA: match.teamA,
        teamB: match.teamB,
        s1A: match.s1A,
        s1B: match.s1B,
        s2A: match.s2A,
        s2B: match.s2B,
        s3A: match.s3A,
        s3B: match.s3B,
        date: match.date || "",
        status: match.status,
        sortOrder: match.sortOrder,
      })),
    });
  }
}

export async function ensureSeeded() {
  const setting = await prisma.setting.findUnique({ where: { id: "app" } });
  const categoryCount = await prisma.category.count();
  if (setting && categoryCount > 0) return;

  const initial = createInitialData();
  await prisma.setting.upsert({
    where: { id: "app" },
    update: { gradeSports: JSON.stringify(DEFAULT_GRADE_SPORTS) },
    create: { id: "app", gradeSports: JSON.stringify(DEFAULT_GRADE_SPORTS) },
  });

  for (const grade of GRADES) {
    for (const sport of SPORTS) {
      const key = categoryKey(grade, sport);
      await writeCategory(key, grade, sport, initial[key]);
    }
  }
}

export async function getLeaguePayload(): Promise<LeaguePayload> {
  await ensureSeeded();

  const setting = await prisma.setting.findUnique({ where: { id: "app" } });
  const categories = await prisma.category.findMany({
    include: {
      groups: {
        orderBy: { sortOrder: "asc" },
        include: { teams: { orderBy: { sortOrder: "asc" } } },
      },
      matches: { orderBy: { sortOrder: "asc" } },
    },
  });

  const data: Record<string, CategoryData> = {};

  categories.forEach((category) => {
    const groups: TeamGroup[] = category.groups.map((group) => ({
      id: group.id,
      name: group.name,
      teams: group.teams.map((team) => team.name),
    }));

    const linkMatches = category.matches
      .filter((match) => match.kind === "link")
      .map(toMatchRecord);

    const defaults = createDefaultFinals();
    const finals: FinalsMap = {
      sf1: toMatchRecord(category.matches.find((match) => match.kind === "sf1") ?? {
        ...emptyDbMatch(`${category.id}_sf1`, "sf1"),
      }),
      sf2: toMatchRecord(category.matches.find((match) => match.kind === "sf2") ?? {
        ...emptyDbMatch(`${category.id}_sf2`, "sf2"),
      }),
      final: toMatchRecord(category.matches.find((match) => match.kind === "final") ?? {
        ...emptyDbMatch(`${category.id}_final`, "final"),
      }),
    };

    finals.sf1 = { ...defaults.sf1, ...finals.sf1, id: "sf1", name: finals.sf1.name || defaults.sf1.name };
    finals.sf2 = { ...defaults.sf2, ...finals.sf2, id: "sf2", name: finals.sf2.name || defaults.sf2.name };
    finals.final = {
      ...defaults.final,
      ...finals.final,
      id: "final",
      name: finals.final.name || defaults.final.name,
    };

    data[category.id] = { groups, linkMatches, finals };
  });

  return {
    gradeSports: parseGradeSports(setting?.gradeSports || ""),
    data,
  };
}

function emptyDbMatch(id: string, kind: MatchKind): Match {
  const defaults = createDefaultFinals();
  const source = kind === "sf2" ? defaults.sf2 : kind === "final" ? defaults.final : defaults.sf1;
  return {
    id,
    categoryId: "",
    kind,
    groupId: null,
    groupName: null,
    name: source.name || null,
    teamA: source.teamA,
    teamB: source.teamB,
    s1A: 0,
    s1B: 0,
    s2A: 0,
    s2B: 0,
    s3A: 0,
    s3B: 0,
    date: "",
    status: "pending",
    sortOrder: 0,
  };
}

export async function updateGradeSports(gradeSports: GradeSports) {
  await ensureSeeded();
  await prisma.setting.update({
    where: { id: "app" },
    data: { gradeSports: JSON.stringify(gradeSports) },
  });
}

export async function saveCategoryGroups(
  grade: number,
  sport: string,
  groups: TeamGroup[],
  regenerate: boolean,
) {
  await ensureSeeded();
  const payload = await getLeaguePayload();
  const key = categoryKey(grade, sport);
  const current = payload.data[key] || createInitialCategory(grade, sport);
  current.groups = groups;
  if (regenerate) {
    current.linkMatches = generateLinkMatchesForGroups(groups);
  }
  await writeCategory(key, grade, sport, current);
}

export async function updateMatchFields(
  grade: number,
  sport: string,
  type: "link" | "finals",
  matchId: string,
  fields: Partial<MatchRecord>,
) {
  await ensureSeeded();
  const key = categoryKey(grade, sport);
  const dbId = type === "finals" ? `${key}_${matchId}` : matchId;

  const existing = await prisma.match.findUnique({ where: { id: dbId } });
  if (!existing) {
    throw new Error("경기를 찾을 수 없습니다.");
  }

  await prisma.match.update({
    where: { id: dbId },
    data: {
      teamA: fields.teamA ?? existing.teamA,
      teamB: fields.teamB ?? existing.teamB,
      s1A: fields.s1A ?? existing.s1A,
      s1B: fields.s1B ?? existing.s1B,
      s2A: fields.s2A ?? existing.s2A,
      s2B: fields.s2B ?? existing.s2B,
      s3A: fields.s3A ?? existing.s3A,
      s3B: fields.s3B ?? existing.s3B,
      date: fields.date ?? existing.date,
      status: fields.status ?? existing.status,
    },
  });
}

export async function resetCategory(grade: number, sport: string) {
  await ensureSeeded();
  const key = categoryKey(grade, sport);
  await writeCategory(key, grade, sport, createInitialCategory(grade, sport));
}

export async function replaceLeaguePayload(payload: LeaguePayload) {
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.group.deleteMany();
  await prisma.category.deleteMany();

  await prisma.setting.upsert({
    where: { id: "app" },
    update: { gradeSports: JSON.stringify(payload.gradeSports || DEFAULT_GRADE_SPORTS) },
    create: {
      id: "app",
      gradeSports: JSON.stringify(payload.gradeSports || DEFAULT_GRADE_SPORTS),
    },
  });

  const data = payload.data || createInitialData();
  for (const grade of GRADES) {
    for (const sport of SPORTS) {
      const key = categoryKey(grade, sport);
      await writeCategory(key, grade, sport, data[key] || createInitialCategory());
    }
  }
}
