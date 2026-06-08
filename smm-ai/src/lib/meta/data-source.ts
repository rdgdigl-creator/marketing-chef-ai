import { isMetaConfigured } from "./config";

/** Источник данных Meta: OAuth (live) или демо-провайдер (mock). */
export type MetaDataSource = "oauth" | "mock";

/**
 * Режим mock активен когда:
 * - META_USE_MOCK=true, или
 * - Meta App не настроен (нет APP_ID/SECRET), или
 * - явно не задано META_USE_MOCK=false при отсутствии App
 */
export function isMetaMockMode(): boolean {
  const flag = process.env.META_USE_MOCK?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return !isMetaConfigured();
}

export function getMetaDataSource(): MetaDataSource {
  return isMetaMockMode() ? "mock" : "oauth";
}

export function canUseMetaOAuth(): boolean {
  return isMetaConfigured() && !isMetaMockMode();
}
