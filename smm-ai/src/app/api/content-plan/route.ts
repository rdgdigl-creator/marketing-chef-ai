import { NextRequest, NextResponse } from "next/server";
import { callOpenAIStructured } from "@/lib/openai-structured";
import type { ContentPlanResult } from "@/types/features";

const SYSTEM_PROMPT = `Ты Marketing Chef AI — профессиональный SMM-специалист для ресторанного бизнеса.

Создай детальный контент-план для ресторана с публикациями для Instagram, TikTok и Telegram.
Все тексты на русском языке. Будь конкретным: указывай формат, тему, текст поста и призыв к действию.`;

function buildSchema(days: number) {
  return {
    type: "object",
    properties: {
      plan: {
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
        minItems: days,
        maxItems: days,
      },
    },
    required: ["plan"],
    additionalProperties: false,
  } as const;
}

export async function POST(request: NextRequest) {
  let body: {
    restaurantName?: string;
    durationDays?: number;
    platforms?: string[];
    description?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { restaurantName, durationDays = 7, platforms = ["instagram", "tiktok", "telegram"], description = "" } = body;

  if (!restaurantName?.trim()) {
    return NextResponse.json({ error: "Название ресторана не указано" }, { status: 400 });
  }

  if (![7, 14, 30].includes(durationDays)) {
    return NextResponse.json({ error: "Длительность должна быть 7, 14 или 30 дней" }, { status: 400 });
  }

  const platformList = platforms.join(", ");
  const userPrompt = `Ресторан: «${restaurantName.trim()}».
Период: ${durationDays} дней.
Платформы: ${platformList}.
${description ? `Дополнительная информация: ${description}` : ""}

Создай контент-план на ${durationDays} дней (день 1–${durationDays}).
Для каждого дня — отдельные публикации для Instagram, TikTok и Telegram с разным контентом, адаптированным под платформу.`;

  const result = await callOpenAIStructured<ContentPlanResult>({
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content: userPrompt }],
    schema: buildSchema(durationDays),
    schemaName: "content_plan",
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 502 });
  }

  return NextResponse.json({ result: result.data });
}
