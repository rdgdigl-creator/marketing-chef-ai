import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IikoClient } from "@/lib/iiko";
import { OLAP_AGGREGATE, OLAP_GROUP } from "@/lib/iiko/sales/fields";

/**
 * Диагностика имён OLAP-полей (reports/olap/columns).
 *
 * GET /api/iiko/sales/columns
 *
 * Берёт api_login + api_key из активного подключения пользователя (платформенная
 * пара appId/clientSecret — из ENV), запрашивает у iiko справочник полей отчёта
 * SALES и сверяет его с полями, которые использует синхронизация
 * (`lib/iiko/sales/fields.ts`).
 *
 * Назначение — убедиться, что технические имена полей совпадают со схемой
 * конкретного ресторана ДО запуска синхронизации. Только чтение, в БД ничего
 * не пишет.
 *
 * Ответ:
 *   - groupFields / aggregateFields  используемые поля и признак present
 *   - missing                        поля, которых нет в схеме ресторана
 *   - columnsCount                   сколько всего полей вернул iiko
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FieldCheck = {
  key: string;
  field: string;
  present: boolean;
  name: string | null;
  type: string | null;
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
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
      { error: "iiko не подключён — сначала введите API Login и API Key" },
      { status: 503 },
    );
  }

  const client = new IikoClient({ apiLogin, apiKey });

  let columns: Awaited<ReturnType<typeof client.getOlapColumns>>;
  try {
    columns = await client.getOlapColumns("SALES");
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось получить список полей OLAP",
      },
      { status: 502 },
    );
  }

  const check = (key: string, field: string): FieldCheck => {
    const info = columns[field];
    return {
      key,
      field,
      present: Boolean(info),
      name: (info?.name as string | undefined) ?? null,
      type: (info?.type as string | undefined) ?? null,
    };
  };

  const groupFields = Object.entries(OLAP_GROUP).map(([key, field]) =>
    check(key, field),
  );
  const aggregateFields = Object.entries(OLAP_AGGREGATE).map(([key, field]) =>
    check(key, field),
  );

  const missing = [...groupFields, ...aggregateFields]
    .filter((item) => !item.present)
    .map((item) => `${item.key} (${item.field})`);

  return NextResponse.json({
    columnsCount: Object.keys(columns).length,
    allFieldsPresent: missing.length === 0,
    missing,
    groupFields,
    aggregateFields,
  });
}
