import type { RevenueRuleContext, RuleMatch } from "./types";

export type RevenueRule = {
  id: string;
  evaluate: (ctx: RevenueRuleContext) => RuleMatch | null;
};

function pctDrop(current: number, baseline: number): number | null {
  if (baseline <= 0) return null;
  return ((baseline - current) / baseline) * 100;
}

function pctRise(current: number, baseline: number): number | null {
  if (baseline <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

/** 10 бизнес-правил для Rule Engine. */
export const REVENUE_RULES: RevenueRule[] = [
  {
    id: "no_iiko",
    evaluate: (ctx) => {
      if (ctx.hasIiko) return null;
      return {
        ruleId: "no_iiko",
        priority: "urgent",
        priorityScore: 100,
        title: "iiko не подключён",
        advice:
          "Подключите кассу iiko — без данных о продажах AI не сможет давать точные советы по росту выручки.",
        actionLabel: "Подключить iiko",
        actionHref: "/profile/integrations",
      };
    },
  },
  {
    id: "no_data",
    evaluate: (ctx) => {
      if (!ctx.hasIiko || ctx.hasData) return null;
      return {
        ruleId: "no_data",
        priority: "urgent",
        priorityScore: 95,
        title: "Нет данных о продажах",
        advice:
          "Синхронизируйте продажи из iiko — после первой загрузки появятся KPI и рекомендации.",
        actionLabel: "Синхронизировать продажи",
        actionHref: "/profile/integrations",
      };
    },
  },
  {
    id: "revenue_drop",
    evaluate: (ctx) => {
      const drop = pctDrop(ctx.revenueToday, ctx.revenueYesterday);
      if (drop === null || drop < 10) return null;
      return {
        ruleId: "revenue_drop",
        priority: "urgent",
        priorityScore: 90,
        title: `Выручка упала на ${drop.toFixed(0)}%`,
        advice:
          "Запустите акцию на сегодня — обед по спеццене или десерт в подарок от определённой суммы чека.",
        actionLabel: "Создать пост в Студии",
        actionHref: "/studio",
      };
    },
  },
  {
    id: "low_average_check",
    evaluate: (ctx) => {
      const drop = pctDrop(ctx.averageCheckToday, ctx.averageCheck7d);
      if (drop === null || drop < 10 || ctx.ordersToday < 3) return null;
      return {
        ruleId: "low_average_check",
        priority: "high",
        priorityScore: 80,
        title: `Средний чек ниже нормы на ${drop.toFixed(0)}%`,
        advice:
          "Гости приходят, но тратят меньше — предложите официантам upsell на десерт, напиток или сет.",
        actionLabel: "Спросить директора",
        actionHref: "/",
      };
    },
  },
  {
    id: "few_guests",
    evaluate: (ctx) => {
      const drop = pctDrop(ctx.guestsToday, ctx.guestsYesterday);
      if (drop === null || drop < 15) return null;
      return {
        ruleId: "few_guests",
        priority: "high",
        priorityScore: 75,
        title: `Гостей на ${drop.toFixed(0)}% меньше, чем вчера`,
        advice:
          "Напомните о себе в соцсетях — Stories с акцией или новинкой меню привлекут гостей сегодня вечером.",
        actionLabel: "Создать Stories",
        actionHref: "/studio",
      };
    },
  },
  {
    id: "weak_weekday",
    evaluate: (ctx) => {
      const drop = pctDrop(ctx.revenueToday, ctx.sameWeekdayLastWeekRevenue);
      if (drop === null || drop < 12 || ctx.sameWeekdayLastWeekRevenue <= 0) return null;
      return {
        ruleId: "weak_weekday",
        priority: "high",
        priorityScore: 70,
        title: "Слабый день недели",
        advice:
          "Сегодня выручка ниже, чем в тот же день на прошлой неделе — сделайте разовую акцию только на сегодня.",
        actionLabel: "Создать акцию",
        actionHref: "/studio",
      };
    },
  },
  {
    id: "peak_hour",
    evaluate: (ctx) => {
      if (ctx.peakHour === null || ctx.peakHourSharePct === null || ctx.peakHourSharePct < 20) {
        return null;
      }
      return {
        ruleId: "peak_hour",
        priority: "normal",
        priorityScore: 55,
        title: `Пик продаж в ${ctx.peakHour}:00`,
        advice: `В ${ctx.peakHour}:00 проходит ${ctx.peakHourSharePct.toFixed(0)}% дневной выручки — напомните гостям о брони столиков заранее.`,
        actionLabel: "Спросить директора",
        actionHref: "/",
      };
    },
  },
  {
    id: "weak_top_product",
    evaluate: (ctx) => {
      if (!ctx.topProductName || ctx.topProductRevenuePrev7d <= 0) return null;
      const drop = pctDrop(ctx.topProductRevenue7d, ctx.topProductRevenuePrev7d);
      if (drop === null || drop < 25) return null;
      return {
        ruleId: "weak_top_product",
        priority: "normal",
        priorityScore: 50,
        title: `Хит «${ctx.topProductName}» теряет продажи`,
        advice:
          "Обновите фото блюда и вынесите его в Stories — возможно, гости перестали его замечать.",
        actionLabel: "Улучшить фото",
        actionHref: "/upload",
      };
    },
  },
  {
    id: "revenue_growth",
    evaluate: (ctx) => {
      const rise = pctRise(ctx.revenueToday, ctx.revenueYesterday);
      if (rise === null || rise < 15 || ctx.revenueToday <= 0) return null;
      return {
        ruleId: "revenue_growth",
        priority: "normal",
        priorityScore: 40,
        title: `Выручка выросла на ${rise.toFixed(0)}%`,
        advice:
          "Отличный день — закрепите результат: опубликуйте Stories с хитом меню, пока гости активны.",
        actionLabel: "Создать Stories",
        actionHref: "/studio",
      };
    },
  },
  {
    id: "high_average_check",
    evaluate: (ctx) => {
      const rise = pctRise(ctx.averageCheckToday, ctx.averageCheck7d);
      if (rise === null || rise < 10 || ctx.ordersToday < 3) return null;
      return {
        ruleId: "high_average_check",
        priority: "normal",
        priorityScore: 35,
        title: `Средний чек выше нормы на ${rise.toFixed(0)}%`,
        advice:
          "Гости тратят больше обычного — продвигайте премиум-позиции и бокалы вина к основным блюдам.",
        actionLabel: "Создать рекламный пост",
        actionHref: "/studio",
      };
    },
  },
];
