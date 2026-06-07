import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IikoClient } from "@/lib/iiko";

/**
 * Подключение интеграции iiko для текущего пользователя.
 *
 * POST /api/iiko/connect
 * Тело: { apiLogin: string, apiKey: string, organizationId?: string }
 *
 * SaaS-модель: платформенная пара appId/clientSecret берётся из ENV и
 * пользователю не видна. В UI клиент вводит только свои API Login и API Key.
 *
 *   1. По `apiLogin` + `apiKey` (вместе с платформенными ENV-данными) проверяем
 *      связь с iiko Cloud API — получаем список организаций клиента.
 *   2. Если организация ещё не выбрана — возвращаем список доступных
 *      организаций, чтобы пользователь выбрал ресторан.
 *   3. Когда передан `organizationId` — сохраняем/обновляем запись в
 *      `iiko_connections` (api_login + api_key + organization_id) с активным
 *      статусом.
 */

type ConnectBody = {
  apiLogin?: string;
  apiKey?: string;
  organizationId?: string;
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: ConnectBody;
  try {
    body = (await request.json()) as ConnectBody;
  } catch {
    body = {};
  }

  const apiLogin = body.apiLogin?.trim() ?? "";
  const apiKey = body.apiKey?.trim() ?? "";
  if (!apiLogin || !apiKey) {
    return NextResponse.json(
      { error: "Введите API Login и API Key вашей интеграции iiko" },
      { status: 400 },
    );
  }

  // Платформенная пара appId/clientSecret подставляется из ENV внутри клиента;
  // здесь передаём только клиентские учётные данные.
  const client = new IikoClient({ apiLogin, apiKey });

  // Шаг 1: проверяем подключение — получаем организации по введённому ключу.
  let organizations: Awaited<ReturnType<typeof client.getOrganizations>>;
  try {
    organizations = await client.getOrganizations();
  } catch (error) {
    // [iiko][debug] Полный текст ошибки в терминале для диагностики 502.
    console.error("[iiko] connect: getOrganizations failed", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      status:
        error && typeof error === "object" && "status" in error
          ? (error as { status?: unknown }).status
          : undefined,
      correlationId:
        error && typeof error === "object" && "correlationId" in error
          ? (error as { correlationId?: unknown }).correlationId
          : undefined,
      cause: error instanceof Error ? error.cause : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    const message =
      error instanceof Error ? error.message : "Не удалось подключиться к iiko";

    return NextResponse.json(
      {
        error: message,
        // TODO(временно): подробности ошибки для отладки. Убрать после диагностики.
        debug: {
          name: error instanceof Error ? error.name : typeof error,
          message,
          status:
            error && typeof error === "object" && "status" in error
              ? (error as { status?: unknown }).status
              : undefined,
          correlationId:
            error && typeof error === "object" && "correlationId" in error
              ? (error as { correlationId?: unknown }).correlationId
              : undefined,
          cause:
            error instanceof Error && error.cause
              ? String(
                  error.cause instanceof Error
                    ? error.cause.message
                    : error.cause,
                )
              : undefined,
        },
      },
      { status: 502 },
    );
  }

  if (organizations.length === 0) {
    return NextResponse.json(
      { error: "iiko не вернул ни одной организации для этого приложения" },
      { status: 502 },
    );
  }

  const organizationId = body.organizationId?.trim();

  // Шаг 2: логин валиден, но организация ещё не выбрана — отдаём список.
  if (!organizationId) {
    return NextResponse.json({
      verified: true,
      organizations: organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
      })),
    });
  }

  const organization = organizations.find((item) => item.id === organizationId);
  if (!organization) {
    return NextResponse.json(
      { error: "Выбранная организация недоступна для этого приложения" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  // Одна активная организация на пользователя: гасим прежние подключения.
  await supabase
    .from("iiko_connections")
    .update({ is_active: false })
    .eq("user_id", user.id);

  // Шаг 3: сохраняем выбранную организацию ресторана в Supabase.
  const { data, error } = await supabase
    .from("iiko_connections")
    .upsert(
      {
        user_id: user.id,
        organization_id: organization.id,
        organization_name: organization.name ?? "",
        api_login: apiLogin,
        api_key: apiKey,
        is_active: true,
        sync_status: "connected",
        error_message: null,
      },
      { onConflict: "user_id,organization_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Не удалось сохранить подключение" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    connection: {
      organizationName: data.organization_name || null,
      organizationsCount: organizations.length,
      syncStatus: data.sync_status,
    },
  });
}
