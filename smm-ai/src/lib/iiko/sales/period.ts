/**
 * Работа с периодом синхронизации продаж.
 * Формат дат для iiko OLAP и таблиц `sales_*` — `yyyy-MM-dd`.
 */

/** Период синхронизации (включительно с обеих сторон). */
export interface SyncPeriod {
  from: string;
  to: string;
}

/** Период ручной синхронизации по умолчанию — последние 30 дней. */
export const DEFAULT_SYNC_DAYS = 30;

/** Форматирует дату в `yyyy-MM-dd` (UTC, без времени). */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Проверяет строку формата `yyyy-MM-dd`. */
export function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Возвращает период синхронизации.
 * Если `from`/`to` не заданы или невалидны — берёт последние
 * `DEFAULT_SYNC_DAYS` дней по сегодняшнюю дату включительно.
 * Гарантирует from <= to.
 */
export function resolveSyncPeriod(input?: {
  from?: string | null;
  to?: string | null;
}): SyncPeriod {
  const to = isValidDateString(input?.to) ? input!.to! : formatDate(new Date());

  let from: string;
  if (isValidDateString(input?.from)) {
    from = input!.from!;
  } else {
    const start = new Date(`${to}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - (DEFAULT_SYNC_DAYS - 1));
    from = formatDate(start);
  }

  return from <= to ? { from, to } : { from: to, to: from };
}
