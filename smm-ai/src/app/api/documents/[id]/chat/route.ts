import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { buildRagContext, type DocumentChunk } from "@/lib/document-rag";
import { extractOutputText } from "@/lib/openai";
import {
  DOCUMENT_CHAT_BUSINESS_PROMPT,
  DOCUMENT_CHAT_MARKETING_PROMPT,
} from "@/lib/pdf-prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsultantMode, DocumentAnalysis } from "@/types/pdf";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен" },
      { status: 500 },
    );
  }

  const { id: documentId } = await context.params;

  let body: { messages?: ChatMessage[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const messages = body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Сообщения не переданы" }, { status: 400 });
  }

  const validMessages = messages.filter(
    (msg): msg is ChatMessage =>
      (msg.role === "user" || msg.role === "assistant") &&
      typeof msg.content === "string" &&
      msg.content.trim().length > 0,
  );

  const lastUser = [...validMessages].reverse().find((m) => m.role === "user");

  if (!lastUser) {
    return NextResponse.json({ error: "Нет вопроса от пользователя" }, { status: 400 });
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: document, error: docError } = await supabase
    .from("pdf_documents")
    .select("id, file_name, document_text, analysis, consultant_mode")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (docError || !document) {
    return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  }

  const { data: chunkRows } = await supabase
    .from("document_chunks")
    .select("chunk_index, content")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });

  const storedChunks: DocumentChunk[] =
    chunkRows?.map((row) => ({
      index: row.chunk_index as number,
      content: row.content as string,
    })) ?? [];

  const analysis = document.analysis as DocumentAnalysis;
  const consultantMode = (document.consultant_mode as ConsultantMode) ?? "marketing";

  const ragContext = buildRagContext({
    fileName: document.file_name as string,
    documentText: document.document_text as string,
    analysisJson: JSON.stringify(analysis, null, 2),
    query: lastUser.content,
    storedChunks: storedChunks.length > 0 ? storedChunks : undefined,
  });

  const systemPrompt =
    consultantMode === "business"
      ? DOCUMENT_CHAT_BUSINESS_PROMPT
      : DOCUMENT_CHAT_MARKETING_PROMPT;

  const instructions = `${systemPrompt}

Контекст документа и анализа:
${ragContext}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        instructions,
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

    await supabase.from("document_chat_messages").insert([
      { document_id: documentId, role: "user", content: lastUser.content },
      { document_id: documentId, role: "assistant", content },
    ]);

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Не удалось связаться с OpenAI" }, { status: 502 });
  }
}
