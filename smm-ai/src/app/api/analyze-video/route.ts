import { NextRequest, NextResponse } from "next/server";
import { callOpenAIStructured } from "@/lib/openai-structured";
import type { VideoAnalysisResult } from "@/types/video";

const SYSTEM_PROMPT = `Ты Marketing Chef AI — эксперт по видеорекламе для ресторанов, кафе и доставок еды.

Проанализируй кадры из видео с точки зрения маркетинга HoReCa.
Все тексты на русском языке. Будь конкретным и практичным.
Оцени видео по шкале 0–100. Дай рекомендации для Meta Ads (Facebook/Instagram).`;

const VIDEO_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number", description: "Оценка видео 0-100" },
    scoreLabel: { type: "string", description: "Краткая метка оценки на русском" },
    firstThreeSeconds: { type: "string", description: "Анализ первых 3 секунд" },
    attentionRetention: { type: "string", description: "Удержание внимания" },
    editing: { type: "string", description: "Оценка монтажа" },
    composition: { type: "string", description: "Композиция кадра" },
    sound: { type: "string", description: "Звук и музыка" },
    textOverlay: { type: "string", description: "Текст на видео" },
    improvements: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 8,
      description: "Что улучшить",
    },
    adReady: { type: "boolean", description: "Подходит ли для рекламы" },
    adReadyReason: { type: "string", description: "Почему подходит или нет" },
    recommendedAudience: {
      type: "object",
      properties: {
        ageRange: { type: "string" },
        gender: { type: "string" },
        interests: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
        geography: { type: "string" },
      },
      required: ["ageRange", "gender", "interests", "geography"],
      additionalProperties: false,
    },
    metaAdsSettings: {
      type: "object",
      properties: {
        campaignObjective: { type: "string" },
        placements: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
        budgetHint: { type: "string" },
        targetingNotes: { type: "string" },
      },
      required: ["campaignObjective", "placements", "budgetHint", "targetingNotes"],
      additionalProperties: false,
    },
    summary: { type: "string", description: "Краткое резюме анализа" },
  },
  required: [
    "score",
    "scoreLabel",
    "firstThreeSeconds",
    "attentionRetention",
    "editing",
    "composition",
    "sound",
    "textOverlay",
    "improvements",
    "adReady",
    "adReadyReason",
    "recommendedAudience",
    "metaAdsSettings",
    "summary",
  ],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  let body: {
    frames?: string[];
    restaurantName?: string;
    videoDescription?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { frames, restaurantName, videoDescription = "" } = body;

  if (!frames?.length) {
    return NextResponse.json({ error: "Кадры видео не переданы" }, { status: 400 });
  }

  const userPrompt = `Ресторан: «${restaurantName?.trim() || "не указан"}».
${videoDescription ? `Контекст: ${videoDescription}` : ""}

Проанализируй видео по кадрам (0 сек, 1 сек, 3 сек):
- Первые 3 секунды и удержание внимания
- Монтаж, композиция, звук, текст
- Оценка 0–100
- Подходит ли для рекламы
- Рекомендуемая аудитория (возраст, пол, интересы, география)
- Настройки для Meta Ads`;

  const imageContent = frames.slice(0, 5).map((frame) => ({
    type: "input_image" as const,
    image_url: frame,
    detail: "high" as const,
  }));

  const result = await callOpenAIStructured<VideoAnalysisResult>({
    instructions: SYSTEM_PROMPT,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }, ...imageContent],
      },
    ],
    schema: VIDEO_SCHEMA,
    schemaName: "video_analysis",
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 502 });
  }

  return NextResponse.json({ result: result.data });
}
