import { getIikoConnectionStatus } from "@/lib/iiko/connection-status";
import { getMetaConnectionStatus } from "@/lib/meta";
import { getMetaDataSource } from "@/lib/meta/data-source";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AGENT_ORDER, AGENT_REGISTRY } from "@/lib/ai-hq/registry";
import type { AgentCardData, AgentStatus, AiHqDashboardData } from "@/lib/ai-hq/types";
import { resolveMediaBuyerStatus } from "./media-buyer-status";

function formatDateTime(value: string | null): string {
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

function statusLabel(status: AgentStatus): string {
  switch (status) {
    case "active":
      return "Активен";
    case "ready":
      return "Готов";
    case "needs_setup":
      return "Нужна настройка";
    case "coming_soon":
      return "Скоро";
    case "offline":
      return "Неактивен";
  }
}

async function loadSharedCounts(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [creatives, competitors] = await Promise.all([
    supabase
      .from("marketing_creatives")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("competitor_analyses")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  return {
    creativesCount: creatives.count ?? 0,
    lastCompetitorAt:
      (competitors.data?.[0] as { created_at?: string } | undefined)?.created_at ?? null,
  };
}

export async function resolveAllAgentCards(userId: string): Promise<AgentCardData[]> {
  const [iiko, meta, counts, mediaBuyer] = await Promise.all([
    getIikoConnectionStatus(userId),
    getMetaConnectionStatus(userId),
    loadSharedCounts(userId),
    resolveMediaBuyerStatus(userId),
  ]);

  const dataSource = getMetaDataSource();
  const isDemo = dataSource === "mock";

  const analyticsStatus: AgentStatus = iiko.connected
    ? iiko.lastSyncAt
      ? "active"
      : "ready"
    : "needs_setup";

  const cards: AgentCardData[] = [
    {
      ...AGENT_REGISTRY.analytics,
      status: analyticsStatus,
      statusLabel: statusLabel(analyticsStatus),
      metrics: [
        { label: "Статус", value: statusLabel(analyticsStatus) },
        { label: "Последний запуск", value: formatDateTime(iiko.lastSyncAt) },
        {
          label: "Последний вывод",
          value: iiko.connected
            ? iiko.organizationName
              ? `Данные: ${iiko.organizationName}`
              : "Данные iiko загружены"
            : "Подключите iiko",
        },
      ],
    },
    {
      ...AGENT_REGISTRY["media-buyer"],
      status: mediaBuyer.status,
      statusLabel: statusLabel(mediaBuyer.status),
      metrics: [
        {
          label: "Статус",
          value: isDemo && mediaBuyer.connected
            ? `${statusLabel(mediaBuyer.status)} · Демо`
            : statusLabel(mediaBuyer.status),
        },
        {
          label: "Подключенные кабинеты",
          value: mediaBuyer.connected
            ? mediaBuyer.accountName ?? "Кабинет выбран"
            : isDemo
              ? "Демо-кабинет доступен"
              : "Не подключён",
        },
        {
          label: "Последний аудит",
          value: mediaBuyer.lastAudit
            ? `${mediaBuyer.lastAudit.score}/100 · ${formatDateTime(mediaBuyer.lastAudit.createdAt)}`
            : mediaBuyer.connected
              ? "Запустите аудит"
              : "—",
        },
        {
          label: "Последний вывод",
          value: mediaBuyer.lastAudit?.topIssueTitle
            ? mediaBuyer.lastAudit.topIssueTitle
            : mediaBuyer.connected
              ? "Ожидает синхронизации"
              : isDemo
                ? "Подключите демо-кабинет"
                : "—",
        },
      ],
    },
    {
      ...AGENT_REGISTRY.creative,
      status: counts.creativesCount > 0 ? "active" : "ready",
      statusLabel: statusLabel(counts.creativesCount > 0 ? "active" : "ready"),
      metrics: [
        {
          label: "Статус",
          value: statusLabel(counts.creativesCount > 0 ? "active" : "ready"),
        },
        { label: "Созданные креативы", value: String(counts.creativesCount) },
        { label: "Студия", value: "Creative Studio" },
      ],
    },
    {
      ...AGENT_REGISTRY.audience,
      status: "coming_soon",
      statusLabel: statusLabel("coming_soon"),
      metrics: [
        { label: "Статус", value: statusLabel("coming_soon") },
        { label: "Сегменты аудитории", value: "—" },
        { label: "Источники", value: "Meta · iiko" },
      ],
    },
    {
      ...AGENT_REGISTRY.competitor,
      status: counts.lastCompetitorAt ? "active" : "ready",
      statusLabel: statusLabel(counts.lastCompetitorAt ? "active" : "ready"),
      metrics: [
        {
          label: "Статус",
          value: statusLabel(counts.lastCompetitorAt ? "active" : "ready"),
        },
        {
          label: "Последний анализ",
          value: formatDateTime(counts.lastCompetitorAt),
        },
        { label: "Инструмент", value: "Анализ конкурентов" },
      ],
    },
    {
      ...AGENT_REGISTRY.roi,
      status: iiko.connected && iiko.lastSyncAt ? "active" : "needs_setup",
      statusLabel: statusLabel(
        iiko.connected && iiko.lastSyncAt ? "active" : "needs_setup",
      ),
      metrics: [
        {
          label: "Статус",
          value: statusLabel(
            iiko.connected && iiko.lastSyncAt ? "active" : "needs_setup",
          ),
        },
        { label: "Последний расчёт", value: formatDateTime(iiko.lastSyncAt) },
        { label: "Модуль", value: "Рост выручки" },
      ],
    },
    {
      ...AGENT_REGISTRY.director,
      status: "active",
      statusLabel: statusLabel("active"),
      metrics: [
        { label: "Статус", value: "Онлайн" },
        {
          label: "Текущий вывод",
          value:
            mediaBuyer.status === "active"
              ? "Таргетинг + продажи + креативы"
              : iiko.connected
                ? "Анализ продаж и маркетинга"
                : "Ожидает данные интеграций",
        },
        {
          label: "Приоритеты",
          value: mediaBuyer.connected
            ? "Meta Ads · Выручка · Креативы"
            : "Выручка · Креативы · Конкуренты",
        },
        { label: "План действий", value: "Спросите AI Директора" },
      ],
    },
  ];

  return AGENT_ORDER.map((id) => cards.find((card) => card.id === id)!);
}

export async function getAiHqDashboard(): Promise<
  AiHqDashboardData & {
    dataSource: "oauth" | "mock";
    mediaBuyer: {
      status: AgentStatus;
      score: number | null;
      topIssue: string | null;
    };
  }
> {
  const { getAuthUser } = await import("@/lib/auth");
  const user = await getAuthUser();
  if (!user) throw new Error("Не авторизован");

  const [agents, mediaBuyer] = await Promise.all([
    resolveAllAgentCards(user.id),
    resolveMediaBuyerStatus(user.id),
  ]);
  const dataSource = getMetaDataSource();

  return {
    updatedAt: new Date().toISOString(),
    agents,
    dataSource,
    mediaBuyer: {
      status: mediaBuyer.status,
      score: mediaBuyer.lastAudit?.score ?? null,
      topIssue: mediaBuyer.lastAudit?.topIssueTitle ?? null,
    },
    summary: {
      activeCount: agents.filter((a) => a.status === "active").length,
      readyCount: agents.filter((a) => a.status === "ready").length,
      needsSetupCount: agents.filter((a) => a.status === "needs_setup").length,
    },
  };
}
