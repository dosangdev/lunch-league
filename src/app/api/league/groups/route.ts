import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getLeaguePayload, saveCategoryGroups } from "@/lib/data";
import type { TeamGroup } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as {
    grade: number;
    sport: string;
    groups: TeamGroup[];
    regenerate: boolean;
  };

  await saveCategoryGroups(body.grade, body.sport, body.groups, body.regenerate);
  const payload = await getLeaguePayload();
  return NextResponse.json({ ...payload, isAdmin: true });
}
