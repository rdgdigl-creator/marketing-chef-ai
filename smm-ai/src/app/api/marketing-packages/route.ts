import { NextRequest, NextResponse } from "next/server";
import { getMarketingPackages, saveMarketingPackage } from "@/lib/marketing-creatives";
import type { CreativeSourceType, SaveMarketingPackageRequest } from "@/types/creative";

const VALID_SOURCE_TYPES: CreativeSourceType[] = ["dish", "document"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sourceType = searchParams.get("sourceType") as CreativeSourceType | null;
  const marketingProjectId = searchParams.get("marketingProjectId") ?? undefined;
  const documentId = searchParams.get("documentId") ?? undefined;

  if (!sourceType || !VALID_SOURCE_TYPES.includes(sourceType)) {
    return NextResponse.json({ error: "Некорректный sourceType" }, { status: 400 });
  }

  const result = await getMarketingPackages({
    sourceType,
    marketingProjectId,
    documentId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ packages: result.packages });
}

export async function POST(request: NextRequest) {
  let body: SaveMarketingPackageRequest;

  try {
    body = (await request.json()) as SaveMarketingPackageRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { sourceType, sourceTitle, marketingProjectId, documentId, creatives } = body;

  if (!sourceType || !VALID_SOURCE_TYPES.includes(sourceType)) {
    return NextResponse.json({ error: "Некорректный sourceType" }, { status: 400 });
  }

  if (!sourceTitle?.trim()) {
    return NextResponse.json({ error: "Укажите название источника" }, { status: 400 });
  }

  if (!Array.isArray(creatives) || creatives.length === 0) {
    return NextResponse.json({ error: "Нет креативов для сохранения" }, { status: 400 });
  }

  const result = await saveMarketingPackage({
    sourceType,
    sourceTitle: sourceTitle.trim(),
    marketingProjectId,
    documentId,
    creatives,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ package: result.package });
}
