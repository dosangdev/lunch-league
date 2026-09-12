import { NextResponse } from "next/server";
import { clearAdminCookie, getAdminPin, isAdmin, setAdminCookie } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ isAdmin: await isAdmin() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { pin?: string };
  if ((body.pin || "").trim() !== getAdminPin()) {
    return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true, isAdmin: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true, isAdmin: false });
}
