import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getLeaguePayload, updateMatchFields } from "@/lib/data";
import { calculateGroupStandings, categoryKey } from "@/lib/league";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { grade: number; sport: string };
  const payload = await getLeaguePayload();
  const category = payload.data[categoryKey(body.grade, body.sport)];

  if (!category) {
    return NextResponse.json({ error: "리그 데이터를 찾을 수 없습니다." }, { status: 404 });
  }

  let sf1A = "1위 팀";
  let sf1B = "4위 팀";
  let sf2A = "2위 팀";
  let sf2B = "3위 팀";

  if (category.groups.length === 1) {
    const standings = calculateGroupStandings(category.groups[0], category.linkMatches);
    if (standings.length < 4) {
      return NextResponse.json({ error: "4개 이상의 팀이 필요합니다." }, { status: 400 });
    }
    sf1A = `${standings[0].team} (예선1위)`;
    sf1B = `${standings[3].team} (예선4위)`;
    sf2A = `${standings[1].team} (예선2위)`;
    sf2B = `${standings[2].team} (예선3위)`;
  } else {
    const groupA = category.groups[0];
    const groupB = category.groups[1];
    const standingsA = calculateGroupStandings(groupA, category.linkMatches);
    const standingsB = calculateGroupStandings(groupB, category.linkMatches);

    sf1A = standingsA[0] ? `${standingsA[0].team} (${groupA.name}1위)` : `${groupA.name} 1위`;
    sf1B = standingsB[1] ? `${standingsB[1].team} (${groupB.name}2위)` : `${groupB.name} 2위`;
    sf2A = standingsB[0] ? `${standingsB[0].team} (${groupB.name}1위)` : `${groupB.name} 1위`;
    sf2B = standingsA[1] ? `${standingsA[1].team} (${groupA.name}2위)` : `${groupA.name} 2위`;
  }

  await updateMatchFields(body.grade, body.sport, "finals", "sf1", { teamA: sf1A, teamB: sf1B });
  await updateMatchFields(body.grade, body.sport, "finals", "sf2", { teamA: sf2A, teamB: sf2B });

  const next = await getLeaguePayload();
  return NextResponse.json({ ...next, isAdmin: true });
}
