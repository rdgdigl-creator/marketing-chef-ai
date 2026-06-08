/** Версия Graph API Meta Marketing. */
export const DEFAULT_META_GRAPH_VERSION = "v21.0";

/** Scopes для read-only MVP. */
export const META_OAUTH_SCOPES = ["ads_read", "business_management"] as const;

export function getMetaAppId(): string | null {
  const value = process.env.META_APP_ID?.trim();
  return value && value.length > 0 ? value : null;
}

export function getMetaAppSecret(): string | null {
  const value = process.env.META_APP_SECRET?.trim();
  return value && value.length > 0 ? value : null;
}

export function isMetaConfigured(): boolean {
  return Boolean(getMetaAppId() && getMetaAppSecret());
}

export function getMetaGraphVersion(): string {
  return process.env.META_GRAPH_API_VERSION?.trim() || DEFAULT_META_GRAPH_VERSION;
}

export function getMetaGraphBaseUrl(): string {
  return `https://graph.facebook.com/${getMetaGraphVersion()}`;
}

/**
 * Redirect URI для OAuth callback.
 * В production задайте META_OAUTH_REDIRECT_URI явно (должен совпадать с Meta App).
 */
export function getMetaOAuthRedirectUri(origin?: string): string {
  const explicit = process.env.META_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  if (origin) return `${origin.replace(/\/+$/, "")}/api/meta/oauth/callback`;
  throw new Error("Missing META_OAUTH_REDIRECT_URI or request origin");
}

export function getMetaOAuthDialogUrl(): string {
  return `https://www.facebook.com/${getMetaGraphVersion()}/dialog/oauth`;
}
