import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile, UserProfileInput, UserTariff } from "@/types/auth";
import type { User } from "@supabase/supabase-js";

type DbProfileRow = {
  id: string;
  full_name: string;
  restaurant_name: string;
  logo_url: string | null;
  phone: string;
  tariff: UserTariff;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: DbProfileRow): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    restaurantName: row.restaurant_name,
    logoUrl: row.logo_url,
    phone: row.phone,
    tariff: row.tariff,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfile(data as DbProfileRow);
}

export async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  const existing = await getUserProfile(userId);
  if (existing) {
    return existing;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .insert({ id: userId })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfile(data as DbProfileRow);
}

export async function updateUserProfile(
  userId: string,
  input: UserProfileInput,
): Promise<{ profile: UserProfile } | { error: string }> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      full_name: input.fullName.trim(),
      restaurant_name: input.restaurantName.trim(),
      logo_url: input.logoUrl,
      phone: input.phone.trim(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось сохранить профиль" };
  }

  return { profile: mapProfile(data as DbProfileRow) };
}

export async function getAuthContext(): Promise<{
  user: User | null;
  profile: UserProfile | null;
  email: string | null;
}> {
  const user = await getAuthUser();
  if (!user) {
    return { user: null, profile: null, email: null };
  }

  const profile = (await getUserProfile(user.id)) ?? (await ensureUserProfile(user.id));

  return {
    user,
    profile,
    email: user.email ?? null,
  };
}
