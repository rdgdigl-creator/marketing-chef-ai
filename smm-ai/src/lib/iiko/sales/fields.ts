/**
 * Технические имена полей OLAP-отчёта iiko (reportType: SALES).
 *
 * Состав и имена полей зависят от версии iiko и настроек аккаунта,
 * поэтому они собраны здесь в одном месте: при расхождении со схемой
 * конкретного ресторана правки нужны только тут (имена можно сверить
 * через POST /api/1/reports/olap/columns).
 *
 * Соглашения iiko:
 *   - поля группировки (измерения) — OpenDate.Typed, HourOpen, DishId, ...
 *   - агрегаты (метрики) — DishSumInt, DishDiscountSumInt, GuestNum, ...
 */

/** Поля группировки (dimensions). */
export const OLAP_GROUP = {
  /** Учётный день (бизнес-дата), формат значения `yyyy-MM-dd`. */
  businessDate: "OpenDate.Typed",
  /** Час открытия заказа (0–23). */
  hour: "HourOpen",
  /** Идентификатор номенклатуры (блюда). */
  dishId: "DishId",
  /** Название блюда. */
  dishName: "DishName",
  /** Категория/группа блюда. */
  dishCategory: "DishCategory",
} as const;

/** Агрегируемые поля (metrics). */
export const OLAP_AGGREGATE = {
  /** Выручка без учёта скидок. */
  grossSum: "DishSumInt",
  /** Выручка с учётом скидок (чистая). */
  netSum: "DishDiscountSumInt",
  /** Количество гостей. */
  guests: "GuestNum",
  /** Количество уникальных чеков (заказов). */
  ordersCount: "UniqOrderId.OrdersCount",
  /** Количество проданных порций. */
  dishAmount: "DishAmountInt",
  /** Себестоимость проданного. */
  cost: "ProductCostBase.ProductCost",
} as const;

/** Имя поля-фильтра по бизнес-дате (тот же ключ, что и группировка по дню). */
export const OLAP_DATE_FILTER_FIELD = OLAP_GROUP.businessDate;
