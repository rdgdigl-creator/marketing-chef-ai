"use client";

import { useEffect, useRef, useState } from "react";
import PageShell, {
  ErrorBanner,
  InputField,
  LoadingSpinner,
  PrimaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { fileToBase64 } from "@/lib/utils";
import {
  DEFAULT_BRAND_KIT_INPUT,
  LOGO_POSITION_OPTIONS,
  LOGO_SIZE_OPTIONS,
  type BrandKit,
  type BrandKitInput,
  type LogoPosition,
  type LogoSize,
} from "@/types/brand-kit";

const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

function positionClasses(position: LogoPosition, size: LogoSize): string {
  const sizeClass =
    size === "small" ? "h-8 w-8" : size === "medium" ? "h-12 w-12" : "h-16 w-16";

  const positionClass = {
    top_left: "top-3 left-3",
    top_right: "top-3 right-3",
    bottom_left: "bottom-3 left-3",
    bottom_right: "bottom-3 right-3",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  }[position];

  return `${sizeClass} ${positionClass}`;
}

function BrandPreview({ form }: { form: BrandKitInput }) {
  const hasName = form.restaurantName.trim().length > 0;

  return (
    <div className="card-shine sticky top-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Предпросмотр бренда</p>

      <div
        className="relative mt-4 aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.08]"
        style={{
          background: `linear-gradient(145deg, ${form.primaryColor} 0%, ${form.secondaryColor} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative flex h-full flex-col justify-between p-5">
          <div>
            <p className="text-lg font-bold text-white drop-shadow-md">
              {hasName ? form.restaurantName : "Название ресторана"}
            </p>
            {form.slogan && (
              <p className="mt-1 text-sm text-white/80 drop-shadow">{form.slogan}</p>
            )}
          </div>

          <div className="space-y-1 text-xs text-white/70">
            {form.instagram && <p>@{form.instagram.replace(/^@/, "")}</p>}
            {form.phone && <p>{form.phone}</p>}
            {form.address && <p className="line-clamp-2">{form.address}</p>}
          </div>
        </div>

        {form.watermarkEnabled && form.logoUrl && (
          <div
            className={`absolute ${positionClasses(form.logoPosition, form.logoSize)} overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm`}
            style={{ opacity: form.logoOpacity / 100 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.logoUrl}
              alt="Логотип"
              className="h-full w-full object-contain p-1"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex-1">
          <p className="mb-2 text-xs text-zinc-500">Основной</p>
          <div
            className="h-10 rounded-lg border border-white/10"
            style={{ backgroundColor: form.primaryColor }}
          />
          <p className="mt-1 font-mono text-xs text-zinc-400">{form.primaryColor}</p>
        </div>
        <div className="flex-1">
          <p className="mb-2 text-xs text-zinc-500">Дополнительный</p>
          <div
            className="h-10 rounded-lg border border-white/10"
            style={{ backgroundColor: form.secondaryColor }}
          />
          <p className="mt-1 font-mono text-xs text-zinc-400">{form.secondaryColor}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Все креативы — Instagram Post, Story, баннеры, постеры и Reels — будут использовать эти
        настройки автоматически.
      </p>
    </div>
  );
}

export default function BrandKitForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<BrandKitInput>(DEFAULT_BRAND_KIT_INPUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrandKit() {
      try {
        const response = await fetch("/api/brand-kit");
        const data = (await response.json()) as { brandKit?: BrandKit; error?: string };

        if (response.ok && data.brandKit) {
          const kit = data.brandKit;
          setExistingId(kit.id);
          setForm({
            restaurantName: kit.restaurantName,
            logoUrl: kit.logoUrl,
            slogan: kit.slogan,
            primaryColor: kit.primaryColor,
            secondaryColor: kit.secondaryColor,
            whatsapp: kit.whatsapp,
            instagram: kit.instagram,
            address: kit.address,
            phone: kit.phone,
            website: kit.website,
            watermarkEnabled: kit.watermarkEnabled,
            logoPosition: kit.logoPosition,
            logoSize: kit.logoSize,
            logoOpacity: kit.logoOpacity,
          });
        }
      } catch {
        setError("Не удалось загрузить Brand Kit");
      } finally {
        setLoading(false);
      }
    }

    void loadBrandKit();
  }, []);

  const updateField = <K extends keyof BrandKitInput>(key: K, value: BrandKitInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleLogoUpload = async (file: File) => {
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setError("Загрузите логотип в формате PNG, JPG или SVG");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Размер логотипа не должен превышать 5 МБ");
      return;
    }

    setError(null);

    try {
      const base64 = await fileToBase64(file);
      updateField("logoUrl", base64);
    } catch {
      setError("Не удалось загрузить логотип");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { brandKit?: BrandKit; error?: string };

      if (!response.ok || !data.brandKit) {
        setError(data.error ?? "Не удалось сохранить Brand Kit");
        return;
      }

      setExistingId(data.brandKit.id);
      setSuccess(existingId ? "Brand Kit обновлён" : "Brand Kit сохранён");
    } catch {
      setError("Произошла ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell activeFeature="/brand-kit" badge="Брендинг" title="Brand Kit">
        <LoadingSpinner label="Загрузка настроек бренда…" />
      </PageShell>
    );
  }

  return (
    <PageShell
      activeFeature="/brand-kit"
      badge="Брендинг"
      title="Brand Kit"
      subtitle="Настройте бренд ресторана один раз — все креативы, баннеры, Stories, посты и Reels будут использовать эти данные автоматически."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {error && <ErrorBanner message={error} />}
          {success && <SuccessBanner message={success} />}

          <section className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">Основная информация</h2>
            <div className="mt-5 space-y-4">
              <InputField
                label="Название ресторана *"
                value={form.restaurantName}
                onChange={(v) => updateField("restaurantName", v)}
                placeholder="Например: La Bella Vita"
              />
              <InputField
                label="Слоган"
                value={form.slogan}
                onChange={(v) => updateField("slogan", v)}
                placeholder="Вкус Италии в каждом блюде"
              />

              <div>
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Логотип ресторана (PNG, JPG, SVG)
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  {form.logoUrl ? (
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logoUrl} alt="Логотип" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-xs text-zinc-500">
                      Нет лого
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-[#8B5CF6]/30 hover:text-white"
                    >
                      {form.logoUrl ? "Заменить логотип" : "Загрузить логотип"}
                    </button>
                    {form.logoUrl && (
                      <button
                        type="button"
                        onClick={() => updateField("logoUrl", null)}
                        className="text-left text-xs text-zinc-500 hover:text-red-400"
                      >
                        Удалить логотип
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">Фирменные цвета</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Основной цвет</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#8B5CF6]/40"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Дополнительный цвет</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.secondaryColor}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#8B5CF6]/40"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">Контакты</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InputField
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(v) => updateField("whatsapp", v)}
                placeholder="+7 999 123-45-67"
              />
              <InputField
                label="Instagram"
                value={form.instagram}
                onChange={(v) => updateField("instagram", v)}
                placeholder="@restaurant"
              />
              <InputField
                label="Телефон"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                placeholder="+7 (495) 123-45-67"
              />
              <InputField
                label="Веб-сайт"
                value={form.website}
                onChange={(v) => updateField("website", v)}
                placeholder="https://restaurant.ru"
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Адрес"
                  value={form.address}
                  onChange={(v) => updateField("address", v)}
                  placeholder="Москва, ул. Примерная, 1"
                />
              </div>
            </div>
          </section>

          <section className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">Настройки водяного знака</h2>
            <div className="mt-5 space-y-5">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.watermarkEnabled}
                  onChange={(e) => updateField("watermarkEnabled", e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#8B5CF6]"
                />
                <span className="text-sm text-zinc-300">Показывать логотип как водяной знак на креативах</span>
              </label>

              <div>
                <span className="mb-2 block text-sm font-medium text-zinc-300">Позиция логотипа</span>
                <div className="flex flex-wrap gap-2">
                  {LOGO_POSITION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField("logoPosition", option.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        form.logoPosition === option.value
                          ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/20 text-[#8B5CF6]"
                          : "border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-zinc-300">Размер логотипа</span>
                <div className="flex flex-wrap gap-2">
                  {LOGO_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField("logoSize", option.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        form.logoSize === option.value
                          ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/20 text-[#8B5CF6]"
                          : "border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Прозрачность логотипа</span>
                  <span className="text-sm tabular-nums text-[#8B5CF6]">{form.logoOpacity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.logoOpacity}
                  onChange={(e) => updateField("logoOpacity", Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>
            </div>
          </section>

          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Сохранение…" : existingId ? "Сохранить изменения" : "Сохранить Brand Kit"}
          </PrimaryButton>
        </div>

        <BrandPreview form={form} />
      </form>
    </PageShell>
  );
}
