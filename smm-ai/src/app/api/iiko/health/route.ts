import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IikoClient } from "@/lib/iiko";

/**
 * Health-check подключения к iiko Cloud API.
 *
 * GET /api/iiko/health
 *
 * Берёт api_login + api_key из активного подключения пользователя в Supabase
 * (`iiko_connections`); платформенная пара appId/clientSecret подставляется из
 * ENV. Проверяет связь: получает токен и список организаций, измеряя задержку.
 *
 * Ответ:
 *   - status              "ok" | "error"
 *   - organizationsCount  число доступных организаций (при успехе)
 *   - latencyMs           длительность проверки в миллисекундах
 *   - error               сообщение об ошибке (при сбое)
 *
 * Коды: 200 — связь есть; 401 — нет авторизации; 503 — связь недоступна.
 */
export async function GET() {
  const startedAt = Date.now();

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      {
        status: "error",
        latencyMs: Date.now() - startedAt,
        error: "Не авторизован",
      },
      { status: 401 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("iiko_connections")
    .select("api_login, api_key")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as { api_login?: string; api_key?: string } | null;
  const apiLogin = row?.api_login?.trim();
  const apiKey = row?.api_key?.trim();
  if (!apiLogin || !apiKey) {
    return NextResponse.json(
      {
        status: "error",
        latencyMs: Date.now() - startedAt,
        error: "iiko не подключён — сначала введите API Login и API Key",
      },
      { status: 503 },
    );
  }

  const client = new IikoClient({ apiLogin, apiKey });

  // checkConnection не бросает исключений — возвращает структурированный статус.
  const connection = await client.checkConnection();

  if (connection.ok) {
    return NextResponse.json(
      {
        status: "ok",
        organizationsCount: connection.organizationsCount ?? 0,
        latencyMs: connection.latencyMs,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      status: "error",
      latencyMs: connection.latencyMs,
      error: connection.error ?? "Не удалось подключиться к iiko",
    },
    { status: 503 },
  );
}
