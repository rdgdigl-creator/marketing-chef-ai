import { NextRequest, NextResponse } from "next/server";
import { callOpenAIStructured } from "@/lib/openai-structured";
import type { CompetitorAnalysisResult } from "@/types/features";

const SYSTEM_PROMPT = `Ты Marketing Chef AI — эксперт по конкурентному анализу в ресторанном бизнесе.

Проведи глубокий анализ Instagram-аккаунта конкурента ресторана.
Используй свои знания о типичных стратегиях ресторанного маркетинга в Instagram.
Все тексты на русском языке. Будь конкретным и практичным.`;

const COMPETITOR_SCHEMA = {
  type: "object",
  properties: {
    profileSummary: {
      type: "string",
      description: "Краткий анализ профиля конкурента в Instagram",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Сильные стороны конкурента",
    },
    weaknesses: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Слабые стороны конкурента",
    },
    contentIdeas: {
      type: "array",
      items: { type: "string" },
      minItems: 7,
      maxItems: 10,
      description: "Идеи контента, которые можно перенять или улучшить",
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Рекомендации для нашего ресторана",
    },
    marketingOpportunities: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 7,
      description: "Маркетинговые возможности и ниши",
    },
  },
  required: [
    "profileSummary",
    "strengths",
    "weaknesses",
    "contentIdeas",
    "recommendations",
    "marketingOpportunities",
  ],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  let body: {
    restaurantName?: string;
    competitorHandle?: string;
    additionalInfo?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { restaurantName, competitorHandle, additionalInfo = "" } = body;

  if (!restaurantName?.trim()) {
    return NextResponse.json({ error: "Название ресторана не указано" }, { status: 400 });
  }

  if (!competitorHandle?.trim()) {
    return NextResponse.json({ error: "Instagram конкурента не указан" }, { status: 400 });
  }

  const handle = competitorHandle.trim().replace(/^@/, "");
  const userPrompt = `Наш ресторан: «${restaurantName.trim()}».
Instagram конкурента: @${handle}
${additionalInfo ? `Дополнительная информация: ${additionalInfo}` : ""}

Проведи анализ Instagram конкурента: сильные и слабые стороны, идеи контента, рекомендации и маркетинговые возможности для нашего ресторана.`;

  const result = await callOpenAIStructured<CompetitorAnalysisResult>({
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content: userPrompt }],
    schema: COMPETITOR_SCHEMA,
    schemaName: "competitor_analysis",
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 502 });
  }

  return NextResponse.json({ result: result.data });
}
