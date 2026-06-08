export type MetaSyncStatus = "pending" | "connected" | "syncing" | "error";

export type MetaAdAccount = {
  id: string;
  name: string;
  currency: string;
  accountStatus: string | null;
  timezone: string | null;
};

export type MetaUser = {
  id: string;
  name: string | null;
};

export type MetaTokenResponse = {
  accessToken: string;
  expiresIn: number | null;
  tokenType: string | null;
};

export type MetaConnectionStatus = {
  connected: boolean;
  configured: boolean;
  metaUserName: string | null;
  syncStatus: MetaSyncStatus | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  selectedAdAccountId: string | null;
  selectedAdAccountName: string | null;
  adAccountsCount: number;
  /** Источник данных: oauth (live) или mock (демо). */
  dataSource: "oauth" | "mock";
  /** OAuth доступен (Meta App настроен и mock выключен). */
  oauthAvailable: boolean;
};

export type MetaAdAccountRow = {
  id: string;
  meta_account_id: string;
  name: string;
  currency: string;
  account_status: string | null;
  is_selected: boolean;
};
