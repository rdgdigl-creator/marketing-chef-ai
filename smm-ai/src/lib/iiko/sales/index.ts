/**
 * Публичная точка входа модуля синхронизации продаж iiko.
 * Импорт: `import { SalesSyncService } from "@/lib/iiko/sales";`
 */

export { SalesSyncService } from "./sync-service";
export type {
  RunSalesSyncParams,
  SalesSyncResult,
} from "./sync-service";
export {
  DEFAULT_SYNC_DAYS,
  resolveSyncPeriod,
  formatDate,
  isValidDateString,
} from "./period";
export type { SyncPeriod } from "./period";
export type {
  SalesSyncContext,
  SalesDailyRow,
  SalesProductRow,
  SalesHourlyRow,
} from "./mappers";
