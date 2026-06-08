import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isMetaMockMode } from "@/lib/meta/data-source";
import {
  createSyncedMockSession,
  DEMO_AD_ACCOUNT,
  getMockSyncResult,
  META_MOCK_COOKIE,
  serializeMockSession,
} from "@/lib/meta/mock";

/** Подключение демо-кабинета + синхронизация за один шаг. */
export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  if (!isMetaMockMode()) {
    return NextResponse.json(
      { error: "Quickstart доступен только в демо-режиме" },
      { status: 400 },
    );
  }

  const session = createSyncedMockSession(DEMO_AD_ACCOUNT.id);
  const sync = getMockSyncResult();

  const response = NextResponse.json({
    ok: true,
    demo: true,
    quickstart: true,
    accountName: DEMO_AD_ACCOUNT.name,
    recordsSynced: sync.recordsSynced,
    redirect: "/media-buyer",
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
