import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MetaGraphClient } from "./client";
import { isMetaMockMode } from "./data-source";
import { getMetaMockSession, getMockAdAccounts } from "./mock";
import type { MetaAdAccount, MetaAdAccountRow } from "./types";

export async function listMetaAdAccounts(userId: string): Promise<MetaAdAccountRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: connection } = await supabase
    .from("meta_connections")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) {
    if (isMetaMockMode()) {
      const session = await getMetaMockSession();
      return getMockAdAccounts(session);
    }
    return [];
  }

  const { data } = await supabase
    .from("meta_ad_accounts")
    .select("id, meta_account_id, name, currency, account_status, is_selected")
    .eq("connection_id", connection.id)
    .order("name");

  return (data as MetaAdAccountRow[] | null) ?? [];
}

export async function syncMetaAdAccountsFromGraph(
  userId: string,
  connectionId: string,
  accessToken: string,
): Promise<MetaAdAccount[]> {
  const client = new MetaGraphClient(accessToken);
  const accounts = await client.getAdAccounts();
  const supabase = await createSupabaseServerClient();

  if (accounts.length === 0) {
    return accounts;
  }

  const rows = accounts.map((account) => ({
    connection_id: connectionId,
    user_id: userId,
    meta_account_id: account.id,
    name: account.name,
    currency: account.currency,
    account_status: account.accountStatus,
    timezone: account.timezone,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("meta_ad_accounts").upsert(rows, {
    onConflict: "connection_id,meta_account_id",
  });

  if (error) {
    throw new Error(error.message);
  }

  return accounts;
}

export async function selectMetaAdAccount(
  userId: string,
  adAccountId: string,
): Promise<{ name: string }> {
  const supabase = await createSupabaseServerClient();

  const { data: connection } = await supabase
    .from("meta_connections")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) {
    throw new Error("Meta не подключён");
  }

  const { data: account } = await supabase
    .from("meta_ad_accounts")
    .select("id, name, meta_account_id")
    .eq("connection_id", connection.id)
    .eq("meta_account_id", adAccountId)
    .maybeSingle();

  if (!account) {
    throw new Error("Рекламный кабинет не найден");
  }

  await supabase
    .from("meta_ad_accounts")
    .update({ is_selected: false })
    .eq("connection_id", connection.id);

  await supabase
    .from("meta_ad_accounts")
    .update({ is_selected: true })
    .eq("id", account.id);

  const { error } = await supabase
    .from("meta_connections")
    .update({
      selected_ad_account_id: account.meta_account_id,
      sync_status: "connected",
      error_message: null,
    })
    .eq("id", connection.id);

  if (error) {
    throw new Error(error.message);
  }

  return { name: account.name };
}
