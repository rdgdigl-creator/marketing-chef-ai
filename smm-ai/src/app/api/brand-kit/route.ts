import { NextRequest, NextResponse } from "next/server";
import { getBrandKit, saveBrandKit } from "@/lib/brand-kit";
import type { BrandKitInput, LogoPosition, LogoSize } from "@/types/brand-kit";

const VALID_POSITIONS: LogoPosition[] = [
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
  "center",
];

const VALID_SIZES: LogoSize[] = ["small", "medium", "large"];

function parseBrandKitInput(body: unknown): BrandKitInput | null {
  if (!body || typeof body !== "object") return null;

  const data = body as Record<string, unknown>;

  const logoPosition = data.logoPosition as LogoPosition;
  const logoSize = data.logoSize as LogoSize;
  const logoOpacity = Number(data.logoOpacity);

  if (!VALID_POSITIONS.includes(logoPosition)) return null;
  if (!VALID_SIZES.includes(logoSize)) return null;
  if (Number.isNaN(logoOpacity) || logoOpacity < 0 || logoOpacity > 100) return null;

  const logoUrl = data.logoUrl;
  if (logoUrl !== null && logoUrl !== undefined && typeof logoUrl !== "string") {
    return null;
  }

  return {
    restaurantName: typeof data.restaurantName === "string" ? data.restaurantName : "",
    logoUrl: typeof logoUrl === "string" ? logoUrl : null,
    slogan: typeof data.slogan === "string" ? data.slogan : "",
    primaryColor: typeof data.primaryColor === "string" ? data.primaryColor : "#8B5CF6",
    secondaryColor: typeof data.secondaryColor === "string" ? data.secondaryColor : "#1a1a1a",
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : "",
    instagram: typeof data.instagram === "string" ? data.instagram : "",
    address: typeof data.address === "string" ? data.address : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    website: typeof data.website === "string" ? data.website : "",
    watermarkEnabled: Boolean(data.watermarkEnabled),
    logoPosition,
    logoSize,
    logoOpacity: Math.round(logoOpacity),
  };
}

export async function GET() {
  try {
    const brandKit = await getBrandKit();
    return NextResponse.json({ brandKit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не удалось загрузить Brand Kit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const input = parseBrandKitInput(body);

  if (!input) {
    return NextResponse.json({ error: "Некорректные данные Brand Kit" }, { status: 400 });
  }

  try {
    const result = await saveBrandKit(input);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ brandKit: result.brandKit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не удалось сохранить Brand Kit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
