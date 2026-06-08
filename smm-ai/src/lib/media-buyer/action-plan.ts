import type {
  ActionPlanStep,
  SpecialistConclusion,
  SpecialistIssue,
} from "./types";
import type { CabinetScore } from "./types";

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2 } as const;

function sortByPriority(items: SpecialistIssue[]): SpecialistIssue[] {
  return [...items].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}

export function buildActionPlan(
  verdict: SpecialistIssue | null,
  errors: SpecialistIssue[],
  opportunities: SpecialistIssue[],
): ActionPlanStep[] {
  const pool: SpecialistIssue[] = [];
  const seen = new Set<string>();

  if (verdict) {
    pool.push(verdict);
    seen.add(verdict.id);
  }

  for (const item of sortByPriority(errors)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    pool.push(item);
  }

  for (const item of sortByPriority(opportunities)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    pool.push(item);
  }

  return pool.slice(0, 5).map((item, index) => ({
    step: index + 1,
    priority: item.priority,
    title: item.title,
    action: item.advice,
    expectedImpact: item.impact,
    href: item.actionHref,
    label: item.actionLabel,
  }));
}

export function buildConclusion(
  score: CabinetScore,
  verdict: SpecialistIssue | null,
  errors: SpecialistIssue[],
  opportunities: SpecialistIssue[],
): SpecialistConclusion {
  const headline = verdict?.title ?? score.summary;

  const parts: string[] = [score.summary];

  if (errors.length > 0) {
    parts.push(
      `Обнаружено ${errors.length} ${errors.length === 1 ? "ошибка" : errors.length < 5 ? "ошибки" : "ошибок"} в таргетинге.`,
    );
  }

  if (opportunities.length > 0) {
    parts.push(`${opportunities.length} возможност${opportunities.length === 1 ? "ь" : "и"} для роста без увеличения бюджета.`);
  }

  if (verdict) {
    parts.push(`Главный риск: ${verdict.cause}`);
  }

  return {
    headline,
    summary: parts.join(" "),
    errorCount: errors.length,
    opportunityCount: opportunities.length,
    gradeLabel: score.gradeLabel,
  };
}
