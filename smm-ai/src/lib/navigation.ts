import type { ComponentType } from "react";
import {
  Bot,
  Camera,
  Clapperboard,
  FileText,
  Video,
} from "@/components/ui/icon";

export const MAIN_MODULES = [
  {
    href: "/upload",
    label: "Фото → Реклама",
    shortLabel: "Фото",
    description:
      "Загрузите фото блюда, ресторана или продукта — получите рекламные концепции, тексты, баннеры и идеи для соцсетей.",
    icon: Camera,
  },
  {
    href: "/analyze-pdf",
    label: "Анализ документов",
    shortLabel: "Документы",
    description:
      "PDF, Word, Excel, PowerPoint — анализ меню, отчётов и маркетинговых материалов с точки зрения ресторанного бизнеса.",
    icon: FileText,
  },
  {
    href: "/analyze-video",
    label: "Анализ видео",
    shortLabel: "Видео",
    description:
      "Оценка видео для рекламы: первые секунды, монтаж, звук и готовые настройки аудитории для Meta Ads.",
    icon: Video,
  },
  {
    href: "/reels-generator",
    label: "Reels Studio",
    shortLabel: "Reels",
    description:
      "20+ идей Reels с хуками, сценами для съёмки, подписями и промптами для Kling AI.",
    icon: Clapperboard,
  },
  {
    href: "/dashboard",
    label: "AI Маркетолог",
    shortLabel: "Маркетолог",
    description:
      "Персональный консультант: продажи, акции, контент-планы, анализ конкурентов и маркетинговая стратегия.",
    icon: Bot,
  },
] as const;

export type MainModule = (typeof MAIN_MODULES)[number];

export const DESKTOP_NAV = MAIN_MODULES.map((m) => ({
  href: m.href,
  label: m.shortLabel,
}));

export const PROFILE_MENU = [
  { href: "/profile", label: "Профиль" },
  { href: "/projects", label: "Проекты" },
  { href: "/profile/settings", label: "Настройки" },
  { href: "/profile/tariff", label: "Тариф" },
] as const;

export function getModuleIcon(
  href: string,
): ComponentType<{ size?: number; className?: string }> | null {
  return MAIN_MODULES.find((m) => m.href === href)?.icon ?? null;
}
