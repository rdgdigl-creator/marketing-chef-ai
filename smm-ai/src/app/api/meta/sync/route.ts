import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { saveAuditAfterSync } from "@/lib/media-buyer/save-audit";
import { META_MOCK_COOKIE } from "@/lib/meta/mock";
import { syncMetaAdAccount } from "@/lib/meta/sync-service";

export const maxDuration = 120;

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const result = await syncMetaAdAccount(user.id);

  if (result.status === "error") {
    return NextResponse.json(result, { status: 502 });
  }

  const response = NextResponse.json(result);

  if (result.demo && result.cookie) {
    response.cookies.set(META_MOCK_COOKIE, result.cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  } else {
    try {
      await saveAuditAfterSync(user.id);
    } catch {
      // Аудит не блокирует успешную синхронизацию
    }
  }

  return response;
}
