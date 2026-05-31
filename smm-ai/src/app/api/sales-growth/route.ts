import { NextRequest, NextResponse } from "next/server";
import { callOpenAIStructured } from "@/lib/openai-structured";
import type { SalesGrowthResult } from "@/types/features";

const SYSTEM_PROMPT = `Ты Marketing Chef AI — эксперт по увеличению выручки ресторанного бизнеса.

Проанализируй меню ресторана и создай практические рекомендации для роста продаж.
Все тексты на русском языке. Будь конкретным с цифрами, механиками и примерами.`;

const SALES_SCHEMA = {
  type: "object",
  properties: {
    menuAnalysis: {
      type: "string",
      description: "Анализ меню: сильные позиции, слабые, маржинальность",
    },
    averageCheckRecommendations: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Рекомендации по увеличению среднего чека",
    },
    promotions: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Акции для роста продаж",
    },
    comboOffers: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Комбо-предложения",
    },
    crossSellIdeas: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Идеи кросс-продаж",
    },
    retentionStrategies: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Стратегии удержания клиентов",
    },
  },
  required: [
    "menuAnalysis",
    "averageCheckRecommendations",
    "promotions",
    "comboOffers",
    "crossSellIdeas",
    "retentionStrategies",
  ],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  let body: { restaurantName?: string; menuDescription?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { restaurantName, menuDescription } = body;

  if (!restaurantName?.trim()) {
    return NextResponse.json({ error: "Название ресторана не указано" }, { status: 400 });
  }

  if (!menuDescription?.trim()) {
    return NextResponse.json({ error: "Описание меню не указано" }, { status: 400 });
  }

  const userPrompt = `Ресторан: «${restaurantName.trim()}».

Меню ресторана:
${menuDescription.trim()}

Проведи анализ меню и создай рекомендации по увеличению среднего чека, акции, комбо-предложения, кросс-продажи и стратегии удержания клиентов.`;

  const result = await callOpenAIStructured<SalesGrowthResult>({
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content: userPrompt }],
    schema: SALES_SCHEMA,
    schemaName: "sales_growth",
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 502 });
  }

  return NextResponse.json({ result: result.data });
}
