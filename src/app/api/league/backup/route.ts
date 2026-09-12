import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getLeaguePayload, replaceLeaguePayload } from "@/lib/data";
import type { LeaguePayload } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }

  const payload = await getLeaguePayload();
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as LeaguePayload;
  if (!body.data && !body.gradeSports) {
    return NextResponse.json({ error: "올바르지 않은 JSON 파일입니다." }, { status: 400 });
  }

  await replaceLeaguePayload({
    gradeSports: body.gradeSports,
    data: body.data || (body as unknown as LeaguePayload).data,
  });

  const payload = await getLeaguePayload();
  return NextResponse.json({ ...payload, isAdmin: true });
}
