import { NextRequest, NextResponse } from "next/server";
import { callOpenAIStructured } from "@/lib/openai-structured";
import type { ReelsGenerationResult } from "@/types/features";

const SYSTEM_PROMPT = `Ты Marketing Chef AI — профессиональный маркетолог ресторанного бизнеса и эксперт по Reels.

Создай минимум 20 идей для Instagram Reels для ресторана.
Для каждой идеи: название, хук (первые секунды), что снять, почему может залететь, подпись для Instagram, промпт для Kling AI (на английском).
Также добавь 3 актуальных тренда для ресторанов.
Все тексты на русском, кроме klingPrompt.`;

const REELS_IDEA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Название идеи" },
    hook: { type: "string", description: "Хук — первые секунды" },
    whatToFilm: { type: "string", description: "Что снять — конкретные сцены" },
    whyItWorks: { type: "string", description: "Почему это может залететь" },
    caption: { type: "string", description: "Подпись для Instagram" },
    klingPrompt: { type: "string", description: "Промпт для Kling AI на английском" },
  },
  required: ["title", "hook", "whatToFilm", "whyItWorks", "caption", "klingPrompt"],
  additionalProperties: false,
};

const REELS_SCHEMA = {
  type: "object",
  properties: {
    dishDescription: { type: "string", description: "Что на фото" },
    ideas: {
      type: "array",
      items: REELS_IDEA,
      minItems: 20,
      maxItems: 25,
    },
    trends: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trend: { type: "string" },
          whyItWorks: { type: "string" },
          howToAdapt: { type: "string" },
        },
        required: ["trend", "whyItWorks", "howToAdapt"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 5,
    },
  },
  required: ["dishDescription", "ideas", "trends"],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  let body: { imageBase64?: string; restaurantName?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { imageBase64, restaurantName } = body;

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return NextResponse.json({ error: "Изображение не передано" }, { status: 400 });
  }

  if (!restaurantName?.trim()) {
    return NextResponse.json({ error: "Название ресторана не указано" }, { status: 400 });
  }

  const userPrompt = `Ресторан: «${restaurantName.trim()}».

Создай минимум 20 идей Reels и 3 тренда для ресторанов.
Каждая идея должна быть связана с блюдом на фото и рестораном.`;

  const result = await callOpenAIStructured<ReelsGenerationResult>({
    instructions: SYSTEM_PROMPT,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          { type: "input_image", image_url: imageBase64, detail: "high" },
        ],
      },
    ],
    schema: REELS_SCHEMA,
    schemaName: "reels_generation",
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 502 });
  }

  return NextResponse.json({ result: result.data });
}
