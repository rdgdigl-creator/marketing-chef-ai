import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import { ProfileSidebar } from "@/components/profile-sidebar";
import { getAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Профиль — Marketing Chef AI",
  description: "Настройки аккаунта и ресторана",
};

async function getProjectCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("marketing_projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export default async function ProfilePage() {
  const { user, profile, email } = await getAuthContext();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

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
    <PageShell
      activeFeature="/profile"
      badge="Аккаунт"
      title="Профиль"
      subtitle="Имя, ресторан, контакты и тариф вашего аккаунта"
    >
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <ProfileSidebar projectCount={projectCount} />
        <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <p className="text-sm text-[#A1A1AA]">Проектов</p>
              <p className="text-2xl font-semibold text-white">{projectCount}</p>
            </div>
            {email && (
              <div className="text-right">
                <p className="text-sm text-[#A1A1AA]">Email</p>
                <p className="text-sm text-white">{email}</p>
              </div>
            )}
          </div>
          <ProfileForm profile={resolvedProfile} email={email} hideLogout />
        </div>
      </div>
    </PageShell>
  );
}
