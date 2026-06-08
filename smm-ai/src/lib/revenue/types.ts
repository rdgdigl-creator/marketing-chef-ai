/** Приоритет срабатывания правила (выше = важнее). */
export type RulePriority = "urgent" | "high" | "normal";

/** Результат срабатывания одного бизнес-правила. */
export type RuleMatch = {
  ruleId: string;
  priority: RulePriority;
  priorityScore: number;
  title: string;
  advice: string;
  actionLabel: string;
  actionHref: string;
};

/** Контекст для Rule Engine — агрегаты из iiko. */
export type RevenueRuleContext = {
  hasIiko: boolean;
  hasData: boolean;
  today: string;
  yesterday: string;
  revenueToday: number;
  revenueYesterday: number;
  ordersToday: number;
  ordersYesterday: number;
  guestsToday: number;
  guestsYesterday: number;
  averageCheckToday: number;
  averageCheck7d: number;
  revenue7dAvg: number;
  guests7dAvg: number;
  sameWeekdayLastWeekRevenue: number;
  peakHour: number | null;
  peakHourSharePct: number | null;
  topProductName: string | null;
  topProductRevenue7d: number;
  topProductRevenuePrev7d: number;
};

export type RevenueKpi = {
  revenueToday: number;
  revenueYesterday: number;
  averageCheckToday: number;
  guestsToday: number;
  revenueTodayVsYesterdayPct: number | null;
};

export type GrowthPotentialTier = "low" | "medium" | "high";

/** Карточка «Потенциал роста». */
export type GrowthPotential = {
  score: number;
  tier: GrowthPotentialTier;
  estimateRub: number;
  summary: string;
};

export type RevenueAdvice = {
  ruleId: string;
  title: string;
  text: string;
};

export type RevenueRecommendation = {
  id: string;
  priority: RulePriority;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

export type RevenueDashboardData = {
  hasIiko: boolean;
  hasData: boolean;
  restaurantName: string | null;
  kpi: RevenueKpi;
  growthPotential: GrowthPotential;
  dailyAdvice: RevenueAdvice | null;
  todayActions: RevenueRecommendation[];
  directorPrompt: string;
  updatedAt: string;
};
