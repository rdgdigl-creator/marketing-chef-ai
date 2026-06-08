import { getAuthUser } from "@/lib/auth";
import { getMetaConnectionStatus } from "@/lib/meta";
import { getMetaDataSource, isMetaMockMode } from "@/lib/meta/data-source";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildActionPlan, buildConclusion } from "./action-plan";
import { loadMediaBuyerContext } from "./metrics";
import { mediaBuyerRuleEngine } from "./rule-engine";
import type {
  MediaBuyerDashboardData,
  MediaBuyerKpi,
  SpecialistIssue,
  SpecialistMatch,
} from "./types";

function toIssue(match: SpecialistMatch): SpecialistIssue {
  return {
    id: match.ruleId,
    priority: match.priority,
    title: match.title,
    cause: match.cause,
    advice: match.advice,
    impact: match.impact,
    actionLabel: match.actionLabel,
    actionHref: match.actionHref,
    entityName: match.entityName,
  };
}

function buildKpi(context: Awaited<ReturnType<typeof loadMediaBuyerContext>>["context"]): MediaBuyerKpi | null {
  if (!context.account7d) return null;
  const a = context.account7d;
  return {
    ctr: a.ctr,
    cpm: a.cpm,
    cpc: a.cpc,
    frequency: a.frequency,
    spend: a.spend,
    conversions: a.conversions,
    currency: context.currency,
  };
}

function buildDirectorPrompt(
  context: Awaited<ReturnType<typeof loadMediaBuyerContext>>["context"],
  verdictTitle: string,
  errors: SpecialistIssue[],
): string {
  const lines = [
    "Ты — таргетолог Meta Ads для ресторана. Проанализируй кабинет и дай план:",
    `Кабинет: ${context.adAccountName ?? "—"}`,
  ];

  if (context.account7d) {
    const a = context.account7d;
    lines.push(
      `За 7 дней: spend ${Math.round(a.spend)} ${context.currency}, CTR ${(a.ctr ?? 0).toFixed(2)}%, CPM ${Math.round(a.cpm ?? 0)}, frequency ${(a.frequency ?? 0).toFixed(1)}, конверсии ${a.conversions}`,
    );
  }

  lines.push(`Главная проблема: ${verdictTitle}`);
  if (errors.length > 0) {
    lines.push("Ошибки:");
    for (const err of errors.slice(0, 3)) {
      lines.push(`- ${err.title}: ${err.cause}`);
    }
  }
  lines.push("Дай 3 конкретных шага таргетолога на эту неделю с ожидаемым эффектом.");
  return lines.join("\n");
}

const AUDIT_SAVE_INTERVAL_MS = 30 * 60 * 1000;

async function shouldSaveAudit(userId: string, adAccountId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("media_buyer_audits")
    .select("created_at")
    .eq("user_id", userId)
    .eq("ad_account_id", adAccountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at) return true;
  const age = Date.now() - new Date(data.created_at).getTime();
  return age >= AUDIT_SAVE_INTERVAL_MS;
}

async function saveAudit(
  userId: string,
  context: Awaited<ReturnType<typeof loadMediaBuyerContext>>["context"],
  score: { score: number; grade: string },
  errors: SpecialistIssue[],
  opportunities: SpecialistIssue[],
  recommendations: SpecialistIssue[],
  kpis: MediaBuyerKpi | null,
  options?: { force?: boolean },
) {
  if (!context.hasData || !context.adAccountId) return;
  if (isMetaMockMode()) return;
  if (
    !options?.force &&
    !(await shouldSaveAudit(userId, context.adAccountId))
  ) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: connection } = await supabase
    .from("meta_connections")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) return;

  await supabase.from("media_buyer_audits").insert({
    user_id: userId,
    connection_id: connection.id,
    ad_account_id: context.adAccountId,
    score: score.score,
    grade: score.grade,
    kpis: kpis ?? {},
    issues: errors,
    opportunities,
    recommendations,
  });
}

/** Сохранить аудит после синхронизации (без throttle). */
export async function forceSaveMediaBuyerAudit(): Promise<void> {
  const user = await getAuthUser();
  if (!user) return;

  const { context } = await loadMediaBuyerContext();
  if (!context.hasData) return;

  const matches = mediaBuyerRuleEngine.evaluateAll(context);
  const cabinetScore = mediaBuyerRuleEngine.calculateScore(matches, context);
  const errors = mediaBuyerRuleEngine.pickErrors(matches).map(toIssue);
  const opportunities = mediaBuyerRuleEngine.pickOpportunities(matches).map(toIssue);
  const verdictMatch = mediaBuyerRuleEngine.pickVerdict(matches);
  const recommendations = mediaBuyerRuleEngine
    .pickRecommendations(
      matches,
      verdictMatch,
      mediaBuyerRuleEngine.pickErrors(matches),
      mediaBuyerRuleEngine.pickOpportunities(matches),
    )
    .map(toIssue);

  await saveAudit(
    user.id,
    context,
    cabinetScore,
    errors,
    opportunities,
    recommendations,
    buildKpi(context),
    { force: true },
  );
}

export async function getMediaBuyerDashboard(): Promise<MediaBuyerDashboardData> {
  const user = await getAuthUser();
  if (!user) throw new Error("Не авторизован");

  const [metaStatus, loaded] = await Promise.all([
    getMetaConnectionStatus(user.id),
    loadMediaBuyerContext(),
  ]);
  const { context, lastSyncAt, debug: loadDebug } = loaded;
  const matches = mediaBuyerRuleEngine.evaluateAll(context);

  const verdictMatch =
    mediaBuyerRuleEngine.pickVerdict(matches) ??
    (context.hasData ? mediaBuyerRuleEngine.defaultVerdict(context) : null);

  const errorMatches = mediaBuyerRuleEngine.pickErrors(matches);
  const opportunityMatches = mediaBuyerRuleEngine.pickOpportunities(matches);
  const recommendationMatches = mediaBuyerRuleEngine.pickRecommendations(
    matches,
    verdictMatch,
    errorMatches,
    opportunityMatches,
  );

  const cabinetScore = context.hasData
    ? mediaBuyerRuleEngine.calculateScore(matches, context)
    : null;

  const errors = errorMatches.map(toIssue);
  const opportunities = opportunityMatches.map(toIssue);
  const recommendations = recommendationMatches.map(toIssue);
  const kpi = buildKpi(context);
  const specialistVerdict = verdictMatch ? toIssue(verdictMatch) : null;

  const conclusion =
    cabinetScore && context.hasData
      ? buildConclusion(cabinetScore, specialistVerdict, errors, opportunities)
      : null;

  const actionPlan = context.hasData
    ? buildActionPlan(specialistVerdict, errors, opportunities)
    : [];

  const verdictTitle = verdictMatch?.title ?? "Media Buyer Agent";
  const directorPrompt = buildDirectorPrompt(context, verdictTitle, errors);

  if (context.hasData && cabinetScore) {
    await saveAudit(
      user.id,
      context,
      cabinetScore,
      errors,
      opportunities,
      recommendations,
      kpi,
    );
  }

  const dataSource = getMetaDataSource();

  return {
    hasMeta: context.hasMeta,
    hasAccount: context.hasAccount,
    hasData: context.hasData,
    needsSync: context.hasAccount && !context.hasData,
    isDemo: dataSource === "mock",
    dataSource,
    adAccountName: context.adAccountName,
    cabinetScore,
    conclusion,
    actionPlan,
    kpi,
    specialistVerdict,
    errors,
    opportunities,
    recommendations,
    directorPrompt,
    lastSyncAt,
    updatedAt: new Date().toISOString(),
    debug: {
      selectedAdAccountId: loadDebug.selectedAdAccountId,
      campaignsCount: loadDebug.campaignsCount,
      adSetsCount: loadDebug.adSetsCount,
      adsCount: loadDebug.adsCount,
      insightsCount: loadDebug.insightsCount,
      accountInsightsLast7d: loadDebug.accountInsightsLast7d,
      lastSyncAt,
      hasData: context.hasData,
      syncError: metaStatus.errorMessage,
    },
  };
}
