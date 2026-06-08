import { MEDIA_BUYER_RULES, type MediaBuyerRule } from "./rules";
import type {
  CabinetGrade,
  CabinetScore,
  MediaBuyerRuleContext,
  SpecialistMatch,
} from "./types";

const PRIORITY_WEIGHT: Record<SpecialistMatch["priority"], number> = {
  urgent: 3,
  high: 2,
  normal: 1,
};

const GRADE_LABELS: Record<CabinetGrade, string> = {
  poor: "Критично",
  fair: "Требует внимания",
  good: "Хорошо",
  excellent: "Отлично",
};

export class MediaBuyerRuleEngine {
  constructor(private readonly rules: MediaBuyerRule[] = MEDIA_BUYER_RULES) {}

  evaluateAll(context: MediaBuyerRuleContext): SpecialistMatch[] {
    const matches: SpecialistMatch[] = [];
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

  pickVerdict(matches: SpecialistMatch[]): SpecialistMatch | null {
    const errors = matches.filter((m) => m.category === "error");
    return errors[0] ?? matches[0] ?? null;
  }

  pickErrors(matches: SpecialistMatch[]): SpecialistMatch[] {
    return matches.filter((m) => m.category === "error");
  }

  pickOpportunities(matches: SpecialistMatch[]): SpecialistMatch[] {
    return matches.filter((m) => m.category === "opportunity");
  }

  pickRecommendations(
    matches: SpecialistMatch[],
    verdict: SpecialistMatch | null,
    errors: SpecialistMatch[],
    opportunities: SpecialistMatch[],
  ): SpecialistMatch[] {
    const used = new Set<string>();
    if (verdict) used.add(verdict.ruleId);
    for (const m of errors) used.add(m.ruleId);
    for (const m of opportunities) used.add(m.ruleId);

    const recs: SpecialistMatch[] = [];
    for (const match of matches) {
      if (used.has(match.ruleId)) continue;
      used.add(match.ruleId);
      recs.push({ ...match, category: "recommendation" });
      if (recs.length >= 3) break;
    }
    return recs;
  }

  calculateScore(matches: SpecialistMatch[], context: MediaBuyerRuleContext): CabinetScore {
    if (!context.hasData) {
      return {
        score: 0,
        grade: "poor",
        gradeLabel: GRADE_LABELS.poor,
        summary: "Синхронизируйте кабинет для оценки.",
      };
    }

    let score = 100;
    const errors = matches.filter((m) => m.category === "error");

    for (const err of errors) {
      if (err.priority === "urgent") score -= 25;
      else if (err.priority === "high") score -= 15;
      else score -= 8;
    }

    if (context.hasRetargeting) score += 5;

    const ctr = context.account7d?.ctr;
    if (ctr !== null && ctr !== undefined && ctr >= 1.5) score += 5;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    let grade: CabinetGrade;
    if (finalScore >= 80) grade = "excellent";
    else if (finalScore >= 60) grade = "good";
    else if (finalScore >= 40) grade = "fair";
    else grade = "poor";

    const summaries: Record<CabinetGrade, string> = {
      poor: "Кабинет теряет бюджет — срочно исправьте критичные ошибки.",
      fair: "Есть заметные проблемы в таргетинге — исправления дадут быстрый эффект.",
      good: "Кабинет в рабочем состоянии, но есть точки роста.",
      excellent: "Структура и метрики в норме — фокус на масштабирование.",
    };

    return {
      score: finalScore,
      grade,
      gradeLabel: GRADE_LABELS[grade],
      summary: summaries[grade],
    };
  }

  defaultVerdict(context: MediaBuyerRuleContext): SpecialistMatch {
    if (!context.hasMeta) {
      return {
        ruleId: "fallback_no_meta",
        priority: "urgent",
        priorityScore: 100,
        category: "error",
        title: "Подключите Meta Ads",
        cause: "Таргетолог не может работать без доступа к кабинету.",
        advice: "Подключите Meta в интеграциях — это займёт 2 минуты.",
        impact: "Первый аудит выявит ошибки, которые сливают бюджет.",
        actionLabel: "Подключить",
        actionHref: "/profile/integrations",
      };
    }

    return {
      ruleId: "fallback_stable",
      priority: "normal",
      priorityScore: 10,
      category: "recommendation",
      title: "Кабинет в порядке",
      cause: "Критичных ошибок в структуре и метриках не обнаружено.",
      advice:
        "Продолжайте тестировать креативы раз в 2 недели и следите за frequency. Обновите ретаргетинговые аудитории.",
      impact: "Регулярный аудит раз в неделю помогает ловить выгорание до роста CPA.",
      actionLabel: "Создать креатив",
      actionHref: "/studio",
    };
  }
}

export const mediaBuyerRuleEngine = new MediaBuyerRuleEngine();
