import type { CabinetScore } from "@/lib/media-buyer/types";

const GRADE_COLORS = {
  poor: "text-red-400",
  fair: "text-amber-400",
  good: "text-[#60A5FA]",
  excellent: "text-emerald-400",
} as const;

export function ScoreCard({ score }: { score: CabinetScore }) {
  const pct = score.score;
  const color = GRADE_COLORS[score.grade];

  return (
    <div className="glass-card card-shine rounded-2xl border border-[#1877F2]/20 p-6">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#60A5FA]">
        Оценка кабинета
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <p className={`text-5xl font-semibold tracking-tight ${color}`}>
          {pct}
          <span className="text-2xl font-normal text-[#A1A1AA]">/100</span>
        </p>
        <div>
          <p className={`text-lg font-medium ${color}`}>{score.gradeLabel}</p>
          <p className="mt-1 max-w-md text-sm text-[#A1A1AA]">{score.summary}</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1877F2] to-[#60A5FA] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
