import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canUseMetaOAuth, getMetaDataSource, isMetaMockMode } from "./data-source";
import { isMetaConfigured } from "./config";
import { getMetaMockSession, getMockConnectionStatus } from "./mock";
import type { MetaConnectionStatus, MetaSyncStatus } from "./types";

function disconnectedStatus(): MetaConnectionStatus {
  return {
    connected: false,
    configured: isMetaConfigured(),
    metaUserName: null,
    syncStatus: null,
    lastSyncAt: null,
    errorMessage: null,
    selectedAdAccountId: null,
    selectedAdAccountName: null,
    adAccountsCount: 0,
    dataSource: getMetaDataSource(),
    oauthAvailable: canUseMetaOAuth(),
  };
}

type MetaConnectionRow = {
  id: string;
  meta_user_name: string | null;
  sync_status: MetaSyncStatus;
  last_sync_at: string | null;
  error_message: string | null;
  selected_ad_account_id: string | null;
};

export async function getMetaConnectionStatus(
  userId: string,
): Promise<MetaConnectionStatus> {
  const supabase = await createSupabaseServerClient();

  const { data: connection } = await supabase
    .from("meta_connections")
    .select(
      "id, meta_user_name, sync_status, last_sync_at, error_message, selected_ad_account_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const row = (connection as MetaConnectionRow | null) ?? null;
  if (!row) {
    if (isMetaMockMode()) {
      const session = await getMetaMockSession();
      if (session.connected) {
        return getMockConnectionStatus(session);
      }
    }
    return disconnectedStatus();
  }

  const { count } = await supabase
    .from("meta_ad_accounts")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", row.id);

  let selectedAdAccountName: string | null = null;
  if (row.selected_ad_account_id) {
    const { data: account } = await supabase
      .from("meta_ad_accounts")
      .select("name")
      .eq("connection_id", row.id)
      .eq("meta_account_id", row.selected_ad_account_id)
      .maybeSingle();
    selectedAdAccountName = (account as { name?: string } | null)?.name ?? null;
  }

  return {
    connected: true,
    configured: isMetaConfigured(),
    metaUserName: row.meta_user_name,
    syncStatus: row.sync_status,
    lastSyncAt: row.last_sync_at,
    errorMessage: row.error_message,
    selectedAdAccountId: row.selected_ad_account_id,
    selectedAdAccountName,
    adAccountsCount: count ?? 0,
    dataSource: "oauth",
    oauthAvailable: canUseMetaOAuth(),
  };
}
