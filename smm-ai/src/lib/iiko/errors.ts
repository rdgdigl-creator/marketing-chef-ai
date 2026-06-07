/**
 * Иерархия ошибок клиента iiko Cloud API.
 * Позволяет различать причины сбоя (сеть, таймаут, авторизация, ответ API)
 * и принимать решение о повторе запроса на стороне вызывающего кода.
 */

/** Базовая ошибка клиента iiko. */
export class IikoError extends Error {
  /** correlationId из ответа iiko (если есть) — для обращения в поддержку. */
  readonly correlationId?: string;

  constructor(message: string, options?: { correlationId?: string; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = new.target.name;
    this.correlationId = options?.correlationId;
  }
}

/**
 * Ошибка авторизации: неверные appId/clientSecret или истёкший токен.
 * Соответствует HTTP 401.
 */
export class IikoAuthError extends IikoError {}

/**
 * Ошибка, возвращённая API с детальным описанием (errorDescription).
 * Несёт HTTP-статус и тело ошибки.
 */
export class IikoApiError extends IikoError {
  /** HTTP-статус ответа. */
  readonly status: number;
  /** Признак потенциально повторяемой ошибки (429 / 5xx). */
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { status: number; retryable: boolean; correlationId?: string },
  ) {
    super(message, { correlationId: options.correlationId });
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

/** Превышен таймаут запроса. */
export class IikoTimeoutError extends IikoError {}

/** Сетевая ошибка (DNS, разрыв соединения, недоступность хоста). */
export class IikoNetworkError extends IikoError {}
