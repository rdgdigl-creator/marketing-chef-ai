"use client";

import { useEffect, useRef, useState } from "react";
import PageShell, {
  ErrorBanner,
  InputField,
  LoadingSpinner,
  PrimaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { ChevronDown, ExternalLink } from "@/components/ui/icon";
import { loadReelsGenerations, saveReelsGeneration } from "@/lib/feature-modules";
import { fileToBase64 } from "@/lib/utils";
import type { ReelsGeneration, ReelsGenerationResult, ReelsIdea } from "@/types/features";

const KLING_URL = "https://klingai.com/";

function ReelsIdeaCard({ idea, index }: { idea: ReelsIdea; index: number }) {
  const [expanded, setExpanded] = useState(index < 3);

  const whatToFilm = idea.whatToFilm ?? idea.script ?? "";
  const whyItWorks = idea.whyItWorks ?? "";
  const caption = idea.caption ?? idea.voiceover ?? "";

  const openKling = () => {
    window.open(
      `${KLING_URL}?prompt=${encodeURIComponent(idea.klingPrompt)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="glass-card card-shine rounded-2xl transition-all duration-300 hover:border-[#8B5CF6]/25">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-sm font-bold text-[#8B5CF6]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{idea.title}</h3>
          <p className="mt-1 text-sm text-[#06B6D4]">{idea.hook}</p>
        </div>
        <ChevronDown
          size={20}
          className={`shrink-0 text-[#A1A1AA] transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-white/[0.06] px-5 pb-5">
          <Field label="Что снять" value={whatToFilm} />
          <Field label="Почему залетит" value={whyItWorks} />
          <Field label="Подпись для Instagram" value={caption} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">
              Kling Prompt
            </p>
            <p className="mt-1 rounded-xl border border-white/[0.06] bg-[#070707]/50 p-3 font-mono text-xs text-[#A1A1AA]">
              {idea.klingPrompt}
            </p>
          </div>
          <PrimaryButton onClick={openKling}>
            <ExternalLink size={16} />
            Открыть Kling
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#A1A1AA]">{value}</p>
    </div>
  );
}

export default function ReelsGeneratorForm() {
  const [restaurantName, setRestaurantName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ReelsGenerationResult | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ReelsGeneration[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReelsGenerations().then(setHistory);
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setError("Загрузите фото");
      return;
    }
    if (!restaurantName.trim()) {
      setError("Укажите название ресторана");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSaveMessage(null);

    try {
      const imageBase64 = await fileToBase64(photo);
      const response = await fetch("/api/generate-reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, restaurantName: restaurantName.trim() }),
      });

      const data = (await response.json()) as { result?: ReelsGenerationResult; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Ошибка генерации");
        return;
      }

      const genResult = data.result ?? null;
      setResult(genResult);
      setSavedImageUrl(imageBase64);

      if (genResult) {
        const saved = await saveReelsGeneration({
          restaurantName: restaurantName.trim(),
          imageUrl: imageBase64,
          dishDescription: genResult.dishDescription ?? "",
          ideas: genResult.ideas ?? [],
        });

        if (saved) {
          setSaveMessage(`${genResult.ideas.length} идей Reels сохранены`);
          loadReelsGenerations().then(setHistory);
        }
      }
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: ReelsGeneration) => {
    setRestaurantName(item.restaurant_name);
    setResult({
      dishDescription: item.dish_description,
      ideas: item.ideas,
      trends: [],
    });
    setSavedImageUrl(item.image_url);
    setSaveMessage(null);
  };

  return (
    <PageShell
      activeFeature="/reels-generator"
      badge="Reels Studio"
      title="Идеи Reels для вашего ресторана"
      subtitle="Загрузите фото — получите 20+ идей с хуками, сценами для съёмки, подписями и промптами для Kling AI."
    >
      <form onSubmit={handleSubmit} className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="glass-card card-shine space-y-4 rounded-2xl p-6">
          <InputField
            label="Название ресторана"
            value={restaurantName}
            onChange={setRestaurantName}
            placeholder="Например: Doner House"
          />
          <div>
            <span className="mb-2 block text-sm font-medium text-[#A1A1AA]">Фото</span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] py-10 transition-all hover:border-[#8B5CF6]/40"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Предпросмотр" className="max-h-48 rounded-lg object-cover" />
              ) : (
                <span className="text-sm text-[#A1A1AA]">Нажмите для загрузки фото</span>
              )}
            </button>
          </div>
          <PrimaryButton type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Генерация идей…" : "Сгенерировать Reels"}
          </PrimaryButton>
        </div>

        <div className="glass-card card-shine rounded-2xl p-6">
          <p className="text-sm font-medium text-[#A1A1AA]">Что вы получите</p>
          <ul className="mt-4 space-y-2 text-sm text-[#A1A1AA]">
            {[
              "20+ идей Reels",
              "Хук и сцены для съёмки",
              "Подпись для Instagram",
              "Промпт для Kling AI",
              "Актуальные тренды для ресторанов",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                {item}
              </li>
            ))}
          </ul>

          {history.length > 0 && (
            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">История</p>
              <div className="space-y-1">
                {history.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => loadFromHistory(item)}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    {item.restaurant_name} · {new Date(item.created_at).toLocaleDateString("ru-RU")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>

      {error && <ErrorBanner message={error} />}
      {saveMessage && (
        <div className="mb-6">
          <SuccessBanner message={saveMessage} />
        </div>
      )}

      {isLoading && <LoadingSpinner label="AI создаёт 20+ идей Reels…" />}

      {result && !isLoading && (
        <section className="space-y-8">
          <div className="glass-card card-shine rounded-2xl p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {savedImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={savedImageUrl} alt="Фото" className="aspect-[4/3] w-full rounded-xl object-cover" />
              )}
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A1A1AA]">На фото</p>
                <p className="mt-2 text-sm leading-relaxed text-white">{result.dishDescription}</p>
              </div>
            </div>
          </div>

          {result.trends?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-white">Тренды для ресторанов</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {result.trends.map((trend, i) => (
                  <div key={i} className="glass-card card-shine rounded-2xl p-5">
                    <h3 className="font-semibold text-[#06B6D4]">{trend.trend}</h3>
                    <p className="mt-2 text-sm text-[#A1A1AA]">
                      <span className="text-white">Почему работает: </span>
                      {trend.whyItWorks}
                    </p>
                    <p className="mt-2 text-sm text-[#A1A1AA]">
                      <span className="text-white">Как адаптировать: </span>
                      {trend.howToAdapt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-xl font-semibold text-white">
              Идеи Reels ({result.ideas.length})
            </h2>
            <div className="space-y-3">
              {result.ideas.map((idea, index) => (
                <ReelsIdeaCard key={index} idea={idea} index={index} />
              ))}
            </div>
          </div>

          <div className="text-center">
            <a
              href={KLING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium text-white"
            >
              <ExternalLink size={16} />
              Открыть Kling
            </a>
          </div>
        </section>
      )}
    </PageShell>
  );
}
