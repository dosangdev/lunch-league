import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { updateMatchFields } from "@/lib/data";
import type { MatchRecord } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as {
    grade: number;
    sport: string;
    type: "link" | "finals";
    matchId: string;
    fields: Partial<MatchRecord>;
  };

  try {
    await updateMatchFields(body.grade, body.sport, body.type, body.matchId, body.fields);
  } catch (error) {
    const message = error instanceof Error ? error.message : "경기 저장에 실패했습니다.";
    const notFound = message.includes("찾을 수 없습니다");
    return NextResponse.json({ error: message }, { status: notFound ? 404 : 503 });
  }

  return NextResponse.json({ ok: true });
}
