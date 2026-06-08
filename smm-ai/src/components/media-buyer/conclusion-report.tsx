import type { CabinetScore, SpecialistConclusion, SpecialistIssue } from "@/lib/media-buyer/types";

const GRADE_COLORS = {
  poor: "text-red-400",
  fair: "text-amber-400",
  good: "text-[#60A5FA]",
  excellent: "text-emerald-400",
} as const;

type ConclusionReportProps = {
  score: CabinetScore;
  conclusion: SpecialistConclusion;
  verdict: SpecialistIssue | null;
};

export function ConclusionReport({ score, conclusion, verdict }: ConclusionReportProps) {
  const color = GRADE_COLORS[score.grade];

  return (
    <div className="glass-card card-shine rounded-2xl border border-[#1877F2]/25 p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#60A5FA]">
            Заключение таргетолога
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
            {conclusion.headline}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#A1A1AA]">
            {conclusion.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs text-red-300">
              {conclusion.errorCount} ошибок
            </span>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              {conclusion.opportunityCount} возможностей
            </span>
            <span className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs ${color}`}>
              {conclusion.gradeLabel}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-center lg:text-right">
          <p className="text-xs text-[#A1A1AA]">Оценка кабинета</p>
          <p className={`text-5xl font-semibold tracking-tight ${color}`}>
            {score.score}
            <span className="text-xl font-normal text-[#71717A]">/100</span>
          </p>
          <div className="mx-auto mt-3 h-2 w-32 overflow-hidden rounded-full bg-white/[0.06] lg:ml-auto">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1877F2] to-[#60A5FA]"
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>
      </div>

      {verdict && (
        <div className="mt-6 grid gap-4 border-t border-white/[0.06] pt-6 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">Причина</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">{verdict.cause}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
              Влияние на результат
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#60A5FA]">{verdict.impact}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
              Первый шаг
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/90">{verdict.advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}
