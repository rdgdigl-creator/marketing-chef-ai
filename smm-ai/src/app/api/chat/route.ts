import { NextRequest, NextResponse } from "next/server";
import { extractOutputText } from "@/lib/openai";
import {
  AI_CONSULTANT_SYSTEM_PROMPT,
  AI_MARKETING_SYSTEM_PROMPT,
} from "@/lib/pdf-prompts";
import type { ConsultantMode } from "@/types/pdf";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getSystemPrompt(mode: ConsultantMode): string {
  return mode === "business" ? AI_CONSULTANT_SYSTEM_PROMPT : AI_MARKETING_SYSTEM_PROMPT;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local" },
      { status: 500 },
    );
  }

  let body: { messages?: ChatMessage[]; mode?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { messages } = body;
  const mode: ConsultantMode = body.mode === "business" ? "business" : "marketing";

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Сообщения не переданы" }, { status: 400 });
  }

  const validMessages = messages.filter(
    (msg): msg is ChatMessage =>
      (msg.role === "user" || msg.role === "assistant") &&
      typeof msg.content === "string" &&
      msg.content.trim().length > 0,
  );

  if (validMessages.length === 0) {
    return NextResponse.json({ error: "Нет валидных сообщений" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        instructions: getSystemPrompt(mode),
        input: validMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
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

    if (!content) {
      return NextResponse.json({ error: "Пустой ответ от OpenAI" }, { status: 502 });
    }

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Не удалось связаться с OpenAI" }, { status: 502 });
  }
}
