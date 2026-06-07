import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getIikoConnectionStatus } from "@/lib/iiko/connection-status";

export const dynamic = "force-dynamic";

/**
 * Лёгкий статус подключения iiko текущего пользователя.
 *
 * GET /api/iiko/status
 *
 * Не обращается к iiko Cloud API — только читает активное подключение
 * из Supabase. Используется для быстрого индикатора на дашборде.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const status = await getIikoConnectionStatus(user.id);
  return NextResponse.json(status, { status: 200 });
}
