/**
 * Чтение и нормализация конфигурации iiko из переменных окружения.
 *
 * С 1 июня 2026 года iiko Cloud API (iikoTransport) перешёл на новую схему
 * авторизации через приложение из портала разработчика. Авторизация выполняется
 * парой учётных данных:
 *   IIKO_APP_ID         — идентификатор приложения (appId) из портала разработчика.
 *   IIKO_CLIENT_SECRET  — секрет приложения (clientSecret) из портала разработчика.
 *   IIKO_API_BASE_URL   — необязательный базовый URL (по умолчанию RU-регион).
 *
 * Обе строки отправляются в POST /api/v2/access_token:
 *   { "appId": "...", "clientSecret": "..." }
 */

/** Базовый URL по умолчанию (российский регион iiko Cloud). */
export const DEFAULT_IIKO_BASE_URL = "https://api-ru.iiko.services";

/**
 * Срок жизни токена доступа iiko — 60 минут.
 * Обновляем заранее (за 5 минут до истечения), чтобы исключить гонку.
 */
export const TOKEN_TTL_MS = 60 * 60 * 1000;
export const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

/** Идентификатор приложения iiko (appId) из портала разработчика. */
export function getIikoAppId(): string {
  const appId = process.env.IIKO_APP_ID;
  if (!appId) {
    throw new Error("Missing IIKO_APP_ID");
  }
  return appId;
}

/** Секрет приложения iiko (clientSecret) из портала разработчика. */
export function getIikoClientSecret(): string {
  const clientSecret = process.env.IIKO_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("Missing IIKO_CLIENT_SECRET");
  }
  return clientSecret;
}

export function getIikoBaseUrl(): string {
  const raw = process.env.IIKO_API_BASE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_IIKO_BASE_URL;
  return base.replace(/\/+$/, "");
}
