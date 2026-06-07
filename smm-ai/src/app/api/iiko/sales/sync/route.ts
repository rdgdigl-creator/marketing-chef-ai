import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SalesSyncService } from "@/lib/iiko/sales";

/**
 * Ручной запуск синхронизации продаж из iiko.
 *
 * POST /api/iiko/sales/sync
 * Тело (всё опционально): { connectionId?: string, from?: "yyyy-MM-dd", to?: "yyyy-MM-dd" }
 *
 *   - connectionId не задан — берётся активное подключение пользователя;
 *   - период не задан — последние 30 дней (по умолчанию в сервисе);
 *   - сама запись в sales_* идёт под service_role внутри SalesSyncService,
 *     ownership проверяется по user_id.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SyncBody = {
  connectionId?: string;
  from?: string;
  to?: string;
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    body = {};
  }

  // Находим подключение пользователя (RLS-scoped клиент: только свои строки).
  const supabase = await createSupabaseServerClient();
  const connectionId = body.connectionId?.trim();

  const query = supabase
    .from("iiko_connections")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (connectionId) {
    query.eq("id", connectionId);
  }

  const { data: connection, error: connError } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connError) {
    return NextResponse.json(
      { error: `Ошибка загрузки подключения: ${connError.message}` },
      { status: 500 },
    );
  }
  if (!connection) {
    return NextResponse.json(
      { error: "Активное подключение iiko не найдено" },
      { status: 404 },
    );
  }

  const service = new SalesSyncService();
  const result = await service.run({
    connectionId: (connection as { id: string }).id,
    userId: user.id,
    from: body.from,
    to: body.to,
  });

  if (result.status === "error") {
    return NextResponse.json(
      { error: result.error ?? "Синхронизация завершилась с ошибкой", result },
      { status: 502 },
    );
  }

  return NextResponse.json({
    status: result.status,
    period: result.period,
    counts: result.counts,
    recordsSynced: result.recordsSynced,
  });
}
