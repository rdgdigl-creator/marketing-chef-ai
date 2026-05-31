import { NextRequest, NextResponse } from "next/server";
import { callOpenAIStructured } from "@/lib/openai-structured";
import type { MarketerGenerateResult, MarketerModuleType } from "@/types/features";

const MODULE_PROMPTS: Record<
  Exclude<MarketerModuleType, "chat">,
  { instructions: string; schema: Record<string, unknown>; schemaName: string }
> = {
  strategy: {
    instructions: `Ты Marketing Chef AI — стратег по маркетингу ресторанного бизнеса.
Создай 7 конкретных стратегий продвижения для ресторана. Все тексты на русском.`,
    schema: {
      type: "object",
      properties: {
        strategies: { type: "array", items: { type: "string" }, minItems: 7, maxItems: 7 },
      },
      required: ["strategies"],
      additionalProperties: false,
    },
    schemaName: "marketing_strategies",
  },
  promotions: {
    instructions: `Ты Marketing Chef AI — эксперт по акциям в ресторанном бизнесе.
Создай 7 конкретных акций для увеличения продаж. Все тексты на русском.`,
    schema: {
      type: "object",
      properties: {
        promotions: { type: "array", items: { type: "string" }, minItems: 7, maxItems: 7 },
      },
      required: ["promotions"],
      additionalProperties: false,
    },
    schemaName: "promotions",
  },
  content_ideas: {
    instructions: `Ты Marketing Chef AI — SMM-специалист для ресторанов.
Создай 10 идей контента для соцсетей. Все тексты на русском.`,
    schema: {
      type: "object",
      properties: {
        contentIdeas: { type: "array", items: { type: "string" }, minItems: 10, maxItems: 10 },
      },
      required: ["contentIdeas"],
      additionalProperties: false,
    },
    schemaName: "content_ideas",
  },
  content_plan: {
    instructions: `Ты Marketing Chef AI — контент-менеджер для ресторанов.
Создай контент-план на 7 дней для Instagram, TikTok и Telegram. Все тексты на русском.`,
    schema: {
      type: "object",
      properties: {
        contentPlan: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "integer" },
              instagram: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  format: { type: "string" },
                },
                required: ["title", "content", "format"],
                additionalProperties: false,
              },
              tiktok: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  format: { type: "string" },
                },
                required: ["title", "content", "format"],
                additionalProperties: false,
              },
              telegram: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  format: { type: "string" },
                },
                required: ["title", "content", "format"],
                additionalProperties: false,
              },
            },
            required: ["day", "instagram", "tiktok", "telegram"],
            additionalProperties: false,
          },
          minItems: 7,
          maxItems: 7,
        },
      },
      required: ["contentPlan"],
      additionalProperties: false,
    },
    schemaName: "content_plan",
  },
  business_analysis: {
    instructions: `Ты Marketing Chef AI — бизнес-аналитик ресторанного сегмента.
Проведи анализ бизнеса ресторана. Все тексты на русском.`,
    schema: {
      type: "object",
      properties: {
        businessAnalysis: {
          type: "object",
          properties: {
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 6 },
            weaknesses: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 6 },
            opportunities: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 6 },
            recommendations: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 7 },
          },
          required: ["summary", "strengths", "weaknesses", "opportunities", "recommendations"],
          additionalProperties: false,
        },
      },
      required: ["businessAnalysis"],
      additionalProperties: false,
    },
    schemaName: "business_analysis",
  },
  competitor_analysis: {
    instructions: `Ты Marketing Chef AI — эксперт по конкурентному анализу в ресторанном бизнесе.

По нише и городу определи основных конкурентов ресторанного сегмента.
Все тексты на русском. Будь конкретным и практичным.`,
    schema: {
      type: "object",
      properties: {
        competitorAnalysis: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Обзор конкурентной среды" },
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                  weaknesses: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                },
                required: ["name", "strengths", "weaknesses"],
                additionalProperties: false,
              },
              minItems: 4,
              maxItems: 8,
            },
            outmaneuverIdeas: {
              type: "array",
              items: { type: "string" },
              minItems: 5,
              maxItems: 8,
              description: "Идеи для обхода конкурентов",
            },
            marketingOpportunities: {
              type: "array",
              items: { type: "string" },
              minItems: 5,
              maxItems: 8,
            },
          },
          required: ["summary", "competitors", "outmaneuverIdeas", "marketingOpportunities"],
          additionalProperties: false,
        },
      },
      required: ["competitorAnalysis"],
      additionalProperties: false,
    },
    schemaName: "niche_competitor_analysis",
  },
};

export async function POST(request: NextRequest) {
  let body: {
    moduleType?: MarketerModuleType;
    restaurantName?: string;
    description?: string;
    niche?: string;
    city?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { moduleType, restaurantName, description = "", niche = "", city = "" } = body;

  if (!moduleType || moduleType === "chat") {
    return NextResponse.json({ error: "Некорректный тип модуля" }, { status: 400 });
  }

  if (!restaurantName?.trim()) {
    return NextResponse.json({ error: "Название ресторана не указано" }, { status: 400 });
  }

  if (moduleType === "competitor_analysis" && (!niche.trim() || !city.trim())) {
    return NextResponse.json({ error: "Укажите нишу и город" }, { status: 400 });
  }

  const config = MODULE_PROMPTS[moduleType];

  let userPrompt = `Ресторан: «${restaurantName.trim()}».
${description ? `Описание бизнеса: ${description}` : ""}`;

  if (moduleType === "competitor_analysis") {
    userPrompt = `Наш ресторан: «${restaurantName.trim()}».
Ниша: ${niche.trim()}
Город: ${city.trim()}
${description ? `Дополнительно: ${description}` : ""}

Покажи основных конкурентов, их сильные и слабые стороны, идеи для обхода и маркетинговые возможности.`;
  }

  const result = await callOpenAIStructured<MarketerGenerateResult>({
    instructions: config.instructions,
    input: [{ role: "user", content: userPrompt }],
    schema: config.schema,
    schemaName: config.schemaName,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 502 });
  }

  return NextResponse.json({ result: result.data });
}
