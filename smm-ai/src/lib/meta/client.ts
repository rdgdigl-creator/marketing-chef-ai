import type { InsightPeriod } from "@/lib/media-buyer/types";
import { getMetaGraphBaseUrl } from "./config";
import { INSIGHT_FIELDS, type RawInsightsRow } from "./insights";
import type { MetaAdAccount, MetaUser } from "./types";

type GraphError = {
  error?: { message?: string; type?: string; code?: number };
};

type GraphList<T> = {
  data?: T[];
  paging?: { next?: string };
  error?: GraphError["error"];
};

type GraphMe = {
  id?: string;
  name?: string;
  error?: GraphError["error"];
};

type GraphAdAccount = {
  id: string;
  name?: string;
  currency?: string;
  account_status?: number | string;
  timezone_name?: string;
};

export type GraphCampaign = {
  id: string;
  name?: string;
  status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
};

export type GraphAdSet = {
  id: string;
  name?: string;
  status?: string;
  campaign_id?: string;
  optimization_goal?: string;
  targeting?: Record<string, unknown>;
};

export type GraphAd = {
  id: string;
  name?: string;
  status?: string;
  adset_id?: string;
  creative?: { id?: string };
};

export class MetaGraphClient {
  constructor(private readonly accessToken: string) {}

  private async get<T>(path: string, query?: Record<string, string>): Promise<T> {
    const params = new URLSearchParams({ access_token: this.accessToken, ...query });
    const res = await fetch(`${getMetaGraphBaseUrl()}${path}?${params}`);
    const payload = (await res.json()) as T & GraphError;
    if (!res.ok) {
      const message =
        (payload as GraphError).error?.message ?? `Meta Graph API error (${res.status})`;
      throw new Error(message);
    }
    return payload;
  }

  async getMe(): Promise<MetaUser> {
    const payload = await this.get<GraphMe>("/me", { fields: "id,name" });
    if (!payload.id) {
      throw new Error("Meta не вернул id пользователя");
    }
    return { id: payload.id, name: payload.name ?? null };
  }

  async getAdAccounts(): Promise<MetaAdAccount[]> {
    const payload = await this.get<GraphList<GraphAdAccount>>("/me/adaccounts", {
      fields: "id,name,currency,account_status,timezone_name",
      limit: "100",
    });

    return (payload.data ?? []).map((account) => ({
      id: account.id,
      name: account.name?.trim() || account.id,
      currency: account.currency?.trim() || "RUB",
      accountStatus:
        account.account_status !== undefined ? String(account.account_status) : null,
      timezone: account.timezone_name ?? null,
    }));
  }

  private async getAllPages<T>(path: string, query: Record<string, string>): Promise<T[]> {
    const items: T[] = [];
    let nextUrl: string | null = null;

    const first = await this.get<GraphList<T>>(path, query);
    items.push(...(first.data ?? []));
    nextUrl = first.paging?.next ?? null;

    while (nextUrl) {
      const res = await fetch(nextUrl);
      const page = (await res.json()) as GraphList<T> & GraphError;
      if (!res.ok) {
        throw new Error(page.error?.message ?? "Meta Graph API pagination error");
      }
      items.push(...(page.data ?? []));
      nextUrl = page.paging?.next ?? null;
    }

    return items;
  }

  async getCampaigns(adAccountId: string): Promise<GraphCampaign[]> {
    return this.getAllPages<GraphCampaign>(`/${adAccountId}/campaigns`, {
      fields: "id,name,status,objective,daily_budget,lifetime_budget",
      limit: "100",
    });
  }

  async getAdSets(adAccountId: string): Promise<GraphAdSet[]> {
    return this.getAllPages<GraphAdSet>(`/${adAccountId}/adsets`, {
      fields: "id,name,status,campaign_id,optimization_goal,targeting",
      limit: "100",
    });
  }

  async getAds(adAccountId: string): Promise<GraphAd[]> {
    return this.getAllPages<GraphAd>(`/${adAccountId}/ads`, {
      fields: "id,name,status,adset_id,creative{id}",
      limit: "100",
    });
  }

  async getInsights(
    entityId: string,
    period: InsightPeriod,
  ): Promise<RawInsightsRow | null> {
    const payload = await this.get<GraphList<RawInsightsRow>>(`/${entityId}/insights`, {
      date_preset: period,
      fields: INSIGHT_FIELDS,
    });
    return payload.data?.[0] ?? null;
  }
}
