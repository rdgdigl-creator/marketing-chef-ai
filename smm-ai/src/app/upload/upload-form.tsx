"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ErrorBanner,
  LoadingSpinner,
  PrimaryButton,
} from "@/components/page-shell";
import { Camera, ImagePlus } from "@/components/ui/icon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MarketingAnalysis } from "@/types/marketing";
import MarketingResults from "./marketing-results";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Не удалось прочитать файл"));
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
}

export default function UploadForm() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToBase64(file);
      setLogoPreview(dataUrl);
    } catch {
      setError("Не удалось загрузить логотип");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!photo || !photoPreview) {
      setError("Загрузите фотографию");
      return;
    }

    if (!restaurantName.trim()) {
      setError("Введите название ресторана");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const imageBase64 = await fileToBase64(photo);

      const response = await fetch("/api/analyze-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          restaurantName: restaurantName.trim(),
        }),
      });

      const data = (await response.json()) as {
        analysis?: MarketingAnalysis;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось проанализировать фото");
      }

      if (!data.analysis) {
        throw new Error("Пустой ответ от сервера");
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Войдите в аккаунт, чтобы сохранить проект");
      }

      const { data: project, error: insertError } = await supabase
        .from("marketing_projects")
        .insert({
          restaurant_name: restaurantName.trim(),
          image_url: imageBase64,
          analysis: data.analysis,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (project?.id) {
        router.push(`/projects/${project.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
          <label htmlFor="dish-photo" className="block text-sm font-medium text-[#A1A1AA]">
            Фотография
          </label>
          <p className="mt-1 text-xs text-[#A1A1AA]/70">
            Блюдо, интерьер ресторана или продукт
          </p>

          <input
            ref={photoInputRef}
            id="dish-photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={isLoading}
            className="sr-only"
          />

          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isLoading}
            className="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-10 transition-all hover:border-[#8B5CF6]/40 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {photoPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Предпросмотр"
                  className="max-h-64 w-full rounded-lg object-cover"
                />
                <span className="text-sm text-[#A1A1AA]">
                  {photo?.name ?? "Фото выбрано"} — нажмите, чтобы заменить
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3 text-[#8B5CF6]">
                  <Camera size={24} />
                </span>
                <span className="text-sm font-medium text-white">
                  Нажмите, чтобы загрузить фото
                </span>
                <span className="text-xs text-[#A1A1AA]">PNG, JPG или WEBP</span>
              </>
            )}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
            <label htmlFor="restaurant-name" className="block text-sm font-medium text-[#A1A1AA]">
              Название ресторана
            </label>
            <input
              id="restaurant-name"
              type="text"
              value={restaurantName}
              onChange={(e) => {
                setRestaurantName(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              placeholder="Например, Doner House"
              className="mt-4 w-full rounded-xl border border-white/[0.08] bg-[#111111]/60 px-4 py-3 text-sm text-white placeholder:text-[#A1A1AA]/60 outline-none backdrop-blur-sm transition-all focus:border-[#8B5CF6]/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </div>

          <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
            <span className="block text-sm font-medium text-[#A1A1AA]">
              Логотип <span className="text-[#A1A1AA]/60">(необязательно)</span>
            </span>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="mt-4 flex w-full items-center gap-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-4 transition-all hover:border-[#8B5CF6]/40"
            >
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Логотип" className="h-12 w-12 rounded-lg object-contain" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  <ImagePlus size={20} />
                </span>
              )}
              <span className="text-sm text-[#A1A1AA]">
                {logoPreview ? "Заменить логотип" : "Загрузить логотип"}
              </span>
            </button>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <PrimaryButton type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? "Анализируем фото…" : "Создать рекламу"}
        </PrimaryButton>
      </form>

      {isLoading && (
        <LoadingSpinner label="AI анализирует фото и создаёт рекламные материалы…" />
      )}
    </div>
  );
}
