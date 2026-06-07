/**
 * Типы данных iiko Cloud API (iikoTransport).
 * Базовый домен: https://api-ru.iiko.services
 *
 * Здесь описаны только контракты, необходимые для подключения:
 * получение токена, проверка связи и список организаций.
 */

/**
 * Тело запроса получения токена доступа (iiko Cloud API v2).
 *
 * SaaS-модель Marketing Chef AI:
 *   - appId + clientSecret — платформенное приложение (из ENV, общее для всех
 *     клиентов, пользователь их не видит и не вводит);
 *   - apiLogin + apiKey — учётные данные конкретного клиента (ресторана),
 *     которые задаются в UI и хранятся в `iiko_connections`.
 */
export interface AccessTokenRequest {
  /** Идентификатор платформенного приложения (appId) из ENV. */
  appId: string;
  /** Секрет платформенного приложения (clientSecret) из ENV. */
  clientSecret: string;
  /** API Login клиента (имя интеграции). */
  apiLogin?: string;
  /** API Key клиента (секрет). */
  apiKey?: string;
}

/** Ответ на запрос токена доступа. */
export interface AccessTokenResponse {
  /** Токен доступа (Bearer). Срок жизни — около 60 минут. */
  token: string;
  /** Идентификатор запроса для трассировки на стороне iiko. */
  correlationId?: string;
}

/** Тело запроса списка организаций. */
export interface OrganizationsRequest {
  /** Фильтр по ID организаций. `null` — вернуть все доступные. */
  organizationIds?: string[] | null;
  /** Возвращать расширенную информацию об организациях. */
  returnAdditionalInfo?: boolean;
  /** Включать отключённые организации. */
  includeDisabled?: boolean;
}

/** Краткое представление организации. */
export interface Organization {
  /** Уникальный идентификатор организации (UUID). */
  id: string;
  /** Название организации. */
  name: string;
  /** Код страны/название, если запрошена доп. информация. */
  country?: string | null;
  /** Часовой пояс ресторана. */
  restaurantAddress?: string | null;
  /** Признак, что организация отключена. */
  isDeleted?: boolean | null;
  /**
   * iiko возвращает множество необязательных полей в зависимости от
   * `returnAdditionalInfo`. Сохраняем их без потери данных.
   */
  [key: string]: unknown;
}

/** Ответ со списком организаций. */
export interface OrganizationsResponse {
  /** Список доступных организаций. */
  organizations: Organization[];
  /** Идентификатор запроса для трассировки. */
  correlationId?: string;
}

// ============================================================================
// OLAP-отчёты (reports/olap) — источник данных о продажах
// ============================================================================

/** Тип OLAP-отчёта iiko. */
export type OlapReportType = "SALES" | "TRANSACTIONS" | "DELIVERIES";

/**
 * Фильтр по диапазону дат для OLAP.
 * Ключ в `filters` — техническое имя поля (например, `OpenDate.Typed`),
 * границы задаются в формате `yyyy-MM-dd`.
 */
export interface OlapDateRangeFilter {
  filterType: "DateRange";
  /** Нижняя граница периода, формат `yyyy-MM-dd`. */
  from: string;
  /** Верхняя граница периода, формат `yyyy-MM-dd`. */
  to: string;
  /** Включать нижнюю границу (по умолчанию true). */
  includeLow?: boolean;
  /** Включать верхнюю границу (по умолчанию true). */
  includeHigh?: boolean;
}

/** Любой поддерживаемый фильтр OLAP (пока используется только DateRange). */
export type OlapFilter = OlapDateRangeFilter;

/** Тело запроса построения OLAP-отчёта. */
export interface OlapReportRequest {
  /**
   * Организация, по которой строится отчёт (UUID).
   * Обязательное поле iiko Cloud API: без него `/reports/olap` вернёт ошибку.
   */
  organizationId: string;
  reportType: OlapReportType;
  /** Добавлять ли итоговую строку (summary). По умолчанию не нужна. */
  buildSummary?: boolean;
  /** Поля группировки по строкам (измерения отчёта). */
  groupByRowFields: string[];
  /** Поля группировки по столбцам (обычно пусто). */
  groupByColFields?: string[];
  /** Агрегируемые поля (метрики: суммы, количества). */
  aggregateFields: string[];
  /** Фильтры по техническим именам полей. */
  filters: Record<string, OlapFilter>;
}

// ============================================================================
// OLAP-поля (reports/olap/columns) — справочник доступных полей отчёта
// ============================================================================

/** Тело запроса справочника полей OLAP-отчёта. */
export interface OlapColumnsRequest {
  /** Тип отчёта, для которого нужен список полей. */
  reportType: OlapReportType;
}

/**
 * Описание одного поля OLAP-отчёта.
 * iiko возвращает набор флагов, по которым видно, можно ли поле
 * группировать / агрегировать / фильтровать.
 */
export interface OlapColumnInfo {
  /** Человекочитаемое название поля. */
  name?: string;
  /** Тип значения поля (например, STRING, NUMBER, DATETIME, ...). */
  type?: string;
  /** Поле можно использовать как агрегат (метрику). */
  aggregationAllowed?: boolean;
  /** Поле можно использовать для группировки (измерение). */
  groupingAllowed?: boolean;
  /** Поле можно использовать в фильтрах. */
  filteringAllowed?: boolean;
  /** Прочие необязательные атрибуты — сохраняем без потерь. */
  [key: string]: unknown;
}

/** Ответ справочника полей OLAP: словарь «техническое имя -> описание». */
export interface OlapColumnsResponse {
  /** Доступные поля отчёта, ключ — техническое имя поля. */
  columns: Record<string, OlapColumnInfo>;
  /** Идентификатор запроса для трассировки. */
  correlationId?: string;
}

/**
 * Одна строка OLAP-отчёта: ключи — запрошенные поля,
 * значения — строки/числа/null в зависимости от типа поля.
 */
export type OlapReportRow = Record<string, string | number | boolean | null>;

/** Ответ построения OLAP-отчёта. */
export interface OlapReportResponse {
  /** Строки отчёта. */
  data: OlapReportRow[];
  /** Идентификатор запроса для трассировки. */
  correlationId?: string;
}

/** Стандартный формат ошибки iiko Cloud API. */
export interface IikoErrorResponse {
  /** Человекочитаемое описание ошибки. */
  errorDescription?: string;
  /** Код/тип ошибки. */
  error?: string;
  /** Идентификатор запроса для трассировки. */
  correlationId?: string;
}

/** Результат проверки подключения. */
export interface IikoConnectionStatus {
  /** Удалось ли установить связь и авторизоваться. */
  ok: boolean;
  /** Количество доступных организаций (если проверка успешна). */
  organizationsCount?: number;
  /** Длительность проверки в миллисекундах. */
  latencyMs: number;
  /** Сообщение об ошибке, если проверка не удалась. */
  error?: string;
}

/** Конфигурация клиента iiko. */
export interface IikoClientConfig {
  /**
   * Идентификатор платформенного приложения (appId).
   * По умолчанию берётся из ENV `IIKO_APP_ID`. Переопределять имеет смысл
   * только в тестах — пользователь это значение не задаёт.
   */
  appId?: string;
  /**
   * Секрет платформенного приложения (clientSecret).
   * По умолчанию берётся из ENV `IIKO_CLIENT_SECRET`. Пользователь это значение
   * не задаёт.
   */
  clientSecret?: string;
  /** API Login клиента (имя интеграции). Задаётся пользователем в UI. */
  apiLogin?: string;
  /** API Key клиента (секрет). Задаётся пользователем в UI. */
  apiKey?: string;
  /** Базовый URL API. По умолчанию `https://api-ru.iiko.services`. */
  baseUrl?: string;
  /** Таймаут одного запроса в миллисекундах (по умолчанию 15000). */
  timeoutMs?: number;
  /** Количество повторов при временных ошибках (по умолчанию 2). */
  maxRetries?: number;
}
