import Link from "next/link";
import type { SpecialistIssue } from "@/lib/media-buyer/types";

const PRIORITY_STYLES = {
  urgent: { badge: "bg-red-500/15 text-red-300 border-red-500/25", label: "Срочно" },
  high: { badge: "bg-amber-500/15 text-amber-300 border-amber-500/25", label: "Важно" },
  normal: { badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", label: "Совет" },
} as const;

type SpecialistCardProps = {
  item: SpecialistIssue;
  variant?: "error" | "opportunity" | "recommendation" | "verdict";
};

export function SpecialistCard({ item, variant = "recommendation" }: SpecialistCardProps) {
  const style = PRIORITY_STYLES[item.priority];
  const borderClass =
    variant === "verdict"
      ? "border-[#1877F2]/25"
      : variant === "error"
        ? "border-red-500/15"
        : variant === "opportunity"
          ? "border-emerald-500/15"
          : "border-white/[0.06]";

  return (
    <div className={`glass-card card-shine rounded-2xl border p-5 ${borderClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
        >
          {style.label}
        </span>
        {item.entityName && (
          <span className="text-xs text-[#71717A]">{item.entityName}</span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>

      <div className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
            Почему
          </p>
          <p className="mt-1 text-[#A1A1AA]">{item.cause}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
            Что сделать
          </p>
          <p className="mt-1 text-white/90">{item.advice}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
            Влияние на результат
          </p>
          <p className="mt-1 text-[#60A5FA]">{item.impact}</p>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={item.actionHref}
          className="btn-glass inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
        >
          {item.actionLabel}
        </Link>
      </div>
    </div>
  );
}
