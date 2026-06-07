/**
 * Публичная точка входа модуля iiko.
 * Импортируйте отсюда: `import { getIikoClient, IikoClient } from "@/lib/iiko";`
 */

export { IikoClient, getIikoClient } from "./client";
export {
  IikoError,
  IikoApiError,
  IikoAuthError,
  IikoTimeoutError,
  IikoNetworkError,
} from "./errors";
export {
  DEFAULT_IIKO_BASE_URL,
  getIikoAppId,
  getIikoBaseUrl,
  getIikoClientSecret,
} from "./config";
export { getIikoConnectionStatus } from "./connection-status";
export type { IikoConnectionStatus as IikoConnectionStatusSummary } from "./connection-status";
export type {
  AccessTokenRequest,
  AccessTokenResponse,
  IikoClientConfig,
  IikoConnectionStatus,
  IikoErrorResponse,
  OlapColumnInfo,
  OlapColumnsRequest,
  OlapColumnsResponse,
  OlapDateRangeFilter,
  OlapFilter,
  OlapReportRequest,
  OlapReportResponse,
  OlapReportRow,
  OlapReportType,
  Organization,
  OrganizationsRequest,
  OrganizationsResponse,
} from "./types";
