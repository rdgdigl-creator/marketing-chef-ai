/**
 * Сервис синхронизации продаж из iiko в Supabase.
 *
 * Единица работы = одно подключение (`iiko_connections`) + период дат.
 * Шаги запуска:
 *   1. загрузить подключение (service_role) и проверить владельца;
 *   2. открыть запись в `sales_sync_logs` (status = in_progress);
 *   3. пометить подключение как `syncing`;
 *   4. построить 3 OLAP-отчёта (день / блюда / часы) и смаппить строки;
 *   5. upsert батчами в `sales_daily` / `sales_products` / `sales_hourly`;
 *   6. закрыть лог (success / error), обновить `last_sync_at` и статус.
 *
 * Запись идёт под service_role (обход RLS), поэтому ownership проверяем сами.
 * Первый этап: одна организация, без разбивки по департаментам.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { IikoClient } from "@/lib/iiko/client";
import type { OlapReportRequest, OlapReportRow } from "@/lib/iiko/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  OLAP_AGGREGATE,
  OLAP_DATE_FILTER_FIELD,
  OLAP_GROUP,
} from "./fields";
import {
  mapDailyRows,
  mapHourlyRows,
  mapProductRows,
  type SalesSyncContext,
} from "./mappers";
import { resolveSyncPeriod, type SyncPeriod } from "./period";

/** OLAP-отчёты бывают тяжёлыми — даём запросу больше времени, чем дефолт. */
const OLAP_TIMEOUT_MS = 60_000;

/** Размер батча upsert в Supabase. */
const UPSERT_BATCH_SIZE = 500;

/** Параметры запуска синхронизации. */
export interface RunSalesSyncParams {
  connectionId: string;
  userId: string;
  from?: string | null;
  to?: string | null;
}

/** Результат синхронизации (по таблицам). */
export interface SalesSyncResult {
  status: "success" | "error";
  logId: string | null;
  period: SyncPeriod;
  counts: { daily: number; products: number; hourly: number };
  recordsSynced: number;
  error?: string;
}

interface ConnectionRow {
  id: string;
  user_id: string;
  organization_id: string;
  api_login: string | null;
  api_key: string | null;
}

/** Делит массив на чанки фиксированного размера. */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Фильтр OLAP по бизнес-дате на весь период (границы включительно). */
function dateFilter(period: SyncPeriod): OlapReportRequest["filters"] {
  return {
    [OLAP_DATE_FILTER_FIELD]: {
      filterType: "DateRange",
      from: period.from,
      to: period.to,
      includeLow: true,
      includeHigh: true,
    },
  };
}

export class SalesSyncService {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient = createSupabaseServiceClient()) {
    this.supabase = supabase;
  }

  /** Запускает синхронизацию продаж за период для одного подключения. */
  async run(params: RunSalesSyncParams): Promise<SalesSyncResult> {
    const period = resolveSyncPeriod({ from: params.from, to: params.to });

    const connection = await this.loadConnection(params.connectionId, params.userId);
    const ctx: SalesSyncContext = {
      connectionId: connection.id,
      userId: connection.user_id,
      organizationId: connection.organization_id,
    };

    const logId = await this.openLog(connection, period);
    await this.setConnectionStatus(connection.id, "syncing", null);

    try {
      const client = new IikoClient({
        // Клиентская пара apiLogin/apiKey; платформенные appId/clientSecret — из ENV.
        apiLogin: connection.api_login ?? undefined,
        apiKey: connection.api_key ?? undefined,
        timeoutMs: OLAP_TIMEOUT_MS,
      });

      const counts = await this.syncAll(client, ctx, period);
      const recordsSynced = counts.daily + counts.products + counts.hourly;

      await this.closeLog(logId, {
        status: "success",
        recordsSynced,
        details: { period, counts },
      });
      await this.markSynced(connection.id);

      return { status: "success", logId, period, counts, recordsSynced };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await this.closeLog(logId, {
        status: "error",
        recordsSynced: 0,
        errorMessage: message,
        details: { period },
      });
      await this.setConnectionStatus(connection.id, "error", message);

      return {
        status: "error",
        logId,
        period,
        counts: { daily: 0, products: 0, hourly: 0 },
        recordsSynced: 0,
        error: message,
      };
    }
  }

  // --------------------------------------------------------------------------
  // OLAP -> таблицы
  // --------------------------------------------------------------------------

  private async syncAll(
    client: IikoClient,
    ctx: SalesSyncContext,
    period: SyncPeriod,
  ): Promise<SalesSyncResult["counts"]> {
    const filters = dateFilter(period);
    const organizationId = ctx.organizationId;

    const dailyRaw = await client.buildOlapReport({
      organizationId,
      reportType: "SALES",
      groupByRowFields: [OLAP_GROUP.businessDate],
      aggregateFields: [
        OLAP_AGGREGATE.grossSum,
        OLAP_AGGREGATE.netSum,
        OLAP_AGGREGATE.guests,
        OLAP_AGGREGATE.ordersCount,
      ],
      filters,
    });
    const daily = await this.upsertDaily(mapDailyRows(dailyRaw, ctx));

    const productsRaw = await client.buildOlapReport({
      organizationId,
      reportType: "SALES",
      groupByRowFields: [
        OLAP_GROUP.businessDate,
        OLAP_GROUP.dishId,
        OLAP_GROUP.dishName,
        OLAP_GROUP.dishCategory,
      ],
      aggregateFields: [
        OLAP_AGGREGATE.dishAmount,
        OLAP_AGGREGATE.netSum,
        OLAP_AGGREGATE.cost,
      ],
      filters,
    });
    const products = await this.upsertProducts(mapProductRows(productsRaw, ctx));

    const hourlyRaw = await client.buildOlapReport({
      organizationId,
      reportType: "SALES",
      groupByRowFields: [OLAP_GROUP.businessDate, OLAP_GROUP.hour],
      aggregateFields: [
        OLAP_AGGREGATE.netSum,
        OLAP_AGGREGATE.ordersCount,
        OLAP_AGGREGATE.guests,
      ],
      filters,
    });
    const hourly = await this.upsertHourly(mapHourlyRows(hourlyRaw, ctx));

    return { daily, products, hourly };
  }

  // --------------------------------------------------------------------------
  // Upsert (идемпотентно по уникальным ключам из 008_sales.sql)
  // --------------------------------------------------------------------------

  private async upsertDaily(rows: ReturnType<typeof mapDailyRows>): Promise<number> {
    return this.upsertBatched("sales_daily", rows, "connection_id,department_id,business_date");
  }

  private async upsertProducts(
    rows: ReturnType<typeof mapProductRows>,
  ): Promise<number> {
    return this.upsertBatched("sales_products", rows, "connection_id,business_date,product_id");
  }

  private async upsertHourly(
    rows: ReturnType<typeof mapHourlyRows>,
  ): Promise<number> {
    return this.upsertBatched("sales_hourly", rows, "connection_id,business_date,hour");
  }

  private async upsertBatched<T extends object>(
    table: string,
    rows: T[],
    onConflict: string,
  ): Promise<number> {
    if (rows.length === 0) return 0;

    let written = 0;
    for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
      const { error } = await this.supabase
        .from(table)
        .upsert(batch, { onConflict, ignoreDuplicates: false });
      if (error) {
        throw new Error(`Ошибка записи в ${table}: ${error.message}`);
      }
      written += batch.length;
    }
    return written;
  }

  // --------------------------------------------------------------------------
  // Подключение и логи
  // --------------------------------------------------------------------------

  private async loadConnection(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionRow> {
    const { data, error } = await this.supabase
      .from("iiko_connections")
      .select("id, user_id, organization_id, api_login, api_key")
      .eq("id", connectionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Не удалось загрузить подключение iiko: ${error.message}`);
    }
    const row = data as ConnectionRow | null;
    if (!row) {
      throw new Error("Подключение iiko не найдено");
    }
    if (row.user_id !== userId) {
      throw new Error("Подключение iiko принадлежит другому пользователю");
    }
    if (!row.api_login || !row.api_key) {
      throw new Error("У подключения iiko не заданы API Login и API Key");
    }
    return row;
  }

  private async openLog(
    connection: ConnectionRow,
    period: SyncPeriod,
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("sales_sync_logs")
      .insert({
        connection_id: connection.id,
        user_id: connection.user_id,
        sync_type: "full",
        status: "in_progress",
        period_from: period.from,
        period_to: period.to,
      })
      .select("id")
      .single();

    if (error || !data) {
      // Лог — вспомогательная сущность: не валим синхронизацию из-за него.
      return null;
    }
    return (data as { id: string }).id;
  }

  private async closeLog(
    logId: string | null,
    payload: {
      status: "success" | "error";
      recordsSynced: number;
      errorMessage?: string;
      details: Record<string, unknown>;
    },
  ): Promise<void> {
    if (!logId) return;
    await this.supabase
      .from("sales_sync_logs")
      .update({
        status: payload.status,
        records_synced: payload.recordsSynced,
        error_message: payload.errorMessage ?? null,
        details: payload.details,
        finished_at: new Date().toISOString(),
      })
      .eq("id", logId);
  }

  private async setConnectionStatus(
    connectionId: string,
    status: "syncing" | "error" | "connected",
    errorMessage: string | null,
  ): Promise<void> {
    await this.supabase
      .from("iiko_connections")
      .update({ sync_status: status, error_message: errorMessage })
      .eq("id", connectionId);
  }

  private async markSynced(connectionId: string): Promise<void> {
    await this.supabase
      .from("iiko_connections")
      .update({
        sync_status: "connected",
        error_message: null,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", connectionId);
  }
}
