"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, RefreshCw, Target } from "@/components/ui/icon";
import type { AgentStatus } from "@/lib/ai-hq/types";

type MediaBuyerQuickStartProps = {
  status: AgentStatus;
  isDemo: boolean;
};

export function MediaBuyerQuickStart({ status, isDemo }: MediaBuyerQuickStartProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isDemo || status === "active") return null;

  const handleQuickstart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meta/mock/quickstart", { method: "POST" });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        setError(data.error ?? "Не удалось запустить демо");
        return;
      }
      router.push(data.redirect ?? "/media-buyer");
      router.refresh();
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card card-shine rounded-2xl border border-[#1877F2]/25 bg-gradient-to-r from-[#1877F2]/10 to-transparent p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="inline-flex rounded-xl border border-[#1877F2]/20 bg-[#1877F2]/10 p-3 text-[#60A5FA]">
            <Target size={22} />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#60A5FA]">
              Первый AI-агент
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">Media Buyer Agent</h2>
            <p className="mt-1 max-w-lg text-sm text-[#A1A1AA]">
              Запустите демо-аудит рекламного кабинета ресторана — таргетолог найдёт ошибки,
              объяснит причины и предложит решения.
            </p>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={handleQuickstart}
            disabled={loading}
            className="btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : undefined} />
            {loading ? "Запуск…" : "Демо-аудит за 1 клик"}
          </button>
          <Link
            href="/profile/integrations"
            className="text-xs text-[#A1A1AA] transition-colors hover:text-white"
          >
            или подключить в интеграциях
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MediaBuyerActiveBanner({
  score,
  topIssue,
}: {
  score: number | null;
  topIssue: string | null;
}) {
  return (
    <Link
      href="/media-buyer"
      className="glass-card card-shine group flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent p-5 transition-all hover:border-emerald-500/35"
    >
      <div>
        <p className="text-sm font-medium text-white">🎯 Media Buyer Agent · Активен</p>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          {score !== null ? `Оценка кабинета: ${score}/100` : "Демо-аудит выполнен"}
          {topIssue ? ` · ${topIssue}` : ""}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
        Открыть аудит
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
