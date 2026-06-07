import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { extractOutputText } from "@/lib/openai";
import {
  buildAnalyticsSummaryText,
  getSalesAnalytics,
} from "@/lib/sales/analytics";

const SYSTEM_PROMPT = `Ты — AI-директор по маркетингу ресторана. На основе сводки продаж из iiko
сделай краткие, конкретные выводы и практические рекомендации для роста продаж и среднего чека.
Пиши по-русски, по-деловому, без воды. Опирайся только на переданные цифры.
Верни СТРОГО JSON без markdown в формате:
{"insights": ["...", "..."], "recommendations": ["...", "..."]}
3–5 пунктов в каждом массиве, каждый пункт — одно ёмкое предложение.`;

type InsightsResponse = { insights: string[]; recommendations: string[] };

function parseInsights(text: string): InsightsResponse | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<InsightsResponse>;
    if (Array.isArray(parsed.insights) && Array.isArray(parsed.recommendations)) {
      return {
        insights: parsed.insights.map(String),
        recommendations: parsed.recommendations.map(String),
      };
    }
  } catch {
    // fall through
  }
  return null;
}

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local" },
      { status: 500 },
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const analytics = await getSalesAnalytics();
  if (!analytics.hasData) {
    return NextResponse.json(
      { error: "Нет данных о продажах. Подключите iiko и синхронизируйте продажи." },
      { status: 400 },
    );
  }

  const summary = buildAnalyticsSummaryText(analytics);

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
        input: [{ role: "user", content: summary }],
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

    const content = extractOutputText(data.output);
    const parsed = content ? parseInsights(content) : null;

    if (!parsed) {
      return NextResponse.json(
        { error: "Не удалось разобрать ответ AI. Попробуйте ещё раз." },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Не удалось связаться с OpenAI" }, { status: 502 });
  }
}
