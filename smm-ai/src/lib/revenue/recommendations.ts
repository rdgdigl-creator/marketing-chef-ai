import { revenueRuleEngine } from "./rule-engine";
import type {
  GrowthPotential,
  GrowthPotentialTier,
  RevenueAdvice,
  RevenueDashboardData,
  RevenueRecommendation,
  RevenueRuleContext,
} from "./types";
import type { RevenueKpi } from "./types";
import { loadRevenueMetrics } from "./metrics";

function tierFromScore(score: number): GrowthPotentialTier {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

/** Расчёт карточки «Потенциал роста» на основе отставания от среднего. */
export function calculateGrowthPotential(
  ctx: RevenueRuleContext,
  kpi: RevenueKpi,
): GrowthPotential {
  if (!ctx.hasData) {
    return {
      score: 0,
      tier: "low",
      estimateRub: 0,
      summary: "Подключите iiko и синхронизируйте продажи, чтобы увидеть потенциал роста.",
    };
  }

  let score = 0;
  let estimateRub = 0;

  const revenueGap = Math.max(0, ctx.revenue7dAvg - kpi.revenueToday);
  if (ctx.revenue7dAvg > 0 && kpi.revenueToday < ctx.revenue7dAvg) {
    const gapPct = (revenueGap / ctx.revenue7dAvg) * 100;
    score += Math.min(40, gapPct * 1.2);
    estimateRub += revenueGap;
  }

  const checkGap =
    ctx.averageCheck7d > 0
      ? Math.max(0, ctx.averageCheck7d - kpi.averageCheckToday) * Math.max(ctx.ordersToday, 1)
      : 0;
  if (checkGap > 0) {
    score += Math.min(25, (checkGap / Math.max(kpi.revenueToday, 1)) * 100);
    estimateRub += checkGap * 0.5;
  }

  const guestsGap = Math.max(0, ctx.guests7dAvg - kpi.guestsToday);
  if (guestsGap > 0 && ctx.guests7dAvg > 0) {
    const guestGapPct = (guestsGap / ctx.guests7dAvg) * 100;
    score += Math.min(20, guestGapPct);
    const avgCheck = kpi.averageCheckToday || ctx.averageCheck7d;
    estimateRub += guestsGap * avgCheck * 0.3;
  }

  if (ctx.sameWeekdayLastWeekRevenue > kpi.revenueToday) {
    score += 15;
    estimateRub += (ctx.sameWeekdayLastWeekRevenue - kpi.revenueToday) * 0.4;
  }

  const finalScore = Math.min(100, Math.round(score));
  const tier = tierFromScore(finalScore);
  const roundedEstimate = Math.round(estimateRub);

  const summaries: Record<GrowthPotentialTier, string> = {
    high:
      roundedEstimate > 0
        ? `Можно добавить ~${roundedEstimate.toLocaleString("ru-RU")} ₽, если вернуться к среднему уровню продаж.`
        : "Есть заметный запас для роста — действуйте по рекомендациям ниже.",
    medium:
      roundedEstimate > 0
        ? `Потенциал ~${roundedEstimate.toLocaleString("ru-RU")} ₽ при небольших улучшениях в чеке и потоке гостей.`
        : "Умеренный потенциал — точечные акции дадут результат.",
    low: "Показатели близки к норме — фокус на удержании и контенте.",
  };

  return {
    score: finalScore,
    tier,
    estimateRub: roundedEstimate,
    summary: summaries[tier],
  };
}

function buildDirectorPrompt(
  ctx: RevenueRuleContext,
  kpi: RevenueKpi,
  adviceTitle: string,
): string {
  const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");
  const lines = [
    "Помоги увеличить выручку ресторана. Вот данные из iiko:",
    `Выручка сегодня: ${fmt(kpi.revenueToday)} ₽`,
    `Выручка вчера: ${fmt(kpi.revenueYesterday)} ₽`,
    `Средний чек: ${fmt(kpi.averageCheckToday)} ₽`,
    `Гостей сегодня: ${fmt(kpi.guestsToday)}`,
  ];
  if (kpi.revenueTodayVsYesterdayPct !== null) {
    const sign = kpi.revenueTodayVsYesterdayPct >= 0 ? "+" : "";
    lines.push(`Динамика к вчера: ${sign}${kpi.revenueTodayVsYesterdayPct.toFixed(1)}%`);
  }
  lines.push(`Главный сигнал: ${adviceTitle}`);
  lines.push("Дай 3 конкретных шага на сегодня.");
  return lines.join("\n");
}

function toAdvice(match: { ruleId: string; title: string; advice: string }): RevenueAdvice {
  return { ruleId: match.ruleId, title: match.title, text: match.advice };
}

function toRecommendation(match: {
  ruleId: string;
  priority: RevenueRecommendation["priority"];
  title: string;
  advice: string;
  actionLabel: string;
  actionHref: string;
}): RevenueRecommendation {
  return {
    id: match.ruleId,
    priority: match.priority,
    title: match.title,
    description: match.advice,
    actionLabel: match.actionLabel,
    actionHref: match.actionHref,
  };
}

export async function getRevenueDashboard(): Promise<RevenueDashboardData> {
  const { context, kpi, restaurantName } = await loadRevenueMetrics();
  const matches = revenueRuleEngine.evaluateAll(context);

  const dailyMatch =
    revenueRuleEngine.pickDailyAdvice(matches) ??
    (context.hasIiko && context.hasData ? revenueRuleEngine.defaultAdvice(context) : null);

  const actionMatches = revenueRuleEngine.pickTodayActions(matches, dailyMatch);

  if (actionMatches.length < 3 && context.hasData) {
    const extras = [
      {
        ruleId: "extra_content",
        priority: "normal" as const,
        priorityScore: 20,
        title: "Покажите кухню в Stories",
        advice: "Живой контент с кухни повышает доверие и приводит гостей без скидок.",
        actionLabel: "Создать Stories",
        actionHref: "/studio",
      },
      {
        ruleId: "extra_menu",
        priority: "normal" as const,
        priorityScore: 15,
        title: "Обновите фото хита меню",
        advice: "Свежее фото лучшего блюда в соцсетях стимулирует повторные визиты.",
        actionLabel: "Улучшить фото",
        actionHref: "/upload",
      },
      {
        ruleId: "extra_analytics",
        priority: "normal" as const,
        priorityScore: 10,
        title: "Проверьте детальную аналитику",
        advice: "Посмотрите продажи по часам и топ блюд — найдите точки роста.",
        actionLabel: "Открыть аналитику",
        actionHref: "/analytics",
      },
    ];
    for (const extra of extras) {
      if (actionMatches.length >= 3) break;
      if (actionMatches.some((m) => m.ruleId === extra.ruleId)) continue;
      if (dailyMatch?.ruleId === extra.ruleId) continue;
      actionMatches.push(extra);
    }
  }

  const growthPotential = calculateGrowthPotential(context, kpi);
  const adviceTitle = dailyMatch?.title ?? "Рост выручки";

  return {
    hasIiko: context.hasIiko,
    hasData: context.hasData,
    restaurantName,
    kpi,
    growthPotential,
    dailyAdvice: dailyMatch ? toAdvice(dailyMatch) : null,
    todayActions: actionMatches.map(toRecommendation),
    directorPrompt: buildDirectorPrompt(context, kpi, adviceTitle),
    updatedAt: new Date().toISOString(),
  };
}
