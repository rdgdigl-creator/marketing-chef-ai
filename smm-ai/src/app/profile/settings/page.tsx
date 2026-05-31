import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import { ProfileSidebar } from "@/components/profile-sidebar";
import { getAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "../profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настройки — Marketing Chef AI",
};

async function getProjectCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("marketing_projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export default async function ProfileSettingsPage() {
  const { user, profile, email } = await getAuthContext();
  if (!user) redirect("/login?redirect=/profile/settings");

  const projectCount = await getProjectCount(user.id);
  const resolvedProfile = profile ?? {
    id: user.id,
    fullName: "",
    restaurantName: "",
    logoUrl: null,
    phone: user.phone ?? "",
    tariff: "free" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <PageShell badge="Настройки" title="Настройки аккаунта" subtitle="Имя, ресторан, логотип и контакты">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <ProfileSidebar projectCount={projectCount} />
        <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
          <ProfileForm profile={resolvedProfile} email={email} hideLogout />
        </div>
      </div>
    </PageShell>
  );
}
