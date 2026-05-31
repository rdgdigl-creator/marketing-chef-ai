import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import { ProfileSidebar } from "@/components/profile-sidebar";
import { getAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TARIFF_LABELS, type UserTariff } from "@/types/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Тариф — Marketing Chef AI",
};

async function getProjectCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("marketing_projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export default async function ProfileTariffPage() {
  const { user, profile } = await getAuthContext();
  if (!user) redirect("/login?redirect=/profile/tariff");

  const projectCount = await getProjectCount(user.id);
  const tariff = (profile?.tariff ?? "free") as UserTariff;

  return (
    <PageShell badge="Тариф" title="Ваш тариф" subtitle="Текущий план и возможности Marketing Chef AI">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <ProfileSidebar projectCount={projectCount} />
        <div className="glass-card card-shine rounded-2xl p-8">
          <div className="rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent p-8">
            <p className="text-xs uppercase tracking-widest text-[#8B5CF6]">Текущий тариф</p>
            <p className="mt-2 text-3xl font-semibold text-white">{TARIFF_LABELS[tariff]}</p>
            <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">
              {tariff === "free"
                ? "Бесплатный доступ ко всем основным инструментам: фото-реклама, документы, видео, Reels Studio и AI-маркетолог."
                : "Расширенный доступ с приоритетной генерацией и дополнительными возможностями."}
            </p>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-[#A1A1AA]">
            {[
              "Фото → Реклама",
              "Анализ документов",
              "Анализ видео",
              "Reels Studio (20+ идей)",
              "AI Маркетолог с анализом конкурентов",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
