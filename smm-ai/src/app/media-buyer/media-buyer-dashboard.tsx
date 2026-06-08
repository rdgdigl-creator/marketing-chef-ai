"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoModeBanner } from "@/components/demo-mode-banner";
import { ActionPlan } from "@/components/media-buyer/action-plan";
import { ConclusionReport } from "@/components/media-buyer/conclusion-report";
import { SpecialistCard } from "@/components/media-buyer/specialist-card";
import {
  Bot,
  Plug,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from "@/components/ui/icon";
import type {
  MediaBuyerDashboardData,
  MediaBuyerDebugInfo,
} from "@/lib/media-buyer/types";
import type { MetaSyncResult } from "@/lib/meta/sync-service";

function formatDebugDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MediaBuyerDebugBlock({
  debug,
  lastSyncResponse,
  clientSyncError,
}: {
  debug: MediaBuyerDebugInfo;
  lastSyncResponse: MetaSyncResult | null;
  clientSyncError: string | null;
}) {
  const syncError = clientSyncError ?? debug.syncError;

  return (
    <details
      open
      className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-sm"
    >
      <summary className="cursor-pointer font-medium text-amber-300">
        Debug · Meta sync (временно)
      </summary>
      <dl className="mt-3 space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">selectedAdAccountId</dt>
          <dd className="break-all text-right font-mono text-xs text-white">
            {debug.selectedAdAccountId ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">campaignsCount</dt>
          <dd className="text-white">{debug.campaignsCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">adSetsCount</dt>
          <dd className="text-white">{debug.adSetsCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">adsCount</dt>
          <dd className="text-white">{debug.adsCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">insightsCount (DB)</dt>
          <dd className="text-white">{debug.insightsCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">accountInsightsLast7d</dt>
          <dd className="text-white">{debug.accountInsightsLast7d ? "true" : "false"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">lastSyncAt</dt>
          <dd className="text-white">{formatDebugDate(debug.lastSyncAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">hasData</dt>
          <dd className="text-white">{debug.hasData ? "true" : "false"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#A1A1AA]">syncError</dt>
          <dd className="break-all text-right text-red-300">{syncError ?? "—"}</dd>
        </div>
        {lastSyncResponse && (
          <div className="mt-2 border-t border-amber-500/20 pt-2">
            <p className="text-xs font-medium text-amber-200">POST /api/meta/sync</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-2 text-left font-mono text-[10px] leading-relaxed text-[#E4E4E7]">
              {JSON.stringify(lastSyncResponse, null, 2)}
            </pre>
          </div>
        )}
      </dl>
    </details>
  );
}

function formatMoney(value: number, currency: string): string {
  const symbol = currency === "RUB" || currency === "RUR" ? "₽" : currency;
  return `${Math.round(value).toLocaleString("ru-RU")} ${symbol}`;
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs text-[#A1A1AA]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ConnectState({ isDemo }: { isDemo: boolean }) {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleDemoConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/meta/mock/quickstart", { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="glass-card card-shine flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <span className="mb-4 inline-flex rounded-2xl border border-[#1877F2]/15 bg-[#1877F2]/[0.06] p-4 text-[#60A5FA]">
        <Target size={28} />
      </span>
      <h2 className="text-lg font-semibold text-white">
        {isDemo ? "Подключите демо-кабинет" : "Подключите Meta Ads"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">
        AI-таргетолог найдёт ошибки в кабинете, объяснит причины и предложит решения
        с оценкой влияния на результат.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isDemo && (
          <button
            type="button"
            onClick={handleDemoConnect}
            disabled={connecting}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <Plug size={16} />
            {connecting ? "Запуск…" : "Демо-аудит за 1 клик"}
          </button>
        )}
        <Link
          href="/profile/integrations"
          className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
        >
          <Plug size={16} />
          Интеграции
        </Link>
      </div>
    </div>
  );
}

function SyncState({
  onSync,
  syncing,
  isDemo,
  onQuickstart,
  quickstarting,
}: {
  onSync: () => void;
  syncing: boolean;
  isDemo: boolean;
  onQuickstart: () => void;
  quickstarting: boolean;
}) {
  const busy = syncing || quickstarting;

  return (
    <div className="glass-card card-shine flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <span className="mb-4 inline-flex rounded-2xl border border-[#1877F2]/15 bg-[#1877F2]/[0.06] p-4 text-[#60A5FA]">
        <RefreshCw size={28} className={busy ? "animate-spin" : undefined} />
      </span>
      <h2 className="text-lg font-semibold text-white">
        {isDemo ? "Запустите демо-аудит" : "Запустите первый аудит"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">
        {isDemo
          ? "Демо-кабинет подключён. Загрузите mock-данные — таргетолог проведёт аудит с ошибками и рекомендациями."
          : "Синхронизируйте кампании и метрики из Meta Ads — таргетолог проведёт первый аудит."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isDemo && (
          <button
            type="button"
            onClick={onQuickstart}
            disabled={busy}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <RefreshCw size={16} className={quickstarting ? "animate-spin" : undefined} />
            {quickstarting ? "Запуск…" : "Демо-аудит за 1 клик"}
          </button>
        )}
        <button
          type="button"
          onClick={onSync}
          disabled={busy}
          className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <RefreshCw size={16} className={syncing ? "animate-spin" : undefined} />
          {syncing ? "Синхронизация…" : "Синхронизировать"}
        </button>
      </div>
    </div>
  );
}

export function MediaBuyerDashboard({ data }: { data: MediaBuyerDashboardData }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [quickstarting, setQuickstarting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncResponse, setLastSyncResponse] = useState<MetaSyncResult | null>(null);

  const debugBlock = (
    <MediaBuyerDebugBlock
      debug={data.debug}
      lastSyncResponse={lastSyncResponse}
      clientSyncError={syncError}
    />
  );

  const handleQuickstart = async () => {
    setQuickstarting(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/meta/mock/quickstart", { method: "POST" });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSyncError(body.error ?? "Не удалось запустить демо");
        return;
      }
      router.refresh();
    } catch {
      setSyncError("Сетевая ошибка");
    } finally {
      setQuickstarting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/meta/sync", { method: "POST" });
      const body = (await res.json()) as MetaSyncResult & { error?: string };
      setLastSyncResponse(body);
      if (!res.ok) {
        setSyncError(body.error ?? "Не удалось синхронизировать");
        return;
      }
      router.refresh();
    } catch {
      setSyncError("Сетевая ошибка при синхронизации");
    } finally {
      setSyncing(false);
    }
  };

  if (!data.hasMeta || !data.hasAccount) {
    return (
      <div className="space-y-4">
        <ConnectState isDemo={data.isDemo} />
        {debugBlock}
      </div>
    );
  }

  if (data.needsSync) {
    return (
      <div className="space-y-4">
        <SyncState
          onSync={handleSync}
          syncing={syncing}
          isDemo={data.isDemo}
          onQuickstart={handleQuickstart}
          quickstarting={quickstarting}
        />
        {debugBlock}
      </div>
    );
  }

  const directorHref = `/?prompt=${encodeURIComponent(data.directorPrompt)}`;
  const kpi = data.kpi;

  return (
    <div className="space-y-6">
      {debugBlock}
      {data.isDemo && <DemoModeBanner title="Media Buyer · демо-аудит" />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#A1A1AA]">
          {data.adAccountName && <span>{data.adAccountName} · </span>}
          Обновлено{" "}
          {new Date(data.updatedAt).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="btn-glass inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : undefined} />
            {syncing ? "Обновление…" : "Обновить аудит"}
          </button>
          <Link
            href={directorHref}
            className="btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
          >
            <Bot size={16} />
            Спросить таргетолога
          </Link>
        </div>
      </div>

      {syncError && <p className="text-sm text-red-400">{syncError}</p>}

      {data.cabinetScore && data.conclusion && (
        <ConclusionReport
          score={data.cabinetScore}
          conclusion={data.conclusion}
          verdict={data.specialistVerdict}
        />
      )}

      {data.actionPlan.length > 0 && <ActionPlan steps={data.actionPlan} />}

      {kpi && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-[#A1A1AA] transition-colors hover:text-white">
            Справочно: метрики кабинета (7 дней)
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <KpiTile label="CTR" value={kpi.ctr !== null ? `${kpi.ctr.toFixed(2)}%` : "—"} />
            <KpiTile label="CPM" value={kpi.cpm !== null ? formatMoney(kpi.cpm, kpi.currency) : "—"} />
            <KpiTile label="CPC" value={kpi.cpc !== null ? formatMoney(kpi.cpc, kpi.currency) : "—"} />
            <KpiTile
              label="Frequency"
              value={kpi.frequency !== null ? kpi.frequency.toFixed(1) : "—"}
            />
            <KpiTile label="Spend" value={formatMoney(kpi.spend, kpi.currency)} />
            <KpiTile label="Конверсии" value={String(Math.round(kpi.conversions))} />
          </div>
        </details>
      )}

      {data.errors.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span>⚠️</span> Детализация ошибок ({data.errors.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.errors
              .filter((e) => e.id !== data.specialistVerdict?.id)
              .map((item) => (
                <SpecialistCard key={item.id} item={item} variant="error" />
              ))}
          </div>
        </section>
      )}

      {data.opportunities.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp size={20} className="text-emerald-400" />
            Возможности роста ({data.opportunities.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.opportunities.map((item) => (
              <SpecialistCard key={item.id} item={item} variant="opportunity" />
            ))}
          </div>
        </section>
      )}

      {data.recommendations.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Zap size={20} className="text-[#8B5CF6]" />
            Рекомендации
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.recommendations.map((item) => (
              <SpecialistCard key={item.id} item={item} variant="recommendation" />
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-[#71717A]">
        Media Buyer Agent · Rule Engine + Meta Insights · не публикует рекламу автоматически
      </p>
    </div>
  );
}
