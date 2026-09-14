import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getLeaguePayload } from "@/lib/data";

export const maxDuration = 30;

export async function GET() {
  try {
    const payload = await getLeaguePayload();
    return NextResponse.json({
      ...payload,
      isAdmin: await isAdmin(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
