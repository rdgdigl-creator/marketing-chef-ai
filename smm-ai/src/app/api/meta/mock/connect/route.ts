import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isMetaMockMode } from "@/lib/meta/data-source";
import {
  createConnectedMockSession,
  DEMO_AD_ACCOUNT,
  META_MOCK_COOKIE,
  serializeMockSession,
} from "@/lib/meta/mock";

type ConnectBody = { adAccountId?: string };

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  if (!isMetaMockMode()) {
    return NextResponse.json(
      { error: "Демо-режим отключён. Используйте OAuth Meta." },
      { status: 400 },
    );
  }

  let body: ConnectBody = {};
  try {
    body = (await request.json()) as ConnectBody;
  } catch {
    // default account
  }

  const accountId = body.adAccountId?.trim() || DEMO_AD_ACCOUNT.id;
  const session = createConnectedMockSession(accountId);

  const response = NextResponse.json({
    ok: true,
    demo: true,
    accountId,
    message: "Демо-кабинет Meta подключён",
  });

  response.cookies.set(META_MOCK_COOKIE, serializeMockSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
