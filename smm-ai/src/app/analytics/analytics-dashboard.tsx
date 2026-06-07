"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Bot,
  DollarSign,
  Plug,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "@/components/ui/icon";
import type { SalesAnalytics } from "@/lib/sales/analytics";

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("ru-RU");
}

function formatDay(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

type Insights = { insights: string[]; recommendations: string[] };

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass-card card-shine rounded-2xl p-5">
      <div className="flex items-center gap-2.5 text-[#A1A1AA]">
        <span className="inline-flex rounded-lg border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] p-2 text-[#8B5CF6]">
          {icon}
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#A1A1AA]">{hint}</p>}
    </div>
  );
}

function BarChart({
  data,
  labelFor,
  color = "#8B5CF6",
}: {
  data: { key: string; value: number; label: string }[];
  labelFor?: (key: string) => string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-44 items-end gap-1">
      {data.map((d) => (
        <div key={d.key} className="group flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${Math.max(2, (d.value / max) * 100)}%`,
              background: `linear-gradient(180deg, ${color} 0%, ${color}55 100%)`,
            }}
            title={`${d.label}: ${formatMoney(d.value)}`}
          />
          <span className="text-[9px] text-[#A1A1AA]/60">
            {labelFor ? labelFor(d.key) : d.key}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card card-shine flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <span className="mb-4 inline-flex rounded-2xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] p-4 text-[#8B5CF6]">
        <BarChart3 size={28} />
      </span>
      <h2 className="text-lg font-semibold text-white">Пока нет данных о продажах</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">
        Подключите кассу iiko и синхронизируйте продажи — здесь появятся выручка, средний
        чек, популярные товары, продажи по дням и часам, а также выводы и рекомендации AI.
      </p>
      <Link
        href="/profile/integrations"
        className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
      >
        <Plug size={16} />
        Подключить iiko
      </Link>
    </div>
  );
}

export function AnalyticsDashboard({ analytics }: { analytics: SalesAnalytics }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/insights", { method: "POST" });
      const data = (await res.json()) as Partial<Insights> & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Не удалось получить выводы AI.");
        return;
      }
      setInsights({
        insights: data.insights ?? [],
        recommendations: data.recommendations ?? [],
      });
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  };

  if (!analytics.hasData) {
    return <EmptyState />;
  }

  const { current, revenueGrowthPct, daily, hourly, topProducts } = analytics;
  const peakHour = [...hourly].sort((a, b) => b.revenue - a.revenue)[0];
  const maxProductRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={<DollarSign size={18} />}
          label="Выручка"
          value={formatMoney(current.totalRevenue)}
          hint="за 30 дней"
        />
        <MetricCard
          icon={<Target size={18} />}
          label="Средний чек"
          value={formatMoney(current.averageCheck)}
          hint={`${formatNumber(current.ordersCount)} заказов`}
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Гостей"
          value={formatNumber(current.guestsCount)}
          hint="за 30 дней"
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Динамика"
          value={
            revenueGrowthPct === null
              ? "—"
              : `${revenueGrowthPct >= 0 ? "+" : ""}${revenueGrowthPct.toFixed(1)}%`
          }
          hint="к прошлому периоду"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card card-shine rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Продажи по дням</h3>
          <BarChart
            data={daily.map((d) => ({ key: d.date, value: d.revenue, label: formatDay(d.date) }))}
            labelFor={(key) => {
              const day = new Date(key).getDate();
              return day % 5 === 0 || day === 1 ? formatDay(key) : "";
            }}
          />
        </div>

        <div className="glass-card card-shine rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Продажи по часам</h3>
          <BarChart
            color="#06B6D4"
            data={hourly.map((h) => ({
              key: String(h.hour),
              value: h.revenue,
              label: `${h.hour}:00`,
            }))}
            labelFor={(key) => (Number(key) % 4 === 0 ? `${key}` : "")}
          />
          {peakHour && peakHour.revenue > 0 && (
            <p className="mt-3 text-xs text-[#A1A1AA]">
              Пиковый час: <span className="text-white">{peakHour.hour}:00</span>
            </p>
          )}
        </div>
      </div>

      <div className="glass-card card-shine rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Популярные товары</h3>
        {topProducts.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">Нет данных о товарах за период.</p>
        ) : (
          <ul className="space-y-3">
            {topProducts.map((product, index) => (
              <li key={product.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-xs font-bold text-[#8B5CF6]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-white">{product.name}</span>
                    <span className="shrink-0 text-sm text-[#A1A1AA]">
                      {formatMoney(product.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                      style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card card-shine rounded-2xl p-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex rounded-lg border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] p-2 text-[#8B5CF6]">
              <Bot size={18} />
            </span>
            <h3 className="text-sm font-semibold text-white">Выводы AI</h3>
          </div>
          <div className="mt-4">
            {insights ? (
              <ul className="space-y-2.5 text-sm leading-relaxed text-[#E4E4E7]">
                {insights.insights.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#A1A1AA]">
                Нажмите «Сгенерировать», чтобы AI-директор проанализировал ваши продажи.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card card-shine rounded-2xl p-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex rounded-lg border border-[#06B6D4]/15 bg-[#06B6D4]/[0.06] p-2 text-[#06B6D4]">
              <Target size={18} />
            </span>
            <h3 className="text-sm font-semibold text-white">Рекомендации AI</h3>
          </div>
          <div className="mt-4">
            {insights ? (
              <ul className="space-y-2.5 text-sm leading-relaxed text-[#E4E4E7]">
                {insights.recommendations.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06B6D4]" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#A1A1AA]">
                Конкретные шаги для роста продаж и среднего чека на основе ваших данных.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={loadInsights}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles size={16} />
          {loading
            ? "AI анализирует…"
            : insights
              ? "Обновить выводы AI"
              : "Сгенерировать выводы AI"}
        </button>
      </div>
    </div>
  );
}
