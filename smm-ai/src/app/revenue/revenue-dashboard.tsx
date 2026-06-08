"use client";

import Link from "next/link";
import { RecommendationCard } from "@/components/revenue/recommendation-card";
import {
  Bot,
  DollarSign,
  Plug,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "@/components/ui/icon";
import type { RevenueDashboardData } from "@/lib/revenue/types";

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("ru-RU");
}

function formatPct(value: number | null): string {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

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

const TIER_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
} as const;

const TIER_COLORS = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-[#8B5CF6]",
} as const;

function EmptyState() {
  return (
    <div className="glass-card card-shine flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <span className="mb-4 inline-flex rounded-2xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] p-4 text-[#8B5CF6]">
        <TrendingUp size={28} />
      </span>
      <h2 className="text-lg font-semibold text-white">Подключите iiko для роста выручки</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">
        AI анализирует продажи из кассы и каждый день подсказывает, что сделать, чтобы
        заработать больше.
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

export function RevenueDashboard({ data }: { data: RevenueDashboardData }) {
  const directorHref = `/?prompt=${encodeURIComponent(data.directorPrompt)}`;

  if (!data.hasIiko || !data.hasData) {
    return <EmptyState />;
  }

  const { kpi, growthPotential, dailyAdvice, todayActions } = data;
  const vsYesterday = kpi.revenueTodayVsYesterdayPct;
  const trendColor =
    vsYesterday === null ? "text-[#A1A1AA]" : vsYesterday >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#A1A1AA]">
          Обновлено{" "}
          {new Date(data.updatedAt).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <Link
          href={directorHref}
          className="btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white"
        >
          <Bot size={18} />
          Спросить директора
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard
          icon={<DollarSign size={18} />}
          label="Выручка сегодня"
          value={formatMoney(kpi.revenueToday)}
          hint={`к вчера: ${formatPct(vsYesterday)}`}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label="Выручка вчера"
          value={formatMoney(kpi.revenueYesterday)}
        />
        <MetricCard
          icon={<Target size={18} />}
          label="Средний чек"
          value={formatMoney(kpi.averageCheckToday)}
          hint="сегодня"
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Гостей"
          value={formatNumber(kpi.guestsToday)}
          hint="сегодня"
        />
        <div className="glass-card card-shine col-span-2 rounded-2xl p-5 lg:col-span-1">
          <div className="flex items-center gap-2.5 text-[#A1A1AA]">
            <span className="inline-flex rounded-lg border border-[#06B6D4]/15 bg-[#06B6D4]/[0.06] p-2 text-[#06B6D4]">
              <Sparkles size={18} />
            </span>
            <span className="text-sm">Потенциал роста</span>
          </div>
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${TIER_COLORS[growthPotential.tier]}`}>
            {growthPotential.score}
            <span className="text-base font-normal text-[#A1A1AA]"> / 100</span>
          </p>
          <p className="mt-1 text-xs text-[#A1A1AA]">
            {TIER_LABELS[growthPotential.tier]} потенциал
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">{growthPotential.summary}</p>
        </div>
      </div>

      {dailyAdvice && (
        <div className="glass-card card-shine rounded-2xl border border-[#8B5CF6]/20 p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex shrink-0 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3 text-2xl">
              🤖
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8B5CF6]">
                Совет дня
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">{dailyAdvice.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{dailyAdvice.text}</p>
              <Link
                href={directorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
              >
                <Bot size={16} />
                Обсудить с директором
              </Link>
            </div>
          </div>
        </div>
      )}

      {todayActions.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span>🎯</span> Что сделать сегодня
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todayActions.map((item) => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <p className={`text-center text-xs ${trendColor}`}>
        Данные из iiko · рекомендации на основе Rule Engine
      </p>
    </div>
  );
}
