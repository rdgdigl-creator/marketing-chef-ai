import { NextRequest, NextResponse } from "next/server";
import {
  detectFileType,
  isImageType,
  mimeForFileType,
  type SupportedFileType,
} from "@/lib/file-types";
import {
  extractDocumentContent,
  parseDataUrl,
} from "@/lib/document-extract";
import { extractOutputText } from "@/lib/openai";
import { savePdfDocument } from "@/lib/pdf-documents";
import {
  DOCUMENT_ANALYSIS_SCHEMA,
  getAnalyzeSystemPrompt,
  getAnalyzeUserPrompt,
} from "@/lib/pdf-prompts";
import type { ConsultantMode, DocumentAnalysis } from "@/types/pdf";

export const maxDuration = 180;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function estimateBase64Size(base64: string): number {
  const data = base64.includes(",") ? base64.split(",")[1] : base64;
  return Math.floor((data.length * 3) / 4);
}

function parseConsultantMode(value: unknown): ConsultantMode {
  return value === "business" ? "business" : "marketing";
}

type OpenAIContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_file"; filename: string; file_data: string }
  | { type: "input_image"; image_url: string; detail?: "auto" | "low" | "high" };

function buildOpenAIInput(params: {
  fileName: string;
  fileType: SupportedFileType;
  dataUrl: string;
  extractedText: string;
  isImage: boolean;
  imageDataUrl?: string;
  userPrompt: string;
}): OpenAIContentPart[] {
  const parts: OpenAIContentPart[] = [];

  if (params.isImage && params.imageDataUrl) {
    parts.push({
      type: "input_image",
      image_url: params.imageDataUrl,
      detail: "high",
    });
  } else if (params.fileType === "pdf") {
    parts.push({
      type: "input_file",
      filename: params.fileName,
      file_data: params.dataUrl,
    });
  }

  const textIntro =
    params.extractedText.trim().length > 0
      ? `Извлечённый текст документа:\n\n${params.extractedText.slice(0, 25000)}\n\n---\n\n`
      : "";

  parts.push({
    type: "input_text",
    text: `${textIntro}${params.userPrompt}`,
  });

  return parts;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local" },
      { status: 500 },
    );
  }

  let body: {
    fileBase64?: string;
    pdfBase64?: string;
    fileName?: string;
    mimeType?: string;
    consultantMode?: string;
    saveToDatabase?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const fileBase64 = body.fileBase64 ?? body.pdfBase64;
  const consultantMode = parseConsultantMode(body.consultantMode);
  const saveToDatabase = body.saveToDatabase !== false;

  if (!fileBase64 || typeof fileBase64 !== "string") {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  if (estimateBase64Size(fileBase64) > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Размер файла не должен превышать 10 МБ" },
      { status: 400 },
    );
  }

  const safeFileName =
    typeof body.fileName === "string" && body.fileName.trim()
      ? body.fileName.trim().replace(/[^\w.\-() ]+/g, "_")
      : "document.pdf";

  let mime: string;
  let buffer: Buffer;

  try {
    const parsed = parseDataUrl(fileBase64);
    mime = parsed.mime;
    buffer = parsed.buffer;
  } catch {
    return NextResponse.json({ error: "Некорректный формат файла" }, { status: 400 });
  }

  const fileType = detectFileType(safeFileName, body.mimeType ?? mime);

  if (!fileType) {
    return NextResponse.json(
      {
        error:
          "Неподдерживаемый формат. Допустимы: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, JPG, PNG",
      },
      { status: 400 },
    );
  }

  let extraction;
  try {
    extraction = await extractDocumentContent(buffer, fileType, fileBase64);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Не удалось извлечь содержимое: ${err.message}`
            : "Не удалось извлечь содержимое документа",
      },
      { status: 422 },
    );
  }

  if (
    !extraction.isImage &&
    !isImageType(fileType) &&
    fileType !== "pdf" &&
    extraction.text.trim().length < 20
  ) {
    return NextResponse.json(
      {
        error:
          "Не удалось извлечь достаточно текста из документа. Проверьте файл или попробуйте другой формат.",
      },
      { status: 422 },
    );
  }

  const userPrompt = getAnalyzeUserPrompt(
    safeFileName,
    fileType,
    consultantMode,
    extraction.text,
  );
  const systemPrompt = getAnalyzeSystemPrompt(consultantMode);

  const inputContent = buildOpenAIInput({
    fileName: safeFileName,
    fileType,
    dataUrl: fileBase64.startsWith("data:")
      ? fileBase64
      : `data:${mimeForFileType(fileType)};base64,${fileBase64}`,
    extractedText: extraction.text,
    isImage: extraction.isImage,
    imageDataUrl: extraction.imageDataUrl,
    userPrompt,
  });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        instructions: systemPrompt,
        input: [
          {
            role: "user",
            content: inputContent,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "document_business_analysis",
            schema: DOCUMENT_ANALYSIS_SCHEMA,
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

    let analysis: DocumentAnalysis;

    try {
      analysis = JSON.parse(rawText) as DocumentAnalysis;
    } catch {
      return NextResponse.json(
        { error: "Не удалось разобрать ответ OpenAI" },
        { status: 502 },
      );
    }

    if (!analysis.documentText?.trim() && extraction.text.trim()) {
      analysis.documentText = extraction.text.slice(0, 15000);
    }
    analysis.detectedFileType = fileType;

    let documentId: string | null = null;
    let saveWarning: string | null = null;

    if (saveToDatabase) {
      try {
        const saved = await savePdfDocument({
          fileName: safeFileName,
          analysis,
          consultantMode,
        });

        if ("documentId" in saved) {
          documentId = saved.documentId;
        } else {
          saveWarning = saved.error;
        }
      } catch (err) {
        saveWarning =
          err instanceof Error ? err.message : "Не удалось сохранить в Supabase";
      }
    }

    return NextResponse.json({
      analysis,
      fileName: safeFileName,
      fileType,
      consultantMode,
      documentId,
      saveWarning,
    });
  } catch {
    return NextResponse.json({ error: "Не удалось связаться с OpenAI" }, { status: 502 });
  }
}
