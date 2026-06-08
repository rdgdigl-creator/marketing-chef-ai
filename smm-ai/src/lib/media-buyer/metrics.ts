import { getAuthUser } from "@/lib/auth";
import { getMetaConnectionStatus } from "@/lib/meta";
import { isMetaMockMode } from "@/lib/meta/data-source";
import {
  buildMockMediaBuyerContext,
  getMetaMockSession,
} from "@/lib/meta/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AccountInsights,
  AdContext,
  AdSetContext,
  CampaignContext,
  MediaBuyerRuleContext,
} from "./types";

type InsightRow = {
  entity_type: string;
  entity_id: string;
  period: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  frequency: number | null;
  conversions: number;
  cost_per_result: number | null;
};

function toInsights(row: InsightRow | undefined): AccountInsights | null {
  if (!row) return null;
  return {
    impressions: row.impressions,
    clicks: row.clicks,
    spend: Number(row.spend),
    ctr: row.ctr !== null ? Number(row.ctr) : null,
    cpm: row.cpm !== null ? Number(row.cpm) : null,
    cpc: row.cpc !== null ? Number(row.cpc) : null,
    frequency: row.frequency !== null ? Number(row.frequency) : null,
    conversions: Number(row.conversions),
    costPerResult: row.cost_per_result !== null ? Number(row.cost_per_result) : null,
  };
}

function insightMap(rows: InsightRow[]): Map<string, { last_7d?: InsightRow; last_30d?: InsightRow }> {
  const map = new Map<string, { last_7d?: InsightRow; last_30d?: InsightRow }>();
  for (const row of rows) {
    const key = `${row.entity_type}:${row.entity_id}`;
    const entry = map.get(key) ?? {};
    if (row.period === "last_7d") entry.last_7d = row;
    if (row.period === "last_30d") entry.last_30d = row;
    map.set(key, entry);
  }
  return map;
}

export type MediaBuyerLoadDebug = {
  selectedAdAccountId: string | null;
  campaignsCount: number;
  adSetsCount: number;
  adsCount: number;
  insightsCount: number;
  accountInsightsLast7d: boolean;
};

export async function loadMediaBuyerContext(): Promise<{
  context: MediaBuyerRuleContext;
  lastSyncAt: string | null;
  restaurantName: string | null;
  debug: MediaBuyerLoadDebug;
}> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Не авторизован");
  }

  const metaStatus = await getMetaConnectionStatus(user.id);
  const supabase = await createSupabaseServerClient();

  const emptyContext: MediaBuyerRuleContext = {
    hasMeta: metaStatus.connected,
    hasAccount: Boolean(metaStatus.selectedAdAccountId),
    hasData: false,
    adAccountId: metaStatus.selectedAdAccountId,
    adAccountName: metaStatus.selectedAdAccountName,
    currency: "RUB",
    account7d: null,
    account30d: null,
    activeCampaigns: 0,
    activeAdSets: 0,
    hasRetargeting: false,
    retargetingAdSets: 0,
    campaigns: [],
    adSets: [],
    ads: [],
  };

  const emptyDebug: MediaBuyerLoadDebug = {
    selectedAdAccountId: metaStatus.selectedAdAccountId,
    campaignsCount: 0,
    adSetsCount: 0,
    adsCount: 0,
    insightsCount: 0,
    accountInsightsLast7d: false,
  };

  if (!metaStatus.connected || !metaStatus.selectedAdAccountId) {
    return { context: emptyContext, lastSyncAt: null, restaurantName: null, debug: emptyDebug };
  }

  if (isMetaMockMode() && metaStatus.dataSource === "mock") {
    const session = await getMetaMockSession();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("restaurant_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const mockCtx = buildMockMediaBuyerContext(session);
    return {
      context: mockCtx,
      lastSyncAt: session.lastSyncAt,
      restaurantName:
        (profile as { restaurant_name?: string | null } | null)?.restaurant_name ?? null,
      debug: {
        selectedAdAccountId: metaStatus.selectedAdAccountId,
        campaignsCount: mockCtx.campaigns.length,
        adSetsCount: mockCtx.adSets.length,
        adsCount: mockCtx.ads.length,
        insightsCount: mockCtx.hasData ? 1 : 0,
        accountInsightsLast7d: mockCtx.hasData,
      },
    };
  }

  const { data: connection } = await supabase
    .from("meta_connections")
    .select("id, last_sync_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection) {
    return { context: emptyContext, lastSyncAt: null, restaurantName: null, debug: emptyDebug };
  }

  const adAccountId = metaStatus.selectedAdAccountId;

  const [insightsRes, campaignsRes, adSetsRes, adsRes, accountRes, profileRes] =
    await Promise.all([
      supabase
        .from("meta_insights_snapshots")
        .select(
          "entity_type, entity_id, period, impressions, clicks, spend, ctr, cpm, cpc, frequency, conversions, cost_per_result",
        )
        .eq("connection_id", connection.id)
        .eq("ad_account_id", adAccountId),
      supabase
        .from("meta_campaigns")
        .select("meta_campaign_id, name, status, objective")
        .eq("connection_id", connection.id)
        .eq("ad_account_id", adAccountId),
      supabase
        .from("meta_ad_sets")
        .select(
          "meta_ad_set_id, meta_campaign_id, name, status, is_retargeting, targeting_summary",
        )
        .eq("connection_id", connection.id)
        .eq("ad_account_id", adAccountId),
      supabase
        .from("meta_ads")
        .select("meta_ad_id, meta_ad_set_id, name, status")
        .eq("connection_id", connection.id)
        .eq("ad_account_id", adAccountId),
      supabase
        .from("meta_ad_accounts")
        .select("currency")
        .eq("connection_id", connection.id)
        .eq("meta_account_id", adAccountId)
        .maybeSingle(),
      supabase
        .from("user_profiles")
        .select("restaurant_name")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const insightRows = (insightsRes.data as InsightRow[] | null) ?? [];
  const accountInsightsLast7d = insightRows.some(
    (r) => r.entity_type === "account" && r.period === "last_7d",
  );
  const hasData = accountInsightsLast7d;
  const map = insightMap(insightRows);

  const accountInsights = map.get(`account:${adAccountId}`);
  const account7d = toInsights(accountInsights?.last_7d);
  const account30d = toInsights(accountInsights?.last_30d);

  const campaignRows = (campaignsRes.data ?? []) as Array<{
    meta_campaign_id: string;
    name: string;
    status: string;
    objective: string | null;
  }>;

  const campaigns: CampaignContext[] = campaignRows.map((c) => {
    const ins = map.get(`campaign:${c.meta_campaign_id}`);
    return {
      id: c.meta_campaign_id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      insights7d: toInsights(ins?.last_7d),
      insights30d: toInsights(ins?.last_30d),
    };
  });

  const adSetRows = (adSetsRes.data ?? []) as Array<{
    meta_ad_set_id: string;
    meta_campaign_id: string;
    name: string;
    status: string;
    is_retargeting: boolean;
    targeting_summary: Record<string, unknown>;
  }>;

  const adSets: AdSetContext[] = adSetRows.map((s) => {
    const ins = map.get(`adset:${s.meta_ad_set_id}`);
    return {
      id: s.meta_ad_set_id,
      name: s.name,
      campaignId: s.meta_campaign_id,
      status: s.status,
      isRetargeting: s.is_retargeting,
      targetingSummary: s.targeting_summary ?? {},
      insights7d: toInsights(ins?.last_7d),
    };
  });

  const adRows = (adsRes.data ?? []) as Array<{
    meta_ad_id: string;
    meta_ad_set_id: string;
    name: string;
    status: string;
  }>;

  const ads: AdContext[] = adRows.map((a) => {
    const ins = map.get(`ad:${a.meta_ad_id}`);
    return {
      id: a.meta_ad_id,
      name: a.name,
      adSetId: a.meta_ad_set_id,
      status: a.status,
      insights7d: toInsights(ins?.last_7d),
      insights30d: toInsights(ins?.last_30d),
    };
  });

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const activeAdSets = adSets.filter((s) => s.status === "ACTIVE").length;
  const retargetingAdSets = adSets.filter((s) => s.isRetargeting && s.status === "ACTIVE");

  const context: MediaBuyerRuleContext = {
    hasMeta: true,
    hasAccount: true,
    hasData,
    adAccountId,
    adAccountName: metaStatus.selectedAdAccountName,
    currency: (accountRes.data as { currency?: string } | null)?.currency ?? "RUB",
    account7d,
    account30d,
    activeCampaigns,
    activeAdSets,
    hasRetargeting: retargetingAdSets.length > 0,
    retargetingAdSets: retargetingAdSets.length,
    campaigns,
    adSets,
    ads,
  };

  return {
    context,
    lastSyncAt: (connection as { last_sync_at?: string | null }).last_sync_at ?? null,
    restaurantName:
      (profileRes.data as { restaurant_name?: string | null } | null)?.restaurant_name ?? null,
    debug: {
      selectedAdAccountId: adAccountId,
      campaignsCount: campaignRows.length,
      adSetsCount: adSetRows.length,
      adsCount: adRows.length,
      insightsCount: insightRows.length,
      accountInsightsLast7d,
    },
  };
}
