import { NextRequest, NextResponse } from "next/server";
import { getBrandKit } from "@/lib/brand-kit";
import { buildCreativePrompt, getCreativeSize } from "@/lib/creative-prompts";
import { editImage, generateImage } from "@/lib/openai-images";
import type { CreativeContext, CreativeType, GenerateCreativeRequest } from "@/types/creative";

const VALID_TYPES: CreativeType[] = [
  "banner",
  "story",
  "instagram_post",
  "promo_poster",
  "enhance_photo",
];

function isCreativeContext(value: unknown): value is CreativeContext {
  if (!value || typeof value !== "object") return false;

  const ctx = value as CreativeContext;

  if (ctx.sourceType === "dish") {
    return (
      typeof ctx.restaurantName === "string" &&
      ctx.restaurantName.trim().length > 0 &&
      typeof ctx.analysis === "object" &&
      ctx.analysis !== null &&
      typeof ctx.analysis.dishDescription === "string"
    );
  }

  if (ctx.sourceType === "document") {
    return (
      typeof ctx.fileName === "string" &&
      typeof ctx.documentType === "string" &&
      typeof ctx.summary === "string" &&
      Array.isArray(ctx.keyFindings) &&
      Array.isArray(ctx.marketingRecommendations)
    );
  }

  return false;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен. Добавьте ключ в .env.local" },
      { status: 500 },
    );
  }

  let body: GenerateCreativeRequest;

  try {
    body = (await request.json()) as GenerateCreativeRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { creativeType, context, sourceImageBase64 } = body;

  if (!creativeType || !VALID_TYPES.includes(creativeType)) {
    return NextResponse.json({ error: "Неизвестный тип креатива" }, { status: 400 });
  }

  if (!isCreativeContext(context)) {
    return NextResponse.json({ error: "Некорректный контекст анализа" }, { status: 400 });
  }

  if (creativeType === "enhance_photo" && !sourceImageBase64) {
    return NextResponse.json(
      { error: "Для улучшения фото нужно исходное изображение" },
      { status: 400 },
    );
  }

  const prompt = buildCreativePrompt(creativeType, context, await getBrandKit());
  const size = getCreativeSize(creativeType);

  try {
    let imageBase64: string;

    const useSourceImage =
      sourceImageBase64 &&
      typeof sourceImageBase64 === "string" &&
      sourceImageBase64.startsWith("data:image/");

    if (creativeType === "enhance_photo" && useSourceImage) {
      imageBase64 = await editImage(apiKey, sourceImageBase64, prompt, size);
    } else if (useSourceImage && creativeType !== "enhance_photo") {
      imageBase64 = await editImage(apiKey, sourceImageBase64, prompt, size);
    } else {
      imageBase64 = await generateImage(apiKey, prompt, size);
    }

    return NextResponse.json({
      creativeType,
      imageBase64,
      prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не удалось сгенерировать креатив";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
