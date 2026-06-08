import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { canUseMetaOAuth } from "@/lib/meta/data-source";
import { buildMetaOAuthUrl } from "@/lib/meta/oauth";

const STATE_COOKIE = "meta_oauth_state";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  if (!canUseMetaOAuth()) {
    return NextResponse.json(
      {
        error: "OAuth недоступен. Используйте демо-кабинет или настройте META_APP_ID / META_APP_SECRET.",
        demoAvailable: true,
      },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;
  const state = randomUUID();
  const oauthUrl = buildMetaOAuthUrl(state, origin);

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
