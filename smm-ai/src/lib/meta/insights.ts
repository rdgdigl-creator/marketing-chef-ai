import type { InsightPeriod } from "@/lib/media-buyer/types";

export type MetaAction = {
  action_type?: string;
  value?: string;
};

export type RawInsightsRow = {
  impressions?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
  cpm?: string;
  cpc?: string;
  frequency?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  date_start?: string;
  date_stop?: string;
};

const CONVERSION_ACTION_TYPES = new Set([
  "purchase",
  "omni_purchase",
  "lead",
  "complete_registration",
  "offsite_conversion.fb_pixel_purchase",
  "offsite_conversion.fb_pixel_lead",
  "onsite_conversion.messaging_conversation_started_7d",
]);

export function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseConversions(actions: MetaAction[] | undefined): number {
  if (!actions?.length) return 0;
  let total = 0;
  for (const action of actions) {
    if (action.action_type && CONVERSION_ACTION_TYPES.has(action.action_type)) {
      total += parseNumber(action.value);
    }
  }
  return total;
}

export function parseCostPerResult(
  costPerAction: MetaAction[] | undefined,
  conversions: number,
): number | null {
  if (!costPerAction?.length || conversions <= 0) return null;
  for (const item of costPerAction) {
    if (item.action_type && CONVERSION_ACTION_TYPES.has(item.action_type)) {
      const cost = parseNumber(item.value);
      return cost > 0 ? cost : null;
    }
  }
  return null;
}

export function normalizeInsights(raw: RawInsightsRow) {
  const conversions = parseConversions(raw.actions);
  return {
    impressions: parseNumber(raw.impressions),
    clicks: parseNumber(raw.clicks),
    spend: parseNumber(raw.spend),
    ctr: raw.ctr ? parseNumber(raw.ctr) : null,
    cpm: raw.cpm ? parseNumber(raw.cpm) : null,
    cpc: raw.cpc ? parseNumber(raw.cpc) : null,
    frequency: raw.frequency ? parseNumber(raw.frequency) : null,
    conversions,
    costPerResult: parseCostPerResult(raw.cost_per_action_type, conversions),
    dateStart: raw.date_start ?? null,
    dateStop: raw.date_stop ?? null,
  };
}

export const INSIGHT_FIELDS =
  "impressions,clicks,spend,ctr,cpm,cpc,frequency,actions,cost_per_action_type,date_start,date_stop";

export const INSIGHT_PERIODS: InsightPeriod[] = ["last_7d", "last_30d"];

export function isRetargetingTargeting(targeting: Record<string, unknown> | null): boolean {
  if (!targeting) return false;

  const customAudiences = targeting.custom_audiences;
  if (Array.isArray(customAudiences) && customAudiences.length > 0) return true;

  const excluded = targeting.excluded_custom_audiences;
  if (Array.isArray(excluded) && excluded.length > 0) return true;

  const flexible = targeting.flexible_spec;
  if (Array.isArray(flexible)) {
    for (const spec of flexible) {
      if (spec && typeof spec === "object") {
        const interests = (spec as Record<string, unknown>).interests;
        if (Array.isArray(interests) && interests.length > 0) {
          // narrow only — not retargeting
        }
      }
    }
  }

  // Lookalike audiences often in custom_audiences with subtype
  return false;
}

/** Эвристика: широкий таргетинг без custom audiences. */
export function isBroadTargeting(targeting: Record<string, unknown> | null): boolean {
  if (!targeting) return true;
  const customAudiences = targeting.custom_audiences;
  if (Array.isArray(customAudiences) && customAudiences.length > 0) return false;

  const geo = targeting.geo_locations;
  const hasGeo = geo && typeof geo === "object";
  const ageMin = targeting.age_min;
  const ageMax = targeting.age_max;
  const isWideAge =
    (typeof ageMin !== "number" || ageMin <= 18) &&
    (typeof ageMax !== "number" || ageMax >= 55);

  return Boolean(hasGeo && isWideAge);
}
