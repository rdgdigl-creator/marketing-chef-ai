/**
 * Production-ready клиент iiko Cloud API (iikoTransport).
 *
 * Архитектура iiko Cloud API (новая схема авторизации с 01.06.2026):
 *   1. Аутентификация: POST /api/v2/access_token { appId, clientSecret } ->
 *      { token }. Токен живёт ~60 минут и передаётся как
 *      `Authorization: Bearer <token>`.
 *   2. Все остальные методы — POST с JSON-телом и Bearer-токеном.
 *   3. Ошибки возвращаются с телом { errorDescription, error, correlationId }.
 *
 * Этот клиент покрывает только подключение:
 *   - получение и кэширование токена с авто-обновлением;
 *   - проверку связи (checkConnection / ping);
 *   - получение списка организаций.
 *
 * Особенности реализации:
 *   - нативный fetch (без внешних зависимостей);
 *   - таймауты через AbortController;
 *   - повторы при сетевых сбоях, 429 и 5xx с экспоненциальной задержкой;
 *   - один in-flight запрос за токеном (защита от «грозы» параллельных вызовов);
 *   - прозрачное обновление токена при 401.
 */

import {
  DEFAULT_IIKO_BASE_URL,
  TOKEN_REFRESH_MARGIN_MS,
  TOKEN_TTL_MS,
  getIikoAppId,
  getIikoBaseUrl,
  getIikoClientSecret,
} from "./config";
import {
  IikoApiError,
  IikoAuthError,
  IikoNetworkError,
  IikoTimeoutError,
} from "./errors";
import type {
  AccessTokenResponse,
  IikoClientConfig,
  IikoConnectionStatus,
  IikoErrorResponse,
  OlapColumnInfo,
  OlapColumnsRequest,
  OlapColumnsResponse,
  OlapReportRequest,
  OlapReportResponse,
  OlapReportRow,
  OlapReportType,
  Organization,
  OrganizationsRequest,
  OrganizationsResponse,
} from "./types";

interface CachedToken {
  token: string;
  /** Момент времени (epoch ms), после которого токен считается истёкшим. */
  expiresAt: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;

export class IikoClient {
  /** Платформенный appId (из ENV `IIKO_APP_ID`). */
  private readonly appId: string;
  /** Платформенный clientSecret (из ENV `IIKO_CLIENT_SECRET`). */
  private readonly clientSecret: string;
  /** API Login клиента (имя интеграции), если задан. */
  private readonly apiLogin?: string;
  /** API Key клиента (секрет), если задан. */
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  private cachedToken: CachedToken | null = null;
  /** In-flight запрос за токеном, чтобы не запрашивать его параллельно. */
  private tokenPromise: Promise<string> | null = null;

  constructor(config: IikoClientConfig = {}) {
    // Платформенная пара appId/clientSecret всегда из ENV: это данные
    // Marketing Chef AI, пользователь их не видит и не вводит.
    this.appId = config.appId ?? getIikoAppId();
    this.clientSecret = config.clientSecret ?? getIikoClientSecret();
    // Клиентские учётные данные приходят из подключения пользователя.
    this.apiLogin = config.apiLogin?.trim() || undefined;
    this.apiKey = config.apiKey?.trim() || undefined;
    this.baseUrl = (config.baseUrl ?? getIikoBaseUrl() ?? DEFAULT_IIKO_BASE_URL).replace(
      /\/+$/,
      "",
    );
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  // --------------------------------------------------------------------------
  // Публичный API
  // --------------------------------------------------------------------------

  /**
   * Возвращает действующий токен доступа, при необходимости запрашивая новый.
   * Результат кэшируется до истечения срока жизни (минус запас).
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    // Если кто-то уже запрашивает токен — ждём тот же запрос.
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = this.requestAccessToken()
      .then((token) => {
        this.cachedToken = {
          token,
          expiresAt: Date.now() + TOKEN_TTL_MS - TOKEN_REFRESH_MARGIN_MS,
        };
        return token;
      })
      .finally(() => {
        this.tokenPromise = null;
      });

    return this.tokenPromise;
  }

  /**
   * Проверяет подключение: получает токен и запрашивает организации.
   * Не выбрасывает исключение — возвращает структурированный статус,
   * удобный для health-check эндпоинтов и UI.
   */
  async checkConnection(): Promise<IikoConnectionStatus> {
    const startedAt = Date.now();
    try {
      const organizations = await this.getOrganizations();
      return {
        ok: true,
        organizationsCount: organizations.length,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Лёгкая проверка доступности: убеждается, что токен можно получить.
   * Возвращает true/false, не пробрасывая исключения.
   */
  async ping(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Возвращает список организаций, доступных текущему API-логину.
   * Это типичный первый вызов после авторизации — даёт organizationId
   * для последующих запросов.
   */
  async getOrganizations(
    options: OrganizationsRequest = {},
  ): Promise<Organization[]> {
    const body: OrganizationsRequest = {
      organizationIds: options.organizationIds ?? null,
      returnAdditionalInfo: options.returnAdditionalInfo ?? true,
      includeDisabled: options.includeDisabled ?? false,
    };

    const data = await this.authorizedRequest<OrganizationsResponse>(
      "/api/1/organizations",
      body,
    );
    return data.organizations ?? [];
  }

  /**
   * Строит OLAP-отчёт (reports/olap) — основной источник данных о продажах.
   *
   * Поля группировки/агрегации и фильтры формирует вызывающий код
   * (см. модуль `iiko/sales`), здесь — только транспорт и распаковка `data`.
   * OLAP-отчёты бывают тяжёлыми: для них имеет смысл создавать клиент
   * с увеличенным `timeoutMs`.
   */
  async buildOlapReport(request: OlapReportRequest): Promise<OlapReportRow[]> {
    if (!request.organizationId) {
      throw new IikoApiError("Для OLAP-отчёта не задан organizationId", {
        status: 400,
        retryable: false,
      });
    }

    const body: OlapReportRequest = {
      organizationId: request.organizationId,
      reportType: request.reportType,
      buildSummary: request.buildSummary ?? false,
      groupByRowFields: request.groupByRowFields,
      groupByColFields: request.groupByColFields ?? [],
      aggregateFields: request.aggregateFields,
      filters: request.filters,
    };

    const data = await this.authorizedRequest<OlapReportResponse>(
      "/api/1/reports/olap",
      body,
    );
    return data.data ?? [];
  }

  /**
   * Возвращает справочник полей OLAP-отчёта (reports/olap/columns).
   *
   * Это служебный вызов для сверки технических имён полей с реальной
   * схемой конкретного ресторана: состав полей зависит от версии iiko
   * и настроек аккаунта. Удобно для отладки до и после изменения `fields.ts`.
   */
  async getOlapColumns(
    reportType: OlapReportType = "SALES",
  ): Promise<Record<string, OlapColumnInfo>> {
    const body: OlapColumnsRequest = { reportType };
    const data = await this.authorizedRequest<OlapColumnsResponse>(
      "/api/1/reports/olap/columns",
      body,
    );
    return data.columns ?? {};
  }

  /** Сбрасывает закэшированный токен (например, после ротации clientSecret). */
  clearToken(): void {
    this.cachedToken = null;
  }

  // --------------------------------------------------------------------------
  // Внутренняя логика
  // --------------------------------------------------------------------------

  /** Запрашивает новый токен доступа у iiko. */
  private async requestAccessToken(): Promise<string> {
    // SaaS-модель: токен запрашивается платформенной парой appId/clientSecret
    // (из ENV) вместе с учётными данными клиента apiLogin/apiKey (из подключения
    // пользователя). Это единственное место формирования тела запроса токена —
    // если контракт iiko по полям изменится, правка локализована здесь.
    const data = await this.rawRequest<AccessTokenResponse>("/api/v2/access_token", {
      appId: this.appId,
      clientSecret: this.clientSecret,
      ...(this.apiLogin ? { apiLogin: this.apiLogin } : {}),
      ...(this.apiKey ? { apiKey: this.apiKey } : {}),
    });

    if (!data.token) {
      throw new IikoAuthError("iiko вернул пустой токен доступа", {
        correlationId: data.correlationId,
      });
    }
    return data.token;
  }

  /**
   * Выполняет авторизованный запрос. При 401 один раз принудительно
   * обновляет токен и повторяет вызов.
   */
  private async authorizedRequest<T>(path: string, body: unknown): Promise<T> {
    const token = await this.getAccessToken();
    try {
      return await this.rawRequest<T>(path, body, token);
    } catch (error) {
      if (error instanceof IikoAuthError) {
        // Токен мог протухнуть на стороне iiko раньше срока — обновляем.
        const freshToken = await this.getAccessToken(true);
        return this.rawRequest<T>(path, body, freshToken);
      }
      throw error;
    }
  }

  /**
   * Низкоуровневый POST-запрос с таймаутом и повторами при временных сбоях.
   * `token` опционален: запрос за самим токеном выполняется без него.
   */
  private async rawRequest<T>(path: string, body: unknown, token?: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(url, body, token);
      } catch (error) {
        lastError = error;

        const isRetryable =
          error instanceof IikoNetworkError ||
          error instanceof IikoTimeoutError ||
          (error instanceof IikoApiError && error.retryable);

        if (!isRetryable || attempt === this.maxRetries) {
          throw error;
        }
        // Экспоненциальная задержка: 300ms, 600ms, 1200ms, ...
        await delay(300 * 2 ** attempt);
      }
    }

    throw lastError;
  }

  /** Единичный сетевой запрос с обработкой ответа и ошибок. */
  private async executeRequest<T>(url: string, body: unknown, token?: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    // [iiko][debug] Временное подробное логирование запроса.
    console.info("[iiko] → POST", url, {
      hasToken: Boolean(token),
      body,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      // [iiko][debug] Полный текст сетевой/таймаут-ошибки до оборачивания.
      console.error("[iiko] ✗ fetch failed", url, {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error ? error.cause : undefined,
        error,
      });
      if (error instanceof Error && error.name === "AbortError") {
        throw new IikoTimeoutError(
          `Превышен таймаут запроса к iiko (${this.timeoutMs} мс): ${url}`,
          { cause: error },
        );
      }
      throw new IikoNetworkError(
        `Сетевая ошибка при запросе к iiko: ${url} (${
          error instanceof Error ? error.message : String(error)
        })`,
        {
          cause: error,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    return this.parseResponse<T>(response, url);
  }

  /** Разбирает ответ: успех -> JSON, ошибка -> типизированное исключение. */
  private async parseResponse<T>(response: Response, url: string): Promise<T> {
    const rawText = await response.text();

    // [iiko][debug] Логируем URL, HTTP-статус и сырое тело ответа iiko целиком.
    console.info("[iiko] ← response", url, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      body: rawText,
    });

    if (response.ok) {
      return (rawText ? JSON.parse(rawText) : {}) as T;
    }

    const errorBody = safeParseError(rawText);
    const description =
      errorBody.errorDescription ||
      errorBody.error ||
      `${response.status} ${response.statusText}`;
    const correlationId = errorBody.correlationId;

    if (response.status === 401) {
      throw new IikoAuthError(`Ошибка авторизации iiko: ${description}`, {
        correlationId,
      });
    }

    const retryable = response.status === 429 || response.status >= 500;
    throw new IikoApiError(`iiko API вернул ошибку: ${description}`, {
      status: response.status,
      retryable,
      correlationId,
    });
  }
}

/** Парсит тело ошибки, не падая на невалидном JSON. */
function safeParseError(rawText: string): IikoErrorResponse {
  if (!rawText) return {};
  try {
    return JSON.parse(rawText) as IikoErrorResponse;
  } catch {
    return { errorDescription: rawText };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Лениво создаваемый экземпляр клиента на основе переменных окружения. */
let defaultClient: IikoClient | null = null;

/**
 * Возвращает singleton-клиент iiko, сконфигурированный из окружения.
 * Удобно для серверных маршрутов: токен кэшируется между вызовами.
 */
export function getIikoClient(): IikoClient {
  if (!defaultClient) {
    defaultClient = new IikoClient();
  }
  return defaultClient;
}
