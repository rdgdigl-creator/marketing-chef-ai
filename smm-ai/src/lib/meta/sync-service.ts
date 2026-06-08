import type { InsightPeriod } from "@/lib/media-buyer/types";
import { isMetaMockMode } from "./data-source";
import {
  createSyncedMockSession,
  DEMO_AD_ACCOUNT,
  getMetaMockSession,
  getMockSyncResult,
  META_MOCK_COOKIE,
  serializeMockSession,
} from "./mock";
import { MetaGraphClient } from "./client";
import {
  INSIGHT_PERIODS,
  isRetargetingTargeting,
  normalizeInsights,
} from "./insights";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ConnectionRow = {
  id: string;
  access_token: string;
  selected_ad_account_id: string | null;
};

const SYNC_DELAY_MS = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type MetaSyncResult = {
  status: "success" | "error";
  recordsSynced: number;
  period?: { campaigns: number; adSets: number; ads: number; insights: number };
  error?: string;
};

async function upsertInsight(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    connectionId: string;
    userId: string;
    adAccountId: string;
    entityType: "account" | "campaign" | "adset" | "ad";
    entityId: string;
    period: InsightPeriod;
    raw: ReturnType<typeof normalizeInsights>;
  },
) {
  const { raw } = params;
  await supabase.from("meta_insights_snapshots").upsert(
    {
      connection_id: params.connectionId,
      user_id: params.userId,
      ad_account_id: params.adAccountId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      period: params.period,
      date_start: raw.dateStart ?? new Date().toISOString().slice(0, 10),
      date_stop: raw.dateStop ?? new Date().toISOString().slice(0, 10),
      impressions: raw.impressions,
      clicks: raw.clicks,
      spend: raw.spend,
      ctr: raw.ctr,
      cpm: raw.cpm,
      cpc: raw.cpc,
      frequency: raw.frequency,
      conversions: raw.conversions,
      cost_per_result: raw.costPerResult,
      raw: raw as unknown as Record<string, unknown>,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "connection_id,entity_type,entity_id,period" },
  );
}

export type MetaSyncResponse = MetaSyncResult & { demo?: boolean; cookie?: string };

export async function syncMetaAdAccount(userId: string): Promise<MetaSyncResponse> {
  if (isMetaMockMode()) {
    const session = await getMetaMockSession();
    if (!session.connected) {
      return { status: "error", recordsSynced: 0, error: "Подключите демо-кабинет Meta" };
    }
    const accountId = session.selectedAccountId ?? DEMO_AD_ACCOUNT.id;
    const synced = createSyncedMockSession(accountId);
    const result = getMockSyncResult();
    return {
      ...result,
      recordsSynced: result.recordsSynced,
      demo: true,
      cookie: serializeMockSession(synced),
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: connection, error: connError } = await supabase
    .from("meta_connections")
    .select("id, access_token, selected_ad_account_id")
    .eq("user_id", userId)
    .maybeSingle();

  const row = connection as ConnectionRow | null;
  if (connError || !row) {
    return { status: "error", recordsSynced: 0, error: "Meta не подключён" };
  }

  const adAccountId = row.selected_ad_account_id;
  if (!adAccountId) {
    return { status: "error", recordsSynced: 0, error: "Выберите рекламный кабинет" };
  }

  const logStarted = await supabase
    .from("meta_sync_logs")
    .insert({
      connection_id: row.id,
      user_id: userId,
      sync_type: "full",
      status: "in_progress",
    })
    .select("id")
    .single();

  await supabase
    .from("meta_connections")
    .update({ sync_status: "syncing", error_message: null })
    .eq("id", row.id);

  let recordsSynced = 0;

  try {
    const client = new MetaGraphClient(row.access_token);
    const now = new Date().toISOString();

    const [campaigns, adSets, ads] = await Promise.all([
      client.getCampaigns(adAccountId),
      client.getAdSets(adAccountId),
      client.getAds(adAccountId),
    ]);

    if (campaigns.length > 0) {
      await supabase.from("meta_campaigns").upsert(
        campaigns.map((c) => ({
          connection_id: row.id,
          user_id: userId,
          ad_account_id: adAccountId,
          meta_campaign_id: c.id,
          name: c.name?.trim() || c.id,
          status: c.status ?? "UNKNOWN",
          objective: c.objective ?? null,
          daily_budget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
          lifetime_budget: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
          synced_at: now,
        })),
        { onConflict: "connection_id,meta_campaign_id" },
      );
      recordsSynced += campaigns.length;
    }

    if (adSets.length > 0) {
      await supabase.from("meta_ad_sets").upsert(
        adSets.map((s) => {
          const targeting = (s.targeting ?? {}) as Record<string, unknown>;
          return {
            connection_id: row.id,
            user_id: userId,
            ad_account_id: adAccountId,
            meta_campaign_id: s.campaign_id ?? "",
            meta_ad_set_id: s.id,
            name: s.name?.trim() || s.id,
            status: s.status ?? "UNKNOWN",
            optimization_goal: s.optimization_goal ?? null,
            targeting_summary: targeting,
            is_retargeting: isRetargetingTargeting(targeting),
            synced_at: now,
          };
        }),
        { onConflict: "connection_id,meta_ad_set_id" },
      );
      recordsSynced += adSets.length;
    }

    if (ads.length > 0) {
      await supabase.from("meta_ads").upsert(
        ads.map((a) => ({
          connection_id: row.id,
          user_id: userId,
          ad_account_id: adAccountId,
          meta_ad_set_id: a.adset_id ?? "",
          meta_ad_id: a.id,
          name: a.name?.trim() || a.id,
          status: a.status ?? "UNKNOWN",
          creative_id: a.creative?.id ?? null,
          synced_at: now,
        })),
        { onConflict: "connection_id,meta_ad_id" },
      );
      recordsSynced += ads.length;
    }

    let insightsCount = 0;

    for (const period of INSIGHT_PERIODS) {
      const accountRaw = await client.getInsights(adAccountId, period);
      if (accountRaw) {
        await upsertInsight(supabase, {
          connectionId: row.id,
          userId,
          adAccountId,
          entityType: "account",
          entityId: adAccountId,
          period,
          raw: normalizeInsights(accountRaw),
        });
        insightsCount += 1;
        recordsSynced += 1;
      }
      await sleep(SYNC_DELAY_MS);

      for (const campaign of campaigns.filter((c) => c.status === "ACTIVE").slice(0, 25)) {
        const raw = await client.getInsights(campaign.id, period);
        if (raw) {
          await upsertInsight(supabase, {
            connectionId: row.id,
            userId,
            adAccountId,
            entityType: "campaign",
            entityId: campaign.id,
            period,
            raw: normalizeInsights(raw),
          });
          insightsCount += 1;
          recordsSynced += 1;
        }
        await sleep(SYNC_DELAY_MS);
      }

      for (const adSet of adSets.filter((s) => s.status === "ACTIVE").slice(0, 25)) {
        const raw = await client.getInsights(adSet.id, period);
        if (raw) {
          await upsertInsight(supabase, {
            connectionId: row.id,
            userId,
            adAccountId,
            entityType: "adset",
            entityId: adSet.id,
            period,
            raw: normalizeInsights(raw),
          });
          insightsCount += 1;
          recordsSynced += 1;
        }
        await sleep(SYNC_DELAY_MS);
      }

      for (const ad of ads.filter((a) => a.status === "ACTIVE").slice(0, 25)) {
        const raw = await client.getInsights(ad.id, period);
        if (raw) {
          await upsertInsight(supabase, {
            connectionId: row.id,
            userId,
            adAccountId,
            entityType: "ad",
            entityId: ad.id,
            period,
            raw: normalizeInsights(raw),
          });
          insightsCount += 1;
          recordsSynced += 1;
        }
        await sleep(SYNC_DELAY_MS);
      }
    }

    const finishedAt = new Date().toISOString();
    await supabase
      .from("meta_connections")
      .update({
        sync_status: "connected",
        last_sync_at: finishedAt,
        error_message: null,
      })
      .eq("id", row.id);

    if (logStarted.data?.id) {
      await supabase
        .from("meta_sync_logs")
        .update({
          status: "success",
          records_synced: recordsSynced,
          finished_at: finishedAt,
          details: {
            campaigns: campaigns.length,
            adSets: adSets.length,
            ads: ads.length,
            insights: insightsCount,
          },
        })
        .eq("id", logStarted.data.id);
    }

    return {
      status: "success",
      recordsSynced,
      period: {
        campaigns: campaigns.length,
        adSets: adSets.length,
        ads: ads.length,
        insights: insightsCount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка синхронизации Meta";
    await supabase
      .from("meta_connections")
      .update({ sync_status: "error", error_message: message })
      .eq("id", row.id);

    if (logStarted.data?.id) {
      await supabase
        .from("meta_sync_logs")
        .update({
          status: "error",
          error_message: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", logStarted.data.id);
    }

    return { status: "error", recordsSynced, error: message };
  }
}
