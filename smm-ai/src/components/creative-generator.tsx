"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  CREATIVE_TYPE_DESCRIPTIONS,
  CREATIVE_TYPE_LABELS,
  MARKETING_PACKAGE_TYPES,
  type CreativeContext,
  type CreativeType,
  type GeneratedCreative,
  type MarketingPackage,
  type PackageGenerationStatus,
} from "@/types/creative";

const CREATIVE_TYPES: CreativeType[] = [
  "banner",
  "story",
  "instagram_post",
  "promo_poster",
  "enhance_photo",
];

const CREATIVE_ICONS: Record<CreativeType, ReactNode> = {
  banner: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
    </svg>
  ),
  story: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.875H18a2.25 2.25 0 0 1 2.25 2.25v16.5A2.25 2.25 0 0 1 18 21.75H6A2.25 2.25 0 0 1 3.75 19.5V8.625M10.5 1.875 3.75 8.625M10.5 1.875V8.625H3.75" />
    </svg>
  ),
  instagram_post: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
    </svg>
  ),
  promo_poster: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  ),
  enhance_photo: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  ),
};

type PackageProgressState = {
  currentStep: number;
  totalSteps: number;
  currentType: CreativeType | null;
  statuses: Record<CreativeType, PackageGenerationStatus>;
  generated: GeneratedCreative[];
  saving: boolean;
};

function createInitialPackageProgress(): PackageProgressState {
  const statuses = Object.fromEntries(
    MARKETING_PACKAGE_TYPES.map((t) => [t, "pending"]),
  ) as Record<CreativeType, PackageGenerationStatus>;

  return {
    currentStep: 0,
    totalSteps: MARKETING_PACKAGE_TYPES.length,
    currentType: null,
    statuses,
    generated: [],
    saving: false,
  };
}

function getSourceTitle(context: CreativeContext): string {
  return context.sourceType === "dish" ? context.restaurantName : context.fileName;
}

type CreativeGeneratorProps = {
  context: CreativeContext;
  sourceImageBase64?: string;
  delayClass?: string;
  marketingProjectId?: string;
  documentId?: string;
};

export default function CreativeGenerator({
  context,
  sourceImageBase64,
  delayClass,
  marketingProjectId,
  documentId,
}: CreativeGeneratorProps) {
  const [generatingType, setGeneratingType] = useState<CreativeType | null>(null);
  const [isPackageGenerating, setIsPackageGenerating] = useState(false);
  const [packageProgress, setPackageProgress] = useState<PackageProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<GeneratedCreative[]>([]);
  const [savedPackages, setSavedPackages] = useState<MarketingPackage[]>([]);
  const [activePackage, setActivePackage] = useState<MarketingPackage | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const canPersist =
    (context.sourceType === "dish" && marketingProjectId) ||
    (context.sourceType === "document" && documentId);

  const loadSavedPackages = useCallback(async () => {
    if (!canPersist) return;

    setLoadingPackages(true);
    try {
      const params = new URLSearchParams({ sourceType: context.sourceType });
      if (marketingProjectId) params.set("marketingProjectId", marketingProjectId);
      if (documentId) params.set("documentId", documentId);

      const response = await fetch(`/api/marketing-packages?${params.toString()}`);
      const data = (await response.json()) as {
        packages?: MarketingPackage[];
        error?: string;
      };

      if (response.ok && data.packages) {
        setSavedPackages(data.packages);
        if (data.packages.length > 0) {
          setActivePackage((prev) => prev ?? data.packages![0]);
        }
      }
    } catch {
      // Non-critical — gallery still works from session state
    } finally {
      setLoadingPackages(false);
    }
  }, [canPersist, context.sourceType, marketingProjectId, documentId]);

  useEffect(() => {
    void loadSavedPackages();
  }, [loadSavedPackages]);

  const generateOneCreative = async (creativeType: CreativeType): Promise<GeneratedCreative> => {
    const response = await fetch("/api/generate-creative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeType,
        context,
        sourceImageBase64,
      }),
    });

    const data = (await response.json()) as GeneratedCreative & { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Не удалось сгенерировать креатив");
    }

    if (!data.imageBase64) {
      throw new Error("Пустой ответ от сервера");
    }

    return {
      creativeType: data.creativeType,
      imageBase64: data.imageBase64,
      prompt: data.prompt,
    };
  };

  const handleGenerate = async (creativeType: CreativeType) => {
    if (creativeType === "enhance_photo" && !sourceImageBase64) {
      setError("Для улучшения фото нужно исходное изображение");
      return;
    }

    setGeneratingType(creativeType);
    setError(null);

    try {
      const creative = await generateOneCreative(creativeType);

      setCreatives((prev) => [
        creative,
        ...prev.filter((c) => c.creativeType !== creative.creativeType),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGeneratePackage = async () => {
    setIsPackageGenerating(true);
    setError(null);
    setSaveWarning(null);
    setPackageProgress(createInitialPackageProgress());

    const generated: GeneratedCreative[] = [];
    let progress = createInitialPackageProgress();

    for (let i = 0; i < MARKETING_PACKAGE_TYPES.length; i++) {
      const creativeType = MARKETING_PACKAGE_TYPES[i];

      progress = {
        ...progress,
        currentStep: i + 1,
        currentType: creativeType,
        statuses: { ...progress.statuses, [creativeType]: "generating" },
      };
      setPackageProgress({ ...progress });

      try {
        const creative = await generateOneCreative(creativeType);
        generated.push(creative);

        progress = {
          ...progress,
          statuses: { ...progress.statuses, [creativeType]: "done" },
          generated: [...generated],
        };
        setPackageProgress({ ...progress });
      } catch (err) {
        progress = {
          ...progress,
          statuses: { ...progress.statuses, [creativeType]: "error" },
        };
        setPackageProgress({ ...progress });

        const message = err instanceof Error ? err.message : "Ошибка генерации";
        setError(`«${CREATIVE_TYPE_LABELS[creativeType]}»: ${message}`);
      }
    }

    if (generated.length === 0) {
      setIsPackageGenerating(false);
      setPackageProgress(null);
      return;
    }

    const sessionPackage: MarketingPackage = {
      id: `session-${Date.now()}`,
      sourceType: context.sourceType,
      sourceTitle: getSourceTitle(context),
      createdAt: new Date().toISOString(),
      creatives: generated.map((c, index) => ({
        id: `session-creative-${index}`,
        creativeType: c.creativeType,
        imageUrl: c.imageBase64,
        prompt: c.prompt,
      })),
    };

    setActivePackage(sessionPackage);

    if (canPersist) {
      setPackageProgress({ ...progress, saving: true });

      try {
        const response = await fetch("/api/marketing-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: context.sourceType,
            sourceTitle: getSourceTitle(context),
            marketingProjectId,
            documentId,
            creatives: generated,
          }),
        });

        const data = (await response.json()) as {
          package?: MarketingPackage;
          error?: string;
        };

        if (!response.ok || !data.package) {
          setSaveWarning(data.error ?? "Не удалось сохранить пакет в Supabase");
        } else {
          setActivePackage(data.package);
          setSavedPackages((prev) => [data.package!, ...prev]);
        }
      } catch {
        setSaveWarning("Не удалось сохранить пакет в Supabase");
      }
    } else {
      setSaveWarning(
        context.sourceType === "dish"
          ? "Пакет сгенерирован локально. Сохраните проект в Supabase для постоянного хранения."
          : "Пакет сгенерирован локально. Сохраните документ в Supabase для постоянного хранения.",
      );
    }

    setIsPackageGenerating(false);
    setPackageProgress(null);
  };

  const handleDownload = (imageUrl: string, creativeType: CreativeType) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${creativeType}-${Date.now()}.png`;
    link.click();
  };

  const isBusy = generatingType !== null || isPackageGenerating;
  const progressPercent = packageProgress
    ? Math.round(
        (Object.values(packageProgress.statuses).filter((s) => s === "done").length /
          packageProgress.totalSteps) *
          100,
      )
    : 0;

  return (
    <div
      className={`card-shine rounded-2xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.04] p-6 backdrop-blur-sm md:p-8 ${delayClass ?? ""}`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex shrink-0 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-2.5 text-[#8B5CF6]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">AI Creative Generator</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Создайте рекламные креативы на основе результатов анализа
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#8B5CF6]/30 bg-gradient-to-r from-[#8B5CF6]/10 to-transparent p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Маркетинг-пакет</p>
            <p className="mt-1 text-xs text-zinc-400">
              Instagram Post, Story, баннер и акционный постер — одной кнопкой
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleGeneratePackage()}
            disabled={isBusy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-6 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(139,92,246,0.25)] transition-all hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPackageGenerating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                </svg>
                Генерация пакета…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 6.75 14.25 10.5 21 3.75M3.75 19.5h16.5a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 18.75 4.5H16.5m-13.5 0h16.5" />
                </svg>
                Создать пакет маркетинга
              </>
            )}
          </button>
        </div>
      </div>

      {packageProgress && (
        <div className="mb-6 space-y-4 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-white">
              {packageProgress.saving
                ? "Сохранение в Supabase…"
                : packageProgress.currentType
                  ? `Генерация ${packageProgress.currentStep} из ${packageProgress.totalSteps}: «${CREATIVE_TYPE_LABELS[packageProgress.currentType]}»`
                  : "Подготовка…"}
            </p>
            <span className="text-sm tabular-nums text-[#8B5CF6]">{progressPercent}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {MARKETING_PACKAGE_TYPES.map((type) => {
              const status = packageProgress.statuses[type];
              return (
                <div
                  key={type}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    status === "generating"
                      ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-white"
                      : status === "done"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : status === "error"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-white/[0.06] bg-white/[0.02] text-zinc-400"
                  }`}
                >
                  {status === "generating" && (
                    <svg className="h-4 w-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                    </svg>
                  )}
                  {status === "done" && (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  {status === "error" && (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  )}
                  {status === "pending" && (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" />
                  )}
                  <span className="truncate">{CREATIVE_TYPE_LABELS[type]}</span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-zinc-500">
            Каждый креатив генерируется отдельно — это может занять несколько минут.
          </p>
        </div>
      )}

      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Или создайте отдельно
      </p>
      <div className="flex flex-wrap gap-2">
        {CREATIVE_TYPES.map((type) => {
          const isGenerating = generatingType === type;
          const isDisabled =
            isBusy || (type === "enhance_photo" && !sourceImageBase64);

          return (
            <button
              key={type}
              type="button"
              onClick={() => void handleGenerate(type)}
              disabled={isDisabled}
              title={CREATIVE_TYPE_DESCRIPTIONS[type]}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isGenerating
                  ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/20 text-[#8B5CF6]"
                  : "border-white/[0.1] bg-white/[0.04] text-zinc-200 hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/10 hover:text-white"
              }`}
            >
              {isGenerating ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                </svg>
              ) : (
                CREATIVE_ICONS[type]
              )}
              {CREATIVE_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {generatingType && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 px-4 py-3">
          <div className="relative h-8 w-8 shrink-0">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#8B5CF6]/20" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
              <svg className="h-4 w-4 animate-pulse text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-zinc-300">
            OpenAI генерирует «{CREATIVE_TYPE_LABELS[generatingType]}»… Это может занять до минуты.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {saveWarning && (
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {saveWarning}
        </p>
      )}

      {activePackage && activePackage.creatives.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                Галерея маркетинг-пакета
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date(activePackage.createdAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                {activePackage.creatives.length} изображений
              </p>
            </div>
            {savedPackages.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {savedPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setActivePackage(pkg)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      activePackage.id === pkg.id
                        ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/20 text-[#8B5CF6]"
                        : "border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {new Date(pkg.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {MARKETING_PACKAGE_TYPES.map((type) => {
              const creative = activePackage.creatives.find((c) => c.creativeType === type);
              if (!creative) return null;

              return (
                <div
                  key={creative.id}
                  className="group overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-[#8B5CF6]/30"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                      {CREATIVE_ICONS[type]}
                      {CREATIVE_TYPE_LABELS[type]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownload(creative.imageUrl, creative.creativeType)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs text-zinc-300 opacity-0 transition-all group-hover:opacity-100 hover:border-[#8B5CF6]/30 hover:text-white"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Скачать
                    </button>
                  </div>
                  <div className="p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creative.imageUrl}
                      alt={CREATIVE_TYPE_LABELS[creative.creativeType]}
                      className="w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loadingPackages && savedPackages.length === 0 && !activePackage && (
        <p className="mt-6 text-sm text-zinc-500">Загрузка сохранённых пакетов…</p>
      )}

      {creatives.length > 0 && (
        <div className="mt-8 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Отдельные креативы
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {creatives.map((creative) => (
              <div
                key={creative.creativeType}
                className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <span className="text-sm font-medium text-white">
                    {CREATIVE_TYPE_LABELS[creative.creativeType]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownload(creative.imageBase64, creative.creativeType)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-[#8B5CF6]/30 hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Скачать
                  </button>
                </div>
                <div className="p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creative.imageBase64}
                    alt={CREATIVE_TYPE_LABELS[creative.creativeType]}
                    className="w-full rounded-lg object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
