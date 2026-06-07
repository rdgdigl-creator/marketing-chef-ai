import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Отключение интеграции iiko для текущего пользователя.
 *
 * POST /api/iiko/disconnect
 *
 * Деактивирует все подключения пользователя: сбрасывает `is_active`
 * и переводит `sync_status` в `pending`. Сами записи не удаляем,
 * чтобы сохранить историю и быстро переподключиться.
 */
export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("iiko_connections")
    .update({
      is_active: false,
      sync_status: "pending",
      error_message: null,
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Не удалось отключить интеграцию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
