import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** @deprecated Use createSupabaseBrowserClient — kept for existing imports */
export function createSupabaseClient(): SupabaseClient {
  return createSupabaseBrowserClient();
}

export type SupabaseConnectionResult =
  | { ok: true }
  | { ok: false; error: unknown };

export async function checkSupabaseConnection(): Promise<SupabaseConnectionResult> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("pdf_documents").select("id").limit(1);

    if (error) {
      return { ok: false, error: new Error(error.message) };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
