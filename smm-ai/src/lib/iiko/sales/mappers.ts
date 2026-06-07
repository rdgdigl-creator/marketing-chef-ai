/**
 * Преобразование строк OLAP-отчёта iiko в строки таблиц `sales_*`.
 *
 * Здесь нет сетевых вызовов и обращений к БД — только чистый маппинг,
 * что упрощает тестирование и изоляцию от формата iiko.
 */

import type { OlapReportRow } from "@/lib/iiko/types";
import { OLAP_AGGREGATE, OLAP_GROUP } from "./fields";

/** Общий контекст синхронизации: к какому подключению относятся данные. */
export interface SalesSyncContext {
  connectionId: string;
  userId: string;
  organizationId: string;
}

/** Строка для upsert в `sales_daily`. */
export interface SalesDailyRow {
  connection_id: string;
  user_id: string;
  organization_id: string;
  department_id: string;
  business_date: string;
  gross_revenue: number;
  discount_total: number;
  revenue: number;
  orders_count: number;
  guests_count: number;
  average_check: number;
}

/** Строка для upsert в `sales_products`. */
export interface SalesProductRow {
  connection_id: string;
  user_id: string;
  business_date: string;
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  revenue: number;
  cost: number;
}

/** Строка для upsert в `sales_hourly`. */
export interface SalesHourlyRow {
  connection_id: string;
  user_id: string;
  business_date: string;
  hour: number;
  revenue: number;
  orders_count: number;
  guests_count: number;
}

/** Приводит значение OLAP к числу (iiko может вернуть строку/null). */
function toNumber(value: OlapReportRow[string]): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Приводит значение OLAP к строке (с обрезкой пробелов). */
function toText(value: OlapReportRow[string]): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Нормализует бизнес-дату iiko к `yyyy-MM-dd` (отбрасывает время, если есть). */
function toBusinessDate(value: OlapReportRow[string]): string {
  return toText(value).slice(0, 10);
}

/** Средний чек = выручка / число заказов (по согласованной формуле). */
function averageCheck(revenue: number, orders: number): number {
  return orders > 0 ? revenue / orders : 0;
}

/** Округление денежных величин до 2 знаков (под numeric(14,2)). */
function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * sales_daily: одна строка OLAP = один бизнес-день.
 * Ожидаемые поля строки: businessDate + grossSum, netSum, guests, ordersCount.
 */
export function mapDailyRows(
  rows: OlapReportRow[],
  ctx: SalesSyncContext,
): SalesDailyRow[] {
  return rows
    .map((row) => {
      const businessDate = toBusinessDate(row[OLAP_GROUP.businessDate]);
      if (!businessDate) return null;

      const gross = money(toNumber(row[OLAP_AGGREGATE.grossSum]));
      const revenue = money(toNumber(row[OLAP_AGGREGATE.netSum]));
      const orders = Math.round(toNumber(row[OLAP_AGGREGATE.ordersCount]));
      const guests = Math.round(toNumber(row[OLAP_AGGREGATE.guests]));

      return {
        connection_id: ctx.connectionId,
        user_id: ctx.userId,
        organization_id: ctx.organizationId,
        department_id: "",
        business_date: businessDate,
        gross_revenue: gross,
        discount_total: money(gross - revenue),
        revenue,
        orders_count: orders,
        guests_count: guests,
        average_check: money(averageCheck(revenue, orders)),
      } satisfies SalesDailyRow;
    })
    .filter((row): row is SalesDailyRow => row !== null);
}

/**
 * sales_products: одна строка OLAP = блюдо за бизнес-день.
 * Ожидаемые поля: businessDate + dishId, dishName, dishCategory,
 * dishAmount, netSum, cost.
 */
export function mapProductRows(
  rows: OlapReportRow[],
  ctx: SalesSyncContext,
): SalesProductRow[] {
  return rows
    .map((row) => {
      const businessDate = toBusinessDate(row[OLAP_GROUP.businessDate]);
      const productId = toText(row[OLAP_GROUP.dishId]);
      if (!businessDate || !productId) return null;

      return {
        connection_id: ctx.connectionId,
        user_id: ctx.userId,
        business_date: businessDate,
        product_id: productId,
        product_name: toText(row[OLAP_GROUP.dishName]),
        category: toText(row[OLAP_GROUP.dishCategory]),
        quantity: toNumber(row[OLAP_AGGREGATE.dishAmount]),
        revenue: money(toNumber(row[OLAP_AGGREGATE.netSum])),
        cost: money(toNumber(row[OLAP_AGGREGATE.cost])),
      } satisfies SalesProductRow;
    })
    .filter((row): row is SalesProductRow => row !== null);
}

/**
 * sales_hourly: одна строка OLAP = час бизнес-дня.
 * Ожидаемые поля: businessDate + hour, netSum, ordersCount, guests.
 * Часы вне диапазона 0–23 отбрасываются (под check-ограничение таблицы).
 */
export function mapHourlyRows(
  rows: OlapReportRow[],
  ctx: SalesSyncContext,
): SalesHourlyRow[] {
  return rows
    .map((row) => {
      const businessDate = toBusinessDate(row[OLAP_GROUP.businessDate]);
      const hour = Math.round(toNumber(row[OLAP_GROUP.hour]));
      if (!businessDate || hour < 0 || hour > 23) return null;

      return {
        connection_id: ctx.connectionId,
        user_id: ctx.userId,
        business_date: businessDate,
        hour,
        revenue: money(toNumber(row[OLAP_AGGREGATE.netSum])),
        orders_count: Math.round(toNumber(row[OLAP_AGGREGATE.ordersCount])),
        guests_count: Math.round(toNumber(row[OLAP_AGGREGATE.guests])),
      } satisfies SalesHourlyRow;
    })
    .filter((row): row is SalesHourlyRow => row !== null);
}
