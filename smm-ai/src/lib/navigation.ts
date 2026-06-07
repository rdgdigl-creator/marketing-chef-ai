import type { ComponentType } from "react";
import {
  BarChart3,
  Bot,
  Clapperboard,
  FileText,
  ImagePlus,
  Layers,
  Megaphone,
  Palette,
  Plug,
  Settings,
  Sparkles,
  UtensilsCrossed,
  Video,
  Wand2,
} from "@/components/ui/icon";

type IconType = ComponentType<{ size?: number; className?: string }>;

/**
 * Главное меню продукта. Пользователь воспринимает систему как своего
 * AI-директора по маркетингу, поэтому навигация максимально простая:
 * директор → аналитика → студия → документы → интеграции → настройки.
 */
export const PRIMARY_NAV: {
  href: string;
  label: string;
  shortLabel: string;
  icon: IconType;
}[] = [
  { href: "/", label: "AI Директор", shortLabel: "Директор", icon: Bot },
  { href: "/analytics", label: "Аналитика бизнеса", shortLabel: "Аналитика", icon: BarChart3 },
  { href: "/studio", label: "Creative Studio", shortLabel: "Студия", icon: Palette },
  { href: "/analyze-pdf", label: "Документы", shortLabel: "Документы", icon: FileText },
  { href: "/profile/integrations", label: "Интеграции", shortLabel: "Интеграции", icon: Plug },
  { href: "/profile/settings", label: "Настройки", shortLabel: "Настройки", icon: Settings },
];

/** Краткие подписи для десктоп-хедера. */
export const DESKTOP_NAV = PRIMARY_NAV.map((item) => ({
  href: item.href,
  label: item.shortLabel,
  icon: item.icon,
}));

/** Примеры запросов для главного чата AI-директора. */
export const DIRECTOR_PROMPTS = [
  "Как увеличить продажи?",
  "Создай контент-план на месяц.",
  "Подготовь стратегию продвижения.",
  "Проанализируй мой бизнес.",
  "Какие акции провести на выходных?",
  "Создай рекламную кампанию.",
  "Подготовь сценарии для Reels.",
] as const;

/** Инструменты творческой студии. */
export const STUDIO_TOOLS: {
  href: string;
  label: string;
  description: string;
  icon: IconType;
  available: boolean;
}[] = [
  {
    href: "/upload",
    label: "Улучшить фото",
    description: "AI-обработка фото блюд и интерьера для рекламы и соцсетей.",
    icon: Wand2,
    available: true,
  },
  {
    href: "/upload",
    label: "Удалить фон",
    description: "Чистый фон для карточек товаров и меню за пару секунд.",
    icon: ImagePlus,
    available: false,
  },
  {
    href: "/upload",
    label: "Рекламный баннер",
    description: "Готовый баннер с текстом и акцентом на ваше предложение.",
    icon: Megaphone,
    available: true,
  },
  {
    href: "/upload",
    label: "Создать Stories",
    description: "Вертикальные истории для Instagram и Telegram.",
    icon: Sparkles,
    available: true,
  },
  {
    href: "/reels-generator",
    label: "Создать Reels",
    description: "20+ идей Reels с хуками, сценами и промптами для генерации.",
    icon: Clapperboard,
    available: true,
  },
  {
    href: "/upload",
    label: "Создать афишу",
    description: "Афиша для события, акции или нового блюда.",
    icon: Layers,
    available: true,
  },
  {
    href: "/upload",
    label: "Рекламный пост",
    description: "Пост с продающим текстом и визуалом для соцсетей.",
    icon: ImagePlus,
    available: true,
  },
  {
    href: "/upload",
    label: "Меню ресторана",
    description: "Оформленное меню с фото, описаниями и ценами.",
    icon: UtensilsCrossed,
    available: false,
  },
  {
    href: "/analyze-video",
    label: "Анализ видео",
    description: "Оценка рекламного видео и настройки аудитории для Meta Ads.",
    icon: Video,
    available: true,
  },
];

/** Меню пользователя (выпадающее, всегда поверх интерфейса). */
export const PROFILE_MENU = [
  { href: "/profile", label: "Профиль" },
  { href: "/projects", label: "Проекты" },
  { href: "/profile/settings", label: "Настройки" },
  { href: "/profile/integrations", label: "Интеграции" },
  { href: "/profile/tariff", label: "Тариф" },
] as const;

export function getNavIcon(href: string): IconType | null {
  return PRIMARY_NAV.find((item) => item.href === href)?.icon ?? null;
}
