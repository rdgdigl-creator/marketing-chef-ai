"use client";

import { useRef, useState } from "react";
import PageShell, {
  ErrorBanner,
  InputField,
  LoadingSpinner,
  PrimaryButton,
  ResultCard,
} from "@/components/page-shell";
import { Target, Video } from "@/components/ui/icon";
import { extractVideoFrames } from "@/lib/video-frames";
import type { VideoAnalysisResult } from "@/types/video";

export default function VideoAnalysisForm() {
  const [restaurantName, setRestaurantName] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Загрузите видео");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const frames = await extractVideoFrames(videoFile, [0, 1, 3]);

      const response = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          restaurantName: restaurantName.trim(),
          videoDescription: videoDescription.trim(),
        }),
      });

      const data = (await response.json()) as {
        result?: VideoAnalysisResult;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Ошибка анализа");
        return;
      }

      setResult(data.result ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось проанализировать видео");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell
      activeFeature="/studio"
      badge="Анализ видео"
      title="Оценка видео для рекламы"
      subtitle="Загрузите видео — AI проанализирует первые секунды, монтаж, звук и подберёт аудиторию для Meta Ads."
    >
      <form onSubmit={handleSubmit} className="mb-8 space-y-6">
        <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
          <InputField
            label="Название ресторана"
            value={restaurantName}
            onChange={setRestaurantName}
            placeholder="Например: Burger Lab"
          />
          <div className="mt-4">
            <InputField
              label="Описание видео (необязательно)"
              value={videoDescription}
              onChange={setVideoDescription}
              placeholder="Рекламный ролик, Reels, обзор меню..."
              rows={2}
            />
          </div>
        </div>

        <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
          <span className="block text-sm font-medium text-[#A1A1AA]">Видео</span>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-10 transition-all hover:border-[#8B5CF6]/40"
          >
            {videoPreview ? (
              <video src={videoPreview} className="max-h-48 w-full rounded-lg" controls muted />
            ) : (
              <>
                <span className="rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3 text-[#8B5CF6]">
                  <Video size={24} />
                </span>
                <span className="text-sm font-medium text-white">Загрузить видео</span>
                <span className="text-xs text-[#A1A1AA]">MP4, MOV, WEBM</span>
              </>
            )}
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        <PrimaryButton type="submit" disabled={isLoading || !videoFile}>
          {isLoading ? "Анализируем видео…" : "Проанализировать видео"}
        </PrimaryButton>
      </form>

      {isLoading && <LoadingSpinner label="AI анализирует видео и формирует рекомендации для Meta Ads…" />}

      {result && !isLoading && (
        <section className="space-y-6">
          <div className="glass-card card-shine rounded-2xl border border-[#8B5CF6]/20 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A1A1AA]">Оценка видео</p>
                <p className="mt-1 text-4xl font-semibold gradient-text-primary">{result.score}/100</p>
                <p className="mt-1 text-sm text-[#A1A1AA]">{result.scoreLabel}</p>
              </div>
              <div
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  result.adReady
                    ? "border border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4]"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                {result.adReady ? "Подходит для рекламы" : "Нужны доработки"}
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">{result.summary}</p>
            <p className="mt-2 text-sm text-[#A1A1AA]">{result.adReadyReason}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Первые 3 секунды", text: result.firstThreeSeconds },
              { title: "Удержание внимания", text: result.attentionRetention },
              { title: "Монтаж", text: result.editing },
              { title: "Композиция", text: result.composition },
              { title: "Звук", text: result.sound },
              { title: "Текст на видео", text: result.textOverlay },
            ].map((item) => (
              <ResultCard key={item.title} title={item.title}>
                {item.text}
              </ResultCard>
            ))}
          </div>

          <div className="glass-card card-shine rounded-2xl p-6">
            <h3 className="font-semibold text-white">Что улучшить</h3>
            <ul className="mt-4 space-y-2">
              {result.improvements.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#A1A1AA]">
                  <span className="text-[#8B5CF6]">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
            <div className="mb-4 flex items-center gap-2">
              <Target size={20} className="text-[#8B5CF6]" />
              <h3 className="text-lg font-semibold text-white">Рекомендуемая аудитория</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Возраст</p>
                <p className="mt-1 text-sm text-white">{result.recommendedAudience.ageRange}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Пол</p>
                <p className="mt-1 text-sm text-white">{result.recommendedAudience.gender}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">География</p>
                <p className="mt-1 text-sm text-white">{result.recommendedAudience.geography}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Интересы</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.recommendedAudience.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#A1A1AA]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white">Рекламные настройки Meta Ads</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Цель кампании</p>
                <p className="mt-1 text-sm text-white">{result.metaAdsSettings.campaignObjective}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Размещения</p>
                <p className="mt-1 text-sm text-[#A1A1AA]">
                  {result.metaAdsSettings.placements.join(", ")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Бюджет</p>
                <p className="mt-1 text-sm text-[#A1A1AA]">{result.metaAdsSettings.budgetHint}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Таргетинг</p>
                <p className="mt-1 text-sm text-[#A1A1AA]">{result.metaAdsSettings.targetingNotes}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
