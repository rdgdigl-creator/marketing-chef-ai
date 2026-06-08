/** Приоритет срабатывания правила таргетолога. */
export type RulePriority = "urgent" | "high" | "normal";

/** Категория вывода специалиста. */
export type SpecialistCategory = "error" | "opportunity" | "recommendation";

export type InsightPeriod = "last_7d" | "last_30d";

export type AccountInsights = {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  frequency: number | null;
  conversions: number;
  costPerResult: number | null;
};

export type CampaignContext = {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  insights7d: AccountInsights | null;
  insights30d: AccountInsights | null;
};

export type AdSetContext = {
  id: string;
  name: string;
  campaignId: string;
  status: string;
  isRetargeting: boolean;
  targetingSummary: Record<string, unknown>;
  insights7d: AccountInsights | null;
};

export type AdContext = {
  id: string;
  name: string;
  adSetId: string;
  status: string;
  insights7d: AccountInsights | null;
  insights30d: AccountInsights | null;
};

/** Контекст для Rule Engine Media Buyer. */
export type MediaBuyerRuleContext = {
  hasMeta: boolean;
  hasAccount: boolean;
  hasData: boolean;
  adAccountId: string | null;
  adAccountName: string | null;
  currency: string;
  account7d: AccountInsights | null;
  account30d: AccountInsights | null;
  activeCampaigns: number;
  activeAdSets: number;
  hasRetargeting: boolean;
  retargetingAdSets: number;
  campaigns: CampaignContext[];
  adSets: AdSetContext[];
  ads: AdContext[];
};

export type SpecialistMatch = {
  ruleId: string;
  priority: RulePriority;
  priorityScore: number;
  category: SpecialistCategory;
  title: string;
  cause: string;
  advice: string;
  impact: string;
  actionLabel: string;
  actionHref: string;
  entityName?: string;
};

export type CabinetGrade = "poor" | "fair" | "good" | "excellent";

export type CabinetScore = {
  score: number;
  grade: CabinetGrade;
  gradeLabel: string;
  summary: string;
};

export type MediaBuyerKpi = {
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  frequency: number | null;
  spend: number;
  conversions: number;
  currency: string;
};

export type SpecialistIssue = {
  id: string;
  priority: RulePriority;
  title: string;
  cause: string;
  advice: string;
  impact: string;
  actionLabel: string;
  actionHref: string;
  entityName?: string;
};

export type SpecialistOpportunity = SpecialistIssue;

/** Шаг плана действий таргетолога. */
export type ActionPlanStep = {
  step: number;
  priority: RulePriority;
  title: string;
  action: string;
  expectedImpact: string;
  href: string;
  label: string;
};

/** Сводное заключение специалиста. */
export type SpecialistConclusion = {
  headline: string;
  summary: string;
  errorCount: number;
  opportunityCount: number;
  gradeLabel: string;
};

/** Временная диагностика sync / Meta API. */
export type MediaBuyerDebugInfo = {
  selectedAdAccountId: string | null;
  campaignsCount: number;
  adSetsCount: number;
  adsCount: number;
  insightsCount: number;
  accountInsightsLast7d: boolean;
  lastSyncAt: string | null;
  hasData: boolean;
  syncError: string | null;
};

export type MediaBuyerDashboardData = {
  hasMeta: boolean;
  hasAccount: boolean;
  hasData: boolean;
  needsSync: boolean;
  debug: MediaBuyerDebugInfo;
  /** Демо-режим без OAuth (mock provider). */
  isDemo: boolean;
  dataSource: "oauth" | "mock";
  adAccountName: string | null;
  cabinetScore: CabinetScore | null;
  conclusion: SpecialistConclusion | null;
  actionPlan: ActionPlanStep[];
  kpi: MediaBuyerKpi | null;
  specialistVerdict: SpecialistIssue | null;
  errors: SpecialistIssue[];
  opportunities: SpecialistOpportunity[];
  recommendations: SpecialistIssue[];
  directorPrompt: string;
  lastSyncAt: string | null;
  updatedAt: string;
};
