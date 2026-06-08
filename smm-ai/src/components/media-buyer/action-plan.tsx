import Link from "next/link";
import { ClipboardList } from "@/components/ui/icon";
import type { ActionPlanStep } from "@/lib/media-buyer/types";

const PRIORITY_DOT = {
  urgent: "bg-red-400",
  high: "bg-amber-400",
  normal: "bg-emerald-400",
} as const;

export function ActionPlan({ steps }: { steps: ActionPlanStep[] }) {
  if (steps.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <ClipboardList size={20} className="text-[#8B5CF6]" />
        План действий на эту неделю
      </h2>
      <div className="space-y-3">
        {steps.map((item) => (
          <div
            key={item.step}
            className="glass-card flex gap-4 rounded-2xl p-5 transition-colors hover:border-white/[0.1]"
          >
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 text-sm font-semibold text-[#A78BFA]">
                {item.step}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${PRIORITY_DOT[item.priority]}`}
                title={item.priority}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">{item.action}</p>
              <p className="mt-2 text-xs text-[#60A5FA]">Эффект: {item.expectedImpact}</p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
              >
                {item.label} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
