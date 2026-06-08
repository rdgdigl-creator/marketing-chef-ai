import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RevenueKpi, RevenueRuleContext } from "./types";

type DailyRow = {
  business_date: string;
  revenue: number | string;
  orders_count: number;
  guests_count: number;
};

type HourlyRow = {
  hour: number;
  revenue: number | string;
  business_date: string;
};

type ProductRow = {
  product_name: string;
  revenue: number | string;
  business_date: string;
};

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function aggregateDay(rows: DailyRow[], date: string) {
  let revenue = 0;
  let orders = 0;
  let guests = 0;
  for (const row of rows) {
    if (row.business_date !== date) continue;
    revenue += toNumber(row.revenue);
    orders += row.orders_count ?? 0;
    guests += row.guests_count ?? 0;
  }
  return { revenue, orders, guests };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

const EMPTY_CONTEXT: RevenueRuleContext = {
  hasIiko: false,
  hasData: false,
  today: "",
  yesterday: "",
  revenueToday: 0,
  revenueYesterday: 0,
  ordersToday: 0,
  ordersYesterday: 0,
  guestsToday: 0,
  guestsYesterday: 0,
  averageCheckToday: 0,
  averageCheck7d: 0,
  revenue7dAvg: 0,
  guests7dAvg: 0,
  sameWeekdayLastWeekRevenue: 0,
  peakHour: null,
  peakHourSharePct: null,
  topProductName: null,
  topProductRevenue7d: 0,
  topProductRevenuePrev7d: 0,
};

export async function loadRevenueMetrics(): Promise<{
  context: RevenueRuleContext;
  kpi: RevenueKpi;
  restaurantName: string | null;
}> {
  const supabase = await createSupabaseServerClient();

  const [connRes, profileRes] = await Promise.all([
    supabase
      .from("iiko_connections")
      .select("id, is_active")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    supabase.from("user_profiles").select("restaurant_name").maybeSingle(),
  ]);

  const hasIiko = Boolean(connRes.data);
  const restaurantName =
    (profileRes.data as { restaurant_name?: string } | null)?.restaurant_name?.trim() ||
    null;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
  const sameWeekdayLastWeek = new Date(today);
  sameWeekdayLastWeek.setDate(sameWeekdayLastWeek.getDate() - 7);

  const todayStr = isoDate(today);
  const yesterdayStr = isoDate(yesterday);

  const [dailyRes, hourlyRes, productsRes] = await Promise.all([
    supabase
      .from("sales_daily")
      .select("business_date, revenue, orders_count, guests_count")
      .gte("business_date", isoDate(twoWeeksAgo))
      .lte("business_date", todayStr)
      .order("business_date", { ascending: true }),
    supabase
      .from("sales_hourly")
      .select("hour, revenue, business_date")
      .eq("business_date", todayStr),
    supabase
      .from("sales_products")
      .select("product_name, revenue, business_date")
      .gte("business_date", isoDate(twoWeeksAgo))
      .lte("business_date", todayStr),
  ]);

  const dailyRows = (dailyRes.data as DailyRow[] | null) ?? [];
  const hourlyRows = (hourlyRes.data as HourlyRow[] | null) ?? [];
  const productRows = (productsRes.data as ProductRow[] | null) ?? [];

  if (!hasIiko || dailyRows.length === 0) {
    return {
      context: { ...EMPTY_CONTEXT, hasIiko, today: todayStr, yesterday: yesterdayStr },
      kpi: {
        revenueToday: 0,
        revenueYesterday: 0,
        averageCheckToday: 0,
        guestsToday: 0,
        revenueTodayVsYesterdayPct: null,
      },
      restaurantName,
    };
  }

  const todayAgg = aggregateDay(dailyRows, todayStr);
  const yesterdayAgg = aggregateDay(dailyRows, yesterdayStr);
  const sameWeekdayAgg = aggregateDay(dailyRows, isoDate(sameWeekdayLastWeek));

  const last7Dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Dates.push(isoDate(d));
  }

  const revenues7d = last7Dates.map((d) => aggregateDay(dailyRows, d).revenue);
  const guests7d = last7Dates.map((d) => aggregateDay(dailyRows, d).guests);

  let orders7d = 0;
  let revenue7d = 0;
  for (const d of last7Dates) {
    const agg = aggregateDay(dailyRows, d);
    orders7d += agg.orders;
    revenue7d += agg.revenue;
  }

  const averageCheckToday =
    todayAgg.orders > 0 ? todayAgg.revenue / todayAgg.orders : 0;
  const averageCheck7d = orders7d > 0 ? revenue7d / orders7d : 0;

  // Peak hour for today
  const hourlyMap = new Map<number, number>();
  for (const row of hourlyRows) {
    hourlyMap.set(row.hour, (hourlyMap.get(row.hour) ?? 0) + toNumber(row.revenue));
  }
  let peakHour: number | null = null;
  let peakRevenue = 0;
  for (const [hour, revenue] of hourlyMap) {
    if (revenue > peakRevenue) {
      peakRevenue = revenue;
      peakHour = hour;
    }
  }
  const peakHourSharePct =
    todayAgg.revenue > 0 && peakRevenue > 0
      ? (peakRevenue / todayAgg.revenue) * 100
      : null;

  // Top product: last 7d vs previous 7d
  const midDate = isoDate(weekAgo);
  const productMap = new Map<string, { recent: number; prev: number }>();
  for (const row of productRows) {
    const name = row.product_name || "Без названия";
    const entry = productMap.get(name) ?? { recent: 0, prev: 0 };
    const rev = toNumber(row.revenue);
    if (row.business_date >= midDate) {
      entry.recent += rev;
    } else {
      entry.prev += rev;
    }
    productMap.set(name, entry);
  }

  let topProductName: string | null = null;
  let topProductRevenue7d = 0;
  let topProductRevenuePrev7d = 0;
  for (const [name, stats] of productMap) {
    if (stats.recent > topProductRevenue7d) {
      topProductName = name;
      topProductRevenue7d = stats.recent;
      topProductRevenuePrev7d = stats.prev;
    }
  }

  const context: RevenueRuleContext = {
    hasIiko: true,
    hasData: true,
    today: todayStr,
    yesterday: yesterdayStr,
    revenueToday: todayAgg.revenue,
    revenueYesterday: yesterdayAgg.revenue,
    ordersToday: todayAgg.orders,
    ordersYesterday: yesterdayAgg.orders,
    guestsToday: todayAgg.guests,
    guestsYesterday: yesterdayAgg.guests,
    averageCheckToday,
    averageCheck7d,
    revenue7dAvg: average(revenues7d),
    guests7dAvg: average(guests7d),
    sameWeekdayLastWeekRevenue: sameWeekdayAgg.revenue,
    peakHour,
    peakHourSharePct,
    topProductName,
    topProductRevenue7d,
    topProductRevenuePrev7d,
  };

  const kpi: RevenueKpi = {
    revenueToday: todayAgg.revenue,
    revenueYesterday: yesterdayAgg.revenue,
    averageCheckToday,
    guestsToday: todayAgg.guests,
    revenueTodayVsYesterdayPct: pctChange(todayAgg.revenue, yesterdayAgg.revenue),
  };

  return { context, kpi, restaurantName };
}
