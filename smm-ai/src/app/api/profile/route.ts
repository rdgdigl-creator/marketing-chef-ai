import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, updateUserProfile } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const logoUrl = data.logoUrl;

  if (logoUrl !== null && logoUrl !== undefined && typeof logoUrl !== "string") {
    return NextResponse.json({ error: "Некорректный логотип" }, { status: 400 });
  }

  const result = await updateUserProfile(user.id, {
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    restaurantName: typeof data.restaurantName === "string" ? data.restaurantName : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    logoUrl: typeof logoUrl === "string" ? logoUrl : null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ profile: result.profile });
}
