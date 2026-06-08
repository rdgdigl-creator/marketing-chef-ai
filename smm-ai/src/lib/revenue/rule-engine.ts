import { REVENUE_RULES, type RevenueRule } from "./rules";
import type { RevenueRuleContext, RuleMatch } from "./types";

const PRIORITY_WEIGHT: Record<RuleMatch["priority"], number> = {
  urgent: 3,
  high: 2,
  normal: 1,
};

/**
 * Rule Engine: прогоняет бизнес-правила по контексту iiko,
 * ранжирует срабатывания и отдаёт совет дня + список действий.
 */
export class RevenueRuleEngine {
  private readonly rules: RevenueRule[];

  constructor(rules: RevenueRule[] = REVENUE_RULES) {
    this.rules = rules;
  }

  /** Все сработавшие правила, отсортированные по важности. */
  evaluateAll(context: RevenueRuleContext): RuleMatch[] {
    const matches: RuleMatch[] = [];

    for (const rule of this.rules) {
      const match = rule.evaluate(context);
      if (match) matches.push(match);
    }

    return matches.sort((a, b) => {
      const pa = PRIORITY_WEIGHT[a.priority] * 100 + a.priorityScore;
      const pb = PRIORITY_WEIGHT[b.priority] * 100 + b.priorityScore;
      return pb - pa;
    });
  }

  /** Главный совет дня — топ-1 правило. */
  pickDailyAdvice(matches: RuleMatch[]): RuleMatch | null {
    return matches[0] ?? null;
  }

  /** До 3 рекомендаций «Что сделать сегодня» (без дубля совета дня). */
  pickTodayActions(matches: RuleMatch[], dailyAdvice: RuleMatch | null): RuleMatch[] {
    const excludeId = dailyAdvice?.ruleId;
    return matches.filter((m) => m.ruleId !== excludeId).slice(0, 3);
  }

  /** Fallback, если ни одно правило не сработало. */
  defaultAdvice(context: RevenueRuleContext): RuleMatch {
    if (!context.hasIiko) {
      return {
        ruleId: "fallback_no_iiko",
        priority: "urgent",
        priorityScore: 100,
        title: "Подключите iiko",
        advice: "Для персональных советов по выручке подключите кассу iiko.",
        actionLabel: "Подключить iiko",
        actionHref: "/profile/integrations",
      };
    }

    return {
      ruleId: "fallback_stable",
      priority: "normal",
      priorityScore: 10,
      title: "Показатели в норме",
      advice:
        "Сегодня нет критичных отклонений — сфокусируйтесь на контенте: покажите кухню, команду или новинку меню.",
      actionLabel: "Создать контент",
      actionHref: "/studio",
    };
  }
}

export const revenueRuleEngine = new RevenueRuleEngine();
