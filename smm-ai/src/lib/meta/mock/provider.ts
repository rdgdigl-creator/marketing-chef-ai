import type { MediaBuyerRuleContext } from "@/lib/media-buyer/types";
import { canUseMetaOAuth } from "../data-source";
import type { MetaAdAccountRow, MetaConnectionStatus } from "../types";
import { DEMO_AD_ACCOUNT, DEMO_AD_ACCOUNTS, DEMO_META_USER } from "./fixtures";
import type { MetaMockSession } from "./session";

export function getMockConnectionStatus(
  session: MetaMockSession,
): MetaConnectionStatus {
  const account = DEMO_AD_ACCOUNTS.find(
    (a) => a.meta_account_id === session.selectedAccountId,
  );

  return {
    connected: session.connected,
    configured: false,
    metaUserName: session.connected ? DEMO_META_USER.name : null,
    syncStatus: session.connected
      ? session.synced
        ? "connected"
        : "pending"
      : null,
    lastSyncAt: session.lastSyncAt,
    errorMessage: null,
    selectedAdAccountId: session.selectedAccountId,
    selectedAdAccountName: account?.name ?? (session.connected ? DEMO_AD_ACCOUNT.name : null),
    adAccountsCount: session.connected ? DEMO_AD_ACCOUNTS.length : 0,
    dataSource: "mock",
    oauthAvailable: canUseMetaOAuth(),
  };
}

export function getMockAdAccounts(session: MetaMockSession): MetaAdAccountRow[] {
  if (!session.connected) return [];
  return DEMO_AD_ACCOUNTS.map((a) => ({
    ...a,
    is_selected: a.meta_account_id === session.selectedAccountId,
  }));
}

/** Демо-кабинет ресторана с типичными ошибками таргетолога. */
export function buildMockMediaBuyerContext(
  session: MetaMockSession,
): MediaBuyerRuleContext {
  const account = DEMO_AD_ACCOUNT;

  if (!session.connected || !session.synced) {
    return {
      hasMeta: session.connected,
      hasAccount: Boolean(session.selectedAccountId),
      hasData: false,
      adAccountId: session.selectedAccountId,
      adAccountName: account.name,
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
  }

  const account7d = {
    impressions: 84200,
    clicks: 420,
    spend: 12400,
    ctr: 0.5,
    cpm: 147,
    cpc: 29.5,
    frequency: 2.8,
    conversions: 18,
    costPerResult: 689,
  };

  const account30d = {
    impressions: 310000,
    clicks: 2100,
    spend: 48200,
    ctr: 0.68,
    cpm: 155,
    cpc: 23,
    frequency: 2.4,
    conversions: 94,
    costPerResult: 513,
  };

  const campaigns = [
    {
      id: "camp_demo_traffic",
      name: "Трафик — Доставка",
      status: "ACTIVE",
      objective: "OUTCOME_TRAFFIC",
      insights7d: { ...account7d, spend: 8200, conversions: 0, ctr: 0.42 },
      insights30d: { ...account30d, spend: 28000, conversions: 12 },
    },
    {
      id: "camp_demo_reels",
      name: "Reels — Новое меню",
      status: "ACTIVE",
      objective: "OUTCOME_ENGAGEMENT",
      insights7d: { impressions: 35000, clicks: 280, spend: 3200, ctr: 0.8, cpm: 91, cpc: 11.4, frequency: 2.1, conversions: 14, costPerResult: 229 },
      insights30d: null,
    },
    {
      id: "camp_demo_brand",
      name: "Узнаваемость бренда",
      status: "PAUSED",
      objective: "OUTCOME_AWARENESS",
      insights7d: null,
      insights30d: null,
    },
  ];

  const adSets = [
    {
      id: "adset_demo_broad_1",
      name: "Широкая — 18-55 Москва",
      campaignId: "camp_demo_traffic",
      status: "ACTIVE",
      isRetargeting: false,
      targetingSummary: { geo_locations: { cities: ["Moscow"] }, age_min: 18, age_max: 55 },
      insights7d: { impressions: 28000, clicks: 95, spend: 2800, ctr: 0.34, cpm: 100, cpc: 29.5, frequency: 2.5, conversions: 0, costPerResult: null },
    },
    {
      id: "adset_demo_broad_2",
      name: "Интересы — Еда и рестораны",
      campaignId: "camp_demo_traffic",
      status: "ACTIVE",
      isRetargeting: false,
      targetingSummary: { geo_locations: { cities: ["Moscow"] }, age_min: 22, age_max: 50 },
      insights7d: { impressions: 22000, clicks: 88, spend: 2600, ctr: 0.4, cpm: 118, cpc: 29.5, frequency: 2.3, conversions: 0, costPerResult: null },
    },
    {
      id: "adset_demo_broad_3",
      name: "Lookalike 3% — Покупатели",
      campaignId: "camp_demo_traffic",
      status: "ACTIVE",
      isRetargeting: false,
      targetingSummary: { geo_locations: { cities: ["Moscow"] }, age_min: 18, age_max: 65 },
      insights7d: { impressions: 18000, clicks: 72, spend: 2200, ctr: 0.4, cpm: 122, cpc: 30.5, frequency: 2.8, conversions: 0, costPerResult: null },
    },
    {
      id: "adset_demo_winner",
      name: "Engagers IG 30д",
      campaignId: "camp_demo_reels",
      status: "ACTIVE",
      isRetargeting: false,
      targetingSummary: { geo_locations: { cities: ["Moscow"] } },
      insights7d: { impressions: 35000, clicks: 280, spend: 3200, ctr: 1.8, cpm: 91, cpc: 11.4, frequency: 2.1, conversions: 14, costPerResult: 229 },
    },
  ];

  const ads = [
    {
      id: "ad_demo_fatigue",
      name: "Видео — Пицца 30см",
      adSetId: "adset_demo_broad_1",
      status: "ACTIVE",
      insights7d: { impressions: 15000, clicks: 42, spend: 1500, ctr: 0.28, cpm: 100, cpc: 35.7, frequency: 4.2, conversions: 0, costPerResult: null },
      insights30d: { impressions: 42000, clicks: 336, spend: 4200, ctr: 0.8, cpm: 100, cpc: 12.5, frequency: 3.1, conversions: 8, costPerResult: 525 },
    },
    {
      id: "ad_demo_reels",
      name: "Reels — Шеф готовит пасту",
      adSetId: "adset_demo_winner",
      status: "ACTIVE",
      insights7d: { impressions: 35000, clicks: 280, spend: 3200, ctr: 1.8, cpm: 91, cpc: 11.4, frequency: 2.1, conversions: 14, costPerResult: 229 },
      insights30d: null,
    },
  ];

  return {
    hasMeta: true,
    hasAccount: true,
    hasData: true,
    adAccountId: account.id,
    adAccountName: account.name,
    currency: "RUB",
    account7d,
    account30d,
    activeCampaigns: 2,
    activeAdSets: 4,
    hasRetargeting: false,
    retargetingAdSets: 0,
    campaigns,
    adSets,
    ads,
  };
}

export type MockSyncResult = {
  status: "success";
  recordsSynced: number;
  period: { campaigns: number; adSets: number; ads: number; insights: number };
  demo: true;
};

export function getMockSyncResult(): MockSyncResult {
  return {
    status: "success",
    recordsSynced: 47,
    period: { campaigns: 3, adSets: 4, ads: 2, insights: 38 },
    demo: true,
  };
}
