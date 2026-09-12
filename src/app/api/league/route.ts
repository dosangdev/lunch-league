import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getLeaguePayload } from "@/lib/data";

export async function GET() {
  const payload = await getLeaguePayload();
  return NextResponse.json({
    ...payload,
    isAdmin: await isAdmin(),
  });
}
