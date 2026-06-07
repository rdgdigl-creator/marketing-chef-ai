import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SalesMetric = {
  totalRevenue: number;
  ordersCount: number;
  guestsCount: number;
  averageCheck: number;
};

export type DailyPoint = { date: string; revenue: number; orders: number };
export type HourlyPoint = { hour: number; revenue: number; orders: number };
export type ProductPoint = { name: string; revenue: number; quantity: number };

export type SalesAnalytics = {
  hasData: boolean;
  periodFrom: string;
  periodTo: string;
  current: SalesMetric;
  revenueGrowthPct: number | null;
  daily: DailyPoint[];
  hourly: HourlyPoint[];
  topProducts: ProductPoint[];
};

type DailyRow = {
  business_date: string;
  revenue: number | string;
  orders_count: number;
  guests_count: number;
};

type HourlyRow = { hour: number; revenue: number | string; orders_count: number };

type ProductRow = {
  product_name: string;
  revenue: number | string;
  quantity: number | string;
};

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const PERIOD_DAYS = 30;

const EMPTY: Omit<SalesAnalytics, "periodFrom" | "periodTo"> = {
  hasData: false,
  current: { totalRevenue: 0, ordersCount: 0, guestsCount: 0, averageCheck: 0 },
  revenueGrowthPct: null,
  daily: [],
  hourly: [],
  topProducts: [],
};

/**
 * Аналитика продаж за последние 30 дней на основе данных, синхронизированных
 * из iiko (таблицы sales_daily / sales_products / sales_hourly).
 * Использует серверный Supabase-клиент с RLS (данные только текущего пользователя).
 */
export async function getSalesAnalytics(): Promise<SalesAnalytics> {
  const supabase = await createSupabaseServerClient();

  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - (PERIOD_DAYS - 1));
  const prevFrom = new Date(today);
  prevFrom.setDate(prevFrom.getDate() - (PERIOD_DAYS * 2 - 1));
  const prevTo = new Date(today);
  prevTo.setDate(prevTo.getDate() - PERIOD_DAYS);

  const periodFrom = isoDate(from);
  const periodTo = isoDate(today);

  const [dailyRes, hourlyRes, productsRes, prevRes] = await Promise.all([
    supabase
      .from("sales_daily")
      .select("business_date, revenue, orders_count, guests_count")
      .gte("business_date", periodFrom)
      .lte("business_date", periodTo)
      .order("business_date", { ascending: true }),
    supabase
      .from("sales_hourly")
      .select("hour, revenue, orders_count")
      .gte("business_date", periodFrom)
      .lte("business_date", periodTo),
    supabase
      .from("sales_products")
      .select("product_name, revenue, quantity")
      .gte("business_date", periodFrom)
      .lte("business_date", periodTo),
    supabase
      .from("sales_daily")
      .select("revenue")
      .gte("business_date", isoDate(prevFrom))
      .lte("business_date", isoDate(prevTo)),
  ]);

  const dailyRows = (dailyRes.data as DailyRow[] | null) ?? [];
  const hourlyRows = (hourlyRes.data as HourlyRow[] | null) ?? [];
  const productRows = (productsRes.data as ProductRow[] | null) ?? [];
  const prevRows = (prevRes.data as { revenue: number | string }[] | null) ?? [];

  if (dailyRows.length === 0) {
    return { ...EMPTY, periodFrom, periodTo };
  }

  // Daily series + totals
  const dailyMap = new Map<string, DailyPoint>();
  let totalRevenue = 0;
  let ordersCount = 0;
  let guestsCount = 0;
  for (const row of dailyRows) {
    const revenue = toNumber(row.revenue);
    const existing = dailyMap.get(row.business_date) ?? {
      date: row.business_date,
      revenue: 0,
      orders: 0,
    };
    existing.revenue += revenue;
    existing.orders += row.orders_count ?? 0;
    dailyMap.set(row.business_date, existing);
    totalRevenue += revenue;
    ordersCount += row.orders_count ?? 0;
    guestsCount += row.guests_count ?? 0;
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Hourly aggregate
  const hourlyMap = new Map<number, HourlyPoint>();
  for (let h = 0; h < 24; h += 1) {
    hourlyMap.set(h, { hour: h, revenue: 0, orders: 0 });
  }
  for (const row of hourlyRows) {
    const point = hourlyMap.get(row.hour);
    if (point) {
      point.revenue += toNumber(row.revenue);
      point.orders += row.orders_count ?? 0;
    }
  }
  const hourly = Array.from(hourlyMap.values());

  // Top products
  const productMap = new Map<string, ProductPoint>();
  for (const row of productRows) {
    const name = row.product_name || "Без названия";
    const existing = productMap.get(name) ?? { name, revenue: 0, quantity: 0 };
    existing.revenue += toNumber(row.revenue);
    existing.quantity += toNumber(row.quantity);
    productMap.set(name, existing);
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Growth vs previous period
  const prevRevenue = prevRows.reduce((sum, row) => sum + toNumber(row.revenue), 0);
  const revenueGrowthPct =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

  const averageCheck = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  return {
    hasData: true,
    periodFrom,
    periodTo,
    current: { totalRevenue, ordersCount, guestsCount, averageCheck },
    revenueGrowthPct,
    daily,
    hourly,
    topProducts,
  };
}

export function buildAnalyticsSummaryText(a: SalesAnalytics): string {
  if (!a.hasData) return "Нет данных о продажах за период.";
  const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");
  const peakHour = [...a.hourly].sort((x, y) => y.revenue - x.revenue)[0];
  const top = a.topProducts
    .slice(0, 5)
    .map((p, i) => `${i + 1}. ${p.name} — ${fmt(p.revenue)} ₽ (${fmt(p.quantity)} шт.)`)
    .join("\n");
  return [
    `Период: ${a.periodFrom} — ${a.periodTo}`,
    `Выручка: ${fmt(a.current.totalRevenue)} ₽`,
    `Заказов: ${fmt(a.current.ordersCount)}`,
    `Гостей: ${fmt(a.current.guestsCount)}`,
    `Средний чек: ${fmt(a.current.averageCheck)} ₽`,
    a.revenueGrowthPct !== null
      ? `Динамика выручки к прошлому периоду: ${a.revenueGrowthPct >= 0 ? "+" : ""}${a.revenueGrowthPct.toFixed(1)}%`
      : "Динамика: недостаточно данных за прошлый период",
    peakHour ? `Пиковый час по выручке: ${peakHour.hour}:00` : "",
    "",
    "Топ товаров:",
    top,
  ]
    .filter(Boolean)
    .join("\n");
}
