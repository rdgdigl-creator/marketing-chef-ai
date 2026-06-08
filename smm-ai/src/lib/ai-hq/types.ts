/** Статус агента в штабе. */
export type AgentStatus =
  | "active"
  | "ready"
  | "needs_setup"
  | "coming_soon"
  | "offline";

export type AgentId =
  | "analytics"
  | "media-buyer"
  | "creative"
  | "audience"
  | "competitor"
  | "roi"
  | "director";

/** Одна строка метаданных на карточке агента. */
export type AgentMetric = {
  label: string;
  value: string;
};

/** Карточка агента на дашборде Штаба ИИ. */
export type AgentCardData = {
  id: AgentId;
  emoji: string;
  name: string;
  description: string;
  status: AgentStatus;
  statusLabel: string;
  href: string | null;
  metrics: AgentMetric[];
  accent: string;
};

export type AiHqDashboardData = {
  updatedAt: string;
  agents: AgentCardData[];
  summary: {
    activeCount: number;
    readyCount: number;
    needsSetupCount: number;
  };
};
