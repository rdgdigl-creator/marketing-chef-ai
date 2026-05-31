"use client";

import {
  ClipboardList,
  DollarSign,
  Heart,
  RefreshCw,
  Tag,
  Utensils,
} from "@/components/ui/icon";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import PageShell, {
  ErrorBanner,
  InputField,
  LoadingSpinner,
  PrimaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { loadSalesGrowthAnalyses, saveSalesGrowthAnalysis } from "@/lib/feature-modules";
import type { SalesGrowthAnalysis, SalesGrowthResult } from "@/types/features";

const SECTIONS: {
  key: keyof SalesGrowthResult;
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  { key: "menuAnalysis", title: "Анализ меню", icon: ClipboardList },
  { key: "averageCheckRecommendations", title: "Средний чек", icon: DollarSign },
  { key: "promotions", title: "Акции", icon: Tag },
  { key: "comboOffers", title: "Комбо-предложения", icon: Utensils },
  { key: "crossSellIdeas", title: "Кросс-продажи", icon: RefreshCw },
  { key: "retentionStrategies", title: "Удержание клиентов", icon: Heart },
];

export default function SalesGrowthForm() {
  const [restaurantName, setRestaurantName] = useState("");
  const [menuDescription, setMenuDescription] = useState("");
  const [result, setResult] = useState<SalesGrowthResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<SalesGrowthAnalysis[]>([]);
  const [activeSection, setActiveSection] = useState<keyof SalesGrowthResult>("menuAnalysis");

  useEffect(() => {
    loadSalesGrowthAnalyses().then(setHistory);
  }, []);

  const handleAnalyze = async () => {
    if (!restaurantName.trim() || !menuDescription.trim()) {
      setError("Укажите название ресторана и описание меню");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/sales-growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          menuDescription: menuDescription.trim(),
        }),
      });

      const data = (await response.json()) as { result?: SalesGrowthResult; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Ошибка анализа");
        return;
      }

      setResult(data.result ?? null);
      setActiveSection("menuAnalysis");

      const saved = await saveSalesGrowthAnalysis({
        restaurantName: restaurantName.trim(),
        menuDescription: menuDescription.trim(),
        analysis: data.result!,
      });

      if (saved) {
        setSaveMessage("Анализ роста продаж сохранён в Supabase");
        loadSalesGrowthAnalyses().then(setHistory);
      }
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: SalesGrowthAnalysis) => {
    setRestaurantName(item.restaurant_name);
    setMenuDescription(item.menu_description);
    setResult(item.analysis);
    setSaveMessage(null);
  };

  const renderSectionContent = () => {
    if (!result) return null;
    const value = result[activeSection];

    if (typeof value === "string") {
      return (
        <p className="text-sm leading-relaxed text-zinc-300">{value}</p>
      );
    }

    return (
      <ul className="space-y-3">
        {value.map((item, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-300"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-xs font-bold text-[#8B5CF6]">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <PageShell
      activeFeature="/sales-growth"
      badge="Рост продаж"
      title="Увеличение выручки ресторана"
      subtitle="Анализ меню, рекомендации по среднему чеку, акции, комбо, кросс-продажи и удержание"
    >
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card-shine space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <InputField
            label="Название ресторана"
            value={restaurantName}
            onChange={setRestaurantName}
            placeholder="Например: Grill House"
          />
          <InputField
            label="Описание меню"
            value={menuDescription}
            onChange={setMenuDescription}
            placeholder="Перечислите основные позиции, цены, категории..."
            rows={6}
          />
          <PrimaryButton onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? "Анализ..." : "Анализировать меню"}
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
                  <span className="text-zinc-300">{item.restaurant_name}</span>
                  <span className="block text-zinc-600">
                    {new Date(item.created_at).toLocaleDateString("ru-RU")}
                  </span>
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
      {isLoading && <LoadingSpinner label="AI анализирует меню и формирует рекомендации..." />}

      {result && !isLoading && (
        <section className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-left text-sm transition-all ${
                  activeSection === section.key
                    ? "bg-[#8B5CF6]/15 text-[#8B5CF6]"
                    : "text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon size={16} />
                {section.title}
              </button>
              );
            })}
          </div>

          <div className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              {SECTIONS.find((s) => s.key === activeSection)?.title}
            </h3>
            {renderSectionContent()}
          </div>
        </section>
      )}
    </PageShell>
  );
}
