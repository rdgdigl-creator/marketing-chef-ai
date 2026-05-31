"use client";

import { useEffect, useState } from "react";
import PageShell, {
  ErrorBanner,
  InputField,
  LoadingSpinner,
  PrimaryButton,
  SecondaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { exportContentPlanPdf } from "@/lib/export-pdf";
import { loadContentPlans, saveContentPlan } from "@/lib/feature-modules";
import type { ContentPlan, ContentPlanDay, ContentPlanResult } from "@/types/features";

const DURATIONS = [7, 14, 30] as const;
const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "from-purple-500/20 to-pink-500/10" },
  { id: "tiktok", label: "TikTok", color: "from-cyan-500/20 to-blue-500/10" },
  { id: "telegram", label: "Telegram", color: "from-blue-500/20 to-sky-500/10" },
] as const;

export default function ContentPlanForm() {
  const [restaurantName, setRestaurantName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<7 | 14 | 30>(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "instagram",
    "tiktok",
    "telegram",
  ]);
  const [result, setResult] = useState<ContentPlanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ContentPlan[]>([]);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    loadContentPlans().then(setHistory);
  }, []);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (!restaurantName.trim()) {
      setError("Введите название ресторана");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError("Выберите хотя бы одну платформу");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/content-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          durationDays: duration,
          platforms: selectedPlatforms,
          description: description.trim(),
        }),
      });

      const data = (await response.json()) as { result?: ContentPlanResult; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Ошибка генерации");
        return;
      }

      setResult(data.result ?? null);
      setActiveDay(1);

      const saved = await saveContentPlan({
        restaurantName: restaurantName.trim(),
        durationDays: duration,
        platforms: selectedPlatforms,
        plan: data.result?.plan ?? [],
      });

      if (saved) {
        setSaveMessage(`Контент-план на ${duration} дней сохранён в Supabase`);
        loadContentPlans().then(setHistory);
      }
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!result?.plan.length) return;
    exportContentPlanPdf({
      restaurantName: restaurantName.trim(),
      durationDays: duration,
      plan: result.plan,
    });
  };

  const loadFromHistory = (item: ContentPlan) => {
    setRestaurantName(item.restaurant_name);
    setDuration(item.duration_days);
    setSelectedPlatforms(item.platforms);
    setResult({ plan: item.plan });
    setActiveDay(1);
    setSaveMessage(null);
  };

  const currentDay: ContentPlanDay | undefined = result?.plan.find((d) => d.day === activeDay);

  return (
    <PageShell
      activeFeature="/content-plan"
      badge="Контент План"
      title="План публикаций для соцсетей"
      subtitle="Генерация контент-плана на 7, 14 или 30 дней для Instagram, TikTok и Telegram"
    >
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card-shine space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <InputField
            label="Название ресторана"
            value={restaurantName}
            onChange={setRestaurantName}
            placeholder="Например: Pasta Bar"
          />
          <InputField
            label="О ресторане (необязательно)"
            value={description}
            onChange={setDescription}
            placeholder="Кухня, аудитория, особенности..."
            rows={2}
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-zinc-300">Период</span>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    duration === d
                      ? "bg-[#8B5CF6] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                      : "border border-white/[0.08] text-zinc-400 hover:border-[#8B5CF6]/30 hover:text-white"
                  }`}
                >
                  {d} дней
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-zinc-300">Платформы</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-all ${
                    selectedPlatforms.includes(p.id)
                      ? "border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#8B5CF6]"
                      : "border border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <PrimaryButton onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? "Генерация..." : "Сгенерировать план"}
            </PrimaryButton>
            {result && (
              <SecondaryButton onClick={handleExportPdf}>
                Экспорт PDF
              </SecondaryButton>
            )}
          </div>
        </div>

        <div className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          {history.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Сохранённые планы
              </p>
              <div className="space-y-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => loadFromHistory(item)}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="text-zinc-300">{item.restaurant_name}</span>
                    <span className="block text-zinc-600">
                      {item.duration_days} дней · {new Date(item.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">История планов появится после первой генерации</p>
          )}
        </div>
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}
      {saveMessage && <div className="mb-6"><SuccessBanner message={saveMessage} /></div>}
      {isLoading && <LoadingSpinner label={`AI создаёт контент-план на ${duration} дней...`} />}

      {result && !isLoading && (
        <section>
          <div className="mb-4 flex gap-1 overflow-x-auto pb-2">
            {result.plan.map((day) => (
              <button
                key={day.day}
                type="button"
                onClick={() => setActiveDay(day.day)}
                className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm transition-all ${
                  activeDay === day.day
                    ? "bg-[#8B5CF6] text-white"
                    : "border border-white/[0.08] text-zinc-400 hover:text-white"
                }`}
              >
                День {day.day}
              </button>
            ))}
          </div>

          {currentDay && (
            <div className="grid gap-4 md:grid-cols-3">
              {PLATFORMS.filter((p) => selectedPlatforms.includes(p.id)).map((platform) => {
                const post = currentDay[platform.id as keyof ContentPlanDay] as {
                  title: string;
                  content: string;
                  format: string;
                };
                return (
                  <div
                    key={platform.id}
                    className={`card-shine rounded-2xl border border-white/[0.08] bg-gradient-to-br ${platform.color} p-5 backdrop-blur-sm`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8B5CF6]">
                      {platform.label}
                    </p>
                    <h3 className="mt-2 font-semibold text-white">{post.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{post.format}</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">{post.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}
