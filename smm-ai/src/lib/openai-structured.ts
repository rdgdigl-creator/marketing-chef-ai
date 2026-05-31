import { extractOutputText } from "@/lib/openai";

type ResponseOutputItem = {
  type?: string;
  content?: { type?: string; text?: string }[];
};

export async function callOpenAIStructured<T>(options: {
  instructions: string;
  input: unknown;
  schema: Record<string, unknown>;
  schemaName: string;
}): Promise<{ data?: T; error?: string; status?: number }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local", status: 500 };
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
        instructions: options.instructions,
        input: options.input,
        text: {
          format: {
            type: "json_schema",
            name: options.schemaName,
            schema: options.schema,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ?? "Ошибка OpenAI API";
      return { error: errorMessage, status: response.status };
    }

    const data = (await response.json()) as { output?: ResponseOutputItem[] };
    const rawText = extractOutputText(data.output);

    if (!rawText) {
      return { error: "Пустой ответ от OpenAI", status: 502 };
    }

    try {
      return { data: JSON.parse(rawText) as T };
    } catch {
      return { error: "Не удалось разобрать ответ OpenAI", status: 502 };
    }
  } catch {
    return { error: "Не удалось связаться с OpenAI", status: 502 };
  }
}

export async function callOpenAIText(options: {
  instructions: string;
  input: unknown;
}): Promise<{ content?: string; error?: string; status?: number }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local", status: 500 };
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
        instructions: options.instructions,
        input: options.input,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ?? "Ошибка OpenAI API";
      return { error: errorMessage, status: response.status };
    }

    const data = (await response.json()) as { output?: ResponseOutputItem[] };
    const content = extractOutputText(data.output);

    if (!content) {
      return { error: "Пустой ответ от OpenAI", status: 502 };
    }

    return { content };
  } catch {
    return { error: "Не удалось связаться с OpenAI", status: 502 };
  }
}
