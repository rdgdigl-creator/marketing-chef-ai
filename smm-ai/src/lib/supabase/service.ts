import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/config";

/**
 * Supabase-клиент с правами service_role.
 *
 * Назначение: фоновые серверные операции (синхронизация продаж из iiko),
 * которым нужно писать в таблицы `sales_*` от имени системы, минуя RLS.
 *
 * ВАЖНО:
 *   - вызывать только в серверном коде (route handlers, сервисы);
 *   - service_role полностью обходит RLS, поэтому фильтрацию по `user_id`
 *     обеспечивает сам вызывающий код;
 *   - сессия не персистится (это не пользовательский клиент).
 */
let serviceClient: SupabaseClient | null = null;

export function createSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  serviceClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serviceClient;
}
