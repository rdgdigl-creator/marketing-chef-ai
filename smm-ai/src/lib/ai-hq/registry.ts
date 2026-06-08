import type { AgentCardData, AgentId } from "./types";

/** Статический реестр агентов — единый источник названий и маршрутов. */
export const AGENT_REGISTRY: Record<
  AgentId,
  Omit<AgentCardData, "status" | "statusLabel" | "metrics">
> = {
  analytics: {
    id: "analytics",
    emoji: "📊",
    name: "Analytics Agent",
    description: "Аналитика продаж и бизнес-показателей из iiko.",
    href: "/analytics",
    accent: "#06B6D4",
  },
  "media-buyer": {
    id: "media-buyer",
    emoji: "🎯",
    name: "Media Buyer Agent",
    description: "AI-таргетолог: аудит Meta Ads, ошибки и рекомендации.",
    href: "/media-buyer",
    accent: "#1877F2",
  },
  creative: {
    id: "creative",
    emoji: "🎨",
    name: "Creative Agent",
    description: "Генерация креативов, Reels и контент-планов.",
    href: "/studio",
    accent: "#8B5CF6",
  },
  audience: {
    id: "audience",
    emoji: "👥",
    name: "Audience Agent",
    description: "Сегменты аудитории и таргетинг для рекламы.",
    href: null,
    accent: "#F59E0B",
  },
  competitor: {
    id: "competitor",
    emoji: "🏆",
    name: "Competitor Agent",
    description: "Анализ конкурентов в Instagram и соцсетях.",
    href: "/competitor-analysis",
    accent: "#10B981",
  },
  roi: {
    id: "roi",
    emoji: "💰",
    name: "ROI Agent",
    description: "Расчёт окупаемости маркетинга и потенциала роста.",
    href: "/revenue",
    accent: "#22C55E",
  },
  director: {
    id: "director",
    emoji: "👑",
    name: "AI Director",
    description: "Главный AI-директор: приоритеты и план действий.",
    href: "/",
    accent: "#A78BFA",
  },
};

export const AGENT_ORDER: AgentId[] = [
  "analytics",
  "media-buyer",
  "creative",
  "audience",
  "competitor",
  "roi",
  "director",
];
