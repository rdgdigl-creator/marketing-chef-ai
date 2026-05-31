"use client";

import { useEffect, useState } from "react";
import PageShell, {
  ErrorBanner,
  InputField,
  LoadingSpinner,
  PrimaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { loadCompetitorAnalyses, saveCompetitorAnalysis } from "@/lib/feature-modules";
import type { CompetitorAnalysis, CompetitorAnalysisResult } from "@/types/features";

export default function CompetitorAnalysisForm() {
  const [restaurantName, setRestaurantName] = useState("");
  const [competitorHandle, setCompetitorHandle] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<CompetitorAnalysis[]>([]);

  useEffect(() => {
    loadCompetitorAnalyses().then(setHistory);
  }, []);

  const handleAnalyze = async () => {
    if (!restaurantName.trim() || !competitorHandle.trim()) {
      setError("Укажите название ресторана и Instagram конкурента");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          competitorHandle: competitorHandle.trim(),
          additionalInfo: additionalInfo.trim(),
        }),
      });

      const data = (await response.json()) as { result?: CompetitorAnalysisResult; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Ошибка анализа");
        return;
      }

      setResult(data.result ?? null);

      const saved = await saveCompetitorAnalysis({
        restaurantName: restaurantName.trim(),
        competitorHandle: competitorHandle.trim().replace(/^@/, ""),
        analysis: data.result!,
      });

      if (saved) {
        setSaveMessage("Анализ конкурента сохранён в Supabase");
        loadCompetitorAnalyses().then(setHistory);
      }
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: CompetitorAnalysis) => {
    setRestaurantName(item.restaurant_name);
    setCompetitorHandle(item.competitor_handle);
    setResult(item.analysis);
    setSaveMessage(null);
  };

  const renderList = (title: string, items: string[], variant: "default" | "promo" = "default") => (
    <div className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex gap-3 rounded-xl p-3 text-sm leading-relaxed ${
              variant === "promo"
                ? "border border-[#8B5CF6]/15 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent text-zinc-200"
                : "border border-white/[0.06] bg-white/[0.02] text-zinc-300"
            }`}
          >
            <span className="shrink-0 font-bold text-[#8B5CF6]">{i + 1}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <PageShell
      activeFeature="/competitor-analysis"
      badge="Анализ конкурентов"
      title="Instagram-анализ конкурентов"
      subtitle="Сильные и слабые стороны, идеи контента, рекомендации и маркетинговые возможности"
    >
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card-shine space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <InputField
            label="Ваш ресторан"
            value={restaurantName}
            onChange={setRestaurantName}
            placeholder="Например: Sushi Master"
          />
          <InputField
            label="Instagram конкурента"
            value={competitorHandle}
            onChange={setCompetitorHandle}
            placeholder="@competitor_name"
          />
          <InputField
            label="Дополнительно (необязательно)"
            value={additionalInfo}
            onChange={setAdditionalInfo}
            placeholder="Что знаете о конкуренте..."
            rows={2}
          />
          <PrimaryButton onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? "Анализ..." : "Анализировать конкурента"}
          </PrimaryButton>
        </div>

        <div className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          {history.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">История</p>
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadFromHistory(item)}
                  className="mb-1 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04]"
                >
                  <span className="text-zinc-300">@{item.competitor_handle}</span>
                  <span className="block text-zinc-600">{item.restaurant_name}</span>
                </button>
              ))}
            </>
          ) : (
            <p className="text-sm text-zinc-500">История анализов появится здесь</p>
          )}
        </div>
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}
      {saveMessage && <div className="mb-6"><SuccessBanner message={saveMessage} /></div>}
      {isLoading && <LoadingSpinner label="AI анализирует конкурента..." />}

      {result && !isLoading && (
        <section className="space-y-6">
          <div className="card-shine rounded-2xl border border-[#8B5CF6]/20 bg-white/[0.03] p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-[#8B5CF6]">Профиль</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">{result.profileSummary}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {renderList("Сильные стороны", result.strengths)}
            {renderList("Слабые стороны", result.weaknesses)}
          </div>

          {renderList("Идеи контента", result.contentIdeas, "promo")}
          {renderList("Рекомендации", result.recommendations)}
          {renderList("Маркетинговые возможности", result.marketingOpportunities, "promo")}
        </section>
      )}
    </PageShell>
  );
}
