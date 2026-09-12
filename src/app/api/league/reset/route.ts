import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getLeaguePayload, resetCategory } from "@/lib/data";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { grade: number; sport: string };
  await resetCategory(body.grade, body.sport);
  const payload = await getLeaguePayload();
  return NextResponse.json({ ...payload, isAdmin: true });
}
