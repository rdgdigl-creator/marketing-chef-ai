import Link from "next/link";
import { ArrowRight, ChevronRight } from "@/components/ui/icon";
import type { AgentCardData, AgentStatus } from "@/lib/ai-hq/types";

const STATUS_STYLES: Record<AgentStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400",
  ready: "border-[#8B5CF6]/30 bg-[#8B5CF6]/[0.08] text-[#A78BFA]",
  needs_setup: "border-amber-500/30 bg-amber-500/[0.08] text-amber-400",
  coming_soon: "border-white/10 bg-white/[0.04] text-[#A1A1AA]",
  offline: "border-white/10 bg-white/[0.04] text-[#71717A]",
};

type AgentCardProps = {
  agent: AgentCardData;
};

export function AgentCard({ agent }: AgentCardProps) {
  const content = (
    <div className="glass-card card-shine group flex h-full flex-col rounded-2xl p-5 transition-all duration-300 hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border text-xl"
            style={{
              borderColor: `${agent.accent}30`,
              backgroundColor: `${agent.accent}10`,
            }}
          >
            {agent.emoji}
          </span>
          <div>
            <h3 className="font-semibold tracking-tight text-white">{agent.name}</h3>
            <p className="mt-0.5 text-xs text-[#A1A1AA]">{agent.description}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLES[agent.status]}`}
        >
          {agent.statusLabel}
        </span>
      </div>

      <dl className="mt-5 flex-1 space-y-2.5 border-t border-white/[0.06] pt-4">
        {agent.metrics.map((metric) => (
          <div key={metric.label} className="flex items-start justify-between gap-3 text-sm">
            <dt className="text-[#A1A1AA]">{metric.label}</dt>
            <dd className="max-w-[55%] text-right text-white">{metric.value}</dd>
          </div>
        ))}
      </dl>

      {agent.href && agent.status !== "coming_soon" ? (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#8B5CF6] opacity-0 transition-opacity group-hover:opacity-100">
          Открыть
          <ChevronRight size={14} />
        </div>
      ) : null}
    </div>
  );

  if (agent.href && agent.status !== "coming_soon") {
    return (
      <Link href={agent.href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

type AiHqSummaryProps = {
  activeCount: number;
  readyCount: number;
  needsSetupCount: number;
};

export function AiHqSummary({
  activeCount,
  readyCount,
  needsSetupCount,
}: AiHqSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs text-[#A1A1AA]">Активных агентов</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-400">{activeCount}</p>
      </div>
      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs text-[#A1A1AA]">Готовы к работе</p>
        <p className="mt-1 text-2xl font-semibold text-[#A78BFA]">{readyCount}</p>
      </div>
      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs text-[#A1A1AA]">Требуют настройки</p>
        <p className="mt-1 text-2xl font-semibold text-amber-400">{needsSetupCount}</p>
      </div>
    </div>
  );
}

export function AiHqDirectorBanner() {
  return (
    <Link
      href="/"
      className="glass-card card-shine group flex items-center justify-between gap-4 rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-r from-[#8B5CF6]/10 to-transparent p-5 transition-all hover:border-[#8B5CF6]/35"
    >
      <div>
        <p className="text-sm font-medium text-white">👑 AI Director</p>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Спросите директора о приоритетах — он видит статус всех агентов.
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-sm text-[#8B5CF6]">
        Открыть чат
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
