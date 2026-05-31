import { NextRequest, NextResponse } from "next/server";
import { extractOutputText } from "@/lib/openai";
import type { MarketingAnalysis } from "@/types/marketing";

const SYSTEM_PROMPT = `Ты Marketing Chef AI — профессиональный маркетолог ресторанного и HoReCa-бизнеса.

Проанализируй фото (блюдо, ресторан, продукт) и создай готовые маркетинговые материалы для рекламы.
Все тексты на русском языке. Будь конкретным, креативным и ориентированным на продажи.
Промпты для генерации изображений (imagePrompt) пиши на английском.`;

const BANNER_ITEM = {
  type: "object",
  properties: {
    title: { type: "string", description: "Заголовок баннера" },
    adText: { type: "string", description: "Рекламный текст" },
    designDescription: { type: "string", description: "Описание дизайна баннера" },
    style: { type: "string", description: "Стиль оформления" },
    imagePrompt: { type: "string", description: "Промпт для генерации изображения на английском" },
  },
  required: ["title", "adText", "designDescription", "style", "imagePrompt"],
  additionalProperties: false,
};

const MARKETING_SCHEMA = {
  type: "object",
  properties: {
    imageDescription: {
      type: "string",
      description: "Что изображено на фото",
    },
    photoQuality: {
      type: "string",
      description: "Оценка качества фотографии для рекламы",
    },
    adAppeal: {
      type: "string",
      description: "Привлекательность для рекламы и рекомендации",
    },
    adConcepts: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5,
      description: "Рекламные концепции",
    },
    adTexts: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5,
      description: "Рекламные тексты",
    },
    offers: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5,
      description: "Офферы",
    },
    cta: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5,
      description: "Призывы к действию (CTA)",
    },
    storiesIdeas: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5,
      description: "Идеи для Stories",
    },
    postIdeas: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5,
      description: "Идеи для постов",
    },
    bannerConcepts: {
      type: "array",
      items: BANNER_ITEM,
      minItems: 3,
      maxItems: 5,
      description: "Концепции Instagram-баннеров",
    },
  },
  required: [
    "imageDescription",
    "photoQuality",
    "adAppeal",
    "adConcepts",
    "adTexts",
    "offers",
    "cta",
    "storiesIdeas",
    "postIdeas",
    "bannerConcepts",
  ],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local" },
      { status: 500 },
    );
  }

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

Проанализируй фото:
1. Что изображено
2. Качество фотографии для рекламы
3. Привлекательность для рекламы

Создай:
- 5 рекламных концепций
- 5 рекламных текстов
- 5 офферов
- 5 CTA
- 5 идей Stories
- 5 идей постов
- 3–5 концепций Instagram-баннеров (заголовок, текст, описание дизайна, стиль, промпт для генерации)

Все материалы должны быть связаны с этим изображением и рестораном.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
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
        text: {
          format: {
            type: "json_schema",
            name: "marketing_analysis",
            schema: MARKETING_SCHEMA,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ??
        "Ошибка OpenAI API";
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = (await response.json()) as {
      output?: { type?: string; content?: { type?: string; text?: string }[] }[];
    };

    const rawText = extractOutputText(data.output);

    if (!rawText) {
      return NextResponse.json({ error: "Пустой ответ от OpenAI" }, { status: 502 });
    }

    let analysis: MarketingAnalysis;

    try {
      analysis = JSON.parse(rawText) as MarketingAnalysis;
    } catch {
      return NextResponse.json({ error: "Не удалось разобрать ответ OpenAI" }, { status: 502 });
    }

    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: "Не удалось связаться с OpenAI" }, { status: 502 });
  }
}
