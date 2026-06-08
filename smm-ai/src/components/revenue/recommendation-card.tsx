import Link from "next/link";
import type { RevenueRecommendation } from "@/lib/revenue/types";

const PRIORITY_STYLES: Record<
  RevenueRecommendation["priority"],
  { badge: string; label: string }
> = {
  urgent: { badge: "bg-red-500/15 text-red-300 border-red-500/25", label: "Срочно" },
  high: { badge: "bg-amber-500/15 text-amber-300 border-amber-500/25", label: "Важно" },
  normal: { badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", label: "Совет" },
};

export function RecommendationCard({ item }: { item: RevenueRecommendation }) {
  const style = PRIORITY_STYLES[item.priority];

  return (
    <div className="glass-card card-shine rounded-2xl p-5">
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
      >
        {style.label}
      </span>
      <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{item.description}</p>
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
