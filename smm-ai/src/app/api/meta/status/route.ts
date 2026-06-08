import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getMetaConnectionStatus } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const status = await getMetaConnectionStatus(user.id);
  return NextResponse.json(status);
}
