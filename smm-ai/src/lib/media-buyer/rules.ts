import { isBroadTargeting } from "@/lib/meta/insights";
import type { MediaBuyerRuleContext, SpecialistMatch } from "./types";

export type MediaBuyerRule = {
  id: string;
  evaluate: (ctx: MediaBuyerRuleContext) => SpecialistMatch | null;
};

const MIN_SPEND_FOR_AUDIT = 500;
const LOW_CTR_THRESHOLD = 0.8;
const HIGH_FREQUENCY_THRESHOLD = 3.5;
const FATIGUE_CTR_DROP_PCT = 20;

function fmtMoney(value: number, currency: string): string {
  const symbol = currency === "RUB" || currency === "RUR" ? "₽" : currency;
  return `${Math.round(value).toLocaleString("ru-RU")} ${symbol}`;
}

function activeSpend(ctx: MediaBuyerRuleContext): number {
  return ctx.account7d?.spend ?? 0;
}

export const MEDIA_BUYER_RULES: MediaBuyerRule[] = [
  {
    id: "no_meta",
    evaluate: (ctx) => {
      if (ctx.hasMeta) return null;
      return {
        ruleId: "no_meta",
        priority: "urgent",
        priorityScore: 100,
        category: "error",
        title: "Meta Ads не подключён",
        cause: "Без доступа к рекламному кабинету таргетолог не видит кампании, аудитории и метрики.",
        advice: "Подключите Meta Ads через OAuth — только чтение, без изменений в кабинете.",
        impact: "После подключения AI проверит структуру рекламы и найдёт точки роста.",
        actionLabel: "Подключить Meta",
        actionHref: "/profile/integrations",
      };
    },
  },
  {
    id: "no_account",
    evaluate: (ctx) => {
      if (!ctx.hasMeta || ctx.hasAccount) return null;
      return {
        ruleId: "no_account",
        priority: "urgent",
        priorityScore: 95,
        category: "error",
        title: "Рекламный кабинет не выбран",
        cause: "У вас несколько ad accounts — без выбора кабинета аудит невозможен.",
        advice: "Выберите основной рекламный кабинет ресторана в интеграциях.",
        impact: "Таргетолог сможет анализировать именно ваш рабочий кабинет.",
        actionLabel: "Выбрать кабинет",
        actionHref: "/profile/integrations",
      };
    },
  },
  {
    id: "no_data",
    evaluate: (ctx) => {
      if (!ctx.hasAccount || ctx.hasData) return null;
      return {
        ruleId: "no_data",
        priority: "urgent",
        priorityScore: 90,
        category: "error",
        title: "Нет данных для аудита",
        cause: "Кабинет подключён, но кампании и метрики ещё не загружены из Meta API.",
        advice: "Запустите синхронизацию — AI подтянет кампании, ad sets, объявления и insights.",
        impact: "Первый аудит покажет ошибки в таргетинге и конкретные шаги по улучшению.",
        actionLabel: "Синхронизировать",
        actionHref: "/media-buyer",
      };
    },
  },
  {
    id: "no_retargeting",
    evaluate: (ctx) => {
      const spend = activeSpend(ctx);
      if (!ctx.hasData || ctx.hasRetargeting || spend < MIN_SPEND_FOR_AUDIT) return null;
      return {
        ruleId: "no_retargeting",
        priority: "high",
        priorityScore: 85,
        category: "error",
        title: "Нет ретаргетинга при активных тратах",
        cause: `За 7 дней потрачено ${fmtMoney(spend, ctx.currency)}, но ни один ad set не работает с custom audience. Вы платите только за «холодную» аудиторию.`,
        advice:
          "Создайте ad set с ретаргетингом: посетители сайта за 30 дней, вовлечённые в Instagram, добавившие в корзину. Бюджет — 15–20% от общего.",
        impact: "Ретаргетинг обычно даёт CPA на 30–50% ниже, чем холодный трафик.",
        actionLabel: "Обсудить с директором",
        actionHref: "/",
      };
    },
  },
  {
    id: "creative_fatigue",
    evaluate: (ctx) => {
      if (!ctx.hasData) return null;

      for (const ad of ctx.ads.filter((a) => a.status === "ACTIVE")) {
        const ins7 = ad.insights7d;
        const ins30 = ad.insights30d;
        if (!ins7 || !ins30 || ins7.impressions < 1000) continue;

        const freq = ins7.frequency ?? 0;
        const ctr7 = ins7.ctr ?? 0;
        const ctr30 = ins30.ctr ?? 0;
        if (ctr30 <= 0) continue;

        const ctrDrop = ((ctr30 - ctr7) / ctr30) * 100;
        if (freq >= HIGH_FREQUENCY_THRESHOLD && ctrDrop >= FATIGUE_CTR_DROP_PCT) {
          return {
            ruleId: "creative_fatigue",
            priority: "high",
            priorityScore: 82,
            category: "error",
            title: "Выгорание креатива",
            cause: `Объявление «${ad.name}»: frequency ${freq.toFixed(1)} — аудитория видела его слишком часто. CTR упал на ${ctrDrop.toFixed(0)}% за 7 дней vs 30 дней.`,
            advice:
              "Остановите или снизьте бюджет на этом объявлении. Запустите 2–3 новых креатива с другим визуалом и первым кадром. Расширьте аудиторию или смените placement.",
            impact: "Свежий креатив обычно возвращает CTR и снижает CPM на 15–25% в течение 3–5 дней.",
            actionLabel: "Создать креатив",
            actionHref: "/studio",
            entityName: ad.name,
          };
        }
      }
      return null;
    },
  },
  {
    id: "low_ctr",
    evaluate: (ctx) => {
      const ctr = ctx.account7d?.ctr;
      const spend = activeSpend(ctx);
      if (!ctx.hasData || ctr == null || spend < MIN_SPEND_FOR_AUDIT) return null;
      if (ctr >= LOW_CTR_THRESHOLD) return null;

      return {
        ruleId: "low_ctr",
        priority: "high",
        priorityScore: 78,
        category: "error",
        title: `Низкий CTR: ${ctr.toFixed(2)}%`,
        cause: `CTR кабинета ${ctr.toFixed(2)}% — ниже нормы ~${LOW_CTR_THRESHOLD}% для ресторанного таргета. Объявление не цепляет аудиторию или показывается нецелевым людям.`,
        advice:
          "Проверьте первые 3 секунды креатива, оффер в тексте и соответствие аудитории. A/B-тест: видео vs карусель, разные заголовки. Сузьте гео до района доставки.",
        impact: "Рост CTR с 0.5% до 1% при том же CPM даёт в 2 раза больше кликов без увеличения бюджета.",
        actionLabel: "Улучшить креатив",
        actionHref: "/studio",
      };
    },
  },
  {
    id: "audience_overlap",
    evaluate: (ctx) => {
      if (!ctx.hasData) return null;

      const byCampaign = new Map<string, typeof ctx.adSets>();
      for (const adSet of ctx.adSets.filter((s) => s.status === "ACTIVE")) {
        const list = byCampaign.get(adSet.campaignId) ?? [];
        list.push(adSet);
        byCampaign.set(adSet.campaignId, list);
      }

      for (const [, sets] of byCampaign) {
        const broadSets = sets.filter((s) => isBroadTargeting(s.targetingSummary));
        if (broadSets.length >= 3) {
          const names = broadSets
            .slice(0, 3)
            .map((s) => s.name)
            .join(", ");
          return {
            ruleId: "audience_overlap",
            priority: "normal",
            priorityScore: 65,
            category: "error",
            title: "Пересечение аудиторий",
            cause: `В одной кампании ${broadSets.length} ad sets с широким таргетингом (${names}). Meta показывает рекламу одним и тем же людям из разных групп — вы конкурируете сами с собой.`,
            advice:
              "Объедините широкие ad sets в один с CBO. Разделите по воронке: cold (интересы), warm (engagers), hot (ретаргетинг). Исключайте конвертировавших из cold-кампаний.",
            impact: "Снижение внутреннего аукциона обычно уменьшает CPM на 10–20%.",
            actionLabel: "Обсудить структуру",
            actionHref: "/",
          };
        }
      }
      return null;
    },
  },
  {
    id: "inefficient_campaign",
    evaluate: (ctx) => {
      if (!ctx.hasData) return null;

      const inefficient = ctx.campaigns
        .filter((c) => c.status === "ACTIVE")
        .filter((c) => {
          const ins = c.insights7d;
          return ins && ins.spend >= 2000 && ins.conversions === 0;
        })
        .sort((a, b) => (b.insights7d?.spend ?? 0) - (a.insights7d?.spend ?? 0));

      const worst = inefficient[0];
      if (!worst?.insights7d) return null;

      return {
        ruleId: "inefficient_campaign",
        priority: "high",
        priorityScore: 80,
        category: "error",
        title: "Неэффективная кампания",
        cause: `«${worst.name}»: потрачено ${fmtMoney(worst.insights7d.spend, ctx.currency)} за 7 дней, 0 конверсий. Бюджет уходит без результата.`,
        advice:
          "Поставьте кампанию на паузу или снизьте бюджет на 50%. Проверьте пиксель/события конверсии, посадочную страницу и offer. Перераспределите бюджет в лучшие ad sets.",
        impact: `Экономия до ${fmtMoney(worst.insights7d.spend, ctx.currency)} в неделю при остановке или оптимизации.`,
        actionLabel: "Открыть Штаб ИИ",
        actionHref: "/ai-hq",
        entityName: worst.name,
      };
    },
  },
  {
    id: "high_cpm",
    evaluate: (ctx) => {
      const cpm = ctx.account7d?.cpm;
      const spend = activeSpend(ctx);
      if (!ctx.hasData || cpm == null || spend < MIN_SPEND_FOR_AUDIT) return null;

      const campaignCpms = ctx.campaigns
        .filter((c) => c.insights7d?.cpm != null)
        .map((c) => c.insights7d!.cpm as number);
      const medianCpm: number =
        campaignCpms.length > 0
          ? campaignCpms.sort((a, b) => a - b)[Math.floor(campaignCpms.length / 2)]!
          : cpm;

      if (cpm <= medianCpm * 1.3) return null;

      return {
        ruleId: "high_cpm",
        priority: "normal",
        priorityScore: 55,
        category: "opportunity",
        title: "Высокий CPM — есть запас для оптимизации",
        cause: `CPM кабинета ${Math.round(cpm)} vs медиана по кампаниям ${Math.round(medianCpm)}. Аукцион перегрет или аудитория слишком узкая/конкурентная.`,
        advice:
          "Расширьте аудиторию на 10–15%, протестируйте Advantage+ placements, обновите креатив. Перенесите бюджет в кампании с CPM ниже медианы.",
        impact: "Снижение CPM на 15% при том же бюджете даёт ~18% больше показов.",
        actionLabel: "Спросить директора",
        actionHref: "/",
      };
    },
  },
  {
    id: "scale_winner",
    evaluate: (ctx) => {
      if (!ctx.hasData) return null;

      const winners = ctx.adSets
        .filter((s) => s.status === "ACTIVE" && s.insights7d)
        .filter((s) => {
          const ins = s.insights7d!;
          return (
            (ins.ctr ?? 0) >= 1.5 &&
            ins.conversions > 0 &&
            ins.spend >= 500
          );
        })
        .sort((a, b) => (b.insights7d?.conversions ?? 0) - (a.insights7d?.conversions ?? 0));

      const best = winners[0];
      if (!best?.insights7d) return null;

      return {
        ruleId: "scale_winner",
        priority: "normal",
        priorityScore: 50,
        category: "opportunity",
        title: "Масштабировать работающий ad set",
        cause: `«${best.name}»: CTR ${(best.insights7d.ctr ?? 0).toFixed(2)}%, ${best.insights7d.conversions} конверсий за 7 дней. Это лучший сегмент в кабинете.`,
        advice:
          "Увеличьте бюджет на 20% каждые 3 дня, пока CPA стабилен. Создайте lookalike 1–3% на конвертировавших. Дублируйте ad set с новым креативом.",
        impact: "Масштабирование winner ad set — самый быстрый способ роста при сохранении ROI.",
        actionLabel: "План масштабирования",
        actionHref: "/",
        entityName: best.name,
      };
    },
  },
];
