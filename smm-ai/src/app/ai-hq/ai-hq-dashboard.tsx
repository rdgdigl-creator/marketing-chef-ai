"use client";

import { AgentCard, AiHqDirectorBanner, AiHqSummary } from "@/components/ai-hq/agent-card";
import {
  MediaBuyerActiveBanner,
  MediaBuyerQuickStart,
} from "@/components/ai-hq/media-buyer-quickstart";
import { DemoModeBanner } from "@/components/demo-mode-banner";
import type { AgentStatus, AiHqDashboardData } from "@/lib/ai-hq/types";

type AiHqDashboardProps = {
  data: AiHqDashboardData & {
    dataSource?: "oauth" | "mock";
    mediaBuyer?: {
      status: AgentStatus;
      score: number | null;
      topIssue: string | null;
    };
  };
};

export function AiHqDashboard({ data }: AiHqDashboardProps) {
  const isDemo = data.dataSource === "mock";
  const mb = data.mediaBuyer;

  return (
    <div className="space-y-8">
      {isDemo && (
        <DemoModeBanner title="Штаб ИИ · демо-режим Meta" />
      )}

      {mb?.status === "active" ? (
        <MediaBuyerActiveBanner score={mb.score} topIssue={mb.topIssue} />
      ) : (
        <MediaBuyerQuickStart status={mb?.status ?? "needs_setup"} isDemo={isDemo} />
      )}

      <AiHqSummary
        activeCount={data.summary.activeCount}
        readyCount={data.summary.readyCount}
        needsSetupCount={data.summary.needsSetupCount}
      />

      <AiHqDirectorBanner />

      <div>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#A1A1AA]">
          Агенты
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-[#71717A]">
        Обновлено{" "}
        {new Date(data.updatedAt).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
