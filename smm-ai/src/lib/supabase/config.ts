export function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return key;
}

/**
 * Сервисный ключ Supabase (service_role). Обходит RLS — использовать ТОЛЬКО
 * на сервере (в фоновой синхронизации), никогда не отдавать в браузер.
 */
export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('ENV SERVICE ROLE:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND' : 'MISSING');
  console.log('SERVICE ROLE LENGTH:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0,20));
  console.log('ALL SUPABASE ENV:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}
