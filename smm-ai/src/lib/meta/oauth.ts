import {
  getMetaAppId,
  getMetaAppSecret,
  getMetaGraphBaseUrl,
  getMetaOAuthDialogUrl,
  getMetaOAuthRedirectUri,
  META_OAUTH_SCOPES,
} from "./config";
import type { MetaTokenResponse } from "./types";

type GraphTokenPayload = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; type?: string; code?: number };
};

function parseTokenResponse(payload: GraphTokenPayload): MetaTokenResponse {
  if (!payload.access_token) {
    const message = payload.error?.message ?? "Meta не вернул access token";
    throw new Error(message);
  }
  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in ?? null,
    tokenType: payload.token_type ?? null,
  };
}

export function buildMetaOAuthUrl(state: string, origin: string): string {
  const appId = getMetaAppId();
  if (!appId) {
    throw new Error("META_APP_ID не настроен");
  }

  const redirectUri = getMetaOAuthRedirectUri(origin);
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_OAUTH_SCOPES.join(","),
    response_type: "code",
  });

  return `${getMetaOAuthDialogUrl()}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  origin: string,
): Promise<MetaTokenResponse> {
  const appId = getMetaAppId();
  const appSecret = getMetaAppSecret();
  if (!appId || !appSecret) {
    throw new Error("Meta App ID или Secret не настроены");
  }

  const redirectUri = getMetaOAuthRedirectUri(origin);
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${getMetaGraphBaseUrl()}/oauth/access_token?${params}`);
  const payload = (await res.json()) as GraphTokenPayload;
  if (!res.ok) {
    throw new Error(payload.error?.message ?? "Не удалось обменять code на token");
  }
  return parseTokenResponse(payload);
}

/** Short-lived → long-lived (до ~60 дней). */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<MetaTokenResponse> {
  const appId = getMetaAppId();
  const appSecret = getMetaAppSecret();
  if (!appId || !appSecret) {
    throw new Error("Meta App ID или Secret не настроены");
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const res = await fetch(`${getMetaGraphBaseUrl()}/oauth/access_token?${params}`);
  const payload = (await res.json()) as GraphTokenPayload;
  if (!res.ok) {
    throw new Error(payload.error?.message ?? "Не удалось получить long-lived token");
  }
  return parseTokenResponse(payload);
}

export function tokenExpiresAt(expiresIn: number | null): string | null {
  if (!expiresIn || expiresIn <= 0) return null;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
