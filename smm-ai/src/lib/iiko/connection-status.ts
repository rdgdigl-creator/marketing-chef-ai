import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Лёгкий статус подключения iiko для текущего пользователя.
 *
 * В отличие от `/api/iiko/health`, этот хелпер НЕ обращается к iiko Cloud API —
 * он лишь читает активное подключение из Supabase (`iiko_connections`).
 * Подходит для быстрого отображения статуса на дашборде и главной странице.
 */
export type IikoConnectionStatus = {
  connected: boolean;
  organizationName: string | null;
  syncStatus: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
};

const DISCONNECTED: IikoConnectionStatus = {
  connected: false,
  organizationName: null,
  syncStatus: null,
  lastSyncAt: null,
  errorMessage: null,
};

type IikoConnectionRow = {
  organization_name: string | null;
  is_active: boolean;
  sync_status: string;
  last_sync_at: string | null;
  error_message: string | null;
};

export async function getIikoConnectionStatus(
  userId: string,
): Promise<IikoConnectionStatus> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("iiko_connections")
    .select("organization_name, is_active, sync_status, last_sync_at, error_message")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = (data as IikoConnectionRow | null) ?? null;
  if (!row) {
    return DISCONNECTED;
  }

  return {
    connected: true,
    organizationName: row.organization_name,
    syncStatus: row.sync_status ?? null,
    lastSyncAt: row.last_sync_at,
    errorMessage: row.error_message,
  };
}
