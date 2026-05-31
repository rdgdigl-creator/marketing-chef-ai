"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authInputClass, authLabelClass } from "@/components/auth-form-styles";
import {
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TARIFF_LABELS, type UserProfile, type UserTariff } from "@/types/auth";

type ProfileFormProps = {
  profile: UserProfile;
  email: string | null;
  hideLogout?: boolean;
};

function fileToDataUrl(file: File): Promise<string> {
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

export default function ProfileForm({ profile, email, hideLogout }: ProfileFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile.fullName);
  const [restaurantName, setRestaurantName] = useState(profile.restaurantName);
  const [phone, setPhone] = useState(profile.phone);
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logoUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Загрузите изображение (PNG, JPG, SVG)");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoUrl(dataUrl);
      setError(null);
    } catch {
      setError("Не удалось загрузить логотип");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        restaurantName,
        phone,
        logoUrl,
      }),
    });

    const data = (await res.json()) as { error?: string; profile?: UserProfile };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }

    setSuccess("Профиль сохранён");
    router.refresh();
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const tariff = profile.tariff as UserTariff;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Логотип" className="h-full w-full object-contain p-2" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <Image src="/logo.svg" alt="" width={40} height={40} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          <SecondaryButton type="button" onClick={() => fileRef.current?.click()}>
            Загрузить логотип
          </SecondaryButton>
          {logoUrl && (
            <button
              type="button"
              onClick={() => setLogoUrl(null)}
              className="ml-3 text-sm text-zinc-400 hover:text-white"
            >
              Удалить
            </button>
          )}
        </div>
      </div>

      <label className="block">
        <span className={authLabelClass}>Имя</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иван Иванов"
          className={authInputClass}
        />
      </label>

      <label className="block">
        <span className={authLabelClass}>Название ресторана</span>
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="Мой ресторан"
          className={authInputClass}
        />
      </label>

      <label className="block">
        <span className={authLabelClass}>Email</span>
        <input
          type="email"
          value={email ?? ""}
          disabled
          className={`${authInputClass} cursor-not-allowed opacity-60`}
        />
      </label>

      <label className="block">
        <span className={authLabelClass}>Телефон</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+79001234567"
          className={authInputClass}
        />
      </label>

      <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-[#8B5CF6]">Тариф</p>
        <p className="mt-1 text-lg font-semibold text-white">{TARIFF_LABELS[tariff]}</p>
        <p className="mt-1 text-sm text-zinc-400">
          {tariff === "free"
            ? "Базовый доступ ко всем инструментам"
            : "Расширенные возможности Marketing Chef AI"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Сохранение…" : "Сохранить"}
        </PrimaryButton>
        {!hideLogout && (
          <SecondaryButton type="button" onClick={handleLogout}>
            Выйти
          </SecondaryButton>
        )}
      </div>
    </form>
  );
}
