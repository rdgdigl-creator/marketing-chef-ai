import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { META_MOCK_COOKIE } from "@/lib/meta/mock";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, demo: true });
  response.cookies.set(META_MOCK_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
