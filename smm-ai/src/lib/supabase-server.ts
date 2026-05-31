import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient as createServerClient } from "@/lib/supabase/server";

/** Server Supabase client with session cookies (async). */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  return createServerClient();
}
