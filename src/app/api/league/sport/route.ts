import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getLeaguePayload, updateGradeSports } from "@/lib/data";
import type { GradeSports } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { gradeSports: GradeSports };
  await updateGradeSports(body.gradeSports);
  const payload = await getLeaguePayload();
  return NextResponse.json({ ...payload, isAdmin: true });
}
